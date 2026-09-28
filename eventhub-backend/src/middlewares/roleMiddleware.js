import AppError from "../utils/AppError.js";
export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user)
      return next(
        new AppError(401, "UNAUTHORIZED", "Authentication is required."),
      );
    if (!roles.includes(req.user.role))
      return next(new AppError(403, "FORBIDDEN", "Access is not allowed."));
    next();
  };
