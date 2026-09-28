import { z } from "zod";
export const idSchema = z.object({ id: z.uuid() }).strict();
const blankOptional = (schema) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());
export const optionalUuid = blankOptional(z.uuid());
export const optionalStatus = (values) => blankOptional(z.enum(values));
export const paginationFields = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};
export const searchField = z.string().trim().max(200).optional();
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));
export const nameField = z.string().trim().min(1).max(200);
