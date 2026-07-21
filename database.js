require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (error) => {
  // A background/idle client emitted an error (e.g. connection dropped).
  // Log it instead of crashing the whole server.
  console.error("Unexpected error on idle Postgres client", error);
});

/**
 * Creates the registrations table if it does not already exist.
 * Safe to run every time the server starts.
 */
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      school TEXT NOT NULL,
      phone_number TEXT,
      email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function testConnection() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query("SELECT NOW()");

    console.log("✅ Successfully connected to Supabase!");
    console.log("Server time:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Connection failed");
    console.error(error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  pool,
  testConnection,
  ensureSchema,
};
