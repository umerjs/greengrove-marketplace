import { ApiError } from "../utils/ApiError.js";

/**
 * Blocks inactive accounts and unverified nurseries from seller operations.
 * Expects loadNursery to have run first.
 */
export function requireApproved(req, _res, next) {
  if (req.userDoc?.status !== "active") {
    return next(new ApiError(403, "Your account is not active yet"));
  }
  if (req.nursery && req.nursery.verificationStatus !== "verified") {
    return next(new ApiError(403, "Your nursery is awaiting admin approval"));
  }
  next();
}
