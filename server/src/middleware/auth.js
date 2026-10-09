import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function verifyJWT(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "Authentication required"));
  try {
    const payload = jwt.verify(token, env.accessSecret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function optionalJWT(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, env.accessSecret);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      /* ignore */
    }
  }
  next();
}
