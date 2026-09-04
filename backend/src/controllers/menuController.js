import Menu from "../models/Menu.js";

export async function listMenus(req, res, next) {
  try {
    const status = req.query.status || "active";
    const filter = status === "all" ? {} : { softDelete: status === "inactive" };
    const data = await Menu.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createMenu(req, res, next) {
  try {
    const { name, price } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Nama menu wajib diisi." });
    const numericPrice = Number(price);
    if (price === undefined || price === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ success: false, message: "Harga tidak valid." });
    }
    const menu = await Menu.create({
      name: name.trim(),
      price: numericPrice,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      softDelete: false
    });
    res.status(201).json({ success: true, data: menu });
  } catch (e) { next(e); }
}

export async function updateMenu(req, res, next) {
  try {
    const payload = {};
    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) return res.status(400).json({ success: false, message: "Nama menu wajib diisi." });
      payload.name = req.body.name.trim();
    }
    if (req.body.price !== undefined) {
      const numericPrice = Number(req.body.price);
      if (req.body.price === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ success: false, message: "Harga tidak valid." });
      }
      payload.price = numericPrice;
    }
    if (req.file) payload.image = `/uploads/${req.file.filename}`;

    const menu = await Menu.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!menu) return res.status(404).json({ success: false, message: "Menu tidak ditemukan." });
    res.json({ success: true, data: menu });
  } catch (e) { next(e); }
}

export async function toggleMenu(req, res, next) {
  try {
    const { softDelete } = req.body;
    if (typeof softDelete !== "boolean") return res.status(400).json({ success: false, message: "softDelete harus boolean." });
    const menu = await Menu.findByIdAndUpdate(req.params.id, { softDelete }, { new: true });
    if (!menu) return res.status(404).json({ success: false, message: "Menu tidak ditemukan." });
    res.json({ success: true, data: menu });
  } catch (e) { next(e); }
}
