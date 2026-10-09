import { User } from "../models/User.js";
import { Nursery } from "../models/Nursery.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Attaches req.userDoc and req.nursery. Lets pending sellers view their profile. */
export const loadNursery = asyncHandler(async (req, _res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, "Account not found");
  if (user.status === "suspended") throw new ApiError(403, "Account suspended");
  req.userDoc = user;

  const nursery = await Nursery.findOne({ owner: user._id });
  if (!nursery) throw new ApiError(404, "No nursery linked to this account");
  req.nursery = nursery;
  next();
});
