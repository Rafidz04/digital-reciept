import axios from "axios";
import FormData from "form-data";
import Menu from "../models/Menu.js";
import Order from "../models/Order.js";
import { buildReceiptPdf } from "../utils/pdf.js";
import { makeReceiptNo } from "../utils/format.js";

const normalizeWa = (value = "") => {
  const clean = value.replace(/\D/g, "");
  if (clean.startsWith("0")) return `62${clean.slice(1)}`;
  return clean;
};

export async function checkout(req, res, next) {
  try {
    const { customerName, items } = req.body;
    if (!customerName?.trim()) return res.status(400).json({ success: false, message: "Nama customer wajib diisi." });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ success: false, message: "Keranjang masih kosong." });

    const ids = items.map((x) => x.menuId);
    const menus = await Menu.find({ _id: { $in: ids }, softDelete: false });
    const map = new Map(menus.map((m) => [String(m._id), m]));

    const finalItems = items.map((item) => {
      const menu = map.get(String(item.menuId));
      const qty = Math.max(1, Number(item.qty || 1));
      if (!menu) throw new Error("Ada menu yang sudah tidak aktif / tidak ditemukan.");
      return {
        menuId: menu._id,
        name: menu.name,
        price: menu.price,
        qty,
        subtotal: menu.price * qty
      };
    });

    const totalQty = finalItems.reduce((a, b) => a + b.qty, 0);
    const totalAmount = finalItems.reduce((a, b) => a + b.subtotal, 0);
    const order = await Order.create({
      receiptNo: makeReceiptNo(),
      customerName: customerName.trim(),
      items: finalItems,
      totalQty,
      totalAmount,
      whatsappTo: normalizeWa(process.env.WA_TO || "6281511003770")
    });
    res.status(201).json({ success: true, data: order });
  } catch (e) { next(e); }
}

export async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
    res.json({ success: true, data: order });
  } catch (e) { next(e); }
}

export async function downloadPdf(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
    const pdf = await buildReceiptPdf(order);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Struk-${order.receiptNo}.pdf`);
    res.send(pdf);
  } catch (e) { next(e); }
}

export async function sendWhatsApp(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });

    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
    const token = process.env.WA_ACCESS_TOKEN;
    const apiVersion = process.env.WA_API_VERSION || "v23.0";
    const to = normalizeWa(process.env.WA_TO || order.whatsappTo || "6281511003770");

    if (!phoneNumberId || !token) {
      return res.status(503).json({
        success: false,
        code: "WA_NOT_CONFIGURED",
        message: "WhatsApp Cloud API belum dikonfigurasi. PDF tetap dapat di-download.",
        pdfUrl: `/api/orders/${order._id}/pdf`,
        whatsappUrl: `https://wa.me/${to}?text=${encodeURIComponent(`Halo, berikut struk ${order.receiptNo}. Silakan lampirkan PDF yang sudah di-download.`)}`
      });
    }

    const pdf = await buildReceiptPdf(order);
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", "application/pdf");
    form.append("file", pdf, { filename: `Struk-${order.receiptNo}.pdf`, contentType: "application/pdf" });

    const mediaRes = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
      form,
      { headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() } }
    );

    const sendRes = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: {
          id: mediaRes.data.id,
          filename: `Struk-${order.receiptNo}.pdf`,
          caption: `Struk digital ${process.env.BRAND_NAME || "kami"} - ${order.receiptNo}`
        }
      },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );

    order.whatsappStatus = "sent";
    order.whatsappSentAt = new Date();
    order.whatsappMessageId = sendRes.data?.messages?.[0]?.id || null;
    await order.save();

    res.json({ success: true, message: "PDF berhasil dikirim ke WhatsApp.", data: order });
  } catch (e) {
    try {
      if (req.params.id) await Order.findByIdAndUpdate(req.params.id, { whatsappStatus: "failed" });
    } catch {}
    next(e);
  }
}

export async function dashboard(req, res, next) {
  try {
    const date = req.query.date || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    const start = new Date(`${date}T00:00:00+07:00`);
    const end = new Date(`${date}T23:59:59.999+07:00`);

    const [summary] = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" }, transactions: { $sum: 1 }, items: { $sum: "$totalQty" } } }
    ]);

    const menuSales = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", qty: { $sum: "$items.qty" }, revenue: { $sum: "$items.subtotal" } } },
      { $sort: { qty: -1 } }
    ]);

    const hourly = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
          _id: { $dateToString: { format: "%H:00", date: "$createdAt", timezone: "Asia/Jakarta" } },
          revenue: { $sum: "$totalAmount" },
          transactions: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);

    const recentOrders = await Order.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        date,
        summary: summary || { revenue: 0, transactions: 0, items: 0 },
        menuSales: menuSales.map((x) => ({ name: x._id, qty: x.qty, revenue: x.revenue })),
        hourly: hourly.map((x) => ({ hour: x._id, revenue: x.revenue, transactions: x.transactions })),
        recentOrders
      }
    });
  } catch (e) { next(e); }
}
