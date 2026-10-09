import mongoose from "mongoose";

const nurserySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    serviceAreas: { type: [String], default: [] },
    logo: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "suspended", "rejected"],
      default: "pending",
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalOrdersFulfilled: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Nursery = mongoose.model("Nursery", nurserySchema);
