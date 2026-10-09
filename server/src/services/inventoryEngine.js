import { NurseryInventory } from "../models/NurseryInventory.js";
import { ProductCatalog } from "../models/ProductCatalog.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Platform-wide aggregated stock per product. A buyer only ever sees the total
 * across verified nurseries — never per-nursery counts.
 */
export function getProductAggregates({ search, category, minQty } = {}) {
  const productMatch = { isActive: true };
  if (category) productMatch.category = category;
  if (search) productMatch.name = { $regex: search, $options: "i" };

  const pipeline = [
    { $match: productMatch },
    { $lookup: { from: "nurseryinventories", localField: "_id", foreignField: "product", as: "inv" } },
    { $unwind: "$inv" },
    { $lookup: { from: "nurseries", localField: "inv.nursery", foreignField: "_id", as: "nurseryData" } },
    { $unwind: "$nurseryData" },
    { $match: { "nurseryData.verificationStatus": "verified", "inv.isListed": true } },
    { $addFields: { effective: { $subtract: ["$inv.quantityAvailable", "$inv.reservedQty"] } } },
    { $match: { effective: { $gt: 0 } } },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        slug: { $first: "$slug" },
        category: { $first: "$category" },
        unit: { $first: "$unit" },
        imageUrl: { $first: "$imageUrl" },
        totalAvailable: { $sum: "$effective" },
        nurseryCount: { $sum: 1 },
        minPrice: { $min: "$inv.pricePerUnit" },
        maxPrice: { $max: "$inv.pricePerUnit" },
      },
    },
  ];
  if (minQty) pipeline.push({ $match: { totalAvailable: { $gte: Number(minQty) } } });
  pipeline.push({ $sort: { name: 1 } });
  return ProductCatalog.aggregate(pipeline);
}

export async function getProductAggregate(productId) {
  const rows = await getProductAggregates({});
  return rows.find((r) => String(r._id) === String(productId)) ?? null;
}

/** Atomic soft-reserve: only succeeds if effective stock covers the request. */
export async function reserveStock(inventoryId, qty) {
  const doc = await NurseryInventory.findOneAndUpdate(
    {
      _id: inventoryId,
      $expr: { $gte: [{ $subtract: ["$quantityAvailable", "$reservedQty"] }, qty] },
    },
    { $inc: { reservedQty: qty } },
    { new: true },
  );
  if (!doc) {
    throw new ApiError(409, "Stock no longer available — another buyer just reserved it");
  }
  return doc;
}

export function releaseReserve(inventoryId, qty) {
  return NurseryInventory.findByIdAndUpdate(inventoryId, { $inc: { reservedQty: -qty } }, { new: true });
}

/** Converts a held reserve into a sale. */
export function confirmReserve(inventoryId, qty) {
  return NurseryInventory.findByIdAndUpdate(
    inventoryId,
    { $inc: { quantityAvailable: -qty, reservedQty: -qty }, lastUpdatedAt: new Date() },
    { new: true },
  );
}

/** Puts stock back (cancellation / seller rejection). */
export function restoreStock(inventoryId, qty) {
  return NurseryInventory.findByIdAndUpdate(
    inventoryId,
    { $inc: { quantityAvailable: qty }, lastUpdatedAt: new Date() },
    { new: true },
  );
}

/** Restore by nursery + product when the inventory doc id isn't at hand. */
export function restoreByStock(nurseryId, productId, qty) {
  return NurseryInventory.findOneAndUpdate(
    { nursery: nurseryId, product: productId },
    { $inc: { quantityAvailable: qty }, lastUpdatedAt: new Date() },
    { new: true },
  );
}
