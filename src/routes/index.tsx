import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "GreenKarachi — B2B Nursery Marketplace" },
      { name: "description", content: "Bulk plant stock from verified Karachi nurseries in one place." },
      { property: "og:title", content: "GreenKarachi — B2B Nursery Marketplace" },
      { property: "og:description", content: "Bulk plant stock from verified Karachi nurseries in one place." },
    ],
  }),
});
