const { pool } = require("./database");

/**
 * Insert a new registration. Returns nothing meaningful — callers only
 * need to know it succeeded (matches previous SQLite behavior).
 */
async function insertRegistration({ fullName, age, school, phoneNumber, email }) {
  await pool.query(
    `INSERT INTO registrations (full_name, age, school, phone_number, email)
     VALUES ($1, $2, $3, $4, $5)`,
    [fullName, age, school, phoneNumber || null, email || null]
  );
}

/**
 * Returns all registrations, most recent first.
 */
async function getAllRegistrations() {
  const result = await pool.query(
    `SELECT id, full_name, age, school, phone_number, email, created_at
     FROM registrations
     ORDER BY created_at DESC, id DESC`
  );

  return result.rows;
}

/**
 * Update an existing registration by id.
 * Returns true if a row was updated, false if no matching id was found.
 */
async function updateRegistration(id, { fullName, age, school, phoneNumber, email }) {
  const result = await pool.query(
    `UPDATE registrations
     SET full_name = $1, age = $2, school = $3, phone_number = $4, email = $5
     WHERE id = $6`,
    [fullName, age, school, phoneNumber || null, email || null, id]
  );

  return result.rowCount > 0;
}

/**
 * Delete a registration by id.
 * Returns true if a row was deleted, false if no matching id was found.
 */
async function deleteRegistration(id) {
  const result = await pool.query(
    `DELETE FROM registrations WHERE id = $1`,
    [id]
  );

  return result.rowCount > 0;
}

module.exports = {
  insertRegistration,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
};
