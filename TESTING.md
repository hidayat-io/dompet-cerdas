# Testing Guide - Dompet Cerdas Bot

## ✅ STATUS: BOT NLU FIX COMPLETED

**Issue Resolved**: Bot now correctly understands flexible Indonesian expense queries without requiring strict keywords like "berapa" or "total".

**Fixed Queries**:
- ✅ "hari ini ada pengeluaran ga" → Now recognized as expense query
- ✅ "pengeluaran hari ini" → Now recognized as expense query  
- ✅ "detail pengeluaran kemarin" → Now recognized as transaction details query
- ✅ "pengeluaran 7 hari terakhir" → Now correctly uses time_range: 'last_week' (last 7 days including today)
- ✅ "detail pengeluaran 7 hari terakhir" → Now correctly uses time_range: 'last_week' for proper date range

**Technical Fix**: 
1. Updated `detectSimpleIntent()` to check for query indicators OR time indicators for flexible Indonesian patterns
2. Fixed "N hari terakhir" to map to `time_range: 'last_week'` instead of `days_ago`, ensuring proper date range (last 7 days including today) rather than a single specific date
3. Note: `days_ago` parameter is for specific past dates (e.g., "7 hari lalu" = 1 specific day), while "7 hari terakhir" requires a range (last_week)

---

## 🚨 STANDAR PENGETESAN WAJIB

Setiap perubahan kode bot **HARUS** melewati 2 tahap testing ini untuk mencegah fitur lama rusak (regression).

### 1. Automated Tests (Pre-Deployment)
Untuk perubahan Telegram bot, jalankan semua script ini:

```bash
cd functions
node test-nlu.js
node test-transaction-parser.js
node test-telegram-hardening.js
node test-telegram-bot-flow.js
```

Checklist:
- `test-nlu.js` = regression query/NLU lama
- `test-transaction-parser.js` = parsing transaksi single/multi-item
- `test-telegram-hardening.js` = sanitasi Firestore payload + keamanan formatter Telegram
- `test-telegram-bot-flow.js` = preview, confirm/cancel, flow `/akun`, dan voice note transaksi

⚠️ **Hanya deploy jika semua script 100% PASS.**

### 2. Manual & Regression Tests (Post-Deployment)
Test langsung di Telegram. Jika salah satu gagal, fitur dianggap **BROKEN**.

#### A. Query Regression Wajib

| No | Query Test | Harapan (Expected Result) |
|----|------------|---------------------------|
| 1 | `saldo` | Menampilkan saldo terkini |
| 2 | `pengeluaran hari ini berapa` | Total pengeluaran HARI INI saja |
| 3 | `hari ini ada pengeluaran ga` | Total pengeluaran HARI INI (test flexible pattern) |
| 4 | `pengeluaran hari ini` | Total pengeluaran HARI INI (test tanpa kata tanya) |
| 4a | `pengeluaran 7 hari terakhir` | Total pengeluaran 7 HARI TERAKHIR (dynamic range) |
| 4b | `berapa pengeluaran total 7 hari terakhir` | Total pengeluaran 7 HARI TERAKHIR (with keywords) |
| 4c | `20 transaksi terakhir` | Menampilkan 20 transaksi terakhir (all-time, bukan minggu/bulan ini) |
| 4d | `40 transaksi terakhir` | Menampilkan 30 transaksi terakhir + pesan batas maksimum (cap 30) |
| 5 | `5 transaksi terakhir` | 5 transaksi **TERMUDA** (Most recent by Date) |
| 6 | `3 transaksi tertinggi bulan ini` | ⚠️ **CRITICAL CHECK**: 3 transaksi dengan **NOMINAL TERBESAR** (Highest Amount). <br> *Bukan yang terbaru!* |
| 7 | `transaksi 27 jan` | Hanya transaksi tanggal 27 Jan (Specific Date) |
| 8 | `transaksi food bulan ini` | Hanya kategori Food/FnB (Category Filter) |
| 9 | `kategori paling boros` | Breakdown per kategori |

#### B. Telegram Input Regression Wajib

| No | Input Test | Harapan (Expected Result) |
|----|------------|---------------------------|
| 1 | `makan siang 25rb` | Bot menampilkan **preview**, bukan langsung simpan |
| 2 | Klik `Simpan` dari test #1 | Transaksi tersimpan dan ada pesan sukses |
| 3 | Ulang test #1 lalu klik `Batal` | Draft dibatalkan dan **tidak** tersimpan |
| 4 | `makan 25rb, parkir 5rb` | Preview 2 transaksi |
| 5 | `makan 25rb; parkir 5rb` | Preview 2 transaksi |
| 6 | `makan 25rb` lalu baris baru `parkir 5rb` | Preview 2 transaksi |
| 7 | `makan 25rb dan parkir 5rb` | Preview 2 transaksi |
| 8 | `hutang 10k, parkir 10k, beli hadiah 100k` | Preview 3 transaksi, **tidak crash**, bisa lanjut confirm/cancel |
| 9 | Klik `Hapus 1` dari preview multi-item | Item pertama hilang, preview di-render ulang |
| 10 | Semua respons di atas | Header `Akun: ...` selalu tampil |
| 11 | `/akun` | Menampilkan akun Telegram aktif + opsi ganti akun jika akun lebih dari satu |
| 12 | Kirim voice note: `makan 25 ribu, parkir 5 ribu` | Bot transkrip voice, tampilkan preview, lalu menunggu konfirmasi |
| 13 | Voice note tidak jelas / terlalu panjang | Bot menolak dengan pesan yang jelas, bukan crash |

#### C. Receipt Regression Singkat

| No | Flow Test | Harapan (Expected Result) |
|----|-----------|---------------------------|
| 1 | Upload foto struk valid | Bot analisis lalu tampilkan preview konfirmasi |
| 2 | Klik `Ya, Simpan` | Transaksi struk tersimpan |
| 3 | Upload gambar non-struk / gagal baca total | Bot menolak dengan pesan yang jelas, bukan crash |

### 3. Aturan Tambahan untuk Perubahan Telegram Input

Jika ada bug baru di input Telegram:
- tambahkan minimal 1 regression case ke `functions/test-transaction-parser.js`, `functions/test-telegram-hardening.js`, atau `functions/test-telegram-bot-flow.js`
- ulangi semua automated tests
- ulangi minimal section **B. Telegram Input Regression Wajib**

---

## Log & Debugging
Jika bot error ("Terjadi kesalahan"), cek log detailnya di sini:

```bash
cd functions
firebase functions:log --only telegramWebhook -n 50
```

Lihat panduan workflow lengkap di: `.agent/workflows/test-bot.md`
