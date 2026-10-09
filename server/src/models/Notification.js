import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_order", "low_stock", "approval", "status_update"],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    refId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
