import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCatalog", required: true },
    totalQuantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 },
    totalAmountPKR: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "partially_dispatched", "fulfilled", "cancelled"],
      default: "confirmed",
      index: true,
    },
    sellerOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "SellerOrder" }],
    deliveryAddress: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
