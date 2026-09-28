import { pool } from "../config/database.js";
import { escapeLike, pagination } from "../utils/query.js";

// Explicit public projection: no creator, participant identity or registration IDs.
const projection = `SELECT e.id,e.title,e.description,e.location,e.event_date AS "eventDate",
 e.max_participants AS "maxParticipants",
 greatest(0,e.max_participants-(SELECT count(*)::int FROM registrations r
 WHERE r.event_id=e.id AND r.status IN ('pending','confirmed'))) AS "availablePlaces"
 FROM events e`;
export async function list(query) {
  const values = query.search ? [escapeLike(query.search)] : [];
  const where = ` WHERE e.status='published' AND e.event_date>now()${values.length ? " AND e.title ILIKE $1" : ""}`;
  const {
    rows: [count],
  } = await pool.query(
    `SELECT count(*)::int AS total FROM events e${where}`,
    values,
  );
  const { rows } = await pool.query(
    `${projection}${where} ORDER BY e.event_date,e.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.limit, (query.page - 1) * query.limit],
  );
  return pagination(rows, count.total, query);
}
export const findEvent = async (id) =>
  (
    await pool.query(
      `${projection} WHERE e.id=$1 AND e.status='published' AND e.event_date>now()`,
      [id],
    )
  ).rows[0];
export async function findOrCreateParticipant(data, db) {
  // Never overwrite an existing person's profile using unauthenticated input.
  await db.query(
    `INSERT INTO participants(full_name,email,phone) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING`,
    [data.fullName, data.email, data.phone],
  );
  return (
    await db.query("SELECT id FROM participants WHERE email=$1 FOR KEY SHARE", [
      data.email,
    ])
  ).rows[0];
}
