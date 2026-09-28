import bcrypt from "bcrypt";
import * as users from "../repositories/userRepository.js";
import { transaction } from "../config/database.js";
import AppError from "../utils/AppError.js";
export const list = users.list;
async function authorizeLocked(db, actorId) {
  const actor = await users.lockAdministration(db, actorId);
  if (!actor?.is_active)
    throw new AppError(401, "UNAUTHORIZED", "Your account is inactive.");
  if (actor.role !== "admin")
    throw new AppError(403, "FORBIDDEN", "Administrator access is required.");
}
export async function create(data, actorId) {
  const hash = await bcrypt.hash(data.password, 12);
  return transaction(async (db) => {
    await authorizeLocked(db, actorId);
    return users.create(data, hash, db);
  });
}
export const update = (id, data, actorId) =>
  transaction(async (db) => {
    await authorizeLocked(db, actorId);
    const current = await users.getManaged(id, db);
    if (!current)
      throw new AppError(404, "USER_NOT_FOUND", "The operator was not found.");
    if (id === actorId && (!data.isActive || data.role !== "admin"))
      throw new AppError(
        409,
        "SELF_ACCESS_CHANGE",
        "You cannot deactivate your own account or remove your administrator role.",
      );
    if (
      current.isActive &&
      current.role === "admin" &&
      (!data.isActive || data.role !== "admin") &&
      (await users.activeAdmins(db)) <= 1
    )
      throw new AppError(
        409,
        "LAST_ADMIN",
        "At least one active administrator must remain.",
      );
    return users.update(id, data, db);
  });
