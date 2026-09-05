import { Router } from "express";
import multer from "multer";
import { createMenu, getMenuImage, listMenus, toggleMenu, updateMenu } from "../controllers/menuController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("File menu harus berupa gambar."));
    cb(null, true);
  }
});

// Gambar boleh dibaca tanpa token agar dapat langsung dipakai oleh elemen <img>.
router.get("/:id/image", getMenuImage);
router.use(requireAuth);
router.get("/", listMenus);
router.post("/", upload.single("image"), createMenu);
router.put("/:id", upload.single("image"), updateMenu);
router.patch("/:id/status", toggleMenu);

export default router;
