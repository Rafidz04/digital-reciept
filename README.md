# U-MaMi Digital Receipt

Aplikasi kasir dan struk digital responsif untuk U-MaMi. Aplikasi menyediakan pengelolaan menu, keranjang dinamis, preview struk, PDF thermal receipt, pengiriman WhatsApp, serta dashboard penjualan harian.

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

## Deployment

Deployment prototipe saat ini menggunakan dua project Vercel dari repository yang sama:

- Frontend: `https://umami-digital-receipt.vercel.app`
- Backend API: `https://umami-digital-receipt-api.vercel.app`
- Database: MongoDB Atlas M0

Project frontend menggunakan root directory `frontend`, sedangkan project API menggunakan `backend`. Keduanya terhubung ke branch `main` untuk auto-deploy.

> Vercel Hobby ditujukan untuk penggunaan personal/nonkomersial. Gunakan paket hosting komersial saat aplikasi mulai dipakai untuk operasional bisnis nyata.
