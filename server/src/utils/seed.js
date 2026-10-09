import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Nursery } from "../models/Nursery.js";
import { ProductCatalog } from "../models/ProductCatalog.js";
import { NurseryInventory } from "../models/NurseryInventory.js";
import { Order } from "../models/Order.js";
import { SellerOrder } from "../models/SellerOrder.js";
import { Notification } from "../models/Notification.js";
import { StockReserve } from "../models/StockReserve.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import { MarketplaceRequest } from "../models/MarketplaceRequest.js";

const PASSWORD = "password123";

const catalogSeed = [
  { name: "Coconut Plant", category: "plants", unit: "pieces" },
  { name: "Mango Sapling", category: "plants", unit: "pieces" },
  { name: "Neem Tree", category: "plants", unit: "pieces" },
  { name: "Bougainvillea", category: "plants", unit: "pieces" },
  { name: "Money Plant", category: "plants", unit: "pieces" },
  { name: "Aloe Vera", category: "plants", unit: "pieces" },
  { name: "DAP Fertilizer", category: "fertilizers", unit: "kg" },
  { name: "Urea", category: "fertilizers", unit: "kg" },
  { name: "Organic Compost", category: "fertilizers", unit: "bag" },
  { name: "Sunflower Seeds", category: "seeds", unit: "kg" },
  { name: "Coriander Seeds", category: "seeds", unit: "kg" },
  { name: "Garden Spade", category: "tools", unit: "pieces" },
  { name: "Watering Can", category: "tools", unit: "pieces" },
];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function makeUser({ email, name, role, status, phone }) {
  const user = new User({ email, name, role, status, phone: phone ?? "" });
  await user.setPassword(PASSWORD);
  await user.save();
  return user;
}

async function run() {
  await connectDB();
  await Promise.all(
    [User, Nursery, ProductCatalog, NurseryInventory, Order, SellerOrder, Notification, StockReserve, InventoryMovement, MarketplaceRequest].map(
      (M) => M.deleteMany({}),
    ),
  );

  const admin = await makeUser({ email: "admin@greenkarachi.pk", name: "Saylani Admin", role: "super_admin", status: "active", phone: "+92 300 0000001" });
  const seller1 = await makeUser({ email: "seller1@gulshan.pk", name: "Imran Gulshan", role: "nursery_seller", status: "active", phone: "+92 300 0000002" });
  const seller2 = await makeUser({ email: "seller2@defence.pk", name: "Sana DHA", role: "nursery_seller", status: "active", phone: "+92 300 0000003" });
  const seller3 = await makeUser({ email: "seller3@korangi.pk", name: "Bilal Korangi", role: "nursery_seller", status: "pending", phone: "+92 300 0000004" });
  const buyer1 = await makeUser({ email: "buyer1@company.pk", name: "Zenith Landscaping", role: "buyer", status: "active", phone: "+92 300 0000005" });

  const gulshan = await Nursery.create({
    owner: seller1._id,
    name: "Gulshan Nursery",
    description: "Family-run wholesale nursery in Gulshan-e-Iqbal.",
    address: "Main University Road, Gulshan-e-Iqbal, Karachi",
    phone: "+92 300 0000002",
    serviceAreas: ["Gulshan", "North Nazimabad", "Federal B Area"],
    verificationStatus: "verified",
    approvedBy: admin._id,
    approvedAt: new Date(),
  });
  const dha = await Nursery.create({
    owner: seller2._id,
    name: "DHA Nursery",
    description: "Premium plant stock across DHA and Clifton.",
    address: "Khayaban-e-Ittehad, DHA Phase 6, Karachi",
    phone: "+92 300 0000003",
    serviceAreas: ["DHA", "Clifton", "Defence"],
    verificationStatus: "verified",
    approvedBy: admin._id,
    approvedAt: new Date(),
  });
  await Nursery.create({
    owner: seller3._id,
    name: "Korangi Nursery",
    description: "Bulk plants near Korangi Industrial Area.",
    address: "Korangi Industrial Area, Karachi",
    phone: "+92 300 0000004",
    serviceAreas: ["Korangi", "Landhi"],
    verificationStatus: "pending",
  });

  const products = await ProductCatalog.insertMany(
    catalogSeed.map((p) => ({ ...p, slug: slug(p.name), description: `Wholesale ${p.name}.`, isActive: true })),
  );
  const byName = Object.fromEntries(products.map((p) => [p.name, p]));

  await NurseryInventory.insertMany([
    { nursery: gulshan._id, product: byName["Coconut Plant"]._id, quantityAvailable: 5000, pricePerUnit: 55, minOrderQty: 100, lowStockThreshold: 500, isListed: true },
    { nursery: gulshan._id, product: byName["Mango Sapling"]._id, quantityAvailable: 800, pricePerUnit: 120, minOrderQty: 50, lowStockThreshold: 100, isListed: true },
    { nursery: gulshan._id, product: byName["DAP Fertilizer"]._id, quantityAvailable: 500, pricePerUnit: 200, minOrderQty: 10, lowStockThreshold: 50, isListed: true },
    { nursery: dha._id, product: byName["Coconut Plant"]._id, quantityAvailable: 3420, pricePerUnit: 60, minOrderQty: 100, lowStockThreshold: 400, isListed: true },
    { nursery: dha._id, product: byName["Neem Tree"]._id, quantityAvailable: 1200, pricePerUnit: 85, minOrderQty: 50, lowStockThreshold: 150, isListed: true },
    { nursery: dha._id, product: byName["Organic Compost"]._id, quantityAvailable: 300, pricePerUnit: 150, minOrderQty: 20, lowStockThreshold: 40, isListed: true },
  ]);

  console.log("Seed complete.");
  console.log(`  admin:  admin@greenkarachi.pk / ${PASSWORD}`);
  console.log(`  seller: seller1@gulshan.pk / ${PASSWORD} (verified)`);
  console.log(`  seller: seller2@defence.pk / ${PASSWORD} (verified)`);
  console.log(`  seller: seller3@korangi.pk / ${PASSWORD} (pending)`);
  console.log(`  buyer:  buyer1@company.pk / ${PASSWORD}`);
  console.log(`  Coconut Plant aggregate: 5,000 + 3,420 = 8,420 units across 2 nurseries · PKR 55–60/unit`);
  console.log(`  (env ${env.nodeEnv}, buyer ${buyer1.email})`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
