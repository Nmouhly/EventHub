import { Router } from "express";
import * as controller from "../controllers/userController.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { idSchema } from "../validators/common.js";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from "../validators/userValidators.js";
const router = Router();
router.use(authorizeRoles("admin"));
router.get("/", validate(userQuerySchema, "query"), controller.list);
router.post("/", validate(createUserSchema), controller.create);
router.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateUserSchema),
  controller.update,
);
export default router;
