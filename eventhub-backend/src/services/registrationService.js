import * as registrations from "../repositories/registrationRepository.js";
import * as participants from "../repositories/participantRepository.js";
import { transaction } from "../config/database.js";
import { lockEvent } from "./eventService.js";
import AppError from "../utils/AppError.js";
export const list = registrations.list;
function requirePublished(event) {
  if (event.status !== "published")
    throw new AppError(
      409,
      "EVENT_NOT_PUBLISHED",
      "Registrations are only allowed for published events.",
    );
}
async function requireSpace(event, db) {
  if ((await registrations.countActive(event.id, db)) >= event.max_participants)
    throw new AppError(
      409,
      "EVENT_FULL",
      "This event has reached its maximum capacity.",
    );
}
export const create = ({ eventId, participantId }) =>
  transaction(async (db) => {
    // All capacity-changing operations lock the event first, on this same connection.
    const event = await lockEvent(eventId, db);
    if (!(await participants.findById(participantId, db, true)))
      throw new AppError(
        404,
        "PARTICIPANT_NOT_FOUND",
        "The participant was not found.",
      );
    requirePublished(event);
    const existing = await registrations.findExisting(
      eventId,
      participantId,
      db,
    );
    if (existing && existing.status !== "cancelled")
      throw new AppError(
        409,
        "ALREADY_REGISTERED",
        "This participant is already registered for this event.",
      );
    await requireSpace(event, db);
    return existing
      ? registrations.updateStatus(existing.id, "pending", db)
      : registrations.create(eventId, participantId, db);
  });
export const updateStatus = (id, status) =>
  transaction(async (db) => {
    const initial = await registrations.findById(id, db);
    if (!initial)
      throw new AppError(
        404,
        "REGISTRATION_NOT_FOUND",
        "The registration was not found.",
      );
    const event = await lockEvent(initial.eventId, db);
    // Re-read after waiting for the event lock: cancellation/reactivation may have committed.
    const current = await registrations.findById(id, db);
    const allowed = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["cancelled"],
      cancelled: ["pending", "confirmed"],
    };
    if (!allowed[current.status].includes(status))
      throw new AppError(
        409,
        "INVALID_REGISTRATION_STATUS_TRANSITION",
        "This registration status transition is not allowed.",
      );
    if (status !== "cancelled") requirePublished(event);
    if (current.status === "cancelled" && status !== "cancelled")
      await requireSpace(event, db);
    return registrations.updateStatus(id, status, db);
  });
