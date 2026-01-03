# File Compression Utility

## Overview
Utility untuk mengkompresi file attachment sebelum upload ke Firebase Storage, menghemat storage dan mempercepat upload.

## Features

### 🖼️ Image Compression
- **Auto-resize**: Gambar otomatis di-resize ke maksimal 1920x1920px dengan mempertahankan aspect ratio
- **Quality optimization**: Kompresi JPEG dengan quality 80%
- **Format conversion**: Semua format gambar (PNG, GIF, WEBP) dikonversi ke JPEG untuk ukuran optimal
- **Smart compression**: Menggunakan Canvas API dengan high-quality image smoothing

### 📄 PDF Validation
- **Size limit**: Maksimal 2MB untuk file PDF
- **Validation**: Validasi ukuran sebelum upload

## Usage

```typescript
import { processFileForUpload } from '../utils/fileCompression';

// Process file before upload
const result = await processFileForUpload(file);

// Result contains:
// - file: Compressed/validated file
// - originalSize: Original file size in bytes
// - processedSize: Processed file size in bytes
// - type: 'image' | 'pdf'
// - compressionApplied: boolean
// - message: User-friendly message
```

## Compression Settings

### Current Settings
```typescript
const COMPRESSION_SETTINGS = {
  image: {
    maxWidth: 1920,      // pixels
    maxHeight: 1920,     // pixels
    quality: 0.8,        // 80% JPEG quality
    format: 'image/jpeg' // Output format
  },
  pdf: {
    maxSize: 2 * 1024 * 1024  // 2MB
  },
  upload: {
    maxInitialSize: 10 * 1024 * 1024  // 10MB before compression
  }
};
```

### Customization
Untuk mengubah settings kompresi, edit file `utils/fileCompression.ts`:

```typescript
// Ubah max dimensions
await compressImage(file, 1280, 1280, 0.7);  // Smaller size, lower quality

// Ubah PDF max size
validatePdfSize(file, 5 * 1024 * 1024);  // 5MB limit
```

## Benefits

### 💰 Cost Savings
- **Storage**: Rata-rata 60-80% pengurangan ukuran file
- **Bandwidth**: Upload dan download lebih cepat
- **Firebase costs**: Lebih sedikit storage usage

### ⚡ Performance
- **Faster uploads**: File lebih kecil = upload lebih cepat
- **Better UX**: Loading time lebih singkat
- **Mobile-friendly**: Hemat data untuk user mobile

### 📊 Example Compression Results
```
Original: 3.2 MB (PNG)  →  Compressed: 850 KB (JPEG)  [73% reduction]
Original: 5.8 MB (JPEG) →  Compressed: 1.2 MB (JPEG)  [79% reduction]
Original: 1.5 MB (PDF)  →  Validated: 1.5 MB (PDF)   [No compression]
```

## Error Handling

```typescript
try {
  const result = await processFileForUpload(file);
  // Success - use result.file for upload
} catch (error) {
  // Handle errors:
  // - "Ukuran PDF terlalu besar..."
  // - "Tipe file tidak didukung"
  // - "Failed to compress image"
}
```

## User Feedback

Setelah kompresi, user akan melihat pesan seperti:
```
✅ Gambar dikompres 73% (3.2 MB → 850 KB)
✅ PDF valid (1.5 MB)
```

## Technical Details

### Canvas API
- Uses `HTMLCanvasElement` for image manipulation
- High-quality image smoothing enabled
- Maintains aspect ratio during resize
- Converts to JPEG for optimal compression

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Improvements

Potential enhancements:
- [ ] Progressive JPEG encoding
- [ ] WebP output format option
- [ ] Configurable compression settings via UI
- [ ] Batch compression for multiple files
- [ ] PDF compression (requires external library)
- [ ] Image quality preview before upload
