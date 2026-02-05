# Update Transaksi Bot - 5 Februari 2026

## Perubahan

Bot Telegram sekarang menampilkan **kedua jenis transaksi** (pemasukan dan pengeluaran) ketika user menanyakan tentang "transaksi".

## Yang Berubah

### 1. **queryService.ts** - `getTransactionDetails()`
- **Sebelumnya**: Hanya menampilkan transaksi EXPENSE (pengeluaran)
- **Sekarang**: Menampilkan semua transaksi (EXPENSE + INCOME)
- Menambahkan field `type` pada interface `TransactionDetail` untuk membedakan jenis transaksi

### 2. **responseFormatter.ts** - `formatTransactionDetails()`
- **Sebelumnya**: Format hanya untuk pengeluaran
- **Sekarang**: 
  - Menampilkan ringkasan dengan pemisahan pemasukan dan pengeluaran
  - Menghitung saldo bersih (pemasukan - pengeluaran) jika ada kedua jenis transaksi
  - Menambahkan indikator visual:
    - **➕** untuk pemasukan (INCOME)
    - **➖** untuk pengeluaran (EXPENSE)

## Contoh Output Bot

### Jika ada pemasukan dan pengeluaran:
```
📋 *Detail transaksi bulan ini*

💰 Ringkasan:
  ➕ Pemasukan: Rp 5.000.000 (2x)
  ➖ Pengeluaran: Rp 2.500.000 (15x)
  💎 Saldo: Rp 2.500.000

📅 *3 Feb - Jumat*
➕ Gaji bulanan
  💵 Rp 5.000.000 • 💼 Salary
➖ Makan siang
  💵 Rp 50.000 • 🍔 Food
```

### Jika hanya pengeluaran:
```
📋 *Detail transaksi bulan ini*

💰 Ringkasan:
  ➖ Pengeluaran: Rp 2.500.000 (15x)

📅 *3 Feb - Jumat*
➖ Makan siang
  💵 Rp 50.000 • 🍔 Food
```

## Testing

Untuk menguji perubahan ini, coba query berikut di bot Telegram:
- "transaksi hari ini"
- "transaksi minggu ini"
- "detail transaksi bulan ini"
- "5 transaksi terakhir"

## Files Modified

1. `functions/src/services/queryService.ts`
   - Updated `getTransactionDetails()` function
   - Added `type` field to `TransactionDetail` interface

2. `functions/src/services/responseFormatter.ts`
   - Updated `formatTransactionDetails()` function
   - Added income/expense separation and summary

## Deploy

Build berhasil tanpa error. Siap untuk di-deploy:
```bash
cd functions
npm run build  # ✅ Success
firebase deploy --only functions
```
