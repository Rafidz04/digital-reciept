import { useEffect, useMemo, useState } from "react";
import { BarChart3, Banknote, ReceiptText, Utensils } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, apiErrorMessage, rupiah } from "../services/api";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Jakarta" }).format(new Date());

export default function DashboardPage() {
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try {
      const r=await api.get(`/orders/dashboard?date=${date}`);
      setData(r.data.data);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, "Dashboard gagal dimuat."));
    } finally { setLoading(false); }
  };
  useEffect(()=>{load();},[date]);
  const summary = data?.summary || {revenue:0,transactions:0,items:0};
  const hourly = useMemo(()=>{
    const byHour = new Map((data?.hourly || []).map((item) => [item.hour, item]));
    return Array.from({ length: 24 }, (_, hour) => {
      const label = `${String(hour).padStart(2, "0")}:00`;
      return byHour.get(label) || { hour: label, revenue: 0, transactions: 0 };
    });
  },[data]);

  return <section className="dashboard-page">
    <div className="section-title-row"><div><span className="eyebrow">Analitik</span><h2>Dashboard Penjualan</h2><p className="muted">Pantau omzet, jumlah transaksi, porsi terjual, dan performa menu per hari.</p></div><label className="date-filter">Tanggal<input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/></label></div>
    {error && <div className="notice error-notice"><span>{error}</span><button onClick={load}>Coba lagi</button></div>}
    <div className="stats-grid">
      <div className="stat-card"><span><Banknote size={20}/></span><div><small>Pendapatan tanggal terpilih</small><strong>{rupiah(summary.revenue)}</strong></div></div>
      <div className="stat-card"><span><ReceiptText size={20}/></span><div><small>Total transaksi</small><strong>{summary.transactions}</strong></div></div>
      <div className="stat-card"><span><Utensils size={20}/></span><div><small>Porsi terjual</small><strong>{summary.items}</strong></div></div>
      <div className="stat-card"><span><BarChart3 size={20}/></span><div><small>Rata-rata transaksi</small><strong>{summary.transactions?rupiah(Math.round(summary.revenue/summary.transactions)):rupiah(0)}</strong></div></div>
    </div>

    <div className="dashboard-grid">
      <article className="chart-card"><div className="card-title"><div><h3>Pendapatan per jam</h3><span>{loading?"Memuat...":"WIB"}</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={hourly}><CartesianGrid stroke="#efe3d2" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="hour" stroke="#948174"/><YAxis stroke="#948174" tickFormatter={(v)=>v>=1000000?`${v/1000000}jt`:v>=1000?`${v/1000}k`:v}/><Tooltip cursor={{fill:"#fff1dc"}} formatter={(v)=>rupiah(v)}/><Bar dataKey="revenue" fill="#f45a1b" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></article>
      <article className="ranking-card"><div className="card-title"><div><h3>Menu terlaris</h3><span>Berdasarkan jumlah porsi</span></div></div><div className="ranking-list">{(data?.menuSales||[]).slice(0,8).map((m,i)=><div className="ranking-row" key={m.name}><span className="rank">{i+1}</span><div><b>{m.name}</b><small>{rupiah(m.revenue)} omzet</small></div><strong>{m.qty} porsi</strong></div>)}{!data?.menuSales?.length&&<div className="empty-state small">Belum ada penjualan pada tanggal ini.</div>}</div></article>
    </div>

    <article className="recent-card"><div className="card-title"><div><h3>Transaksi terbaru</h3><span>10 transaksi terakhir pada tanggal terpilih</span></div></div><div className="table-scroll"><table><thead><tr><th>Waktu</th><th>No. Struk</th><th>Customer</th><th>Item</th><th>Total</th><th>WhatsApp</th></tr></thead><tbody>{(data?.recentOrders||[]).map(o=><tr key={o._id}><td>{new Date(o.createdAt).toLocaleTimeString("id-ID",{timeZone:"Asia/Jakarta",hour12:false})}</td><td className="mono">{o.receiptNo}</td><td>{o.customerName}</td><td>{o.totalQty}</td><td><b>{rupiah(o.totalAmount)}</b></td><td><span className={`status-badge ${o.whatsappStatus==="sent"?"on":"off"}`}>{o.whatsappStatus==="sent"?"Terkirim":"Belum"}</span></td></tr>)}</tbody></table></div></article>
  </section>;
}
