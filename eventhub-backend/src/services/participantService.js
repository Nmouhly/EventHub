import * as participants from "../repositories/participantRepository.js";
import AppError from "../utils/AppError.js";
function requireParticipant(value) {
  if (!value)
    throw new AppError(
      404,
      "PARTICIPANT_NOT_FOUND",
      "The participant was not found.",
    );
  return value;
}
export const list = participants.list;
export const create = participants.create;
export const get = async (id) =>
  requireParticipant(await participants.findById(id));
export const update = async (id, data) =>
  requireParticipant(await participants.update(id, data));
export const remove = async (id) =>
  requireParticipant(await participants.remove(id));
