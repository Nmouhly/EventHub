import { Router } from "express";
import * as controller from "../controllers/eventController.js";
import { validate } from "../middlewares/validate.js";
import { idSchema } from "../validators/common.js";
import {
  createEventSchema,
  updateEventSchema,
  eventStatusSchema,
  eventQuerySchema,
} from "../validators/eventValidators.js";
const router = Router();
router.get("/", validate(eventQuerySchema, "query"), controller.list);
router.post("/", validate(createEventSchema), controller.create);
router.get("/:id", validate(idSchema, "params"), controller.get);
router.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateEventSchema),
  controller.update,
);
router.patch(
  "/:id/status",
  validate(idSchema, "params"),
  validate(eventStatusSchema),
  controller.updateStatus,
);
export default router;
