import { pool } from "../config/database.js";
import { pagination } from "../utils/query.js";
const select = `SELECT r.id, r.event_id AS "eventId", r.participant_id AS "participantId", r.status,
 r.cancelled_at AS "cancelledAt", r.created_at AS "createdAt", r.updated_at AS "updatedAt",
 json_build_object('id',p.id,'fullName',p.full_name,'email',p.email) AS participant,
 json_build_object('id',e.id,'title',e.title,'status',e.status) AS event
 FROM registrations r JOIN participants p ON p.id=r.participant_id JOIN events e ON e.id=r.event_id`;
export const findById = async (id, db = pool) =>
  (await db.query(`${select} WHERE r.id=$1`, [id])).rows[0];
export const findExisting = async (eventId, participantId, db) =>
  (
    await db.query(
      "SELECT id,status FROM registrations WHERE event_id=$1 AND participant_id=$2",
      [eventId, participantId],
    )
  ).rows[0];
export const countActive = async (eventId, db) =>
  (
    await db.query(
      "SELECT count(*)::int AS count FROM registrations WHERE event_id=$1 AND status IN ('pending','confirmed')",
      [eventId],
    )
  ).rows[0].count;
export async function create(eventId, participantId, db) {
  const { rows } = await db.query(
    "INSERT INTO registrations(event_id,participant_id) VALUES($1,$2) RETURNING id",
    [eventId, participantId],
  );
  return findById(rows[0].id, db);
}
export async function updateStatus(id, status, db) {
  await db.query(
    "UPDATE registrations SET status=$2,cancelled_at=CASE WHEN $2='cancelled' THEN now() ELSE NULL END WHERE id=$1",
    [id, status],
  );
  return findById(id, db);
}
export const cancelForEvent = (id, db) =>
  db.query(
    "UPDATE registrations SET status='cancelled',cancelled_at=now() WHERE event_id=$1 AND status <> 'cancelled'",
    [id],
  );
export async function list(query) {
  const values = [];
  const filters = [];
  for (const [key, column] of [
    ["eventId", "r.event_id"],
    ["participantId", "r.participant_id"],
    ["status", "r.status"],
  ]) {
    if (query[key]) {
      values.push(query[key]);
      filters.push(`${column}=$${values.length}`);
    }
  }
  const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const {
    rows: [{ total }],
  } = await pool.query(
    `SELECT count(*)::int AS total FROM registrations r${where}`,
    values,
  );
  const { rows } = await pool.query(
    `${select}${where} ORDER BY r.created_at DESC,r.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.limit, (query.page - 1) * query.limit],
  );
  return pagination(rows, total, query);
}
