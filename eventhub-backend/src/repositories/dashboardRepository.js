import { eventSelect } from "./eventRepository.js";
export async function stats(db, start, end) {
  return (
    await db.query(
      `SELECT
    (SELECT count(*)::int FROM events) AS "totalEvents",
    (SELECT count(*)::int FROM events WHERE status='published') AS "publishedEvents",
    (SELECT count(*)::int FROM participants) AS "totalParticipants",
    (SELECT count(*)::int FROM registrations WHERE created_at >= $1 AND created_at < $2) AS "todayRegistrations"`,
      [start, end],
    )
  ).rows[0];
}
export async function topEvents(db) {
  return (
    await db.query(`SELECT ranked.*, round(100.0 * "registeredParticipants" / "maxParticipants",2)::float8 AS "fillRate"
    FROM (${eventSelect} WHERE e.status='published') ranked
    ORDER BY "registeredParticipants"::numeric / "maxParticipants" DESC, "eventDate", id LIMIT 5`)
  ).rows;
}
export const upcomingEvents = async (db) =>
  (
    await db.query(
      `${eventSelect} WHERE e.status <> 'cancelled' AND e.event_date >= now() ORDER BY e.event_date,e.id LIMIT 4`,
    )
  ).rows;
