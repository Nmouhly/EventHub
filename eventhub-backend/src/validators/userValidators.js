import { z } from "zod";
import {
  nameField,
  emailField,
  paginationFields,
  searchField,
} from "./common.js";
export const updateUserSchema = z
  .object({
    fullName: nameField,
    email: emailField,
    role: z.enum(["admin", "staff"]),
    isActive: z.boolean(),
  })
  .strict();
export const createUserSchema = updateUserSchema.extend({
  password: z
    .string()
    .min(12)
    .max(72)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Maximum 72 UTF-8 bytes",
    ),
});
export const userQuerySchema = z
  .object({ ...paginationFields, search: searchField })
  .strict();
