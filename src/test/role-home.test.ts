import { describe, expect, it } from "vitest";
import { homeForRole } from "@/lib/auth";

describe("login redirects by role", () => {
  it("sends admins to nurseries", () => expect(homeForRole("super_admin")).toBe("/admin/nurseries"));
  it("sends sellers to their dashboard", () => expect(homeForRole("nursery_seller")).toBe("/seller/dashboard"));
  it("sends buyers to the marketplace", () => expect(homeForRole("buyer")).toBe("/buyer/marketplace"));
});
