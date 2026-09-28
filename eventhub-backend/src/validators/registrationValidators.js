import { z } from "zod";
import { paginationFields, optionalUuid, optionalStatus } from "./common.js";
export const createRegistrationSchema = z
  .object({ eventId: z.uuid(), participantId: z.uuid() })
  .strict();
export const registrationStatusSchema = z
  .object({ status: z.enum(["pending", "confirmed", "cancelled"]) })
  .strict();
export const registrationQuerySchema = z
  .object({
    ...paginationFields,
    eventId: optionalUuid,
    participantId: optionalUuid,
    status: optionalStatus(["pending", "confirmed", "cancelled"]),
  })
  .strict();
