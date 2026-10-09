import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}. Fill server/.env`);
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  reserveMinutes: Number(process.env.RESERVE_MINUTES ?? 10),
};
