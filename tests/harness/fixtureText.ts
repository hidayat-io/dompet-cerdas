// Teks fixture dipakai bersama oleh harness (main.tsx) dan spec, supaya tidak ditulis dua kali.
const exactLength = (base: string, length: number) => {
  const text = base.repeat(Math.ceil(length / base.length)).slice(0, length);
  // Hindari spasi di ujung: deskripsi di-trim sebelum panjangnya dihitung.
  return text.replace(/\s$/, 'x');
};

export const FIXTURE_TEXT = {
  short: 'Kopi',
  medium: 'Makan siang bareng tim di kantin',
  long: 'Belanja bulanan di supermarket: beras, minyak goreng, telur, sabun, sampo, dan kebutuhan dapur lainnya',
  unbroken: 'https://contoh.example.com/struk/very-long-receipt-identifier-1234567890abcdef',
  longCategory: 'Kategori Dengan Nama Yang Sangat Panjang Sekali',
  longGridCategory: 'Langganan Streaming Musik dan Video Keluarga',
  longFileName: 'foto-struk-belanja-bulanan-supermarket-oktober-2026-halaman-pertama.jpg',
  // Tanpa spasi/tanda hubung: browser tidak punya titik wrap alami.
  longUnbrokenFileName: 'IMG_20261101_1234567890_struk_belanja_bulanan_supermarket.jpg',
  // Lebih lebar dari area konten action sheet di semua lebar HP (≥ ~420px di font 14px).
  unbrokenCategory: 'KategoriTanpaSpasiYangSangatPanjangSekaliUntukUjiTampilan',
  unbrokenGridCategory: 'PerlengkapanRumahTanggaBulananKeluarga',
  longWordCategories: ['Perlengkapan', 'Pemeliharaan', 'Telekomunikasi', 'Rumahtangga'],
  // Nama dengan "/" tanpa spasi: browser tidak memberi titik wrap setelah "/" yang diikuti huruf.
  slashCategories: ['Sumbangan/Donasi', 'Zakat/Infaq/Sedekah'],
  unbrokenBillName: 'TagihanInternetRumahUtamaDanKantorCabangJakartaSelatan',
  // Batas threshold font: ≤24 → 14px, 25–48 → 13px, >48 → 12px.
  len24: exactLength('Bensin motor ', 24),
  len25: exactLength('Servis motor ', 25),
  len48: exactLength('Iuran kebersihan kompleks ', 48),
  len49: exactLength('Iuran keamanan kompleks ', 49),
} as const;
