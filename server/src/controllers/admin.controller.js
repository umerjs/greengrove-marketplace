import { randomBytes } from "node:crypto";
import { User } from "../models/User.js";
import { Nursery } from "../models/Nursery.js";
import { ProductCatalog } from "../models/ProductCatalog.js";
import { NurseryInventory } from "../models/NurseryInventory.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import { notify } from "../services/notifier.js";

function slugify(name) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomBytes(3).toString("hex")}`;
}

export const pendingSellers = asyncHandler(async (_req, res) => {
  const rows = await Nursery.find({ verificationStatus: "pending" })
    .populate("owner", "name email phone createdAt")
    .sort({ createdAt: -1 });
  ok(res, rows);
});

export const allSellers = asyncHandler(async (_req, res) => {
  const rows = await Nursery.find()
    .populate("owner", "name email phone status")
    .sort({ createdAt: -1 });
  ok(res, rows);
});

export const approveSeller = asyncHandler(async (req, res) => {
  const { approve } = req.body;
  const nursery = await Nursery.findById(req.params.id);
  if (!nursery) throw new ApiError(404, "Nursery not found");

  nursery.verificationStatus = approve ? "verified" : "rejected";
  nursery.approvedBy = req.user.id;
  nursery.approvedAt = new Date();
  if (approve) nursery.memberSince = nursery.memberSince ?? new Date();
  await nursery.save();

  await User.findByIdAndUpdate(nursery.owner, { status: approve ? "active" : "suspended" });
  await notify(
    nursery.owner,
    "approval",
    approve ? `Your nursery "${nursery.name}" was approved. You can now list stock.` : `Your nursery "${nursery.name}" application was rejected.`,
    nursery._id,
  );
  ok(res, nursery);
});

export const inventoryOverview = asyncHandler(async (_req, res) => {
  const rows = await NurseryInventory.find()
    .populate("product", "name category unit")
    .populate("nursery", "name verificationStatus")
    .sort({ quantityAvailable: -1 });
  const byProduct = new Map();
  for (const row of rows) {
    const key = String(row.product?._id ?? row.product);
    const entry = byProduct.get(key) ?? {
      product: row.product,
      totalAvailable: 0,
      totalReserved: 0,
      nurseryCount: 0,
      nurseries: [],
    };
    entry.totalAvailable += row.quantityAvailable;
    entry.totalReserved += row.reservedQty;
    entry.nurseryCount += 1;
    entry.nurseries.push({
      nurseryName: row.nursery?.name ?? "Unknown",
      verificationStatus: row.nursery?.verificationStatus,
      quantityAvailable: row.quantityAvailable,
      reservedQty: row.reservedQty,
      pricePerUnit: row.pricePerUnit,
      isListed: row.isListed,
    });
    byProduct.set(key, entry);
  }
  ok(res, [...byProduct.values()]);
});

export const allOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const rows = await Order.find(filter)
    .populate("product", "name category unit")
    .populate("buyer", "name email")
    .populate("sellerOrders", "nursery quantityAssigned status")
    .sort({ createdAt: -1 });
  ok(res, rows);
});

export const listProducts = asyncHandler(async (_req, res) => {
  const rows = await ProductCatalog.find().sort({ name: 1 });
  ok(res, rows);
});

export const createProduct = asyncHandler(async (req, res) => {
  const doc = await ProductCatalog.create({ ...req.body, slug: slugify(req.body.name) });
  created(res, doc);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const doc = await ProductCatalog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new ApiError(404, "Product not found");
  ok(res, doc);
});

export const stats = asyncHandler(async (_req, res) => {
  const [nurseries, pendingNurseries, products, orders, gmvAgg] = await Promise.all([
    Nursery.countDocuments({ verificationStatus: "verified" }),
    Nursery.countDocuments({ verificationStatus: "pending" }),
    NurseryInventory.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmountPKR" } } },
    ]),
  ]);
  ok(res, {
    verifiedNurseries: nurseries,
    pendingNurseries,
    inventoryRecords: products,
    totalOrders: orders,
    gmvPKR: gmvAgg[0]?.total ?? 0,
  });
});
