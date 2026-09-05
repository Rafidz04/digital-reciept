import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const tokenOptions = {
  expiresIn: "12h",
  issuer: "umami-digital-receipt",
  audience: "umami-superadmin",
};

const publicUser = (user) => ({
  id: String(user._id),
  username: user.username,
  role: user.role,
});

export async function login(req, res, next) {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi.",
      });
    }

    const user = await User.findOne({ username }).select("+passwordHash");
    const passwordValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordValid) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Username atau password tidak sesuai.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET belum dikonfigurasi.");
    }

    const token = jwt.sign(
      { sub: String(user._id), username: user.username, role: user.role },
      process.env.JWT_SECRET,
      tokenOptions,
    );

    res.json({
      success: true,
      data: { token, user: publicUser(user) },
    });
  } catch (error) {
    next(error);
  }
}

export function currentUser(req, res) {
  res.json({ success: true, data: { user: publicUser(req.user) } });
}
