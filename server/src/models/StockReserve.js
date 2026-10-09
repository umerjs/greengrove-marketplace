import mongoose from "mongoose";

/**
 * Soft-hold records created at checkout. The reserve reaper releases expired
 * quantities before deleting these records; a MongoDB TTL index would delete
 * the records before their reserved stock could be returned.
 */
const reserveSchema = new mongoose.Schema(
  {
    checkoutId: { type: String, required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: "NurseryInventory", required: true },
    nursery: { type: mongoose.Schema.Types.ObjectId, ref: "Nursery", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCatalog", required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

reserveSchema.index({ expiresAt: 1 });

export const StockReserve = mongoose.model("StockReserve", reserveSchema);
