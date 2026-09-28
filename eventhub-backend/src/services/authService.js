import bcrypt from "bcrypt";
import { findByEmail, publicUser } from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
// Equal-cost comparison for unknown emails avoids a trivial user enumeration timing leak.
const dummyHash = await bcrypt.hash("unusable-random-login-placeholder", 12);
export async function login({ email, password }) {
  const user = await findByEmail(email.trim().toLowerCase());
  const matches = await bcrypt.compare(
    password,
    user?.password_hash || dummyHash,
  );
  if (!user?.is_active || !matches)
    throw new AppError(401, "UNAUTHORIZED", "Invalid email or password.");
  return { token: signToken(user), user: publicUser(user) };
}
