import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jakartaDateParts, rupiah } from "./format.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_WIDTH = 226.77; // 80 mm thermal receipt
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const colors = {
  orange: "#F45A1B",
  orangeDark: "#D94710",
  orangeSoft: "#FFF0DC",
  cream: "#FFF9ED",
  paper: "#FFFDF8",
  ink: "#39271E",
  muted: "#816E62",
  line: "#E8D6C1",
  white: "#FFFFFF"
};

function estimatedItemHeight(item) {
  const nameLength = String(item?.name || "").length;
  const extraLines = Math.max(0, Math.ceil(nameLength / 27) - 1);
  return 35 + extraLines * 9;
}

function label(doc, text, x, y, options = {}) {
  doc
    .font("Helvetica-Bold")
    .fontSize(6.4)
    .fillColor(colors.orangeDark)
    .text(String(text).toUpperCase(), x, y, {
      characterSpacing: 0.8,
      ...options
    });
}

export function buildReceiptPdf(order) {
  return new Promise((resolve, reject) => {
    try {
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsHeight = items.reduce((height, item) => height + estimatedItemHeight(item), 0);
      const footerText = process.env.BRAND_FOOTER || "Terima kasih sudah berbelanja.";
      const footerExtraLines = Math.max(0, Math.ceil(footerText.length / 42) - 2);
      const receiptHeight = Math.max(445, 408 + itemsHeight + footerExtraLines * 9);
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, receiptHeight],
        margin: 0,
        info: {
          Title: `Struk ${order.receiptNo}`,
          Author: process.env.BRAND_NAME || "U-MaMi",
          Subject: "Struk digital"
        }
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const brand = process.env.BRAND_NAME || "U-MaMi";
      const address = process.env.BRAND_ADDRESS || "";
      const phone = process.env.BRAND_PHONE || "";
      const footer = footerText;
      const created = jakartaDateParts(order.createdAt || new Date());
      const logoPath = path.resolve(__dirname, "../../public/logo.png");

      doc.rect(0, 0, PAGE_WIDTH, receiptHeight).fill(colors.cream);
      doc.rect(0, 0, PAGE_WIDTH, 6).fill(colors.orange);

      if (fs.existsSync(logoPath)) {
        try {
          doc.save();
          doc.roundedRect(62, 14, 103, 70, 12).clip();
          doc.image(logoPath, 44, -13, { width: 140 });
          doc.restore();
        } catch {}
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(colors.orangeDark)
        .text(brand, MARGIN, 88, { width: CONTENT_WIDTH, align: "center" });

      const contact = [address, phone].filter(Boolean).join("  •  ");
      if (contact) {
        doc
          .font("Helvetica")
          .fontSize(6.7)
          .fillColor(colors.muted)
          .text(contact, MARGIN, 106, { width: CONTENT_WIDTH, align: "center" });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(6.2)
        .fillColor(colors.orange)
        .text("DIGITAL RECEIPT", MARGIN, 120, {
          width: CONTENT_WIDTH,
          align: "center",
          characterSpacing: 1.5
        });

      let y = 139;
      label(doc, "Detail transaksi", MARGIN, y);
      y += 13;

      const metaHeight = 72;
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, metaHeight, 10).fill(colors.paper);
      doc.roundedRect(MARGIN, y, 4, metaHeight, 2).fill(colors.orange);

      const metaRows = [
        ["No. struk", order.receiptNo || "-"],
        ["Customer", order.customerName || "-"],
        ["Tanggal", created.date],
        ["Pukul", `${created.time} WIB`]
      ];

      metaRows.forEach(([key, value], index) => {
        const rowY = y + 10 + index * 14;
        doc.font("Helvetica").fontSize(6.8).fillColor(colors.muted).text(key, MARGIN + 12, rowY, { width: 47 });
        doc.font("Helvetica-Bold").fontSize(6.8).fillColor(colors.ink).text(value, MARGIN + 62, rowY, {
          width: CONTENT_WIDTH - 72,
          align: "right",
          ellipsis: true
        });
      });

      y += metaHeight + 17;

      label(doc, "Rincian pesanan", MARGIN, y);
      doc
        .font("Helvetica-Bold")
        .fontSize(6.2)
        .fillColor(colors.orangeDark)
        .text(`${order.totalQty || 0} PORSI`, PAGE_WIDTH - MARGIN - 54, y, { width: 54, align: "right" });
      y += 14;

      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 6).fill(colors.orangeSoft);
      doc.font("Helvetica-Bold").fontSize(6.2).fillColor(colors.muted).text("MENU", MARGIN + 9, y + 7);
      doc.text("SUBTOTAL", PAGE_WIDTH - MARGIN - 64, y + 7, { width: 55, align: "right" });
      y += 25;

      if (!items.length) {
        doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text("Belum ada item.", MARGIN, y + 5, {
          width: CONTENT_WIDTH,
          align: "center"
        });
        y += 28;
      } else {
        items.forEach((item) => {
          const rowTop = y;
          const nameHeight = doc.heightOfString(item.name, { width: 122, font: "Helvetica-Bold", fontSize: 8 });
          const rowHeight = Math.max(32, nameHeight + 15);

          doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text(item.name, MARGIN + 3, rowTop, {
            width: 122,
            lineGap: 1
          });
          doc.font("Helvetica").fontSize(6.8).fillColor(colors.muted).text(
            `${item.qty} × ${rupiah(item.price)}`,
            MARGIN + 3,
            rowTop + nameHeight + 3,
            { width: 122 }
          );
          doc.font("Helvetica-Bold").fontSize(7.6).fillColor(colors.ink).text(
            rupiah(item.subtotal ?? item.price * item.qty),
            PAGE_WIDTH - MARGIN - 66,
            rowTop + 1,
            { width: 63, align: "right" }
          );

          y += rowHeight;
          doc.moveTo(MARGIN, y - 4).lineTo(PAGE_WIDTH - MARGIN, y - 4).lineWidth(0.5).strokeColor(colors.line).stroke();
        });
      }

      y += 8;

      const totalHeight = 54;
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, totalHeight, 11).fill(colors.orange);
      doc.font("Helvetica").fontSize(6.8).fillColor(colors.white).text("Total porsi", MARGIN + 12, y + 10);
      doc.font("Helvetica-Bold").fontSize(7).text(String(order.totalQty || 0), PAGE_WIDTH - MARGIN - 45, y + 10, {
        width: 33,
        align: "right"
      });
      doc.font("Helvetica-Bold").fontSize(9).text("TOTAL", MARGIN + 12, y + 29);
      doc.font("Helvetica-Bold").fontSize(13).text(rupiah(order.totalAmount || 0), PAGE_WIDTH - MARGIN - 102, y + 25, {
        width: 90,
        align: "right"
      });
      y += totalHeight + 17;

      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.ink).text(footer, MARGIN + 8, y, {
        width: CONTENT_WIDTH - 16,
        align: "center",
        lineGap: 1.5
      });
      y += doc.heightOfString(footer, { width: CONTENT_WIDTH - 16, fontSize: 7.5, lineGap: 1.5 }) + 7;
      doc.font("Helvetica").fontSize(6.2).fillColor(colors.muted).text(
        "Simpan struk ini sebagai bukti transaksi.",
        MARGIN,
        y,
        { width: CONTENT_WIDTH, align: "center" }
      );
      y += 15;

      doc.circle(PAGE_WIDTH / 2 - 7, y, 1.6).fill(colors.orange);
      doc.circle(PAGE_WIDTH / 2, y, 1.6).fill(colors.orange);
      doc.circle(PAGE_WIDTH / 2 + 7, y, 1.6).fill(colors.orange);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
