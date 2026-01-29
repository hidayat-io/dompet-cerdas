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

Setiap perubahan kode **HARUS** melewati 2 tahap testing ini untuk mencegah fitur lama rusak (regression).

### 1. Automated NLU Test (Pre-Deployment)
Script ini mengecek logika parsing bahasa secara otomatis.

```bash
cd functions
node test-nlu.js
```
⚠️ **Hanya deploy jika RESULTS: 100% PASS.**

### 2. Manual & Regression Tests (Post-Deployment)
Test langsung di Telegram dengan 7 query "kramat" ini. Jika salah satu salah, maka fitur dianggap **BROKEN**.

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

---

## Log & Debugging
Jika bot error ("Terjadi kesalahan"), cek log detailnya di sini:

```bash
cd functions
firebase functions:log --only telegramWebhook -n 50
```

Lihat panduan workflow lengkap di: `.agent/workflows/test-bot.md`
