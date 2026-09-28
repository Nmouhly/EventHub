import AppError from "../utils/AppError.js";
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success)
      return next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Please check the information entered.",
          parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        ),
      );
    req.validated = { ...req.validated, [source]: parsed.data };
    next();
  };
