import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedClientOrigin } from "../config/cors.js";

const config = { clientUrl: "https://greenkarachi.example", isProd: false };

test("allows the configured client origin in every environment", () => {
  assert.equal(isAllowedClientOrigin(config.clientUrl, { ...config, isProd: true }), true);
});

test("allows local development clients on an automatically selected port", () => {
  assert.equal(isAllowedClientOrigin("http://localhost:5175", config), true);
  assert.equal(isAllowedClientOrigin("http://127.0.0.1:5175", config), true);
});

test("rejects unconfigured remote origins and non-local origins in development", () => {
  assert.equal(isAllowedClientOrigin("https://attacker.example", config), false);
  assert.equal(isAllowedClientOrigin("http://192.168.1.10:5173", config), false);
  assert.equal(
    isAllowedClientOrigin("http://localhost:5175", { ...config, isProd: true }),
    false,
  );
});
