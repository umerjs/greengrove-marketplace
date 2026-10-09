import { ProductCatalog } from "../models/ProductCatalog.js";
import { Nursery } from "../models/Nursery.js";
import { MarketplaceRequest } from "../models/MarketplaceRequest.js";
import { getProductAggregates, getProductAggregate } from "../services/inventoryEngine.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";

export const listProducts = asyncHandler(async (req, res) => {
  const { search, category, minQty } = req.query;
  const rows = await getProductAggregates({ search, category, minQty });
  ok(res, rows);
});

export const getProduct = asyncHandler(async (req, res) => {
  const aggregate = await getProductAggregate(req.params.id);
  if (!aggregate) throw new ApiError(404, "Product is not currently available from any verified nursery");
  ok(res, aggregate);
});

export const createRequest = asyncHandler(async (req, res) => {
  const product = await ProductCatalog.findById(req.body.product);
  if (!product) throw new ApiError(404, "Product not found");
  const aggregate = await getProductAggregate(product._id);
  const matchSummary = {
    totalAvailable: aggregate?.totalAvailable ?? 0,
    nurseryCount: aggregate?.nurseryCount ?? 0,
  };
  const status = matchSummary.totalAvailable >= req.body.quantityRequested ? "matched" : "open";
  const request = await MarketplaceRequest.create({
    buyer: req.user.id,
    product: product._id,
    quantityRequested: req.body.quantityRequested,
    status,
    matchSummary,
  });
  created(res, request);
});

export const myRequests = asyncHandler(async (req, res) => {
  const rows = await MarketplaceRequest.find({ buyer: req.user.id })
    .populate("product", "name category unit")
    .sort({ createdAt: -1 });
  ok(res, rows);
});

export const stats = asyncHandler(async (_req, res) => {
  const [nurseries, products, aggregates] = await Promise.all([
    Nursery.countDocuments({ verificationStatus: "verified" }),
    ProductCatalog.countDocuments({ isActive: true }),
    getProductAggregates({}),
  ]);
  const totalStock = aggregates.reduce((sum, p) => sum + p.totalAvailable, 0);
  ok(res, { verifiedNurseries: nurseries, catalogProducts: products, totalStock });
});

export const featuredNurseries = asyncHandler(async (_req, res) => {
  const rows = await Nursery.find({ verificationStatus: "verified" })
    .select("name description serviceAreas rating totalOrdersFulfilled memberSince logo")
    .sort({ totalOrdersFulfilled: -1, memberSince: 1 })
    .limit(6);
  ok(res, rows);
});
