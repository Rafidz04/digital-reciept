import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { api, apiErrorMessage, storeAuthToken } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      setMessage("Username dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const { data } = await api.post("/auth/login", form);
      storeAuthToken(data.data.token);
      onLogin(data.data.user);
    } catch (error) {
      setMessage(apiErrorMessage(error, "Login gagal. Periksa kembali data Anda."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <span className="login-logo-frame"><img src="/logo.png" alt="Logo U-MaMi" /></span>
          <span className="login-eyebrow">Digital Receipt Studio</span>
          <h1>Kasir yang ringkas,<br />struk yang berkesan.</h1>
          <p>Kelola menu, transaksi, laporan, dan struk thermal U-MaMi dalam satu tempat.</p>
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card-icon"><LockKeyhole size={24} /></div>
          <span className="eyebrow">Selamat datang</span>
          <h2>Masuk ke U-MaMi</h2>
          <p>Gunakan akun superadmin untuk membuka halaman kasir.</p>

          <label className="login-field">
            <span>Username</span>
            <div><UserRound size={17} /><input autoFocus autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Masukkan username" /></div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Masukkan password" /><button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          </label>

          {message && <div className="login-error" role="alert">{message}</div>}
          <button className="btn primary login-submit" disabled={loading}>
            <LogIn size={17} /> {loading ? "Memeriksa..." : "Masuk sebagai Superadmin"}
          </button>
          <small className="login-footnote">Sesi login akan berakhir otomatis untuk menjaga keamanan akun.</small>
        </form>
      </section>
    </main>
  );
}
