import request from "supertest";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/database.js";
let eventId, adminId;
const person = {
  fullName: "Public Guest",
  email: "guest@example.com",
  phone: null,
};
const register = (data = person, id = eventId) =>
  request(app).post(`/api/public/events/${id}/registrations`).send(data);
beforeEach(async () => {
  if (
    !(
      await pool.query("SELECT current_database() AS name")
    ).rows[0].name.endsWith("_test")
  )
    throw new Error("Unsafe database");
  await pool.query("TRUNCATE registrations,events,participants,users");
  adminId = (
    await pool.query(
      "INSERT INTO users(full_name,email,password_hash,role) VALUES('Admin','private@example.com','unused','admin') RETURNING id",
    )
  ).rows[0].id;
  eventId = (
    await pool.query(
      "INSERT INTO events(title,location,event_date,max_participants,status,created_by) VALUES('Public event','Casablanca',now()+interval '1 day',1,'published',$1) RETURNING id",
      [adminId],
    )
  ).rows[0].id;
});
afterAll(() => pool.end());
test("public catalogue hides unpublished and past events and private fields", async () => {
  await pool.query(
    "INSERT INTO events(title,location,event_date,max_participants,status,created_by) VALUES('Draft','Private',now()+interval '1 day',5,'draft',$1),('Past','Private',now()-interval '1 day',5,'published',$1)",
    [adminId],
  );
  const response = await request(app).get("/api/public/events").expect(200);
  expect(response.body.total).toBe(1);
  expect(response.body.data[0]).toMatchObject({
    id: eventId,
    availablePlaces: 1,
  });
  expect(response.body.data[0].createdBy).toBeUndefined();
  expect(JSON.stringify(response.body)).not.toContain("private@example.com");
  await request(app).get("/api/public/events?status=draft").expect(400);
  await request(app)
    .get("/api/public/events?search=missing")
    .expect(200)
    .expect((r) => expect(r.body.total).toBe(0));
  await request(app).get("/api/participants").expect(401);
});
test("registration is pending, normalizes email and does not expose or overwrite an existing profile", async () => {
  await pool.query(
    "INSERT INTO participants(full_name,email,phone) VALUES('Original name','guest@example.com','123')",
  );
  const response = await register({
    ...person,
    email: " GUEST@example.com ",
  }).expect(201);
  expect(Object.keys(response.body).sort()).toEqual(["message", "status"]);
  expect(response.body.status).toBe("pending");
  const stored = (await pool.query("SELECT full_name,phone FROM participants"))
    .rows[0];
  expect(stored).toEqual({ full_name: "Original name", phone: "123" });
  await register()
    .expect(409)
    .expect((r) => expect(r.body.error.code).toBe("ALREADY_REGISTERED"));
});
test("concurrent last-place requests accept one and roll back the losing participant", async () => {
  const results = await Promise.all([
    register(),
    register({ ...person, email: "second@example.com" }),
  ]);
  expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  expect(
    (await pool.query("SELECT count(*)::int AS n FROM registrations")).rows[0]
      .n,
  ).toBe(1);
  expect(
    (await pool.query("SELECT count(*)::int AS n FROM participants")).rows[0].n,
  ).toBe(1);
});
test("draft, cancelled and past events cannot be read or registered publicly", async () => {
  for (const status of ["draft", "cancelled", "published"]) {
    await pool.query(
      "UPDATE events SET status=$2,cancelled_at=CASE WHEN $2='cancelled' THEN now() ELSE NULL END,event_date=CASE WHEN $2='published' THEN now()-interval '1 day' ELSE now()+interval '1 day' END WHERE id=$1",
      [eventId, status],
    );
    await request(app).get(`/api/public/events/${eventId}`).expect(404);
    await register().expect(404);
  }
  expect(
    (await pool.query("SELECT count(*)::int AS n FROM participants")).rows[0].n,
  ).toBe(0);
});
test("strict validation rejects forged IDs/status and cancelled registration reuses its row", async () => {
  await register({ ...person, status: "confirmed" }).expect(400);
  await register({ ...person, email: "invalid" }).expect(400);
  await register(person, "invalid").expect(400);
  await register().expect(201);
  const first = (await pool.query("SELECT id FROM registrations")).rows[0].id;
  await pool.query(
    "UPDATE registrations SET status='cancelled',cancelled_at=now()",
  );
  await register().expect(201);
  expect(
    (await pool.query("SELECT id,status FROM registrations")).rows,
  ).toEqual([{ id: first, status: "pending" }]);
});
