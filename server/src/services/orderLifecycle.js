import { Order } from "../models/Order.js";
import { SellerOrder } from "../models/SellerOrder.js";
import { Nursery } from "../models/Nursery.js";
import { splitOrder } from "./orderSplitter.js";
import { reserveStock, confirmReserve } from "./inventoryEngine.js";
import { notify, notifyLowStock } from "./notifier.js";

/** Recomputes the parent order status from its sub-orders. */
export async function recomputeParentStatus(orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.status === "cancelled") return order;

  const subOrders = await SellerOrder.find({ parentOrder: orderId });
  const statuses = subOrders.map((s) => s.status);

  let status = "confirmed";
  if (statuses.length && statuses.every((s) => s === "delivered")) status = "fulfilled";
  else if (statuses.some((s) => ["dispatched", "delivered"].includes(s))) status = "partially_dispatched";
  else if (statuses.length && statuses.every((s) => s === "rejected")) status = "cancelled";

  order.status = status;
  await order.save();
  return order;
}

/** After a seller rejects, try to fill the quantity from the next-best nurseries. */
export async function reassignRejected(rejectedSubOrder) {
  const order = await Order.findById(rejectedSubOrder.parentOrder);
  let splits;
  try {
    splits = await splitOrder(rejectedSubOrder.product, rejectedSubOrder.quantityAssigned, [
      rejectedSubOrder.nursery,
    ]);
  } catch {
    if (order) {
      await notify(
        order.buyer,
        "status_update",
        `A nursery rejected ${rejectedSubOrder.quantityAssigned} units and no other nursery can cover them.`,
        order._id,
      );
    }
    return;
  }

  for (const split of splits) {
    await reserveStock(split.inventoryId, split.qty);
    const inv = await confirmReserve(split.inventoryId, split.qty);
    const subOrder = await SellerOrder.create({
      parentOrder: rejectedSubOrder.parentOrder,
      nursery: split.nursery,
      product: rejectedSubOrder.product,
      quantityAssigned: split.qty,
      pricePerUnit: split.pricePerUnit,
      amountPKR: split.qty * split.pricePerUnit,
      status: "pending",
    });
    if (order) {
      order.sellerOrders.push(subOrder._id);
      await order.save();
    }
    const nursery = await Nursery.findById(split.nursery);
    if (nursery) {
      await notify(nursery.owner, "new_order", `Order ${order?._id}: ${split.qty} units reassigned to you`, order._id);
      if (inv) await notifyLowStock(inv, nursery);
    }
  }
  if (order) {
    await notify(order.buyer, "status_update", "Part of your order was reassigned after a nursery rejection.", order._id);
  }
}
