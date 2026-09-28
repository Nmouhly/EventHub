import { login } from "../services/authService.js";
import { publicUser } from "../repositories/userRepository.js";
export const signIn = async (req, res) =>
  res.json(await login(req.validated.body));
export const me = (req, res) => res.json(publicUser(req.user));
