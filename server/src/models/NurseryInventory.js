import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    nursery: { type: mongoose.Schema.Types.ObjectId, ref: "Nursery", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCatalog", required: true },
    quantityAvailable: { type: Number, required: true, min: 0, default: 0 },
    pricePerUnit: { type: Number, required: true, min: 0, default: 0 },
    minOrderQty: { type: Number, default: 1, min: 1 },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    isListed: { type: Boolean, default: true },
    reservedQty: { type: Number, default: 0, min: 0 },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

inventorySchema.index({ nursery: 1, product: 1 }, { unique: true });
inventorySchema.index({ product: 1, isListed: 1, quantityAvailable: 1 });

inventorySchema.virtual("effectiveStock").get(function () {
  return Math.max(0, this.quantityAvailable - this.reservedQty);
});

export const NurseryInventory = mongoose.model("NurseryInventory", inventorySchema);
