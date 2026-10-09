import mongoose from "mongoose";

const movementSchema = new mongoose.Schema(
  {
    nursery: { type: mongoose.Schema.Types.ObjectId, ref: "Nursery", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCatalog", required: true },
    previousQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["seller_update", "order_confirmed", "order_cancelled", "seller_rejected"],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

movementSchema.index({ nursery: 1, product: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model("InventoryMovement", movementSchema);
