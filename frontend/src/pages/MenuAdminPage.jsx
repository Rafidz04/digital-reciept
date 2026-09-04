import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit3, ImagePlus, Plus, Power, PowerOff, Search } from "lucide-react";
import { api, apiErrorMessage, imageUrl, rupiah } from "../services/api";
import Modal from "../components/Modal";

const emptyForm = { name: "", price: "", image: null };

const normalizePrice = (value) =>
  value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 15);

export default function MenuAdminPage() {
  const [active, setActive] = useState([]);
  const [inactive, setInactive] = useState([]);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    try {
      setLoading(true); setLoadError("");
      const [a, i] = await Promise.all([api.get("/menus?status=active"), api.get("/menus?status=inactive")]);
      setActive(a.data.data || []); setInactive(i.data.data || []);
    } catch (error) {
      setLoadError(apiErrorMessage(error, "Data menu gagal dimuat."));
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []);

  const list = useMemo(() => (tab === "active" ? active : inactive).filter(x=>x.name.toLowerCase().includes(search.toLowerCase())), [tab, active, inactive, search]);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setMessage(""); setModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ name:m.name, price:String(m.price), image:null }); setMessage(""); setModal(true); };

  const changePrice = (value) => {
    setForm((current) => ({ ...current, price: normalizePrice(value) }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.price === "") return setMessage("Nama dan harga wajib diisi.");
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) return setMessage("Harga harus berupa angka nol atau lebih.");
    try {
      setSaving(true); setMessage("");
      const fd = new FormData(); fd.append("name", form.name); fd.append("price", form.price); if (form.image) fd.append("image", form.image);
      if (editing) await api.put(`/menus/${editing._id}`, fd);
      else await api.post("/menus", fd);
      await load(); setModal(false); setForm(emptyForm); setEditing(null);
    } catch (e2) { setMessage(apiErrorMessage(e2, "Menu gagal disimpan.")); }
    finally { setSaving(false); }
  };

  const toggle = async (m) => {
    try {
      setTogglingId(m._id); setLoadError("");
      await api.patch(`/menus/${m._id}/status`, { softDelete: !m.softDelete });
      await load();
      setConfirmTarget(null);
    } catch (error) {
      setLoadError(apiErrorMessage(error, "Status menu gagal diubah."));
    } finally { setTogglingId(null); }
  };

  return <section className="admin-page">
    <div className="section-title-row"><div><span className="eyebrow">Administrator</span><h2>Manajemen Menu</h2><p className="muted">Tambah, edit, aktifkan atau nonaktifkan menu tanpa menghapus histori transaksi.</p></div><button className="btn primary" onClick={openCreate}><Plus size={18}/> Tambah Menu</button></div>
    <div className="toolbar">
      <div className="segmented"><button className={tab==="active"?"active":""} onClick={()=>setTab("active")}>Menu Aktif <span>{active.length}</span></button><button className={tab==="inactive"?"active":""} onClick={()=>setTab("inactive")}>Tidak Aktif <span>{inactive.length}</span></button></div>
      <div className="search-box compact"><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari nama menu..."/></div>
    </div>
    {loadError && <div className="notice error-notice"><span>{loadError}</span><button onClick={load}>Coba lagi</button></div>}

    <div className="admin-menu-grid">
      {list.map((m)=><article className="admin-menu-card" key={m._id}>
        <div className="admin-menu-image">{m.image?<img src={imageUrl(m.image)} alt={m.name}/>:<div className="image-placeholder">{m.name.slice(0,1).toUpperCase()}</div>}<span className={`status-badge ${m.softDelete?"off":"on"}`}>{m.softDelete?"Tidak aktif":"Aktif"}</span></div>
        <div className="admin-menu-content"><h3>{m.name}</h3><strong>{rupiah(m.price)}</strong><small>Diperbarui {new Date(m.updatedAt).toLocaleDateString("id-ID")}</small>
          <div className="card-actions"><button className="mini-btn" onClick={()=>openEdit(m)}><Edit3 size={15}/> Edit</button><button disabled={togglingId===m._id} className={`mini-btn ${m.softDelete?"activate":"danger"}`} onClick={()=>m.softDelete?toggle(m):setConfirmTarget(m)}>{m.softDelete?<Power size={15}/>:<PowerOff size={15}/>} {togglingId===m._id?"Memproses...":m.softDelete?"Aktifkan":"Nonaktifkan"}</button></div>
        </div>
      </article>)}
      {loading && <div className="empty-state">Memuat data menu...</div>}
      {!loading && !list.length && <div className="empty-state">Belum ada menu pada kategori ini.</div>}
    </div>

    <Modal open={modal} title={editing?"Edit menu":"Tambah menu baru"} onClose={()=>setModal(false)}>
      <form className="menu-form" onSubmit={save}>
        <label>Nama menu<input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Contoh: Nasi Kebuli Ayam"/></label>
        <label className="price-field">Harga menu<input type="text" inputMode="numeric" autoComplete="off" value={form.price === "" ? "" : rupiah(Number(form.price))} onChange={(e)=>changePrice(e.target.value)} placeholder="Rp 26.000"/><small>Ketik nominal tanpa khawatir salah membaca jumlah nol.</small></label>
        <label className="file-field"><span>Gambar menu <small>(opsional, max 3 MB)</small></span><div><ImagePlus size={20}/><span>{form.image?.name || (editing?.image ? "Ganti gambar bila perlu" : "Pilih JPG/PNG")}</span></div><input type="file" accept="image/*" onChange={(e)=>setForm({...form,image:e.target.files?.[0]||null})}/></label>
        {message && <div className="notice">{message}</div>}
        <button className="btn primary full" disabled={saving}>{saving?"Menyimpan...":editing?"Simpan Perubahan":"Buat Menu"}</button>
      </form>
    </Modal>

    <Modal open={Boolean(confirmTarget)} title="Nonaktifkan menu?" onClose={()=>!togglingId&&setConfirmTarget(null)}>
      <div className="confirm-dialog">
        <div className="confirm-icon"><AlertTriangle size={24}/></div>
        <p><strong>{confirmTarget?.name}</strong> akan dipindahkan ke daftar menu tidak aktif dan tidak muncul di halaman kasir.</p>
        <div className="confirm-note">Menu tidak dihapus permanen. Histori transaksi tetap aman dan menu bisa diaktifkan kembali kapan saja.</div>
        <div className="confirm-actions">
          <button type="button" className="btn ghost" disabled={Boolean(togglingId)} onClick={()=>setConfirmTarget(null)}>Batal</button>
          <button type="button" className="btn danger-solid" disabled={Boolean(togglingId)} onClick={()=>toggle(confirmTarget)}><PowerOff size={17}/> {togglingId?"Menonaktifkan...":"Ya, nonaktifkan"}</button>
        </div>
      </div>
    </Modal>
  </section>;
}
