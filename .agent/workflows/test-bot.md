---
description: Standard Testing Workflow & Checklist for Dompet Cerdas Bot
---

# 🤖 Dompet Cerdas Bot - Testing Standard

**CRITICAL:** Dokumen ini adalah acuan standar untuk testing bot. Setiap perubahan kode pada bot **WAJIB** melewati prosedur ini untuk mencegah regresi fitur.

// turbo-all

## 1. Automated NLU Testing (Local)

Sebelum deploy, jalankan script test NLU ini untuk memvalidasi logic parsing intent secara lokal.

```bash
cd functions
node test-nlu.js
```

**Syarat:** Semua test harus **PASS**.
Jika gagal, JANGAN DEPLOY. Perbaiki kode NLU terlebih dahulu.

### Cakupan Test NLU:
| Fitur | Deskripsi | Test Case Contoh |
|-------|-----------|------------------|
| **Basic Queries** | Saldo, Pengeluaran, Pemasukan | "saldo", "berapa pengeluaran bulan ini" |
| **Transaction Details** | List transaksi by time range | "transaksi bulan ini", "detail minggu ini" |
| **Limit (Recency)** | Filter N transaksi terakhir (by date) | "5 transaksi terakhir", "last 10 trans" |
| **Limit (Amount)** | Filter N transaksi terbesar (by amount) | "3 transaksi tertinggi", "top 5 trans", "pengeluaran terbesar" |
| **Specific Date** | Filter transaksi tanggal tertentu | "transaksi 27 jan", "transaksi tgl 15" |
| **Category Filter** | Filter by kategori spesifik | "transaksi food bulan ini", "kategori bill" |
| **Category Breakdown** | Breakdown pengeluaran | "kategori paling boros" |

---

## 2. Deployment

Hanya lakukan jika Step 1 sukses.

```bash
npm run build
npm run deploy
```

---

## 3. Manual Regression Testing (Post-Deployment)

Setelah deploy, test manual di Telegram menggunakan handphone atau Telegram Web untuk memastikan integrasi end-to-end berjalan lancar (Firestore, Gemini AI, Webhook).

**Wajib check 7 query ini:**

1. **Saldo & Basic:**
   - Query: `saldo`
   - Expect: Menampilkan saldo saat ini.

2. **Time Range:**
   - Query: `pengeluaran hari ini berapa`
   - Expect: Total pengeluaran hari ini (bukan bulan ini/minggu ini).

3. **Limit by Recency (Terakhir):**
   - Query: `5 transaksi terakhir`
   - Expect: 5 transaksi yang **paling baru** terjadi (urut tanggal descending).

4. **Limit by Amount (Tertinggi/Terbesar):** 🌟 *Fitur Rawan Bug*
   - Query: `3 transaksi tertinggi bulan ini`
   - Expect: 3 transaksi dengan **nominal paling besar** (urut amount descending).
   - *Note: Pastikan tidak tertukar dengan transaksi terakhir.*

5. **Specific Date:** 🌟 *Fitur Rawan Bug*
   - Query: `transaksi 27 jan` (sesuaikan tanggal)
   - Expect: Hanya menampilkan transaksi pada tanggal tersebut.

6. **Category Filter:**
   - Query: `transaksi food bulan ini`
   - Expect: Hanya menampilkan transaksi kategori Food & Beverage.

7. **Error Handling:**
   - Query: `asdfghjkl` (random text)
   - Expect: Bot merespon bingung / unknown intent dengan sopan, BUKAN crash/diam.

---

## Troubleshooting Guide

Jika menemukan error saat manual testing:

### 1. Bot menjawab "Maaf, saya kurang mengerti"
- **Masalah:** Intent tidak terdeteksi oleh logic NLU.
- **Action:**
    1. Cek `functions/src/services/nluService.ts`.
    2. Tambahkan pattern regex baru jika perlu.
    3. Update `test-nlu.js` dengan case yang gagal tadi.

### 2. Bot menjawab "❌ Terjadi kesalahan"
- **Masalah:** Runtime error (Crash) di backend function.
- **Action:** Cek logs via terminal:
  ```bash
  firebase functions:log --only telegramWebhook -n 50
  ```
  Look for: `Error handling text message` atau stack trace error.

### 3. Hasil beda (Misal: "Tertinggi" malah keluar "Terakhir")
- **Masalah:** Logic sorting atau parsing parameter `sort_by` salah.
- **Action:**
    1. Cek `nluService.ts` bagian ekstraksi limit & sort_by.
    2. Cek `queryService.ts` bagian sorting logic.
    3. Pastikan `test-nlu.js` meng-cover perbedaan use case ini.

---

**Ingat:** "3 transaksi tertinggi" ≠ "3 transaksi terakhir".
- Tertinggi = `sort_by: 'amount'`
- Terakhir = `sort_by: 'date'` (Default)
