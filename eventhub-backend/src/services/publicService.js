import * as repository from "../repositories/publicRepository.js";
import * as eventRepository from "../repositories/eventRepository.js";
import { transaction } from "../config/database.js";
import { createWithConnection } from "./registrationService.js";
import AppError from "../utils/AppError.js";
export const list = repository.list;
const unavailable = () =>
  new AppError(
    404,
    "EVENT_NOT_FOUND",
    "This event is not available for registration.",
  );
export async function get(id) {
  const event = await repository.findEvent(id);
  if (!event) throw unavailable();
  return event;
}
export const register = (eventId, data) =>
  transaction(async (db) => {
    // Lock the event row for the duration of the transaction to prevent
    // concurrent capacity changes, reusing the shared repository method.
    const event = await eventRepository.lockById(eventId, db);
    if (
      !event ||
      event.status !== "published" ||
      new Date(event.event_date) <= new Date()
    )
      throw unavailable();
    const participant = await repository.findOrCreateParticipant(data, db);
    await createWithConnection({ eventId, participantId: participant.id }, db);
    return {
      status: "pending",
      message:
        "Your registration has been received. The organizing team will review it.",
    };
  });
