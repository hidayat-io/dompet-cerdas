<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DompetCerdas - Smart Expense Tracker v2.8.7

Personal finance management with AI-powered receipt scanning and Telegram bot integration.

## Features

### 🌐 Web Application
- Banyak `Akun Keuangan` yang bisa dibuat private atau langsung dibagikan per akun
- Kolaborasi sederhana untuk akun bersama: anggota, kode gabung, dan data shared lintas user
- Member akun bersama bisa keluar sendiri, dan owner bisa hapus workspace kalau sudah jadi satu-satunya anggota
- Dashboard with expense analytics
- Manual transaction entry
- Category management
- Rencana pemasukan/pengeluaran dengan proyeksi saldo, status item, dan tanggal rencana
- Anggaran bulanan berbasis plan, bisa satu atau beberapa kategori, dengan progress dan salin bulan lalu
- Hutang Piutang dengan status lunas/sebagian, riwayat pembayaran, dan jatuh tempo
- Onboarding ringan untuk user baru, helper dashboard, dan panduan singkat di Settings
- AI financial advisor with 3 analysis modes and backend quota
- Excel export with date range selection
- PWA installable dengan offline shell, sync indicator, dan update flow yang lebih rapi
- Attachment upload queue saat offline dengan retry otomatis saat koneksi kembali
- Warning conflict untuk edit transaksi lintas tab/perangkat

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
- Data shared hanya bisa diedit oleh user yang membuat datanya; transaksi milik anggota lain tampil read-only dengan info pembuat
- Akun private bisa langsung diubah jadi akun bersama dari kartu akun di Settings
- Dashboard sekarang punya toggle untuk menyembunyikan nominal saldo saat dibuka di depan orang lain
- Riwayat transaksi sekarang dikelompokkan per hari dengan card terpisah agar perbedaan tanggal lebih mudah discan
- Pengaturan akun, daftar rencana, dan ringkasan anggaran sekarang diarahkan ke layout yang lebih minimal dan lebih mudah discan
- Toggle tema dipindah keluar dari Settings supaya akses ganti tema lebih cepat tanpa merusak komposisi desktop/mobile
- Deploy hosting sekarang wajib lewat smoke check agar root `/` dan route SPA tetap aman setelah rilis
- Dashboard chart sekarang lazy-loaded, dan status sync/offline lebih jelas untuk penggunaan mobile/PWA

## Current Release

- **Version**: `v2.8.7`
- **Build Date**: `May 14, 2026`
- **Status**: Fitur pengurutan kategori dengan drag and drop.

## Changelog

### v2.8.7 - May 14, 2026
- Fitur *drag and drop* kategori di Master Kategori yang otomatis tersinkronisasi ke daftar urutan kategori pada Form Transaksi.

### v2.8.6 - May 14, 2026
- Tambah kondisi bagi owner dari akun bersama untuk bisa mengedit transaksi buatan member lain.
- Tampilkan informasi pembuat dan pengubah transaksi pada form transaksi bila mereka adalah pengguna yang berbeda.

### v2.8.5 - May 1, 2026
- Security credential rotation, Telegram bot latency optimization, dan image compression.

### v2.8.4 - April 30, 2026
- Fix Telegram bot gagal scan foto struk: migrasi dari SDK deprecated `@google/generative-ai` ke `@google/genai`, dan update model dari `gemini-2.0-flash` ke `gemini-2.5-flash`.
- Tambah idempotency lock berbasis Firestore untuk Telegram `update_id` agar retry dari Telegram tidak memanggil Gemini berulang dan memicu 429.
- Tambah structured error logging untuk Gemini API agar error 429/quota lebih mudah didiagnosis dari log.
- Matikan Gemini fallback untuk caption category secara default sehingga upload struk hanya melakukan 1 call Gemini.
- Fix Markdown escaping di pesan konfirmasi struk bot agar tidak ditolak Telegram karena karakter spesial.
- Sanitize objek transaksi sebelum disimpan ke Firestore untuk mencegah error field undefined.
- Default kategori form web dan bot Telegram sekarang **Belanja** untuk transaksi EXPENSE yang tidak dikenali.
- Kategori Belanja/Shopping ditampilkan di urutan pertama di pilihan kategori form transaksi.

### v2.8.3 - April 5, 2026
- Toggle tema dipindah keluar dari Settings dan ditempatkan di shell aplikasi supaya user bisa ganti tema langsung dari desktop sidebar atau bar akun mobile.
- Desktop sidebar dirapikan lagi agar aksi tema menyatu dengan kartu user, bukan berdiri sendiri di bar logo.
- Panel tema di Settings dihapus supaya halaman fokus ke pengaturan akun, Telegram, export, dan tindakan administratif.

### v2.8.2 - March 31, 2026
- Member akun bersama sekarang bisa keluar dari workspace lewat tombol akun, sementara owner bisa menghapus workspace jika sudah menjadi satu-satunya anggota.
- Backend delete shared account sekarang memisahkan flow owner vs member, menolak hapus saat masih ada anggota lain, dan merapikan update akun aktif/default Telegram.
- Pesan error callable dirapikan supaya alasan dari server tampil lebih jelas di UI.

### v2.8.1 - March 31, 2026
- Akun private sekarang bisa dibagikan langsung dari kartu akun di Settings dan dikonversi ke shared workspace tanpa membuat akun baru dari nol.
- Tombol share existing account ini memindahkan data scoped ke shared workspace, mempertahankan ownership per record, dan langsung menyiapkan mode kolaborasi.
- Deploy hosting sekarang dipaksa lewat `typecheck` sebelum build supaya error runtime yang berasal dari import/typing yang hilang ketangkap lebih awal.
- Dashboard runtime crash dari import yang hilang sudah diperbaiki dan live bundle sudah di-refresh.

### v2.8.0 - March 30, 2026
- Fondasi PWA diselesaikan dengan service worker, offline fallback, prompt update versi, dan Firestore local persistence.
- Initial load dirapikan lewat chunk splitting, lazy screen loading, pemecahan runtime Firebase, dan pemindahan chart dashboard ke lazy chunk terpisah.
- Sistem icon dipindah ke Material Symbols web font sehingga bundle icon JS besar tidak lagi ikut dibawa.
- Offline UX dipoles dengan indikator sync, reconnect toast, queue cleanup storage, attachment upload queue berbasis IndexedDB, dan retry otomatis saat koneksi kembali.
- Edit transaksi sekarang punya warning conflict lintas tab/perangkat agar perubahan tidak tertimpa diam-diam.

### v2.7.2 - March 30, 2026
- UI `Akun Keuangan` disederhanakan menjadi daftar akun yang lebih mudah discan, dengan alur `Tambah Akun` via popup kecil dan aksi `Pakai` yang lebih langsung.
- Hapus akun sekarang dibatasi lebih aman: akun hanya bisa dihapus jika belum punya transaksi, akun terakhir tidak bisa dihapus, dan akun bersama belum dihapus dari menu ini.
- Halaman `Rencana` dirapikan dengan flow pembuatan rencana via popup, card daftar rencana yang lebih tenang, dan pengurangan elemen visual yang terasa bertumpuk.
- Halaman `Anggaran` dibuat lebih minimal dengan kontrol bulan yang lebih compact, summary strip yang lebih ringan, dan action area yang tidak saling berebut perhatian.

### v2.7.1 - March 30, 2026
- Standardisasi UI lintas menu agar lebih konsisten berbasis Material UI, termasuk `PageHeader`, `FullScreenDialog`, confirm dialog, notification dialog, dan attachment preview.
- Semua form utama dipindah ke pola full-screen agar pengalaman create/edit lebih seragam di transaksi, kategori, anggaran, rencana, hutang piutang, onboarding, dan penghapusan massal.
- Riwayat transaksi diperjelas dengan grouping per hari berbasis card terpisah, header tanggal yang lebih kuat, dan pembersihan elemen header yang redundant.
- Dashboard mendapat toggle untuk menyembunyikan nominal `Total Saldo`, dan form transaksi dibersihkan dari note lampiran yang duplikat serta glitch label `Catatan`.
- Hosting frontend sudah dideploy dan diverifikasi lewat smoke check untuk `/` dan `/link-telegram`.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite |
| UI Library | **Material UI (MUI)** v7 + Material Symbols web font |
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

# Deploy hosting + smoke check wajib (predeploy typecheck + build)
npm run deploy:hosting:safe
```

## Documentation

- [DOKUMENTASI_LENGKAP.md](./DOKUMENTASI_LENGKAP.md) - Referensi dokumentasi utama proyek
- [docs/PRODUCT_VOCABULARY.md](./docs/PRODUCT_VOCABULARY.md) - Istilah produk dan aturan copywriting user-facing
- [docs/TELEGRAM_INTEGRATION.md](./docs/TELEGRAM_INTEGRATION.md) - Dokumentasi teknis integrasi bot Telegram
- [deploy/DEPLOY_GUIDE.md](./deploy/DEPLOY_GUIDE.md) - Panduan deploy dan smoke check hosting
- [TESTING.md](./TESTING.md) - Panduan test bot dan regression checklist

## Upcoming Feature TODO

- Attachment replacement queue yang lebih lengkap untuk kasus edit berulang sebelum reconnect, termasuk progress/retry detail per item.
- Conflict resolution UX untuk modul selain transaksi: kategori, anggaran, rencana, dan hutang piutang.
- Audit lanjutan untuk `firebase-firestore`, `exceljs`, dan sisa chunk besar lain kalau ingin mengejar mobile low-end.
- Offline write sync yang lebih cerdas untuk operasi berbasis Cloud Functions atau shared account, termasuk fallback queue yang lebih eksplisit.
- QA browser/E2E pass untuk skenario multi-tab, offline-online, attachment retry, dan update service worker sebelum rilis publik penuh.

## Workflow

### Lakukan finishing
- Cek dokumentasi yang relevan dan pastikan perubahan fitur, bug fix, atau polishing yang baru memang sudah tercatat.
- Baca seluruh `git diff` dan pahami semua perubahan yang ada di worktree, termasuk yang bukan hasil kerja agent saat ini.
- Jika ada perubahan lain di worktree, commit semuanya agar worktree kembali clean sebelum lanjut.
- Update versi app dan dokumentasi, lalu tulis changelog untuk versi terbaru.
- Jalankan `git commit` dan `git push`.
- Deploy bila perubahan belum dirilis.

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
- Phase 10: kolaborasi `Akun Keuangan` bersama dengan anggota, kode gabung, dan shared data lintas user
- Phase 11: refactor akun netral dengan share per akun dan ownership per record

## License

MIT
