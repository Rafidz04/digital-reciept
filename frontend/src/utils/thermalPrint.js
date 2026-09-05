import { rupiah } from "../services/api";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const jakartaDateTime = (value) => {
  const date = new Date(value || Date.now());
  return {
    date: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date),
  };
};

export function printThermalReceipt(order, selectedWidth = 80) {
  const paperWidth = Number(selectedWidth) === 58 ? 58 : 80;
  const printWindow = window.open("", "umami-thermal-print", "width=520,height=760");
  if (!printWindow) return false;

  const brand = import.meta.env.VITE_BRAND_NAME || "U-MaMi";
  const address = import.meta.env.VITE_BRAND_ADDRESS || "";
  const phone = import.meta.env.VITE_BRAND_PHONE || "";
  const footer = import.meta.env.VITE_BRAND_FOOTER || "Terima kasih sudah berbelanja.";
  const created = jakartaDateTime(order?.createdAt);
  const items = Array.isArray(order?.items) ? order.items : [];
  const totalQty = order?.totalQty ?? items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalAmount = order?.totalAmount ?? items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const itemRows = items.map((item) => `
    <div class="item">
      <div><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.qty)} × ${escapeHtml(rupiah(item.price))}</span></div>
      <strong>${escapeHtml(rupiah(item.subtotal ?? item.price * item.qty))}</strong>
    </div>`).join("");

  printWindow.document.write(`<!doctype html>
  <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>Struk ${escapeHtml(order?.receiptNo || "U-MaMi")}</title>
      <style>
        @page { size: ${paperWidth}mm auto; margin: 0; }
        * { box-sizing: border-box; }
        html, body { width: ${paperWidth}mm; margin: 0; padding: 0; background: #fff; color: #111; }
        body { padding: ${paperWidth === 58 ? "3mm" : "4mm"}; font-family: Arial, Helvetica, sans-serif; font-size: ${paperWidth === 58 ? "9px" : "10px"}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt { width: 100%; }
        .brand { text-align: center; }
        .brand img { width: ${paperWidth === 58 ? "27mm" : "34mm"}; height: ${paperWidth === 58 ? "18mm" : "23mm"}; margin: 0 auto 1.5mm; display: block; object-fit: cover; border-radius: 2mm; }
        .brand h1 { margin: 0; font-size: ${paperWidth === 58 ? "16px" : "19px"}; }
        .brand p { margin: 1mm 0 0; font-size: ${paperWidth === 58 ? "8px" : "9px"}; line-height: 1.35; }
        .title { margin: 3mm 0 1.8mm; padding-bottom: 1.3mm; border-bottom: 1px dashed #111; font-size: 8px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
        .meta { display: grid; gap: 1.2mm; }
        .meta div, .summary div { display: flex; justify-content: space-between; gap: 3mm; }
        .meta span { flex: 0 0 auto; }
        .meta b { min-width: 0; text-align: right; overflow-wrap: anywhere; }
        .item { padding: 2mm 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 2.5mm; border-bottom: 1px dotted #555; }
        .item > div { min-width: 0; display: flex; flex-direction: column; gap: .8mm; }
        .item b { line-height: 1.3; }
        .item span { font-size: ${paperWidth === 58 ? "8px" : "9px"}; }
        .item strong { flex: 0 0 auto; font-size: ${paperWidth === 58 ? "8px" : "10px"}; }
        .summary { margin-top: 2.5mm; padding: 2.5mm 0; border-top: 1.5px solid #111; border-bottom: 1.5px solid #111; display: grid; gap: 1.5mm; }
        .grand { align-items: baseline; font-size: ${paperWidth === 58 ? "13px" : "16px"}; font-weight: 800; }
        .thanks { margin: 4mm 1mm 0; text-align: center; font-weight: 700; line-height: 1.45; }
        .system { margin: 1.5mm 0 0; text-align: center; font-size: 8px; }
        .cut { margin-top: 4mm; border-top: 1px dashed #111; }
        @media screen { body { margin: 16px auto; box-shadow: 0 8px 30px rgba(0,0,0,.16); } }
      </style>
    </head>
    <body>
      <main class="receipt">
        <header class="brand">
          <img src="${window.location.origin}/logo.png" alt="Logo U-MaMi" />
          <h1>${escapeHtml(brand)}</h1>
          <p>${escapeHtml([address, phone].filter(Boolean).join(" • "))}</p>
        </header>
        <div class="title">Detail transaksi</div>
        <section class="meta">
          <div><span>No. struk</span><b>${escapeHtml(order?.receiptNo || "-")}</b></div>
          <div><span>Customer</span><b>${escapeHtml(order?.customerName || "-")}</b></div>
          <div><span>Tanggal</span><b>${escapeHtml(created.date)}</b></div>
          <div><span>Pukul</span><b>${escapeHtml(created.time)} WIB</b></div>
        </section>
        <div class="title">Rincian pesanan</div>
        <section>${itemRows}</section>
        <section class="summary">
          <div><span>Total porsi</span><b>${escapeHtml(totalQty)}</b></div>
          <div class="grand"><span>TOTAL</span><b>${escapeHtml(rupiah(totalAmount))}</b></div>
        </section>
        <p class="thanks">${escapeHtml(footer)}</p>
        <p class="system">Simpan struk ini sebagai bukti transaksi.</p>
        <div class="cut"></div>
      </main>
      <script>
        const startPrint = () => setTimeout(() => { window.focus(); window.print(); }, 250);
        const logo = document.querySelector("img");
        if (logo && !logo.complete) { logo.addEventListener("load", startPrint, { once: true }); logo.addEventListener("error", startPrint, { once: true }); }
        else { startPrint(); }
      <\/script>
    </body>
  </html>`);
  printWindow.document.close();
  return true;
}
