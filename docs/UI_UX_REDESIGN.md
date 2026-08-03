# Redesign UI/UX Dompet Cerdas — Mobile-First 2026

**Status**: Proposal Implementasi
**Versi Target**: v3.0.0 (Redesign)
**Tanggal**: Agu 3, 2026
**Stack existing**: React 19 + MUI 7 + Firebase (PWA)
**Referensi desain**: Material Design 3, Apple HIG, pola Mobbin/Dribbble untuk finance apps (Copilot Money, Monarch, YNAB), aplikasi enterprise mobile (SAP Fiori, HubSpot mobile), dan pola bottom-sheet Android modern.

---

## 1. Executive Summary

Dompet Cerdas saat ini adalah aplikasi expense tracker personal berbasis React + Material UI dengan fitur lengkap (transaksi, anggaran, rencana, hutang piutang, akun bersama, bot Telegram, AI advisor). Fondasi teknisnya sudah solid — lazy loading, PWA, offline queue, conflict handling sudah ada.

**Masalah utamanya bukan di fitur, tapi di pengalaman:**

1. **Navigasi mobile terfragmentasi** — item penting (Rencana, Pengeluaran Rutin, Analisis AI, Kategori) tersebar di menu "Lainnya", sementara FAB tambah transaksi hanya muncul di halaman Transaksi.
2. **Dashboard belum action-oriented** — masih berupa tumpukan card statis (saldo → 3 kartu anggaran → chart → transaksi terakhir), bukan diprioritaskan berdasarkan "apa yang harus dilakukan user hari ini".
3. **Form transaksi padat** — semua field ditampilkan sekaligus: nominal, kategori grid 3 kolom yang panjang, tanggal, catatan, lampiran, scan AI. Tanpa progressive disclosure.
4. **Riwayat transaksi memakai card per hari yang berat** — setiap hari diberi border card penuh dengan box tanggal besar 60px, menghabiskan ruang layar sebelum data tampil.
5. **Aksi edit transaksi tersembunyi di balik long-press** — tidak ada affordance visual, user baru tidak akan menemukannya.
6. **Tidak ada quick-add yang konsisten** — menambah transaksi hanya dari halaman Transaksi; dari Dashboard butuh navigasi dulu.
7. **Masukan filter mahal** — filter panel besar, tidak sticky, dan chips filter aktif hanya muncul saat panel dibuka manual.

**Arah redesign:**
- Mobile-first dengan bottom nav 5 slot: Beranda, Riwayat, **+ Tambah (FAB tengah)**, Anggaran, Lainnya.
- Dashboard "action dashboard": prioritas hari ini (anggaran yang hampir jebol, hutang jatuh tempo, rencana yang perlu dicatat) di atas ringkasan saldo.
- Quick Add dari mana saja via FAB tengah; form dibagi 2 langkah ringan (Nominal+Kategori → Detail opsional) dengan autosave draft.
- Riwayat jadi daftar padat mobile-modern: sticky header tanggal, swipe-to-edit, filter chips selalu terlihat di bawah search bar.
- Semua feedback via snackbar konsisten; konfirmasi hanya untuk aksi destruktif.

Target: input transaksi non-Telegram dari **6+ tap menjadi 3 tap**; menemukan "edit transaksi" dari tersembunyi menjadi terlihat; zero scrolling untuk melihat status penting hari ini di dashboard.

---

## 2. UI/UX Audit

### A. Masalah UI Existing

| # | Masalah | Prioritas | Dampak |
|---|---------|-----------|--------|
| UI-1 | Riwayat transaksi memakai card besar per hari + angka tanggal 60px | High | Ruang layar boros; daftar sulit dipindai cepat; pada layar kecil hanya 2-3 transaksi terlihat per layar |
| UI-2 | Aksi edit via long-press (600ms) tanpa affordance | **Critical** | Fitur edit/hapus efektif tidak terdeteksi oleh user baru; tidak ada akses edit via mouse di desktop selain long-press |
| UI-3 | Dashboard = tumpukan 3-4 kartu besar vertikal | High | Tidak ada prioritas; user harus scroll 2 layar untuk melihat transaksi terakhir |
| UI-4 | Kategori di form = grid 3 kolom tombol kecil (icon+caption) | High | Kategori >12 jadi dinding tombol; target sentuh ±64px tetapi teks sering terpotong (noWrap caption) |
| UI-5 | Bottom nav label font 0.6rem (< 11px) | Medium | Di bawah pedoman M3 (min 12sp); sulit dibaca pada layar terang |
| UI-6 | Header mobile = 2 baris (app bar + bar akun) tetap menghabiskan ±100px | Medium | Mengurangi area konten; info akun bisa dipindah ke bottom sheet |
| UI-7 | Banyak border per layar: Paper outlined berlapis + Card outlined di dalam Card | Medium | Visual terasa "bertab"; M3 modern justru meminimalkan border, mengandalkan surface tonal |
| UI-8 | NotificationModal (modal tengah) untuk pesan sukses | High | Blokir layar dan minta tap "OK" untuk pesan trivial ("Transaksi berhasil disimpan!") — harusnya snackbar |
| UI-9 | Konsistensi warna status tersebar di theme.colors custom + sx inline | Medium | Sulit di-maintain; tidak ada token status tunggal (warning/overdue/over-budget) |
| UI-10 | Login page plain; tidak ada nilai proposisi fitur | Low | Kehilangan kesempatan onboarding pertama |

### B. Masalah UX Existing

| # | Masalah | Prioritas | Dampak |
|---|---------|-----------|--------|
| UX-1 | Tambah transaksi hanya dari halaman Riwayat (FAB) | **Critical** | Dari dashboard perlu 2 navigasi dulu; pengeluaran cepat sering tidak dicatat |
| UX-2 | Form transaksi = satu layar panjang, ~8 field/blok | High | Kognitif berat; tidak ada draft autosave jika tidak sengaja tertutup |
| UX-3 | Tidak ada "recent/frequent categories" di form | Medium | Kategori yang sama dipilih berulang tetap harus dicari manual |
| UX-4 | Edit transaksi: long-press → form full screen; tidak ada quick actions (duplikat, hapus) | High | Alur koreksi lambat; tidak ada aksi cepat pada item |
| UX-5 | Filter riwayat: panel besar non-sticky, state tersembunyi saat panel ditutup | Medium | User lupa filter aktif; "x transaksi ditemukan" tanpa konteks filter |
| UX-6 | Dashboard tidak menampilkan "hal yang butuh tindakan" (anggaran hampir jebol, hutang jatuh tempo, rencana PLANNED lewat tanggal) | High | User harus masuk 3 menu berbeda untuk tahu kondisi hari ini |
| UX-7 | Hutang: pencatatan pembayaran harus masuk detail dulu (list → detail → Catat Pembayaran) | Medium | Aksi paling sering butuh 3 langkah; harusnya ada aksi cepat dari list |
| UX-8 | Tidak ada shortcut input jumlah cepat (quick amounts) atau template transaksi rutin dari dashboard | Medium | Pengeluaran rutin (parkir 5rb, kopi 18rb) tetap diketik penuh |
| UX-9 | Pesan offline hanya banner bawah; di form, ketergantungan online (scan AI, share akun) tersebar sebagai alert terpisah | Low | Konsistensi offline messaging bisa dipusatkan |
| UX-10 | Anggaran: form create berada di belakang tombol kecil; bila belum ada anggaran bulan ini, CTA tidak menonjol di empty state halaman lain | Low | Onboarding anggaran lemah |
| UX-11 | Risiko double submit saat menekan Simpan berulang pada koneksi lambat | High | `isSaving` sudah ada, tetapi button tidak menunjukkan spinner yang jelas di semua form |

### C. Temuan menurut tingkat keparahan

- **Critical**: UI-2 (long-press edit), UX-1 (tambah dari dashboard), UI-8 (modal untuk sukses)
- **High**: UI-1, UI-3, UI-4, UX-2, UX-4, UX-6, UX-11
- **Medium**: UI-5, UI-6, UI-7, UI-9, UX-3, UX-5, UX-7, UX-8
- **Low**: UI-10, UX-9, UX-10

---

## 3. User Persona

**Persona utama — "Sari, 27, karyawan swasta, pengguna Android kelas menengah"**
- Memakai satu tangan sambil berdiri/antre; sering input saat selesai bayar sesuatu.
- Butuh: catat pengeluaran < 5 detik, tahu sisa anggaran tanpa menghitung, diingatkan hutang teman.
- Frustrasi existing: "edit transaksi di mana?", "kok aku harus buka menu dulu buat catat?".
- Akses: 80% mobile, 20% desktop (rekap/export).

**Persona kedua — "Budi, 34, admin keuangan rumah tangga"**
- Pakai akun bersama dengan pasangan; rajin cek anggaran; butuh export Excel akhir bulan.
- Butuh: status sinkronisasi jelas, info siapa yang input apa, dan rekap cepat.

---

## 4. User Journey (Setelah Redesign)

1. Buka aplikasi → splash singkat → Dashboard langsung menampilkan **saldo + "Perlu Perhatian" hari ini** (tanpa scroll) pada layar 360px.
2. Selesai bayar parkir → tap **FAB + tengah** → keyboard numerik terbuka, nominal 5.000, kategori "Transport" tersedia di baris **Frequent** → tap Simpan. Total 3-4 tap, <10 detik.
3. Salah nominal → di Riwayat, **tap item** membuka sheet aksi (Edit / Duplikat / Hapus) — tidak perlu menebak long-press.
4. Akhir bulan → Dashboard menampilkan strip "3 anggaran >80%"; tap → lompat ke Anggaran bulan ini.
5. Offline di basement → banner status slim di atas; transaksi tetap tersimpan sebagai "Menunggu sinkronisasi"; ada chip status di item Riwayat.

---

## 5. Existing vs Proposed Flow

| Proses | Existing Step | Proposed Step | Pengurangan | Manfaat |
|--------|--------------:|--------------:|------------:|---------|
| Catat pengeluaran cepat (dari mana pun) | 6 (Buka Riwayat → tap FAB → isi nominal → gulir kategori → isi tanggal+catatan → Simpan) | 3 (tap FAB tengah → nominal+pilih kategori frequent → Simpan) | -50% | Pencatatan tidak lagi "nanti saja" |
| Edit transaksi | 4+ (Long-press 600ms tersembunyi → form full screen → ubah → Update) | 3 (tap item → tap Edit → simpan) | terjangkau | Dapat ditemukan tanpa pelatihan |
| Hapus/duplikat transaksi | Tidak ada duplikat; hapus via edit | 3 (tap item → pilih aksi → konfirmasi) | - | Quick actions standar aplikasi modern |
| Cek status hari ini | 10+ (Dashboard → scroll → Anggaran → Rencana → Hutang) | 1 layar (Dashboard bagian "Perlu Perhatian") | -80% | Satu layar untuk keputusan harian |
| Catat pembayaran hutang | 3 (Tab → tap item → Catat Pembayaran) | 2 (tap aksi cepat di kartu → simpan) | -33% | Aksi tersering semakin dekat |
| Buat anggaran bulan baru | 3+ (Anggaran → Buat Anggaran → isi) | 2 dengan "Salin bulan lalu" menonjol di empty state | -1 | Adopsi anggaran naik |
| Koreksi saat salah pilih kategori | Cari manual di grid besar | 2 (frequent chips + pencarian kategori) | jelas | Kesalahan input turun |

Kontrol/validasi tetap dipertahankan: nominal wajib > 0, kategori wajib, konfirmasi tetap hanya untuk aksi destruktif.

---

## 6. Information Architecture (Baru)

```
Beranda (Dashboard)
├── Saldo & ringkasan bulan ini (privacy toggle)
├── Perlu Perhatian: over-budget, hutang jatuh tempo, rencana terjadwal hari ini
├── Aksi Cepat: Tambah Pemasukan/Pengeluaran, Scan Struk, template rutin
└── Transaksi Terakhir (5)

Riwayat
├── Search bar (selalu terlihat) + filter chips (Bulan, Tipe, Kategori)
├── Ringkasan periode (masuk/keluar/saldo) sebagai strip tipis
└── List padat bergrup tanggal (sticky header)
    └── Item tap → Action Sheet: Edit / Duplikat / Hapus / Lihat Lampiran

+ (FAB tengah, global)
└── Form Cepat 2 langkah: Nominal+Kategori → (opsional) Detail: tanggal, catatan, lampiran, scan AI

Anggaran
├── Navigasi bulan (‹ Agustus 2026 ›)
├── Ringkasan strip + progress per anggaran
└── Detail anggaran (transaksi terkait)

Lainnya
├── Rencana
├── Hutang Piutang
├── Pengeluaran Rutin
├── Kategori
├── Analisis AI
└── Pengaturan / Akun
```

Rencana/Hutang tetap pertama-class di desktop sidebar; di mobile mereka pindah ke "Lainnya" agar bottom nav tetap 5 slot — namun item yang butuh tindakan hari ini diangkat ke Dashboard, sehingga fungsi pengingatnya tidak hilang.

---

## 7. Navigation Recommendation

| Komponen | Keputusan | Alasan |
|----------|-----------|--------|
| Bottom navigation (mobile) | 5 slot: Beranda, Riwayat, **[+]** , Anggaran, Lainnya | Pola paling dikenal (Gojek/Grab/BCA mobile); FAB tengah = aksi utama aplikasi pencatat keuangan |
| FAB global (mobile) | Menggantikan FAB per-halaman; selalu terlihat kecuali saat keyboard terbuka / dialog penuh | Aksi terpenting (catat) tersedia dari mana saja |
| Bottom action bar | Dipakai di form (Simpan stick di bawah) & sheet aksi item | Standar M3; jempol-friendly satu tangan |
| Top app bar (mobile) | Satu baris ramping: logo kecil + chip akun aktif (tap buka bottom sheet ganti akun) + ikon tema | Mengganti 2 baris existing (hemat ±56px vertikal) |
| Drawer/sidebar (desktop ≥900px) | Dipertahankan, dirapikan: grup "Operasional" vs "Perencanaan" | Sudah OK; hanya kosmetik |
| Tabs | Hanya untuk konteks setara (Riwayat: filter tipe; Hutang: Perlu Dibayar/Ditagih/Selesai) sesuai M3 |
| Sheet (bottom sheet) | Ganti modal tengah untuk: ganti akun, aksi item, konfirmasi non-destruktif | Lebih mobile-native, tidak memutus konteks |

---

## 8. Design System

Design system diimplementasikan sebagai ekstensi `ThemeContext` existing (light/dark), BUKAN mengganti MUI — seluruh token dipetakan ke `createTheme` agar komponen MUI mengikuti otomatis.

### 8.1 Color Palette (Light)

```
Primary (indigo, dipertahankan dari brand):
  primary:        #4F46E5   (accent existing)
  primaryHover:   #4338CA
  primarySoft:    #EEF2FF   (surface tonal)
  onPrimary:      #FFFFFF

Semantic:
  income:   #0E9F6E   (lebih dalam dari existing untuk kontras)
  incomeBg: #E7F6F0
  expense:  #E02424
  expenseBg:#FDECEC
  warning:  #C27803   (amber gelap, AA pada putih)
  warningBg:#FDF3E3
  info:     #1C64F2
  infoBg:   #E8F0FE

Neutral:
  bgPrimary:   #F8FAFC
  surface:     #FFFFFF
  surfaceAlt:  #F1F5F9
  border:      #E2E8F0   (dipakai hemat)
  textPrimary: #0F172A
  textSecondary:#475569
  textMuted:   #94A3B8
```

Dark mode: surface `#0F172A → #1E293B`, teks `#F8FAFC/#CBD5E1/#64748B`, warna brand dinaikkan luminansinya (`#818CF8`) untuk kontras AA.

### 8.2 Typography

Font tetap system stack existing (Inter bila tersedia). Scale:

| Token | Ukuran/Weight | Dipakai untuk |
|-------|--------------|----------------|
| displayAmount | 34/700 tabular-nums | Saldo hero, nominal di form |
| h1 | 22/700 | Judul halaman |
| h2 | 18/700 | Judul section/card |
| body | 14/400 | Konten utama |
| bodyStrong | 14/600 | Nama item list |
| caption | 12/500 | Meta, helper |
| overline | 11/700 letter-spacing .08em uppercase | Label kecil |
| navLabel | 12/500 | Bottom nav (naik dari 0.6rem → 0.75rem) |

Angka uang selalu `font-variant-numeric: tabular-nums`.

### 8.3 Spacing / Radius / Elevation / Icon

- Spacing scale: 4, 8, 12, 16, 20, 24, 32 (base 4)
- Radius: sm 8, md 12, lg 16, xl 20, pill 999 — **maksimal lg untuk konten**; xl hanya hero
- Elevation: border dikurangi; gunakan surface tonal + shadow halus: `0 1px 2px rgba(15,23,42,.06)`, card penting `0 4px 12px rgba(15,23,42,.08)`
- Icon: Material Symbols existing; ukuran 18/20/24; selalu + label bila makna berpotensi ambigu
- Touch target: minimal 44px (list item 56px, nav 56px area, chip aksi 36px min-height dengan padding horizontal 12)

### 8.4 Komponen (ringkas)

- **Button**: contained (primary), tonal (secondary, bg primarySoft), text; tinggi 44; radius 12; state disabled jelas (bg `surfaceAlt`, teks `textMuted`).
- **Input**: filled-style modern (bg `surfaceAlt`, tanpa outline tebal), label di atas (bukan floating) untuk form panjang; error = ikon + teks di bawah field, bukan modal.
- **Card**: default `surface` + 1px border atau tonal; satu kartu tidak di dalam kartu lain.
- **Chip**: filter chips 32px, radius pill, selected = tonal + ikon check.
- **Badge status**: Lunas/Belum/Jatuh tempo/Over-budget/Menunggu sinkronisasi — warna + ikon (bukan warna saja).
- **Snackbar**: menggantikan modal notifikasi sukses; 4 detik, aksi maksimal satu (Undo/Lihat).
- **Bottom sheet**: ganti akun, aksi item, pilihan sederhana; drag-handle 32x4.
- **Dialog**: hanya untuk destruktif (hapus) & konflik data.
- **Skeleton**: untuk daftar riwayat & kartu ringkasan saat loading awal.

---

## 9. Screen-by-Screen Redesign (ringkas per layar)

### 9.1 Splash/Login
- Splash: logo + tagline satu baris; auto dark aware (sudah ada inline SVG loader — pertahankan).
- Login: hero value props (3 butir fitur dengan ikon: Catat cepat, Anggaran terpantau, Telegram); satu tombol Google 48px; teks keamanan kecil; error inline dengan solusi jelas.
- Empty/error: popup diblokir → tawarkan "Lanjutkan lewat redirect" sebagai aksi utama, bukan hanya teks error.

### 9.2 Dashboard (Beranda)
Urutan baru (mobile pertama):
1. **Header ramping** menyatu dengan konten: sapaan singkat + tanggal hari ini (overline), avatar kecil kanan.
2. **Saldo hero ringkas** (gradient tetap, tinggi dikurangi): total saldo besar, privacy eye, dan bar kecil masuk/keluar bulan ini — bukan dua kartu kaca penuh.
3. **Perlu Perhatian** (hanya muncul bila ada): daftar 1-3 item actionable (anggaran >90%, hutang lewat jatuh tempo, rencana berakhir hari ini) dengan CTA langsung per item.
4. **Aksi Cepat**: 4 ikon berlabel (Pengeluaran, Pemasukan, Scan Struk, Rutin) — masing-masing membuka form yang sesuai.
5. **Transaksi Terakhir** (5) dalam list M3 padat + "Lihat semua".
6. Getting Started card tetap untuk user baru (konten dipertahankan, styling dirapikan, bisa di-dismiss permanen).

Loading: skeleton untuk hero & list (bukan spinner saja). Offline: strip status digabung ke sistem status global.

### 9.3 Riwayat (TransactionList)
- Search field selalu terlihat di bawah PageHeader; di kanannya ikon filter (bottom sheet).
- **Filter chips bar**: chip periode (mis. "Agu 2026 ▾"), chip tipe (Semua/Masuk/Keluar segmented kecil), chip kategori bila aktif; "Hapus filter" chip tonal bila ada yang aktif.
- Ringkasan periode jadi **strip tipis satu baris**: Masuk • Keluar • Selisih (bukan 3 Paper besar).
- List per tanggal: **sticky date header** tipis (teks 12/700 + total harian kanan) — mengganti kartu tanggal raksasa; di bawahnya item 56-64px: ikon kategori bulat warna, judul = deskripsi (fallback kategori), sub = kategori • sumber (Telegram) • badge lampiran/menunggu-sync; nominal kanan dengan warna tipe.
- Aksi item: **tap** membuka action sheet (Lihat lampiran / Edit / Duplikat / Hapus). Long-press tetap berfungsi (progressive enhancement). Desktop: hover menampilkan ikon aksi sekaligus klik membuka sheet.
- Empty: ilustrasi ikon + kalimat situasional (kosong karena filter vs bulan kosong) + CTA "Catat transaksi pertama".
- Loading awal: skeleton baris ×6. Infinite/virtualisasi: daftar dibatasi render per grup bulan (render window) — data Firestore sudah realtime; gunakan `content-visibility` CSS untuk grup lama.

### 9.4 Form Transaksi (Quick Add 2 langkah)
Langkah 1 (default): Segmented Pengeluaran/Pemasukan → keypad nominal besar (displayAmount 34px, prefix Rp) → **Frequent categories** (5 terpakai terbanyak 30 hari, dari riwayat lokal) → grid kategori lainnya di bawah (lebih kecil, discroll internal) → tombol besar **Simpan** + tombol teks "Tambah detail".
Langkah 2 (detail, progressive): tanggal (default hari ini, chippable Kemarin/Hari ini), catatan dengan autocomplete dari deskripsi terdahulu (datalist), lampiran (upload / **Scan Struk AI** dipromosikan sebagai tile besar), info akun & siapa pencatat (read-only).
- Autosave draft: draft disimpan di localStorage per akun setiap perubahan (debounce 400ms); membuka form lagi menawarkan "Lanjutkan draf?" via snackbar.
- Validasi inline (nominal > 0, kategori wajib) — pesan di bawah kontrol, tombol Simpan disabled, tidak memakai modal.
- Konfirmasi: hanya untuk Hapus (dialog danger) & konflik multi-tab (existing, dipertahankan, style dirapikan).
- Sukses: snackbar "Tersimpan • Rp25.000 di Makanan" + aksi **Undo** 5 detik (undo = hapus dokumen yang barusan dibuat).
- Keyboard: `inputMode="numeric"`; area konten diberi `padding-bottom` setara tinggi keyboard via `visualViewport` agar Simpan tidak tertutup.

### 9.5 Anggaran
- Header bulan sebagai segmented control (‹ Agu 2026 ›) langsung di PageHeader (sudah ada, dirapikan jadi pill).
- Strip ringkasan satu baris + **status chipAgregat** ("2 anggaran > 80%").
- Kartu anggaran dirampingkan: nama + chip kategori, progress bar dengan **penanda 80%**, sisa ditekankan; warna bar hijau → amber (>80%) → merah (jebol). Aksi sekunder (Edit/Hapus) masuk overflow menu per kartu; aksi utama "Lihat detail".
- Empty state: CTA ganda "Buat Anggaran" + "Salin dari bulan lalu" (sebelumnya tombol salin tersembunyi di header list).
- Form: nama (auto-suggest dari nama anggaran lampau), nominal keypad, kategori sebagai chip multi-select dengan pencarian — bukan grid kartu besar.

### 9.6 Hutang Piutang
Pertahankan IA (3 tab) tetapi:
- Ringkasan atas jadi **dua kartu kompak** (Perlu Dibayar / Perlu Ditagih) dengan jumlah catatan — gradient penuh diganti surface tonal + aksen kiri 4px (lebih enterprise).
- Kartu list mendapat **aksi cepat langsung**: tombol "Catat Bayar" (tonal) + overflow (Ubah/Tandai Lunas/Hapus) — tanpa masuk detail dulu.
- Detail: hero menjadi header ringkas (avatar inisial, sisa jumlah besar, chip status & jatuh tempo), riwayat pembayaran timeline, sticky bottom bar: "Catat Pembayaran" + "Tandai Lunas".
- Badge "Lewat jatuh tempo" juga tampil di Dashboard bagian Perlu Perhatian.

### 9.7 Lainnya (sheet penuh, bukan Menu dropdown)
Menu "Lainnya" menjadi **bottom sheet penuh setinggi 90%** dengan daftar besar berikon: Rencana, Hutang Piutang, Pengeluaran Rutin, Kategori, Analisis AI, Pengaturan, Panduan. Label jelas — menggantikan dropdown kecil yang cramped.

### 9.8 Pengaturan
Group menjadi 4 section: **Akun & Kolaborasi**, **Telegram**, **Data** (Export, Hapus semua), **Tentang**. Toggle pengingat memakai switch + time picker jam (chips per jam populer: 07.00/12.00/20.00 + custom). Status sinkronisasi & info build dipindah ke "Tentang".

### 9.9 Status & Sistem Umpan Balik (global)
- Sistem status: `Synced / Menunggu sinkronisasi / Offline / Gagal upload (retry)` — satu komponen `SyncStatusChip` dipakai di Riwayat item & header.
- Semua hasil aksi → snackbar; modal hanya error blokir & konfirmasi destruktif.
- Undo 5 detik untuk: tambah transaksi, hapus transaksi (restore dokumen), tandai lunas.
- Data mencegah duplikasi: tombol submit disable + spinner, dan `key` idempoten untuk tambah (mengandalkan doc id pre-generated existing).

---

## 10. Wireframe (teks, mobile 360px)

### Beranda
```
┌──────────────────────────────┐
│ Selamat malam, Sari   (ava)  │  header ramping
│ Senin, 3 Agustus 2026        │
├──────────────────────────────┤
│ ╭──────────────────────────╮ │
│ │ Total Saldo          👁  │ │  hero ringkas
│ │ Rp 4.250.000             │ │
│ │ ↑ 3,1 jt   ↓ 1,9 jt Agu  │ │
│ ╰──────────────────────────╯ │
│ PERLU PERHATIAN              │
│ ⚠ Makanan: 92% anggaran  →   │
│ ⏰ Hutang Budi jatuh tempo → │
│ AKSI CEPAT                   │
│ [−Keluar][+Masuk][📷][🔁]    │
│ TRANSAKSI TERAKHIR  Lihat ›  │
│ ☕ Kopi        −18.000       │
│ 🍜 Makan siang −25.000       │
├──────────────────────────────┤
│ Beranda Riwayat [＋] Anggaran⋯│
└──────────────────────────────┘
```

### Riwayat
```
┌──────────────────────────────┐
│ 🔍 Cari transaksi…      [⚙]  │
│ [Agu 2026▾][Semua|↧|↥][Kat▾] │
│ Masuk 3,1jt • Keluar 1,9jt   │
├──────────────────────────────┤
│ HARI INI             −43.000 │  sticky header
│ ☕ Kopi • Makanan    −18.000 │
│ 🍜 Makan siang       −25.000 │
│ KEMARIN              −12.000 │
│ 🅿 Parkir • 🕓 sync  −12.000 │
└──────────────────────────────┘
Tap item → ┌──────────────────┐
           │ Lihat lampiran   │
           │ Edit  Duplikat   │
           │ Hapus (merah)    │
           └──────────────────┘
```

### Quick Add (langkah 1)
```
┌──────────────────────────────┐
│ ✕  Catat Transaksi           │
│ [ Pengeluaran | Pemasukan ]  │
│         Rp 25.000            │  display besar
│ Sering dipakai:              │
│ [🍜][☕][🅿][🛍][⛽]          │
│ Semua kategori (cari…)       │
│ [grid ringkas …]             │
│ ┌──────────────────────────┐ │
│ │         Simpan           │ │  sticky bottom
│ └──────────────────────────┘ │
│ Tambah detail (tanggal, dll) │
└──────────────────────────────┘
```

---

## 11. High-Fidelity Direction

- Hero saldo: gradient `#4F46E5 → #7C3AED` dipertahankan namun tinggi dipadatkan (±150px mobile), sudut xl 20, dekor lingkaran blur subtle; angka `displayAmount` tabular.
- Surface: dasar `#F8FAFC`, kartu putih radius 16 dengan shadow halus, **tanpa border bertumpuk**; sticky header tanggal `bgPrimary 85% + backdrop-blur`.
- Bottom nav: tinggi 64, label 12px, ikon 22; item aktif tonal pill di belakang ikon (gaya M3), FAB tengah 56 elevation menjorok.
- Motion ringan: sheet slide-up 200ms `cubic-bezier(.2,0,0,1)`, snackbar fade-up, progress bar transisi lebar 300ms, haptics ringan saat berhasil simpan (navigator.vibrate 10ms, guarded).
- Dark mode: hero gradient digeser lebih terang (`#6366F1 → #8B5CF6`), status chips memakai varian tonal agar kontras AA terjaga.

---

## 12. Microcopy (perubahan kunci)

| Konteks | Lama | Baru |
|---|---|---|
| Sukses simpan | Modal "Berhasil! Transaksi berhasil disimpan!" | Snackbar: "Tersimpan • Rp25.000 di Makanan — Urungkan" |
| Kosong riwayat | "Belum ada transaksi di bulan ini." | "Bulan ini masih kosong. Catat pengeluaran pertamamu — cukup 10 detik." + tombol |
| Kosong karena filter | "Coba ubah filter…" | "Tidak ketemu. Hapus filter atau ubah kata kunci." + chip "Hapus semua filter" |
| Offline banner | "Mode offline aktif. Data yang sudah…" | "Kamu offline — catatan tetap tersimpan & otomatis terkirim saat online." |
| Hapus akun diblokir | "Minimal harus ada satu Akun Keuangan…" | "Akun terakhir tidak bisa dihapus — aplikasi butuh minimal satu akun." |
| Long-press hint | (tidak ada) | Tap item = aksi; tooltip onboarding 1×: "Sentuh transaksi untuk edit atau hapus." |
| Error popup login | "Popup ditutup. Mencoba redirect..." | "Popup tertutup. Lanjutkan di halaman ini?" [Lanjutkan] |

---

## 13. Prototype Interaction

- Dashboard → Quick Add: FAB morph menaikkan sheet; fokus nominal; keyboard numerik otomatis.
- Simpan cepat: sheet turun, snackbar muncul di atas nav, hero saldo animasi count-up kecil.
- Riwayat: scroll — header tanggal sticky; tap item → sheet aksi slide dari bawah dengan spring ringan; Hapus → dialog merah → item fade + snackbar Undo.
- Ganti akun: chip akun di app bar → bottom sheet daftar akun dengan radio; pilih → skeleton konten 300ms.
- Theme toggle: transisi warna 150ms lintas surface.

---

## 14. Implementation Plan

**Quick wins (hari ini, terukur kecil):**
1. Snackbar menggantikan modal notifikasi sukses (NotificationModal → hanya warning/error blokir).
2. Bottom nav label 12px, FAB global pusat.
3. Aksi item Riwayat via tap → action sheet (Edit/Duplikat/Hapus).
4. Filter chips selalu terlihat + ringkasan strip satu baris.

**Phase 1 (inti redesign):**
5. Design tokens di ThemeContext + `createTheme` mapping (radius, spacing, warna, typography, shadows).
6. Dashboard baru (Perlu Perhatian, Aksi Cepat, list padat).
7. Riwayat baru (sticky header tanggal, item 56px, skeleton).
8. Quick Add 2 langkah + frequent categories + autosave draft + Undo.

**Phase 2:**
9. Anggaran & Hutang polish (aksi cepat, overflow menu, progress dengan threshold 80%).
10. Sheet "Lainnya" penuh; Sheet ganti akun; Pengaturan digroup ulang.
11. SyncStatusChip global & konsolidasi pesan offline.

**Future enhancement (dicatat, tidak dikerjakan):**
- Virtualisasi penuh daftar lintas tahun; template rutin di Beranda dari RoutineExpense; widget home Android; review AI mingguan push.

---

## 15. Risiko & Mitigasi Implementasi

| Risiko | Mitigasi |
|---|---|
| Frequent categories butuh riwayat lokal | Hitung dari `transactions` in-memory (30 hari); tanpa koleksi baru |
| Autosave draft bocor lintas akun | Key draft menempel `uid_accountId`, dibersihkan saat simpan/ganti akun |
| Undo delete bertabrakan aturan shared | Undo hanya mengembalikan dokumen milik sendiri; bila gagal → snackbar error jujur |
| Sheet aksi di desktop terasa asing | Di ≥900px sheet dirender sebagai menu kontekstual |
| Ukuran bundle bertambah | Tidak ada dependensi baru; semua komponen dari MUI existing; sheet = MUI Dialog fullScreen yang distyle |

*(Dokumen ini menjadi acuan implementasi kode pada fase berikutnya.)*
