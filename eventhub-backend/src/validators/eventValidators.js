import { z } from "zod";
import {
  nameField,
  paginationFields,
  optionalStatus,
  searchField,
} from "./common.js";
export const createEventSchema = z
  .object({
    title: nameField,
    description: z
      .string()
      .trim()
      .max(10000)
      .nullable()
      .optional()
      .transform((v) => v || null),
    location: z.string().trim().min(1).max(500),
    eventDate: z.iso.datetime({ offset: true }),
    maxParticipants: z.number().int().positive().max(2147483647),
  })
  .strict();
export const updateEventSchema = createEventSchema;
export const eventStatusSchema = z
  .object({ status: z.enum(["draft", "published", "cancelled"]) })
  .strict();
export const eventQuerySchema = z
  .object({
    ...paginationFields,
    status: optionalStatus(["draft", "published", "cancelled"]),
    search: searchField,
    date: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.iso.date().optional(),
    ),
  })
  .strict();
