import { pool } from "../config/database.js";
import { escapeLike, pagination } from "../utils/query.js";
const columns =
  'id, full_name AS "fullName", email, role, is_active AS "isActive", created_at AS "createdAt"';
export async function list(query) {
  const values = query.search ? [escapeLike(query.search)] : [];
  const where = values.length
    ? " WHERE full_name ILIKE $1 OR email ILIKE $1"
    : "";
  const {
    rows: [{ total }],
  } = await pool.query(
    `SELECT count(*)::int AS total FROM users${where}`,
    values,
  );
  const { rows } = await pool.query(
    `SELECT ${columns} FROM users${where} ORDER BY created_at DESC,id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.limit, (query.page - 1) * query.limit],
  );
  return pagination(rows, total, query);
}
export async function lockAdministration(db, actorId) {
  await db.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
  return (
    await db.query("SELECT role,is_active FROM users WHERE id=$1", [actorId])
  ).rows[0];
}
export const getManaged = async (id, db) =>
  (await db.query(`SELECT ${columns} FROM users WHERE id=$1`, [id])).rows[0];
export const activeAdmins = async (db) =>
  (
    await db.query(
      "SELECT count(*)::int AS n FROM users WHERE role='admin' AND is_active",
    )
  ).rows[0].n;
export const create = async (data, hash, db) =>
  (
    await db.query(
      `INSERT INTO users(full_name,email,role,is_active,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING ${columns}`,
      [data.fullName, data.email, data.role, data.isActive, hash],
    )
  ).rows[0];
export const update = async (id, data, db) =>
  (
    await db.query(
      `UPDATE users SET full_name=$2,email=$3,role=$4,is_active=$5 WHERE id=$1 RETURNING ${columns}`,
      [id, data.fullName, data.email, data.role, data.isActive],
    )
  ).rows[0];
export const findByEmail = async (email) =>
  (
    await pool.query(
      "SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1",
      [email],
    )
  ).rows[0];
export const findById = async (id) =>
  (
    await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE id = $1",
      [id],
    )
  ).rows[0];
export const publicUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  name: user.full_name,
  email: user.email,
  role: user.role,
});
