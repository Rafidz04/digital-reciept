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
    const menu = new Menu({
      name: name.trim(),
      price: numericPrice,
      softDelete: false
    });
    if (req.file) {
      menu.image = `/api/menus/${menu._id}/image`;
      menu.imageData = req.file.buffer;
      menu.imageMimeType = req.file.mimetype;
    }
    await menu.save();
    const responseMenu = menu.toObject();
    delete responseMenu.imageData;
    delete responseMenu.imageMimeType;
    res.status(201).json({ success: true, data: responseMenu });
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
    if (req.file) {
      payload.image = `/api/menus/${req.params.id}/image?v=${Date.now()}`;
      payload.imageData = req.file.buffer;
      payload.imageMimeType = req.file.mimetype;
    }

    const menu = await Menu.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!menu) return res.status(404).json({ success: false, message: "Menu tidak ditemukan." });
    res.json({ success: true, data: menu });
  } catch (e) { next(e); }
}

export async function getMenuImage(req, res, next) {
  try {
    const menu = await Menu.findById(req.params.id).select("+imageData +imageMimeType");
    if (!menu?.imageData) return res.status(404).json({ success: false, message: "Gambar menu tidak ditemukan." });
    res.setHeader("Content-Type", menu.imageMimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(menu.imageData);
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
