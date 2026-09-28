import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/database.js";
import { signToken } from "../../src/utils/jwt.js";
let admin, token, hash;
const data = {
  fullName: "New Operator",
  email: "new@example.com",
  role: "staff",
  isActive: true,
};
const headers = () => ({ Authorization: `Bearer ${token}` });
beforeAll(async () => {
  if (
    !(
      await pool.query("SELECT current_database() AS name")
    ).rows[0].name.endsWith("_test")
  )
    throw new Error("Unsafe database");
  hash = await bcrypt.hash("EventHub2026!", 12);
});
beforeEach(async () => {
  await pool.query("TRUNCATE registrations,events,participants,users");
  admin = (
    await pool.query(
      "INSERT INTO users(full_name,email,password_hash,role) VALUES('Admin','admin@eventhub.demo',$1,'admin') RETURNING id,role",
      [hash],
    )
  ).rows[0];
  token = signToken(admin);
});
afterAll(() => pool.end());
test("admin creates a hashed operator, lists safely and operator can log in", async () => {
  const res = await request(app)
    .post("/api/users")
    .set(headers())
    .send({ ...data, email: " NEW@Example.com ", password: "EventHub2026!" });
  expect(res.status).toBe(201);
  expect(res.body.email).toBe(data.email);
  expect(res.body.password_hash).toBeUndefined();
  const stored = (
    await pool.query("SELECT password_hash FROM users WHERE id=$1", [
      res.body.id,
    ])
  ).rows[0];
  expect(await bcrypt.compare("EventHub2026!", stored.password_hash)).toBe(
    true,
  );
  const list = await request(app)
    .get("/api/users?search=new&limit=1")
    .set(headers());
  expect(list.body.total).toBe(1);
  expect(JSON.stringify(list.body)).not.toContain("password");
  expect(
    (
      await request(app)
        .post("/api/auth/login")
        .send({ email: data.email, password: "EventHub2026!" })
    ).status,
  ).toBe(200);
});
test("staff cannot list, create or update operators", async () => {
  await pool.query("UPDATE users SET role='staff' WHERE id=$1", [admin.id]);
  expect((await request(app).get("/api/users").set(headers())).status).toBe(
    403,
  );
  expect(
    (
      await request(app)
        .post("/api/users")
        .set(headers())
        .send({ ...data, password: "EventHub2026!" })
    ).status,
  ).toBe(403);
  expect(
    (await request(app).put(`/api/users/${admin.id}`).set(headers()).send(data))
      .status,
  ).toBe(403);
});
test("deactivation immediately invalidates existing sessions and reactivation restores login", async () => {
  const created = await request(app)
    .post("/api/users")
    .set(headers())
    .send({ ...data, password: "EventHub2026!" });
  const id = created.body.id;
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: data.email, password: "EventHub2026!" });
  expect(
    (
      await request(app)
        .put(`/api/users/${id}`)
        .set(headers())
        .send({ ...data, isActive: false })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${login.body.token}`)
    ).status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .put(`/api/users/${id}`)
        .set(headers())
        .send({ ...data, isActive: true })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .post("/api/auth/login")
        .send({ email: data.email, password: "EventHub2026!" })
    ).status,
  ).toBe(200);
});
test("self-deactivation, own demotion, duplicate email and weak password are refused", async () => {
  for (const values of [
    { ...data, isActive: false, role: "admin" },
    { ...data, role: "staff" },
  ])
    expect(
      (
        await request(app)
          .put(`/api/users/${admin.id}`)
          .set(headers())
          .send(values)
      ).body.error.code,
    ).toBe("SELF_ACCESS_CHANGE");
  expect(
    (
      await request(app)
        .post("/api/users")
        .set(headers())
        .send({ ...data, password: "short" })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .post("/api/users")
        .set(headers())
        .send({
          ...data,
          email: "admin@eventhub.demo",
          password: "EventHub2026!",
        })
    ).body.error.code,
  ).toBe("EMAIL_ALREADY_EXISTS");
});
test("concurrent admins cannot deactivate each other and leave no active admin", async () => {
  const other = (
    await request(app)
      .post("/api/users")
      .set(headers())
      .send({ ...data, role: "admin", password: "EventHub2026!" })
  ).body;
  const secondToken = signToken(other);
  const responses = await Promise.all([
    request(app)
      .put(`/api/users/${other.id}`)
      .set(headers())
      .send({ ...data, role: "admin", isActive: false }),
    request(app)
      .put(`/api/users/${admin.id}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .send({
        fullName: "Admin",
        email: "admin@eventhub.demo",
        role: "admin",
        isActive: false,
      }),
  ]);
  expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
  expect(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM users WHERE role='admin' AND is_active",
      )
    ).rows[0].n,
  ).toBe(1);
});
