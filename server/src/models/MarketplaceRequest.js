import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCatalog", required: true },
    quantityRequested: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["open", "matched", "ordered", "cancelled"],
      default: "open",
      index: true,
    },
    matchSummary: {
      totalAvailable: { type: Number, default: 0 },
      nurseryCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const MarketplaceRequest = mongoose.model("MarketplaceRequest", requestSchema);
