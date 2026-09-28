import { z } from "zod";
import {
  emailField,
  nameField,
  paginationFields,
  searchField,
} from "./common.js";
export const createParticipantSchema = z
  .object({
    fullName: nameField,
    email: emailField,
    phone: z
      .string()
      .trim()
      .max(40)
      .nullable()
      .optional()
      .transform((v) => v || null),
  })
  .strict();
export const updateParticipantSchema = createParticipantSchema;
export const participantQuerySchema = z
  .object({ ...paginationFields, search: searchField })
  .strict();
