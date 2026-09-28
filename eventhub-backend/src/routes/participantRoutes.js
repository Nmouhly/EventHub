import { Router } from "express";
import * as controller from "../controllers/participantController.js";
import { validate } from "../middlewares/validate.js";
import { idSchema } from "../validators/common.js";
import {
  createParticipantSchema,
  updateParticipantSchema,
  participantQuerySchema,
} from "../validators/participantValidators.js";
const router = Router();
router.get("/", validate(participantQuerySchema, "query"), controller.list);
router.post("/", validate(createParticipantSchema), controller.create);
router.get("/:id", validate(idSchema, "params"), controller.get);
router.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateParticipantSchema),
  controller.update,
);
router.delete("/:id", validate(idSchema, "params"), controller.remove);
export default router;
