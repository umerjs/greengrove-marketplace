import { randomBytes } from "node:crypto";
import { User } from "../models/User.js";
import { Nursery } from "../models/Nursery.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import { signAccess, signRefresh, verifyRefresh, setRefreshCookie, clearRefreshCookie } from "../utils/tokens.js";
import { notify } from "../services/notifier.js";

function slugify(name) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomBytes(3).toString("hex")}`;
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, name, phone, role, nursery } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email already registered");

  const user = new User({ email, name, phone, role });
  await user.setPassword(password);

  if (role === "nursery_seller") {
    user.status = "pending";
    await user.save();
    const nurseryName = nursery?.name ?? `${name}'s Nursery`;
    await Nursery.create({
      owner: user._id,
      name: nurseryName,
      address: nursery?.address ?? "",
      phone: nursery?.phone ?? phone ?? "",
      serviceAreas: nursery?.serviceAreas ?? [],
      verificationStatus: "pending",
    });
    const admins = await User.find({ role: "super_admin" }).select("_id");
    await Promise.all(
      admins.map((a) => notify(a._id, "approval", `New nursery application: ${nurseryName}`, user._id)),
    );
  } else {
    await user.save();
  }

  const accessToken = signAccess(user);
  setRefreshCookie(res, signRefresh(user));
  created(res, { user: user.toSafeJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.status === "suspended") throw new ApiError(403, "Account suspended. Contact support.");

  const accessToken = signAccess(user);
  setRefreshCookie(res, signRefresh(user));
  ok(res, { user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.gk_refresh;
  if (!token) throw new ApiError(401, "No refresh token");
  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status === "suspended") throw new ApiError(401, "Account unavailable");
  ok(res, { user: user.toSafeJSON(), accessToken: signAccess(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  clearRefreshCookie(res);
  ok(res, { message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");
  const nursery = user.role === "nursery_seller" ? await Nursery.findOne({ owner: user._id }) : null;
  ok(res, { user: user.toSafeJSON(), nursery: nursery ?? null });
});
