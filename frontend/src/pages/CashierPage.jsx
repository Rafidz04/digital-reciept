import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, Download, Minus, Plus, Printer, Search, Send, ShoppingBag, Trash2 } from "lucide-react";
import { api, apiErrorMessage, imageUrl, rupiah } from "../services/api";
import ReceiptPreview from "../components/ReceiptPreview";
import Modal from "../components/Modal";
import { printThermalReceipt } from "../utils/thermalPrint";

export default function CashierPage() {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menusLoading, setMenusLoading] = useState(true);
  const [menusError, setMenusError] = useState("");
  const [message, setMessage] = useState("");
  const [fallbackLinks, setFallbackLinks] = useState(null);
  const [customerAlertOpen, setCustomerAlertOpen] = useState(false);
  const [customerNeedsAttention, setCustomerNeedsAttention] = useState(false);
  const [paperWidth, setPaperWidth] = useState(() => Number(localStorage.getItem("umami:paper-width")) === 58 ? 58 : 80);
  const customerInputRef = useRef(null);

  const loadMenus = async () => {
    try {
      setMenusLoading(true);
      setMenusError("");
      const { data } = await api.get("/menus?status=active");
      setMenus(data.data || []);
    } catch (error) {
      setMenusError(apiErrorMessage(error, "Daftar menu gagal dimuat."));
    } finally {
      setMenusLoading(false);
    }
  };
  useEffect(() => { loadMenus(); }, []);

  const filtered = useMemo(() => menus.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())), [menus, search]);
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const qtyTotal = cart.reduce((s, x) => s + x.qty, 0);

  const add = (menu) => {
    setOrder(null);
    setMessage("");
    setFallbackLinks(null);
    setCart((old) => {
      const found = old.find((x) => x.menuId === menu._id);
      if (found) return old.map((x) => x.menuId === menu._id ? { ...x, qty: x.qty + 1 } : x);
      return [...old, { menuId: menu._id, name: menu.name, price: menu.price, qty: 1 }];
    });
  };
  const changeQty = (id, delta) => {
    setOrder(null);
    setMessage("");
    setFallbackLinks(null);
    setCart((old) => old.map((x) => x.menuId === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x));
  };
  const remove = (id) => {
    setOrder(null);
    setMessage("");
    setFallbackLinks(null);
    setCart((old) => old.filter((x) => x.menuId !== id));
  };

  const createReceipt = async () => {
    if (!customerName.trim()) {
      setMessage("");
      setPreviewOpen(false);
      setCustomerNeedsAttention(true);
      setCustomerAlertOpen(true);
      return;
    }
    if (!cart.length) return setMessage("Keranjang masih kosong.");
    try {
      setLoading(true); setMessage(""); setFallbackLinks(null);
      const { data } = await api.post("/orders/checkout", { customerName, items: cart.map(({ menuId, qty }) => ({ menuId, qty })) });
      setOrder(data.data); setPreviewOpen(true);
    } catch (e) { setMessage(apiErrorMessage(e, "Struk gagal dibuat.")); }
    finally { setLoading(false); }
  };

  const choosePaperWidth = (width) => {
    setPaperWidth(width);
    localStorage.setItem("umami:paper-width", String(width));
  };

  const pdfBlobUrl = async () => {
    const { data } = await api.get(`/orders/${order._id}/pdf?paper=${paperWidth}&download=1`, {
      responseType: "blob",
      timeout: 30000,
    });
    return URL.createObjectURL(data);
  };

  const triggerPdfDownload = (url) => {
    const download = document.createElement("a");
    download.href = url;
    download.download = `Struk-${order.receiptNo}-${paperWidth}mm.pdf`;
    document.body.appendChild(download);
    download.click();
    download.remove();
  };

  const downloadPdf = async () => {
    if (!order) return;
    try {
      setLoading(true); setMessage("");
      const url = await pdfBlobUrl();
      triggerPdfDownload(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setMessage(apiErrorMessage(error, "PDF gagal di-download."));
    } finally { setLoading(false); }
  };

  const printThermal = () => {
    if (!order) return;
    if (!printThermalReceipt(order, paperWidth)) {
      setMessage("Jendela print diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.");
    }
  };
  const sendWa = async () => {
    if (!order) return;
    const whatsappTab = window.open("about:blank", "digital-receipt-whatsapp");
    try {
      setLoading(true); setMessage(""); setFallbackLinks(null);
      const { data } = await api.post(`/orders/${order._id}/send-whatsapp`);
      whatsappTab?.close();
      setOrder(data.data); setMessage("PDF struk berhasil dikirim ke WhatsApp 081511003770.");
    } catch (e) {
      const payload = e.response?.data;
      if (payload?.code === "WA_NOT_CONFIGURED") {
        try {
          const pdfUrl = await pdfBlobUrl();
          triggerPdfDownload(pdfUrl);
          if (whatsappTab) whatsappTab.location.href = payload.whatsappUrl;
          setFallbackLinks({ pdfUrl, whatsappUrl: payload.whatsappUrl });
          setMessage("Mode kirim manual aktif: PDF sudah diunduh dan chat WhatsApp tujuan sudah dibuka. Lampirkan PDF tersebut lalu tekan kirim.");
        } catch (downloadError) {
          whatsappTab?.close();
          setMessage(apiErrorMessage(downloadError, "PDF struk gagal disiapkan."));
        }
      } else {
        whatsappTab?.close();
        setMessage(apiErrorMessage(e, "Struk gagal dikirim ke WhatsApp."));
      }
    } finally { setLoading(false); }
  };

  const focusCustomerField = () => {
    setCustomerAlertOpen(false);
    window.requestAnimationFrame(() => customerInputRef.current?.focus());
  };

  const newTransaction = () => { setCart([]); setCustomerName(""); setOrder(null); setPreviewOpen(false); setMessage(""); setFallbackLinks(null); setCustomerNeedsAttention(false); setCustomerAlertOpen(false); };

  const notice = message && <div className="notice">
    <span>{message}</span>
    {fallbackLinks && <div className="fallback-actions">
      <a href={fallbackLinks.pdfUrl} target="_blank" rel="noreferrer">Download PDF</a>
      <a href={fallbackLinks.whatsappUrl} target="_blank" rel="noreferrer">Buka WhatsApp</a>
    </div>}
  </div>;

  return <div className="cashier-layout">
    <section className="menu-panel">
      <div className="section-title-row"><div><span className="eyebrow">Kasir</span><h2>Pilih menu</h2></div><span className="count-pill">{menus.length} aktif</span></div>
      <div className="search-box"><Search size={18}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari menu..." /></div>
      {menusError && <div className="notice error-notice"><span>{menusError}</span><button onClick={loadMenus}>Coba lagi</button></div>}
      <div className="menu-grid">
        {filtered.map((menu) => <button key={menu._id} className="menu-card" onClick={()=>add(menu)}>
          <div className="menu-image">{menu.image ? <img src={imageUrl(menu.image)} alt={menu.name}/> : <div className="image-placeholder">{menu.name.slice(0,1).toUpperCase()}</div>}</div>
          <div className="menu-card-body"><strong>{menu.name}</strong><span>{rupiah(menu.price)}</span><small>Tap untuk tambah</small></div>
        </button>)}
        {menusLoading && <div className="empty-state">Memuat daftar menu...</div>}
        {!menusLoading && !filtered.length && <div className="empty-state">{search ? "Menu yang dicari tidak ditemukan." : "Belum ada menu aktif. Tambahkan dari halaman Menu."}</div>}
      </div>
    </section>

    <aside className="cart-panel">
      <div className="cart-heading"><div><ShoppingBag size={20}/><h3>Keranjang</h3></div><span>{qtyTotal} item</span></div>
      <label className={`field-label customer-field ${customerNeedsAttention?"needs-attention":""}`}>Nama customer<input ref={customerInputRef} aria-invalid={customerNeedsAttention} value={customerName} onChange={(e)=>{setCustomerName(e.target.value);setCustomerNeedsAttention(false);setOrder(null);setMessage("");setFallbackLinks(null)}} placeholder="Contoh: Kak Rafi" />{customerNeedsAttention&&<small>Nama customer wajib diisi sebelum transaksi disimpan.</small>}</label>
      <div className="cart-items">
        {cart.length === 0 ? <div className="cart-empty"><ShoppingBag size={30}/><b>Keranjang masih kosong</b><span>Pilih menu di sebelah kiri untuk memulai transaksi.</span></div> : cart.map((item) => <div className="cart-item" key={item.menuId}>
          <div className="cart-item-top"><div><strong>{item.name}</strong><span>{rupiah(item.price)} / porsi</span></div><button className="remove-btn" onClick={()=>remove(item.menuId)}><Trash2 size={17}/></button></div>
          <div className="cart-item-bottom"><div className="qty-control"><button disabled={item.qty <= 1} onClick={()=>changeQty(item.menuId,-1)}><Minus size={16}/></button><b>{item.qty}</b><button onClick={()=>changeQty(item.menuId,1)}><Plus size={16}/></button></div><b>{rupiah(item.price*item.qty)}</b></div>
        </div>)}
      </div>
      <div className="cart-summary"><div><span>Total porsi</span><b>{qtyTotal}</b></div><div className="cart-grand"><span>Total pembayaran</span><b>{rupiah(total)}</b></div></div>
      {notice}
      <div className="stack-actions">
        <button className="btn secondary" disabled={!cart.length} onClick={()=>setPreviewOpen(true)}>Preview Struk</button>
        <button className="btn primary" disabled={loading || !cart.length} onClick={order ? ()=>setPreviewOpen(true) : createReceipt}>{loading ? "Memproses..." : order ? "Lihat Struk Tersimpan" : "Buat Struk & Simpan Transaksi"}</button>
      </div>
    </aside>

    <Modal open={previewOpen} title={order ? "Struk siap dikirim" : "Preview struk"} onClose={()=>setPreviewOpen(false)}>
      <div className="preview-wrap"><ReceiptPreview order={order} customerName={customerName} cart={cart}/></div>
      {notice}
      {order ? <div className="modal-actions">
        <div className="thermal-tool">
          <div><span><Printer size={17}/> Printer thermal</span><small>Pilih lebar kertas printer Kassen Anda.</small></div>
          <div className="paper-size-control"><button type="button" className={paperWidth===58?"active":""} onClick={()=>choosePaperWidth(58)}>58 mm</button><button type="button" className={paperWidth===80?"active":""} onClick={()=>choosePaperWidth(80)}>80 mm</button></div>
          <button type="button" className="btn thermal-print-btn" onClick={printThermal}><Printer size={17}/> Print Thermal {paperWidth} mm</button>
        </div>
        <button className="btn secondary" disabled={loading} onClick={downloadPdf}><Download size={17}/> Download PDF {paperWidth} mm</button>
        <button className="btn primary" disabled={loading} onClick={sendWa}><Send size={17}/> Send WhatsApp</button>
        <button className="btn ghost" onClick={newTransaction}>Transaksi Baru</button>
      </div> : <div className="modal-actions"><button className="btn primary" onClick={createReceipt}>Konfirmasi & Buat Struk</button></div>}
    </Modal>

    <Modal open={customerAlertOpen} title="Data transaksi belum lengkap" onClose={focusCustomerField}>
      <div className="customer-alert">
        <div className="customer-alert-icon"><CircleAlert size={27}/></div>
        <span className="eyebrow">Perlu diperhatikan</span>
        <h4>Nama customer belum diisi</h4>
        <p>Masukkan nama customer terlebih dahulu agar struk tersimpan dengan identitas transaksi yang jelas.</p>
        <button type="button" className="btn primary full" onClick={focusCustomerField}>Isi Nama Customer</button>
      </div>
    </Modal>
  </div>;
}
