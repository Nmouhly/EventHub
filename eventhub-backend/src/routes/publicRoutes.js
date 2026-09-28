import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import {
  idSchema,
  paginationFields,
  searchField,
} from "../validators/common.js";
import { createParticipantSchema } from "../validators/participantValidators.js";
import * as service from "../services/publicService.js";
const router = Router();
router.get(
  "/events",
  validate(
    z.object({ ...paginationFields, search: searchField }).strict(),
    "query",
  ),
  async (req, res) => res.json(await service.list(req.validated.query)),
);
router.get("/events/:id", validate(idSchema, "params"), async (req, res) =>
  res.json(await service.get(req.validated.params.id)),
);
router.post(
  "/events/:id/registrations",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "PUBLIC_RATE_LIMIT",
        message: "Too many registration requests. Please try again later.",
      },
    },
  }),
  validate(idSchema, "params"),
  validate(createParticipantSchema),
  async (req, res) =>
    res
      .status(201)
      .json(
        await service.register(req.validated.params.id, req.validated.body),
      ),
);
export default router;
