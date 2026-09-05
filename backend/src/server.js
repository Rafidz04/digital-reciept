import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { ensureSuperAdmin } from "./utils/superAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        configuredOrigins.includes(origin) ||
        isLocalOrigin(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS.`));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../public/uploads")),
);
app.use(
  "/logo.png",
  express.static(path.resolve(__dirname, "../public/logo.png")),
);

app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "Digital Receipt API OK" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);

app.use((err, _req, res, _next) => {
  console.error("[API ERROR]", err?.response?.data || err);
  const status =
    err.name === "MulterError" ||
    err.message === "File menu harus berupa gambar."
      ? 400
      : 500;
  res.status(status).json({
    success: false,
    message: err.message || "Terjadi kesalahan server.",
    detail: err?.response?.data || null,
  });
});

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/digital_receipt";
if (mongoose.connection.readyState === 0) {
  await mongoose.connect(mongoUrl);
  console.log("[DB] MongoDB connected");
}
await ensureSuperAdmin();

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 8080);
  app.listen(port, () => console.log(`[API] http://localhost:${port}`));
}

export default app;
