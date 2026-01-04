# 🌐 Dompet Cerdas - Landing Page Documentation

Dokumentasi khusus untuk halaman landing page (marketing) aplikasi Dompet Cerdas.

## 📋 Overview
Ini adalah halaman web statis (Standalone) yang dirancang untuk mempromosikan aplikasi Dompet Cerdas. Halaman ini sepenuhnya terpisah dari aplikasi utama (React App), sehingga ringan, cepat, dan mudah diedit tanpa perlu build tools (seperti Vite/Webpack).

## 📁 Struktur File

Folder `landing-page/` berisi:

| File | Deskripsi |
|------|-----------|
| `index.html` | Struktur utama halaman dan konten teks. Berisi markup semantik dan SVG icons inline. |
| `style.css` | Styling tampilan. Menggunakan Vanilla CSS modern (Variables, Flexbox, Grid) tanpa framework eksternal. |
| `script.js` | Logika interaktif sederhana untuk Menu Mobile (Hamburger) dan Smooth Scroll. |
| `DOCUMENTATION.md` | File dokumentasi ini. |

## 🛠 Teknologi
- **HTML5**: Semantic Markup.
- **CSS3**: Custom Design (Glassmorphism, Gradients).
- **JavaScript**: Vanilla JS (ES6+).
- **Icons**: Inline SVG (tidak perlu download file icon terpisah).
- **Fonts**: Google Fonts (Outfit).

## 🎨 Panduan Kustomisasi

### 1. Mengubah Warna Tema
Warna didefinisikan sebagai **CSS Variables** di bagian paling atas file `style.css`. Anda hanya perlu mengubah nilai di `:root`.

```css
/* style.css baris 1-15 */
:root {
    --primary: #4F46E5;       /* Warna Utama (Indigo) */
    --secondary: #10B981;     /* Warna Hijau (Success/Income) */
    --accent: #F59E0B;        /* Warna Oranye (Accent/Warning) */
    /* ... */
}
```

### 2. Mengubah Link Aplikasi
Tombol "Buka Aplikasi" atau "Mulai Sekarang" saat ini mengarah ke `https://dompas.indoomega.my.id`.
Untuk mengubahnya, cari tag `<a>` di `index.html` dan ubah atribut `href`:

```html
<!-- Contoh di bagian Hero -->
<a href="https://url-baru-anda.com" class="btn-primary">
    Mulai Sekarang
</a>
```

### 3. Mengganti Konten Teks
Cukup buka `index.html` dan cari teks yang ingin diubah.
- **Headline Utama**: Ada di tag `<h1>` dalam `<header class="hero">`.
- **Fitur**: Ada di section `<section id="fitur">`.
- **Testimoni/AI**: Ada di section `<section id="ai">`.

## 🚀 Deployment (Cara Online)

Karena ini adalah situs statis murni, Anda memiliki banyak opsi fleksibel untuk menayangkannya:

### Opsi A: Hosting Terpisah (Disarankan)
Anda bisa menghosting halaman ini di provider static hosting gratis seperti **Netlify**, **Vercel**, atau **GitHub Pages**.
1. Upload folder `landing-page` ini saja.
2. Domain bisa diatur misal: `info.dompas.indoomega.my.id` atau `landing.dompas.indoomega.my.id`.

### Opsi B: Subfolder di Server Utama
Jika Anda ingin halaman ini muncul di `dompas.indoomega.my.id/info`:
1. Masuk ke server/VPS Anda.
2. Buat folder `info` di dalam root direktori web server (misal `/var/www/html/info` atau di dalam folder `dist` aplikasi utama jika dikonfigurasi demikian).
3. Upload `index.html`, `style.css`, dan `script.js` ke folder tersebut.

### ⚠️ Catatan Penting
- **Favicon**: Saat ini file HTML memanggil favicon dari folder `../public/favicon-32.png`. Jika Anda memindahkan folder ini keluar dari struktur project saat ini, pastikan Anda juga menyalin file favicon dan memperbarui path-nya di `index.html`:
  ```html
  <link rel="icon" type="image/png" href="path/to/favicon.png">
  ```
- **Gambar**: Halaman ini **TIDAK** menggunakan file gambar eksternal (JPG/PNG) untuk visualisasi. Semua ilustrasi (Card saldo, Pie chart, Mockup HP) dibuat menggunakan **CSS Shapes**. Ini membuat halaman sangat ringan dan mudah dipindah-pindah tanpa resiko gambar broken (missing images).

---
> **Last Updated**: 4 Januari 2026
