import { Router } from "express";
import * as controller from "../controllers/registrationController.js";
import { validate } from "../middlewares/validate.js";
import { idSchema } from "../validators/common.js";
import {
  createRegistrationSchema,
  registrationStatusSchema,
  registrationQuerySchema,
} from "../validators/registrationValidators.js";
const router = Router();
router.get("/", validate(registrationQuerySchema, "query"), controller.list);
router.post("/", validate(createRegistrationSchema), controller.create);
router.patch(
  "/:id/status",
  validate(idSchema, "params"),
  validate(registrationStatusSchema),
  controller.updateStatus,
);
export default router;
