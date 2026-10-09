import assert from "node:assert/strict";
import test from "node:test";
import { StockReserve } from "../models/StockReserve.js";

test("expired reserve documents are retained until the reaper releases their stock", () => {
  const expiresAtIndex = StockReserve.schema.indexes().find(([keys]) => keys.expiresAt === 1);

  assert.ok(expiresAtIndex, "expiresAt should have an index for cleanup scans");
  assert.equal(expiresAtIndex[1].expireAfterSeconds, undefined);
});
