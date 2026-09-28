import * as events from "../repositories/eventRepository.js";
import * as registrations from "../repositories/registrationRepository.js";
import { transaction } from "../config/database.js";
import AppError from "../utils/AppError.js";
export const list = events.list;
export const create = events.create;
export async function get(id) {
  const event = await events.findById(id);
  if (!event)
    throw new AppError(404, "EVENT_NOT_FOUND", "The event was not found.");
  return event;
}
export async function lockEvent(id, db) {
  const event = await events.lockById(id, db);
  if (!event)
    throw new AppError(404, "EVENT_NOT_FOUND", "The event was not found.");
  return event;
}
export const update = (id, data) =>
  transaction(async (db) => {
    await lockEvent(id, db);
    const active = await registrations.countActive(id, db);
    if (data.maxParticipants < active)
      throw new AppError(
        409,
        "MAX_PARTICIPANTS_TOO_LOW",
        "Capacity cannot be lower than the number of active registrations.",
      );
    return events.update(id, data, db);
  });
export const updateStatus = (id, status) =>
  transaction(async (db) => {
    const event = await lockEvent(id, db);
    const allowed = {
      draft: ["published", "cancelled"],
      published: ["cancelled"],
      cancelled: [],
    };
    if (!allowed[event.status].includes(status))
      throw new AppError(
        409,
        "INVALID_EVENT_STATUS_TRANSITION",
        "This event status transition is not allowed.",
      );
    await events.updateStatus(id, status, db);
    if (status === "cancelled") await registrations.cancelForEvent(id, db);
    return events.findById(id, db);
  });
