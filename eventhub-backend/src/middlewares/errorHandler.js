import AppError from "../utils/AppError.js";
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let safe = error;
  if (error.code === "23505") {
    safe =
      error.constraint === "registrations_event_participant_key"
        ? new AppError(
            409,
            "ALREADY_REGISTERED",
            "This participant is already registered for this event.",
          )
        : new AppError(
            409,
            "EMAIL_ALREADY_EXISTS",
            "This email address is already in use.",
          );
  } else if (error.code === "23503") {
    // Map by constraint name so this middleware stays agnostic of HTTP routes.
    // "registrations_participant_id_fkey" fires when a participant that still
    // has registrations is deleted (ON DELETE RESTRICT on registrations.participant_id).
    safe =
      error.constraint === "registrations_participant_id_fkey"
        ? new AppError(
            409,
            "PARTICIPANT_HAS_REGISTRATIONS",
            "This participant has registrations and cannot be deleted.",
          )
        : new AppError(
            409,
            "RELATED_RESOURCE_CONFLICT",
            "A related resource no longer exists or is still in use.",
          );
  } else if (["23514", "23502", "22P02", "22007", "22008"].includes(error.code))
    safe = new AppError(
      400,
      "VALIDATION_ERROR",
      "The supplied values are invalid.",
    );
  else if (error.type === "entity.parse.failed")
    safe = new AppError(
      400,
      "VALIDATION_ERROR",
      "The request body must be valid JSON.",
    );
  else if (error.type === "entity.too.large")
    safe = new AppError(
      413,
      "PAYLOAD_TOO_LARGE",
      "The request body is too large.",
    );
  if (!(safe instanceof AppError)) {
    console.error("Request failed", {
      method: req.method,
      route: req.route?.path,
      code: error.code || "INTERNAL_ERROR",
    });
    safe = new AppError(
      500,
      "INTERNAL_ERROR",
      "An unexpected server error occurred.",
    );
  }
  res.status(safe.status).json({
    success: false,
    error: {
      code: safe.code,
      message: safe.message,
      ...(safe.details && { details: safe.details }),
    },
  });
}
