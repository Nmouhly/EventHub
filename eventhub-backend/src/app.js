import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";
import { authenticate } from "./middlewares/authMiddleware.js";
import { authorizeRoles } from "./middlewares/roleMiddleware.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import participantRoutes from "./routes/participantRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import docsRoutes from "./routes/docsRoutes.js";
import AppError from "./utils/AppError.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors((req, callback) => callback(null, {
    origin(origin, callback) {
      if (!origin || origin === env.FRONTEND_URL || origin === `${req.protocol}://${req.get('host')}`) callback(null, true);
      else
        callback(new AppError(403, "FORBIDDEN", "This origin is not allowed."));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })),
);
app.use(express.json({ limit: "100kb" }));
if (env.NODE_ENV !== "test")
  app.use(morgan(":method :status :response-time ms"));
app.get("/api/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api", docsRoutes);
app.use("/api", authenticate, authorizeRoles("admin", "staff"));
app.use("/api/events", eventRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use(notFound);
app.use(errorHandler);
