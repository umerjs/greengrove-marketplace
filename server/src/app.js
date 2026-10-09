import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";
import { isAllowedClientOrigin } from "./config/cors.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => callback(null, isAllowedClientOrigin(origin, env)),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (env.nodeEnv !== "production") app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "greenkarachi" }));
app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
