import { NurseryInventory } from "../models/NurseryInventory.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Pure allocation: given candidate inventory docs (already sorted cheapest-first
 * by the caller) pick how many units to take from each to fill totalQty.
 * Exported separately so it can be unit-tested without a database.
 */
export function allocateStocks(sources, totalQty, excludeNurseryIds = []) {
  const exclude = new Set(excludeNurseryIds.map(String));
  const splits = [];
  let remaining = totalQty;

  for (const source of sources) {
    if (remaining <= 0) break;
    if (!source.nursery || source.nursery.verificationStatus !== "verified") continue;
    if (exclude.has(String(source.nursery._id))) continue;

    const effective = Math.max(0, source.quantityAvailable - source.reservedQty);
    const take = Math.min(effective, remaining);
    if (take > 0) {
      splits.push({
        inventoryId: source._id,
        nursery: source.nursery._id,
        nurseryName: source.nursery.name,
        qty: take,
        pricePerUnit: source.pricePerUnit,
      });
    }
    remaining -= take;
  }

  if (remaining > 0) {
    throw new ApiError(400, `Only ${totalQty - remaining} of ${totalQty} available across verified nurseries`);
  }
  return splits;
}

/** Given a product and a total quantity, choose the best verified nurseries. */
export async function splitOrder(productId, totalQty, excludeNurseryIds = []) {
  const sources = await NurseryInventory.find({ product: productId, isListed: true })
    .populate("nursery")
    .sort({ pricePerUnit: 1, quantityAvailable: -1 });
  return allocateStocks(sources, totalQty, excludeNurseryIds);
}
