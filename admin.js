const tableBody = document.getElementById("registrationTableBody");
const totalCount = document.getElementById("totalCount");
const latestSignup = document.getElementById("latestSignup");
const refreshButton = document.getElementById("refreshButton");
const adminMessage = document.getElementById("adminMessage");
const editForm = document.getElementById("editForm");
const saveButton = document.getElementById("saveButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const exportButton = document.getElementById("exportButton");

let registrationsCache = [];

function formatDate(value) {
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return value;
}

return new Intl.DateTimeFormat("en-NG", {
dateStyle: "medium",
timeStyle: "short"
}).format(date);
}

function setMessage(message, type) {
adminMessage.textContent = message || "";
adminMessage.className = "form-message";

if (type) {
adminMessage.classList.add(type);
}
}

function resetEditForm() {
editForm.reset();
document.getElementById("editId").value = "";
saveButton.disabled = true;
cancelEditButton.disabled = true;
}

function populateEditForm(registration) {
document.getElementById("editId").value = registration.id;
document.getElementById("editFullName").value = registration.full_name || "";
document.getElementById("editAge").value = registration.age || "";
document.getElementById("editSchool").value = registration.school || "";
document.getElementById("editPhoneNumber").value = registration.phone_number || "";
document.getElementById("editEmail").value = registration.email || "";
saveButton.disabled = false;
cancelEditButton.disabled = false;
}

function renderRows(registrations) {
registrationsCache = registrations;

if (!registrations.length) {
tableBody.innerHTML = '<tr><td colspan="7">No registrations yet.</td></tr>';
totalCount.textContent = "0";
latestSignup.textContent = "No entries yet";
resetEditForm();
return;
}

tableBody.innerHTML = registrations.map(function (registration) {
return `
<tr>
<td>${registration.full_name || "-"}</td>
<td>${registration.age || "-"}</td>
<td>${registration.school || "-"}</td>
<td>${registration.phone_number || "-"}</td>
<td>${registration.email || "-"}</td>
<td>${formatDate(registration.created_at)}</td>
<td>
<div class="admin-row-actions">
<button type="button" class="admin-row-button" data-action="edit" data-id="${registration.id}">Edit</button>
<button type="button" class="admin-row-button admin-delete-button" data-action="delete" data-id="${registration.id}">Delete</button>
</div>
</td>
</tr>
`;
}).join("");

totalCount.textContent = String(registrations.length);
latestSignup.textContent = registrations[0] ? formatDate(registrations[0].created_at) : "No entries yet";
}

async function loadRegistrations() {
refreshButton.disabled = true;
refreshButton.classList.add("is-loading");
refreshButton.textContent = "Refreshing...";
setMessage("");

try {
const response = await fetch("/api/admin/registrations", {
headers: {
"Accept": "application/json"
}
});

if (!response.ok) {
throw new Error("Unable to load registrations.");
}

const payload = await response.json();
renderRows(payload.registrations || []);
setMessage("Dashboard updated.", "success");
} catch (error) {
tableBody.innerHTML = '<tr><td colspan="7">Could not load registrations.</td></tr>';
setMessage(error.message || "Something went wrong.", "error");
} finally {
refreshButton.disabled = false;
refreshButton.classList.remove("is-loading");
refreshButton.textContent = "Refresh";
}
}

async function deleteRegistration(id) {
const confirmed = window.confirm("Delete this registration permanently?");

if (!confirmed) {
return;
}

setMessage("");

try {
const response = await fetch(`/api/admin/registrations/${id}`, {
method: "DELETE"
});
const payload = await response.json();

if (!response.ok) {
throw new Error(payload.message || "Unable to delete registration.");
}

setMessage(payload.message, "success");
await loadRegistrations();
} catch (error) {
setMessage(error.message || "Unable to delete registration.", "error");
}
}

tableBody.addEventListener("click", function (event) {
const button = event.target.closest("[data-action]");

if (!button) {
return;
}

const id = Number(button.dataset.id);
const action = button.dataset.action;
const registration = registrationsCache.find(function (item) {
return item.id === id;
});

if (action === "edit" && registration) {
populateEditForm(registration);
setMessage("Editing registration #" + id + ".", "success");
return;
}

if (action === "delete") {
deleteRegistration(id);
}
});

editForm.addEventListener("submit", async function (event) {
event.preventDefault();

const id = document.getElementById("editId").value;

if (!id) {
setMessage("Select a registration to edit first.", "error");
return;
}

const formData = new FormData(editForm);
const payload = {
fullName: String(formData.get("fullName") || "").trim(),
age: Number(formData.get("age")),
school: String(formData.get("school") || "").trim(),
phoneNumber: String(formData.get("phoneNumber") || "").trim(),
email: String(formData.get("email") || "").trim()
};

saveButton.disabled = true;
saveButton.classList.add("is-loading");
saveButton.textContent = "Saving...";
setMessage("");

try {
const response = await fetch(`/api/admin/registrations/${id}`, {
method: "PUT",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(payload)
});
const result = await response.json();

if (!response.ok) {
throw new Error(result.message || "Unable to save changes.");
}

setMessage(result.message, "success");
resetEditForm();
await loadRegistrations();
} catch (error) {
setMessage(error.message || "Unable to save changes.", "error");
saveButton.disabled = false;
cancelEditButton.disabled = false;
} finally {
saveButton.classList.remove("is-loading");
saveButton.textContent = "Save Changes";
}
});

cancelEditButton.addEventListener("click", function () {
resetEditForm();
setMessage("Edit cancelled.", "success");
});

exportButton.addEventListener("click", function () {
setMessage("Export started. Your spreadsheet download should begin shortly.", "success");
});

refreshButton.addEventListener("click", loadRegistrations);
resetEditForm();
loadRegistrations();
