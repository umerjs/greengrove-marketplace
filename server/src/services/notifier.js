import { Notification } from "../models/Notification.js";

export async function notify(recipient, type, message, refId) {
  return Notification.create({ recipient, type, message, refId });
}

export async function notifyLowStock(inventoryDoc, nursery) {
  if (inventoryDoc.quantityAvailable > inventoryDoc.lowStockThreshold) return null;
  return Notification.create({
    recipient: nursery.owner,
    type: "low_stock",
    message: `Low stock: only ${inventoryDoc.quantityAvailable} left (threshold ${inventoryDoc.lowStockThreshold}).`,
    refId: inventoryDoc._id,
  });
}
