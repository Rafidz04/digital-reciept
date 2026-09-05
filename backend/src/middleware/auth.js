import jwt from "jsonwebtoken";
import User from "../models/User.js";

const verifyOptions = {
  issuer: "umami-digital-receipt",
  audience: "umami-superadmin",
};

export async function requireAuth(req, res, next) {
  try {
    const authorization = String(req.headers.authorization || "");
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Silakan login untuk melanjutkan.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET belum dikonfigurasi.");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
    const user = await User.findById(payload.sub);

    if (!user || user.role !== "superadmin") {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Sesi login tidak valid atau sudah berakhir.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Sesi login tidak valid atau sudah berakhir.",
      });
    }
    next(error);
  }
}
