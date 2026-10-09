import mongoose from "mongoose";

const sellerOrderSchema = new mongoose.Schema(
  {
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    nursery: { type: mongoose.Schema.Types.ObjectId, ref: "Nursery", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCatalog", required: true },
    quantityAssigned: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    amountPKR: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "dispatched", "delivered"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

sellerOrderSchema.index({ parentOrder: 1 });
sellerOrderSchema.index({ nursery: 1, status: 1 });

export const SellerOrder = mongoose.model("SellerOrder", sellerOrderSchema);
