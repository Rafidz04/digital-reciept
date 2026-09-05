import User from "../models/User.js";

export async function ensureSuperAdmin() {
  const username = String(process.env.SUPERADMIN_USERNAME || "")
    .trim()
    .toLowerCase();
  const passwordHash = String(process.env.SUPERADMIN_PASSWORD_HASH || "").trim();

  if (!username || !passwordHash) {
    throw new Error(
      "SUPERADMIN_USERNAME dan SUPERADMIN_PASSWORD_HASH wajib dikonfigurasi.",
    );
  }

  if (!/^\$2[aby]\$\d{2}\$/.test(passwordHash)) {
    throw new Error("SUPERADMIN_PASSWORD_HASH harus berupa hash bcrypt yang valid.");
  }

  const admin = await User.findOneAndUpdate(
    { username },
    { $set: { username, passwordHash, role: "superadmin" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Aplikasi ini memang hanya memiliki satu akun superadmin dan tidak menyediakan registrasi.
  await User.deleteMany({ _id: { $ne: admin._id } });
  return admin;
}
