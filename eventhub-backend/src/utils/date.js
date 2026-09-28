import { DateTime } from "luxon";
import { env } from "../config/env.js";
export function dayBounds(date, zone = env.APP_TIMEZONE) {
  const start = date
    ? DateTime.fromISO(date, { zone }).startOf("day")
    : DateTime.now().setZone(zone).startOf("day");
  if (!start.isValid) throw new Error("Invalid date");
  return {
    start: start.toUTC().toISO(),
    end: start.plus({ days: 1 }).toUTC().toISO(),
  };
}
