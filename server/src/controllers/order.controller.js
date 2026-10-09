import { randomUUID } from "node:crypto";
import { Order } from "../models/Order.js";
import { SellerOrder } from "../models/SellerOrder.js";
import { StockReserve } from "../models/StockReserve.js";
import { ProductCatalog } from "../models/ProductCatalog.js";
import { Nursery } from "../models/Nursery.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import { splitOrder } from "../services/orderSplitter.js";
import { reserveStock, releaseReserve, confirmReserve, restoreByStock } from "../services/inventoryEngine.js";
import { notify, notifyLowStock } from "../services/notifier.js";

export const checkout = asyncHandler(async (req, res) => {
  const { product, quantity } = req.body;
  const prod = await ProductCatalog.findById(product);
  if (!prod) throw new ApiError(404, "Product not found");

  const splits = await splitOrder(product, quantity);
  const checkoutId = randomUUID();
  const expiresAt = new Date(Date.now() + env.reserveMinutes * 60 * 1000);

  const reserved = [];
  try {
    for (const s of splits) {
      await reserveStock(s.inventoryId, s.qty);
      reserved.push(s);
    }
  } catch (err) {
    await Promise.all(reserved.map((r) => releaseReserve(r.inventoryId, r.qty)));
    throw err;
  }

  await StockReserve.insertMany(
    splits.map((s) => ({
      checkoutId,
      buyer: req.user.id,
      inventory: s.inventoryId,
      nursery: s.nursery,
      product,
      quantity: s.qty,
      pricePerUnit: s.pricePerUnit,
      expiresAt,
    })),
  );

  const totalAmount = splits.reduce((sum, s) => sum + s.qty * s.pricePerUnit, 0);
  created(res, {
    checkoutId,
    expiresAt,
    product: { id: String(prod._id), name: prod.name, unit: prod.unit },
    totalQuantity: quantity,
    totalAmount,
    priceSnapshot: totalAmount / quantity,
    splits: splits.map((s) => ({
      nurseryName: s.nurseryName,
      quantity: s.qty,
      pricePerUnit: s.pricePerUnit,
      amountPKR: s.qty * s.pricePerUnit,
    })),
  });
});

export const confirm = asyncHandler(async (req, res) => {
  const { checkoutId, deliveryAddress, notes } = req.body;
  const reserves = await StockReserve.find({ checkoutId, buyer: req.user.id });
  if (!reserves.length) throw new ApiError(400, "Reservation expired or not found. Please re-checkout.");

  if (reserves.some((r) => r.expiresAt <= new Date())) {
    for (const r of reserves) {
      const claimed = await StockReserve.findOneAndDelete({ _id: r._id });
      if (claimed) await releaseReserve(claimed.inventory, claimed.quantity);
    }
    throw new ApiError(400, "Reservation expired. Please re-checkout.");
  }

  const productId = reserves[0].product;
  const prod = await ProductCatalog.findById(productId);
  const totalQuantity = reserves.reduce((s, r) => s + r.quantity, 0);
  const totalAmountPKR = reserves.reduce((s, r) => s + r.quantity * r.pricePerUnit, 0);

  const order = await Order.create({
    buyer: req.user.id,
    product: productId,
    totalQuantity,
    priceSnapshot: totalAmountPKR / totalQuantity,
    totalAmountPKR,
    status: "confirmed",
    deliveryAddress,
    notes,
  });

  for (const r of reserves) {
    const inv = await confirmReserve(r.inventory, r.quantity);
    const sellerOrder = await SellerOrder.create({
      parentOrder: order._id,
      nursery: r.nursery,
      product: productId,
      quantityAssigned: r.quantity,
      pricePerUnit: r.pricePerUnit,
      amountPKR: r.quantity * r.pricePerUnit,
      status: "pending",
    });
    order.sellerOrders.push(sellerOrder._id);
    await InventoryMovement.create({
      nursery: r.nursery,
      product: productId,
      previousQty: (inv?.quantityAvailable ?? 0) + r.quantity,
      newQty: inv?.quantityAvailable ?? 0,
      reason: "order_confirmed",
      refId: order._id,
    });

    const nursery = await Nursery.findById(r.nursery);
    if (nursery) {
      await notify(nursery.owner, "new_order", `New order ${order._id}: ${r.quantity} × ${prod?.name ?? "item"}`, order._id);
      if (inv) await notifyLowStock(inv, nursery);
    }
    await StockReserve.findOneAndDelete({ _id: r._id });
  }
  await order.save();

  const populated = await Order.findById(order._id)
    .populate("product", "name category unit")
    .populate("sellerOrders");
  created(res, populated);
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user.id })
    .populate("product", "name category unit")
    .populate("sellerOrders", "nursery quantityAssigned status")
    .sort({ createdAt: -1 });
  ok(res, orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("product", "name category unit")
    .populate("buyer", "name email")
    .populate("sellerOrders");
  if (!order) throw new ApiError(404, "Order not found");
  if (req.user.role === "buyer" && String(order.buyer._id) !== req.user.id) {
    throw new ApiError(403, "Not your order");
  }
  ok(res, order);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (String(order.buyer) !== req.user.id) throw new ApiError(403, "Not your order");
  if (["fulfilled", "cancelled"].includes(order.status)) {
    throw new ApiError(400, `Order already ${order.status}`);
  }

  const sellerOrders = await SellerOrder.find({ parentOrder: order._id });
  if (sellerOrders.some((s) => ["dispatched", "delivered"].includes(s.status))) {
    throw new ApiError(400, "Cannot cancel — a nursery has already dispatched stock");
  }

  for (const so of sellerOrders) {
    if (["pending", "accepted"].includes(so.status)) {
      await restoreByStock(so.nursery, so.product, so.quantityAssigned);
      so.status = "rejected";
      so.rejectionReason = "Order cancelled by buyer";
      await so.save();
    }
  }
  order.status = "cancelled";
  await order.save();
  ok(res, order);
});
