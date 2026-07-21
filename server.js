require("dotenv").config();

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const { ensureSchema } = require("./database");
const {
  insertRegistration,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
} = require("./queries");

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.warn(
    "⚠️  ADMIN_PASSWORD is not set in your .env file. The /admin dashboard and admin API routes will reject every login until you set it."
  );
}

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendUnauthorized(response) {
  response.writeHead(401, {
    "Content-Type": "text/plain; charset=utf-8",
    "WWW-Authenticate": 'Basic realm="Jesus Teens Admin"',
  });
  response.end("Authentication required.");
}

function isAuthorized(request) {
  const authHeader = request.headers.authorization;

  if (!ADMIN_PASSWORD || !authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const encoded = authHeader.slice(6);
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    return false;
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

function serveFile(filePath, response) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 404, { message: "Not found" });
        return;
      }

      sendJson(response, 500, { message: "Unable to load file" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    response.end(content);
  });
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function readJsonBody(request) {
  const rawBody = await collectBody(request);
  return rawBody ? JSON.parse(rawBody) : {};
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateRegistration(payload) {
  const fullName = String(payload.fullName || "").trim();
  const age = Number(payload.age);
  const school = String(payload.school || "").trim();
  const phoneNumber = String(payload.phoneNumber || "").trim();
  const email = String(payload.email || "").trim();

  if (!fullName || !school) {
    return { valid: false, message: "Full name and school are required." };
  }

  if (!Number.isInteger(age) || age < 10 || age > 25) {
    return { valid: false, message: "Age must be a whole number between 10 and 25." };
  }

  if (!phoneNumber && !email) {
    return { valid: false, message: "Please provide a phone number or email address." };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  return {
    valid: true,
    data: { fullName, age, school, phoneNumber, email },
  };
}

function parseRegistrationId(rawId) {
  const numericId = Number(rawId);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleRegister(request, response) {
  try {
    const payload = await readJsonBody(request);
    const validation = validateRegistration(payload);

    if (!validation.valid) {
      sendJson(response, 400, { message: validation.message });
      return;
    }

    await insertRegistration(validation.data);

    sendJson(response, 201, { message: "Registration saved successfully." });
  } catch (error) {
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    const message =
      statusCode === 400 ? "Invalid request payload." : "Unable to save registration right now.";

    if (statusCode === 500) {
      console.error("Register error:", error);
    }

    sendJson(response, statusCode, { message });
  }
}

async function handleAdminRegistrations(request, response) {
  if (!isAuthorized(request)) {
    sendUnauthorized(response);
    return;
  }

  try {
    const rows = await getAllRegistrations();
    sendJson(response, 200, { registrations: rows });
  } catch (error) {
    console.error("List registrations error:", error);
    sendJson(response, 500, { message: "Unable to load registrations right now." });
  }
}

async function handleAdminRegistrationUpdate(request, response, rawId) {
  if (!isAuthorized(request)) {
    sendUnauthorized(response);
    return;
  }

  const id = parseRegistrationId(rawId);

  if (!id) {
    sendJson(response, 400, { message: "Invalid registration id." });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const validation = validateRegistration(payload);

    if (!validation.valid) {
      sendJson(response, 400, { message: validation.message });
      return;
    }

    const wasUpdated = await updateRegistration(id, validation.data);

    if (!wasUpdated) {
      sendJson(response, 404, { message: "Registration not found." });
      return;
    }

    sendJson(response, 200, { message: "Registration updated successfully." });
  } catch (error) {
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    const message =
      statusCode === 400 ? "Invalid request payload." : "Unable to update registration right now.";

    if (statusCode === 500) {
      console.error("Update registration error:", error);
    }

    sendJson(response, statusCode, { message });
  }
}

async function handleAdminRegistrationDelete(request, response, rawId) {
  if (!isAuthorized(request)) {
    sendUnauthorized(response);
    return;
  }

  const id = parseRegistrationId(rawId);

  if (!id) {
    sendJson(response, 400, { message: "Invalid registration id." });
    return;
  }

  try {
    const wasDeleted = await deleteRegistration(id);

    if (!wasDeleted) {
      sendJson(response, 404, { message: "Registration not found." });
      return;
    }

    sendJson(response, 200, { message: "Registration deleted successfully." });
  } catch (error) {
    console.error("Delete registration error:", error);
    sendJson(response, 500, { message: "Unable to delete registration right now." });
  }
}

function toCsvValue(value) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

async function handleAdminExport(request, response) {
  if (!isAuthorized(request)) {
    sendUnauthorized(response);
    return;
  }

  try {
    const rows = await getAllRegistrations();

    const headers = ["ID", "Full Name", "Age", "School", "Phone Number", "Email", "Created At"];
    const csvLines = [
      headers.map(toCsvValue).join(","),
      ...rows.map((row) =>
        [row.id, row.full_name, row.age, row.school, row.phone_number, row.email, row.created_at]
          .map(toCsvValue)
          .join(",")
      ),
    ];

    response.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations-export.csv"',
    });
    response.end("\ufeff" + csvLines.join("\n"));
  } catch (error) {
    console.error("Export error:", error);
    sendJson(response, 500, { message: "Unable to export registrations right now." });
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function requestHandler(request, response) {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const adminRecordMatch = requestUrl.pathname.match(/^\/api\/admin\/registrations\/(\d+)$/);

    if (request.method === "POST" && requestUrl.pathname === "/api/register") {
      await handleRegister(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/registrations") {
      await handleAdminRegistrations(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/export") {
      await handleAdminExport(request, response);
      return;
    }

    if (adminRecordMatch && request.method === "PUT") {
      await handleAdminRegistrationUpdate(request, response, adminRecordMatch[1]);
      return;
    }

    if (adminRecordMatch && request.method === "DELETE") {
      await handleAdminRegistrationDelete(request, response, adminRecordMatch[1]);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/admin") {
      if (!isAuthorized(request)) {
        sendUnauthorized(response);
        return;
      }

      serveFile(path.join(ROOT_DIR, "admin.html"), response);
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Method not allowed" });
      return;
    }

    const safePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    const decodedPath = decodeURIComponent(safePath);
    const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(ROOT_DIR, normalizedPath);

    if (!filePath.startsWith(ROOT_DIR)) {
      sendJson(response, 403, { message: "Forbidden" });
      return;
    }

    if (path.basename(filePath).toLowerCase() === "admin.html") {
      sendJson(response, 403, { message: "Forbidden" });
      return;
    }

    serveFile(filePath, response);
  } catch (error) {
    console.error("Unhandled request error:", error);
    sendJson(response, 500, { message: "Something went wrong." });
  }
}

const server = http.createServer((request, response) => {
  requestHandler(request, response);
});

async function start() {
  await ensureSchema();

  server.listen(PORT, () => {
    console.log(`Jesus Teens Church server running at http://localhost:${PORT}`);
    console.log(`Connected to Supabase Postgres`);
    console.log(`Admin dashboard available at http://localhost:${PORT}/admin`);
    console.log(`Admin username: ${ADMIN_USERNAME}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = { server };
