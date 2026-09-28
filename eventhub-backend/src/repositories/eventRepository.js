import { pool } from "../config/database.js";
import { escapeLike, pagination } from "../utils/query.js";
import { dayBounds } from "../utils/date.js";
export const eventSelect = `SELECT e.id, e.title, e.description, e.location, e.event_date AS "eventDate",
  e.max_participants AS "maxParticipants", e.status, e.cancelled_at AS "cancelledAt",
  e.created_at AS "createdAt", e.updated_at AS "updatedAt",
  json_build_object('id', u.id, 'name', u.full_name, 'fullName', u.full_name, 'email', u.email) AS "createdBy",
  (SELECT count(*)::int FROM registrations r WHERE r.event_id=e.id AND r.status IN ('pending','confirmed')) AS "registeredParticipants"
  FROM events e JOIN users u ON u.id=e.created_by`;
export const findById = async (id, db = pool) =>
  (await db.query(`${eventSelect} WHERE e.id=$1`, [id])).rows[0];
export const lockById = async (id, db) =>
  (
    await db.query(
      "SELECT id, status, max_participants, event_date FROM events WHERE id=$1 FOR UPDATE",
      [id],
    )
  ).rows[0];
export async function list(query, db = pool) {
  const values = [];
  const filters = [];
  if (query.status) {
    values.push(query.status);
    filters.push(`e.status=$${values.length}`);
  }
  if (query.search) {
    values.push(escapeLike(query.search));
    filters.push(`e.title ILIKE $${values.length}`);
  }
  if (query.date) {
    const { start, end } = dayBounds(query.date);
    values.push(start, end);
    filters.push(
      `e.event_date >= $${values.length - 1} AND e.event_date < $${values.length}`,
    );
  }
  const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const {
    rows: [{ total }],
  } = await db.query(
    `SELECT count(*)::int AS total FROM events e${where}`,
    values,
  );
  const result = await db.query(
    `${eventSelect}${where} ORDER BY e.event_date, e.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.limit, (query.page - 1) * query.limit],
  );
  return pagination(result.rows, total, query);
}
export async function create(data, userId) {
  const result = await pool.query(
    `INSERT INTO events(title,description,location,event_date,max_participants,created_by)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
    [
      data.title,
      data.description,
      data.location,
      data.eventDate,
      data.maxParticipants,
      userId,
    ],
  );
  return findById(result.rows[0].id);
}
export async function update(id, data, db) {
  await db.query(
    "UPDATE events SET title=$2, description=$3, location=$4, event_date=$5, max_participants=$6 WHERE id=$1",
    [
      id,
      data.title,
      data.description,
      data.location,
      data.eventDate,
      data.maxParticipants,
    ],
  );
  return findById(id, db);
}
export async function updateStatus(id, status, db) {
  await db.query(
    "UPDATE events SET status=$2, cancelled_at=CASE WHEN $2='cancelled' THEN now() ELSE NULL END WHERE id=$1",
    [id, status],
  );
}
