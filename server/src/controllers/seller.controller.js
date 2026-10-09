import { NurseryInventory } from "../models/NurseryInventory.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import { SellerOrder } from "../models/SellerOrder.js";
import { ProductCatalog } from "../models/ProductCatalog.js";
import { Notification } from "../models/Notification.js";
import { Nursery } from "../models/Nursery.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import { restoreByStock } from "../services/inventoryEngine.js";
import { notifyLowStock } from "../services/notifier.js";
import { reassignRejected, recomputeParentStatus } from "../services/orderLifecycle.js";

export const getProfile = asyncHandler(async (req, res) => {
  ok(res, req.nursery);
});

export const getCatalog = asyncHandler(async (_req, res) => {
  const rows = await ProductCatalog.find({ isActive: true }).sort({ name: 1 });
  ok(res, rows);
});

export const getDashboard = asyncHandler(async (req, res) => {
  const nurseryId = req.nursery._id;
  const [inventory, orders, notifications] = await Promise.all([
    NurseryInventory.find({ nursery: nurseryId }).populate("product", "name category unit"),
    SellerOrder.find({ nursery: nurseryId }),
    Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(10),
  ]);

  const totalStock = inventory.reduce((sum, i) => sum + i.quantityAvailable, 0);
  const lowStock = inventory.filter((i) => i.quantityAvailable <= i.lowStockThreshold);
  const revenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amountPKR, 0);
  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  ok(res, {
    nursery: req.nursery,
    totalStock,
    inventoryCount: inventory.length,
    lowStock: lowStock.length,
    ordersByStatus: byStatus,
    revenueDeliveredPKR: revenue,
    notifications,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "description", "address", "phone", "serviceAreas", "logo", "coverImage"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.nursery[key] = req.body[key];
  }
  await req.nursery.save();
  ok(res, req.nursery);
});

export const getInventory = asyncHandler(async (req, res) => {
  const rows = await NurseryInventory.find({ nursery: req.nursery._id }).populate(
    "product",
    "name category unit slug",
  );
  ok(res, rows);
});

export const upsertInventory = asyncHandler(async (req, res) => {
  const { product, quantityAvailable, pricePerUnit, minOrderQty, lowStockThreshold, isListed } = req.body;
  const existing = await NurseryInventory.findOne({ nursery: req.nursery._id, product });
  const previousQty = existing?.quantityAvailable ?? 0;

  const doc = await NurseryInventory.findOneAndUpdate(
    { nursery: req.nursery._id, product },
    {
      $set: {
        quantityAvailable,
        pricePerUnit,
        ...(minOrderQty !== undefined ? { minOrderQty } : {}),
        ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
        ...(isListed !== undefined ? { isListed } : {}),
        lastUpdatedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).populate("product", "name category unit");

  if (previousQty !== quantityAvailable) {
    await InventoryMovement.create({
      nursery: req.nursery._id,
      product,
      previousQty,
      newQty: quantityAvailable,
      reason: "seller_update",
      refId: doc._id,
    });
  }
  await notifyLowStock(doc, req.nursery);
  created(res, doc);
});

export const updateInventory = asyncHandler(async (req, res) => {
  const doc = await NurseryInventory.findOne({ _id: req.params.id, nursery: req.nursery._id });
  if (!doc) throw new ApiError(404, "Inventory record not found");
  const previousQty = doc.quantityAvailable;
  const fields = ["quantityAvailable", "pricePerUnit", "minOrderQty", "lowStockThreshold", "isListed"];
  for (const key of fields) if (req.body[key] !== undefined) doc[key] = req.body[key];
  doc.lastUpdatedAt = new Date();
  await doc.save();
  if (previousQty !== doc.quantityAvailable) {
    await InventoryMovement.create({
      nursery: req.nursery._id,
      product: doc.product,
      previousQty,
      newQty: doc.quantityAvailable,
      reason: "seller_update",
      refId: doc._id,
    });
  }
  await notifyLowStock(doc, req.nursery);
  ok(res, doc);
});

export const getOrders = asyncHandler(async (req, res) => {
  const filter = { nursery: req.nursery._id };
  if (req.query.status) filter.status = req.query.status;
  const rows = await SellerOrder.find(filter)
    .populate("product", "name category unit")
    .populate("parentOrder", "deliveryAddress buyer createdAt")
    .sort({ createdAt: -1 });
  ok(res, rows);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const subOrder = await SellerOrder.findById(req.params.id);
  if (!subOrder) throw new ApiError(404, "Sub-order not found");
  if (String(subOrder.nursery) !== String(req.nursery._id)) {
    throw new ApiError(403, "This sub-order belongs to another nursery");
  }

  if (status === "accepted") {
    if (subOrder.status !== "pending") throw new ApiError(400, "Only pending orders can be accepted");
    subOrder.status = "accepted";
  } else if (status === "dispatched") {
    if (subOrder.status !== "accepted") throw new ApiError(400, "Accept the order before dispatching");
    subOrder.status = "dispatched";
    subOrder.dispatchedAt = new Date();
  } else if (status === "delivered") {
    if (subOrder.status !== "dispatched") throw new ApiError(400, "Dispatch before marking delivered");
    subOrder.status = "delivered";
    subOrder.deliveredAt = new Date();
    await Nursery.findByIdAndUpdate(subOrder.nursery, { $inc: { totalOrdersFulfilled: 1 } });
  } else if (status === "rejected") {
    if (!["pending", "accepted"].includes(subOrder.status)) {
      throw new ApiError(400, "This order can no longer be rejected");
    }
    subOrder.status = "rejected";
    subOrder.rejectionReason = rejectionReason || "No reason provided";
    await subOrder.save();
    const inv = await restoreByStock(subOrder.nursery, subOrder.product, subOrder.quantityAssigned);
    await InventoryMovement.create({
      nursery: subOrder.nursery,
      product: subOrder.product,
      previousQty: (inv?.quantityAvailable ?? 0) - subOrder.quantityAssigned,
      newQty: inv?.quantityAvailable ?? 0,
      reason: "seller_rejected",
      refId: subOrder.parentOrder,
    });
    await reassignRejected(subOrder);
    await recomputeParentStatus(subOrder.parentOrder);
    return ok(res, subOrder);
  } else {
    throw new ApiError(400, "Unsupported status");
  }

  await subOrder.save();
  await recomputeParentStatus(subOrder.parentOrder);
  ok(res, subOrder);
});
