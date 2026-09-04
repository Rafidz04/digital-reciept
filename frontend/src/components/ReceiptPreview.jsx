import { useEffect, useState } from "react";
import { rupiah } from "../services/api";

function formatDateTime(dateValue) {
  const d = new Date(dateValue);
  return {
    date: new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" }).format(d),
    time: new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d)
  };
}

export default function ReceiptPreview({ order, customerName, cart }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (order) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [order]);

  const items = order?.items || cart || [];
  const created = formatDateTime(order?.createdAt || now);
  const totalQty = order?.totalQty ?? items.reduce((s, x) => s + x.qty, 0);
  const totalAmount = order?.totalAmount ?? items.reduce((s, x) => s + x.price * x.qty, 0);
  const brand = import.meta.env.VITE_BRAND_NAME || "YOUR BRAND";
  const address = import.meta.env.VITE_BRAND_ADDRESS || "";
  const phone = import.meta.env.VITE_BRAND_PHONE || "";
  const footer = import.meta.env.VITE_BRAND_FOOTER || "Terima kasih sudah berbelanja. Sampai jumpa kembali!";

  return (
    <div className="receipt-paper">
      <div className="receipt-brand">
        <span className="receipt-logo-frame"><img src="/logo.png" alt="Logo U-MaMi" /></span>
        <strong>{brand}</strong>
        {(address || phone) && <small className="receipt-contact">{[address, phone].filter(Boolean).join("  •  ")}</small>}
        <span className="receipt-kicker">Digital Receipt</span>
      </div>

      <section className="receipt-section">
        <div className="receipt-section-title">Detail transaksi</div>
        <div className="receipt-meta-card">
          <div><span>No. struk</span><b>{order?.receiptNo || "PREVIEW"}</b></div>
          <div><span>Customer</span><b>{order?.customerName || customerName || "-"}</b></div>
          <div><span>Tanggal</span><b>{created.date}</b></div>
          <div><span>Pukul</span><b>{created.time} WIB</b></div>
        </div>
      </section>

      <section className="receipt-section receipt-order-section">
        <div className="receipt-order-heading">
          <div className="receipt-section-title">Rincian pesanan</div>
          <b>{totalQty} porsi</b>
        </div>
        <div className="receipt-table-head"><span>Menu</span><span>Subtotal</span></div>
        <div className="receipt-items">
          {items.length === 0 ? <p className="receipt-empty">Belum ada menu di keranjang.</p> : items.map((item) => (
            <div className="receipt-item" key={item.menuId || item._id}>
              <div><strong>{item.name}</strong><span>{item.qty} × {rupiah(item.price)}</span></div>
              <b>{rupiah(item.subtotal ?? item.price * item.qty)}</b>
            </div>
          ))}
        </div>
      </section>

      <div className="receipt-total-card">
        <div><span>Total porsi</span><b>{totalQty}</b></div>
        <div><strong>TOTAL</strong><strong>{rupiah(totalAmount)}</strong></div>
      </div>
      <p className="receipt-thanks">{footer}<span>Simpan struk ini sebagai bukti transaksi.</span></p>
      <div className="receipt-dots"><i></i><i></i><i></i></div>
    </div>
  );
}
