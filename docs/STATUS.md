# STATUS — utang & cacat yang diketahui

Diperbarui 4 Okt 2026, setelah perbaikan Pengeluaran Rutin (Set Lunas), Riwayat Transaksi (teks tidak terpotong),
dan form Catat Transaksi (ikon kategori, detail selalu tampil, button Simpan floating, update PWA).
Semua di bawah ini **belum diperbaiki**. Yang ditemukan reviewer tapi di luar permintaan dicatat di sini, bukan diam-diam ditinggal.

## Belum diverifikasi

- **HP sungguhan.** Keyboard virtual di harness memakai mock `visualViewport`; "iphone-webkit" = WebKit Playwright di macOS, bukan iOS Safari.
- **Firestore asli.** Jalur `writeBatch` "Lunas + catat" (rules + ack server) belum pernah jalan ke server. Wajib 1x eksekusi nyata di akun test sebelum production.
- **Update SW di PWA ter-install** (Android/iOS). Baru diuji di simulator desktop.
- **Penyebab pasti** keluhan "Set Lunas wajib catat transaksi" di HP owner (dua kandidat sudah ditutup, mana yang terjadi belum terbukti).

## Salah diam-diam (prioritas)

- **Transaksi bisa dobel.** Catat Transaksi / "Lunas + catat" dengan lampiran di sinyal lambat: selama upload belum ada yang ditulis, tapi form masih bisa ditutup (X/backdrop). Kalau user mencatat ulang, transaksinya jadi dua. Fix-nya harus membedakan fase upload (blokir tutup) dari write yang pending offline (tetap boleh tutup).
- **"Tersimpan!" padahal tidak tersimpan.** `App.tsx` `addTransaction` keluar diam-diam (`return`) kalau `user`/akun masih null; `updateTransaction` juga `return` kalau transaksinya sudah dihapus. Form tetap menampilkan toast sukses.
- **Action sheet pemasukan tampil "-Rp …" merah.** Tanda & warna diambil dari `amount >= 0` (`TransactionActionSheet.tsx`), padahal amount selalu positif.
- **Tagihan rutin dengan kategori yang sudah dihapus** mencatat transaksi dengan `categoryId` orphan (`QuickAddSheetLoader.tsx` hanya cek non-kosong).
- **Filter bulan Pengeluaran Rutin** memakai `createdAt` UTC (`RoutineExpenseManager.tsx`, `exp.createdAt.substring(0, 7)`).

## Perilaku yang perlu diketahui

- **Batch "Lunas + catat" gagal setelah lampiran ter-upload:** file tertinggal di Storage (orphan); kalau offline, job upload nyangkut "Gagal" di card status upload.
- **Akun bersama:** kalau tagihan sudah ditandai lunas anggota lain, "Lunas + catat" ditolak rules seluruhnya dengan pesan umum "Coba lagi" (dicoba lagi pun tetap ditolak).
- **"Lunas + catat" saat offline:** form tertahan "Menyimpan..." sampai online (tagihan langsung tampil lunas, form boleh ditutup).
- **WebKit, proses dimatikan saat install SW:** SW baru aktif tapi tab tidak auto-reload; chunk lama sudah terhapus dari cache, jadi menu yang belum pernah dibuka bisa gagal dimuat sampai reload manual (belum diuji). Penyebab belum ketemu.
- **`npm run dev`:** SW tidak ter-install (dev server membalas `index.html` untuk `/precache-manifest.json`). Production tidak terpengaruh.

## Tampilan

- Teks masih terpotong (`noWrap`): "Transaksi Terakhir" di Dashboard (`Dashboard.tsx`), daftar transaksi & nama kategori di Anggaran (`BudgetManager.tsx`).
- Riwayat Transaksi di layar 280px: kolom deskripsi sangat sempit, chip status "Gagal" ter-ellipsis.
- Ikon empty-state di Rencana & Anggaran: `sx={{ marginBottom: 8/12/16 }}` terbaca spacing unit (64–128px) (`BudgetManager.tsx`, `PlanManager.tsx`).
- Dark mode: teks putih button Simpan di atas warna accent kontrasnya 2,98:1 (di bawah AA).
- Halaman Utang 320px: nama menimpa nominal.
- Input Catatan satu baris; placeholder terpotong di 320px. Button "Batal" action sheet di bawah fold di 320×568.

## Lain-lain

- SW latent: font di-precache lewat HTTP cache `immutable`; chunk yang hilang dibalas HTML 200 lalu ikut di-cache.
- Sheet edit di desktop: fokus Tab bisa salah target karena sheet belum diberi `key` (`TransactionList.tsx`).
- Dokumen stale: `README.md`, `IMPLEMENTASI_REDESIGN_v3.md`, `docs/UI_UX_REDESIGN.md` masih menggambarkan detail yang di-collapse / "Tambah detail".
