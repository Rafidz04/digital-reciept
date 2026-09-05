import { Router } from "express";
import { checkout, dashboard, downloadPdf, getOrder, sendWhatsApp } from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.post("/checkout", checkout);
router.get("/dashboard", dashboard);
router.get("/:id", getOrder);
router.get("/:id/pdf", downloadPdf);
router.post("/:id/send-whatsapp", sendWhatsApp);
export default router;
