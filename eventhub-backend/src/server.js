import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";
try {
  await pool.query("SELECT 1");
  const server = app.listen(env.PORT, () =>
    console.log(`EventHub API ready at http://localhost:${env.PORT}/api`),
  );
  server.on("error", async (error) => {
    console.error("Unable to start HTTP server:", error.code);
    await pool.end();
    process.exitCode = 1;
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => {
      await pool.end();
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} catch (error) {
  console.error(
    "Unable to connect to PostgreSQL:",
    error.code || "CONNECTION_FAILED",
  );
  await pool.end();
  process.exitCode = 1;
}
