import { z } from "zod";
import { verifyToken } from "../utils/jwt.js";
import { findById } from "../repositories/userRepository.js";
import AppError from "../utils/AppError.js";
export async function authenticate(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || "");
  const unauthorized = () =>
    new AppError(401, "UNAUTHORIZED", "A valid active session is required.");
  if (!match) throw unauthorized();
  let payload;
  try {
    payload = verifyToken(match[1]);
  } catch {
    throw unauthorized();
  }
  if (!z.uuid().safeParse(payload.sub).success) throw unauthorized();
  const user = await findById(payload.sub);
  if (!user?.is_active) throw unauthorized();
  req.user = user;
  next();
}
