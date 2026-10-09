import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

export const myNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user.id };
  if (req.query.unread === "true") filter.isRead = false;
  const rows = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  ok(res, { notifications: rows, unreadCount });
});

export const markRead = asyncHandler(async (req, res) => {
  const doc = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true },
  );
  if (!doc) throw new ApiError(404, "Notification not found");
  ok(res, doc);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
  ok(res, { message: "All marked read" });
});
