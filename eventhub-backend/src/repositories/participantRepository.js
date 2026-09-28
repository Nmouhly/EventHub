import { pool } from "../config/database.js";
import { escapeLike, pagination } from "../utils/query.js";
const columns =
  'id, full_name AS "fullName", email, phone, created_at AS "createdAt", updated_at AS "updatedAt"';
export const findById = async (id, db = pool, lock = false) =>
  (
    await db.query(
      `SELECT ${columns} FROM participants WHERE id=$1${lock ? " FOR KEY SHARE" : ""}`,
      [id],
    )
  ).rows[0];
export async function list(query) {
  const values = query.search ? [escapeLike(query.search)] : [];
  const where = values.length
    ? " WHERE full_name ILIKE $1 OR email ILIKE $1"
    : "";
  const {
    rows: [{ total }],
  } = await pool.query(
    `SELECT count(*)::int AS total FROM participants${where}`,
    values,
  );
  const { rows } = await pool.query(
    `SELECT ${columns} FROM participants${where} ORDER BY created_at DESC, id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.limit, (query.page - 1) * query.limit],
  );
  return pagination(rows, total, query);
}
export const create = async (data) =>
  (
    await pool.query(
      `INSERT INTO participants(full_name,email,phone) VALUES($1,$2,$3) RETURNING ${columns}`,
      [data.fullName, data.email, data.phone],
    )
  ).rows[0];
export const update = async (id, data) =>
  (
    await pool.query(
      `UPDATE participants SET full_name=$2,email=$3,phone=$4 WHERE id=$1 RETURNING ${columns}`,
      [id, data.fullName, data.email, data.phone],
    )
  ).rows[0];
export const remove = async (id) =>
  (await pool.query("DELETE FROM participants WHERE id=$1 RETURNING id", [id]))
    .rows[0];
