import { StockReserve } from "../models/StockReserve.js";
import { NurseryInventory } from "../models/NurseryInventory.js";

/**
 * Releases expired soft holds and deletes their records. We claim each reserve
 * with findOneAndDelete so the decrement happens exactly once across workers.
 */
export async function releaseExpiredReserves() {
  const expired = await StockReserve.find({ expiresAt: { $lt: new Date() } }).select("_id inventory quantity");
  let released = 0;
  for (const reserve of expired) {
    const claimed = await StockReserve.findOneAndDelete({ _id: reserve._id });
    if (!claimed) continue;
    await NurseryInventory.findByIdAndUpdate(claimed.inventory, { $inc: { reservedQty: -claimed.quantity } });
    released += 1;
  }
  if (released) console.log(`[reserveReaper] released ${released} expired hold(s)`);
  return released;
}

export function startReserveReaper(intervalMs = 60_000) {
  releaseExpiredReserves().catch((e) => console.error("[reserveReaper]", e));
  const timer = setInterval(() => {
    releaseExpiredReserves().catch((e) => console.error("[reserveReaper]", e));
  }, intervalMs);
  timer.unref?.();
  return timer;
}
