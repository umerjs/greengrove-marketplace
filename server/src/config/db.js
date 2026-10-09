import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { autoIndex: true });
  console.log("[db] MongoDB connected");
  return mongoose.connection;
}
