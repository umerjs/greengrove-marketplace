import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode ?? 500;
  let message = err.message ?? "Internal server error";

  if (err.name === "ZodError") {
    status = 400;
    message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate record";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    message,
    ...(env.nodeEnv !== "production" && status >= 500 ? { stack: err.stack } : {}),
  });
}
