import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";
dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => /^postgres(ql)?:/.test(v)),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine(
      (v) => !v.startsWith("replace-") && v !== "change-me",
      "Generate a random JWT_SECRET",
    ),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/)
    .default("8h"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  APP_TIMEZONE: z
    .string()
    .default("Africa/Casablanca")
    .refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, "Invalid IANA timezone"),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success)
  throw new Error(
    `Invalid environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. See backend/.env.example.`,
  );
export const env = parsed.data;
