import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { startReserveReaper } from "./services/reserveReaper.js";

async function main() {
  await connectDB();
  startReserveReaper();
  app.listen(env.port, () => {
    console.log(`[server] GreenKarachi API on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal", err);
  process.exit(1);
});
