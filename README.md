# U-MaMi Digital Receipt

Aplikasi kasir dan struk digital responsif untuk U-MaMi. Aplikasi menyediakan login superadmin, pengelolaan menu, keranjang dinamis, preview struk, PDF thermal receipt, pengiriman WhatsApp, serta dashboard penjualan harian.

## Struktur proyek

- `frontend/` — React dan Vite
- `backend/` — Express, MongoDB, PDFKit, dan integrasi WhatsApp Business Cloud API

## Menjalankan aplikasi

Gunakan Node.js 20 dan pastikan MongoDB aktif.

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend berjalan di `http://localhost:8080`.

Isi konfigurasi autentikasi berikut pada `.env` backend:

```dotenv
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD_HASH=<hash bcrypt, bukan password asli>
JWT_SECRET=<secret acak minimal 32 karakter>
```

Aplikasi hanya menyiapkan satu akun `superadmin` dan tidak menyediakan endpoint registrasi. Seluruh endpoint menu, transaksi, dashboard, PDF, dan WhatsApp dilindungi token login; hanya health check dan gambar menu yang dapat dibaca tanpa token.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Konfigurasi WhatsApp

`WA_ACCESS_TOKEN` bukan URL `wa.me`. Nilai tersebut adalah access token dari Meta WhatsApp Business Cloud API. Jika token belum diisi, aplikasi memakai mode manual: PDF diunduh dan chat WhatsApp tujuan dibuka agar PDF dapat dilampirkan.

Jangan commit file `.env` karena dapat berisi token dan kredensial pribadi.

## Print thermal Kassen/Caysn

- Pilih `58 mm` atau `80 mm` sesuai lebar roll, lalu gunakan tombol **Print Thermal**. Tombol ini merender struk lewat browser agar printer tidak menerima source PDF mentah.
- Pada dialog print macOS gunakan ukuran kertas yang sama, skala `100%`, margin `None/0`, dan matikan header/footer.
- Tombol **Download PDF** juga menghasilkan PDF sesuai ukuran kertas yang dipilih.
- Jika printer tetap mencetak tulisan seperti `%PDF` atau kode, antrean printer macOS memakai mode raw/text atau driver yang tidak dapat meraster PDF. Hapus lalu tambahkan kembali printer memakai driver Kassen/Caysn/ESC-POS yang sesuai; jangan mengirim file PDF langsung ke antrean raw.

## Deployment

Deployment prototipe saat ini menggunakan dua project Vercel dari repository yang sama:

- Frontend: `https://umami-digital-receipt.vercel.app`
- Backend API: `https://umami-digital-receipt-api.vercel.app`
- Database: MongoDB Atlas M0

Project frontend menggunakan root directory `frontend`, sedangkan project API menggunakan `backend`. Keduanya terhubung ke branch `main` untuk auto-deploy.

> Vercel Hobby ditujukan untuk penggunaan personal/nonkomersial. Gunakan paket hosting komersial saat aplikasi mulai dipakai untuk operasional bisnis nyata.
