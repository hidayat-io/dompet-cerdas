<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DompetCerdas - Smart Expense Tracker v2.7.0

Personal finance management with AI-powered receipt scanning and Telegram bot integration.

## Features

### 🌐 Web Application
- Multi-`Akun Keuangan` untuk pisah data pribadi, keluarga, bisnis, atau bersama
- Dashboard with expense analytics
- Manual transaction entry
- Category management
- Rencana pemasukan/pengeluaran dengan proyeksi saldo, status item, dan tanggal rencana
- Anggaran bulanan berbasis plan, bisa satu atau beberapa kategori, dengan progress dan salin bulan lalu
- Hutang Piutang dengan status lunas/sebagian, riwayat pembayaran, dan jatuh tempo
- Onboarding ringan untuk user baru, helper dashboard, dan panduan singkat di Settings
- AI financial advisor with 3 analysis modes and backend quota
- Excel export with date range selection

### 🤖 Telegram Bot (@dompas_bot)
- **Receipt Scanning**: Upload photos, AI extracts data automatically
- **Natural Language**: "berapa pengeluaran minggu ini?"
- **Preview + Confirm**: Input transaksi tidak auto-save, selalu tampil preview sebelum simpan
- **Multi-Transaction**: Satu pesan bisa berisi banyak transaksi
- **Voice Note**: Voice note ditranskrip, dipreview, lalu dikonfirmasi
- **Quick Entry**: "makan siang 25rb" atau "kopi 18rb, parkir 5rb"
- **Telegram Account Context**: `/akun` untuk cek/ganti akun aktif Telegram
- **Account Linking**: Secure token-based connection

## Current Product Highlights

- Semua data utama sekarang scoped per `Akun Keuangan`
- Telegram punya akun default sendiri dan tidak perlu relink untuk pindah akun
- `Rencana` menggantikan `Simulasi`
- `Anggaran` berbasis budget plan, bukan auto-render semua kategori
- `Hutang Piutang` saat ini **tidak otomatis mempengaruhi saldo** karena masih diposisikan sebagai modul tracking terpisah dari transaksi
- Deploy hosting sekarang wajib lewat smoke check agar root `/` dan route SPA tetap aman setelah rilis

## Current Release

- **Version**: `v2.7.0`
- **Build Date**: `March 29, 2026`
- **Status**: Internal testing build yang sudah mencakup phase 0 sampai phase 10

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite |
| UI Library | **Material UI (MUI)** v6, `@mui/icons-material` |
| Hosting | **Firebase Hosting** (CDN Global) |
| Backend | Firebase Functions (Node.js 22) |
| Database | Firestore |
| Storage | Firebase Storage |
| AI | Gemini 2.0 (Vision & NLU) |
| Excel Export | ExcelJS |
| Bot | node-telegram-bot-api |

## Quick Start

### Web App

```bash
npm install
cp .env.example .env.local  # Add your API keys
npm run dev
```

### Firebase Functions

```bash
cd functions
npm install
cp .env.example .env  # Add TELEGRAM_BOT_TOKEN & GEMINI_API_KEY
npm run build
firebase deploy --only functions
```

## 🚀 Deployment

```bash
# Build frontend
npm run build

# Deploy semua (Hosting + Functions + Rules)
firebase deploy

# Atau deploy terpisah:
firebase deploy --only hosting      # Frontend only
firebase deploy --only functions    # Backend only
firebase deploy --only firestore    # Firestore rules only

# Deploy hosting + smoke check wajib
npm run deploy:hosting:safe
```

## Documentation

- [DOKUMENTASI_LENGKAP.md](./DOKUMENTASI_LENGKAP.md) - Referensi dokumentasi utama proyek
- [docs/PRODUCT_VOCABULARY.md](./docs/PRODUCT_VOCABULARY.md) - Istilah produk dan aturan copywriting user-facing
- [docs/TELEGRAM_INTEGRATION.md](./docs/TELEGRAM_INTEGRATION.md) - Dokumentasi teknis integrasi bot Telegram
- [deploy/DEPLOY_GUIDE.md](./deploy/DEPLOY_GUIDE.md) - Panduan deploy dan smoke check hosting
- [TESTING.md](./TESTING.md) - Panduan test bot dan regression checklist

## Environment Variables

### Web App (.env.local)
```
# Frontend AI analysis now uses Cloud Functions.
# VITE_GEMINI_API_KEY is only needed for client-side category validation fallback.
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Functions (.env)
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
```

## Recent Internal Milestones

- Phase 0: vocabulary produk disederhanakan untuk user awam
- Phase 1: fondasi `Akun Keuangan` dan migrasi data lama ke struktur account-scoped
- Phase 2: core app, export, AI, dan Telegram dibuat account-aware
- Phase 3: `Simulasi` diubah menjadi `Rencana`
- Phase 4: `Anggaran` jadi budget plan multi-kategori + salin anggaran bulan lalu + detail transaksi per anggaran
- Phase 5: parser transaksi hybrid, preview, dan confirm sebelum simpan
- Phase 6: Telegram multi-transaction + hapus item dari preview
- Phase 7: voice note Telegram dengan transkrip + preview + confirm
- Phase 8: modul `Hutang Piutang` + redesign UX yang lebih sederhana
- Phase 9: onboarding user baru, helper dashboard, dan panduan singkat
- Phase 10: migrasi UI ke Material UI (MUI) — semua komponen pakai MUI, icons ke `@mui/icons-material`, hapus `lucide-react`

## License

MIT
