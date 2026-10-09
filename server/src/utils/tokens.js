import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccess(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.accessSecret, {
    expiresIn: env.accessTtl,
  });
}

export function signRefresh(user) {
  return jwt.sign({ sub: String(user._id) }, env.refreshSecret, {
    expiresIn: env.refreshTtl,
  });
}

export function verifyRefresh(token) {
  return jwt.verify(token, env.refreshSecret);
}

export const REFRESH_COOKIE = "gk_refresh";

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}
