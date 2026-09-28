import AppError from "../utils/AppError.js";
export const notFound = (req, res, next) =>
  next(new AppError(404, "NOT_FOUND", "The requested route was not found."));
