import test from "node:test";
import assert from "node:assert/strict";
import { allocateStocks } from "../services/orderSplitter.js";

const src = (id, qty, price, reserved = 0, status = "verified") => ({
  _id: `inv_${id}`,
  nursery: { _id: `nur_${id}`, name: `Nursery ${id}`, verificationStatus: status },
  quantityAvailable: qty,
  reservedQty: reserved,
  pricePerUnit: price,
});

test("fills from cheapest stock first and splits across nurseries", () => {
  const sources = [src("a", 4000, 55), src("b", 3000, 60), src("c", 3000, 65)];
  const splits = allocateStocks(sources, 10000);
  assert.equal(splits.length, 3);
  assert.deepEqual(splits.map((s) => s.qty), [4000, 3000, 3000]);
  assert.deepEqual(splits.map((s) => s.pricePerUnit), [55, 60, 65]);
});

test("excludes reserved quantity (effective stock)", () => {
  const sources = [src("a", 5000, 55, 1200)];
  assert.throws(() => allocateStocks(sources, 4000), /Only 3800 of 4000/);
  assert.equal(allocateStocks(sources, 3800)[0].qty, 3800);
});

test("skips unverified nurseries and excluded ids", () => {
  const sources = [src("a", 1000, 55, 0, "pending"), src("b", 1000, 60)];
  assert.deepEqual(allocateStocks(sources, 500).map((s) => s.nurseryName), ["Nursery b"]);
  assert.throws(() => allocateStocks(sources, 500, ["nur_b"]), /Only 0 of 500/);
});
