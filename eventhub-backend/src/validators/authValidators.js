import { z } from "zod";
import { emailField } from "./common.js";
export const loginSchema = z
  .object({
    email: emailField,
    password: z
      .string()
      .min(1)
      .max(200)
      .refine(
        (v) => Buffer.byteLength(v, "utf8") <= 72,
        "Password exceeds bcrypt byte limit",
      ),
  })
  .strict();
