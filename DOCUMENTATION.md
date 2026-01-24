# 📱 Dompet Cerdas - Technical Documentation

> **Last Updated**: January 24, 2026  
> **Version**: 1.6.0  
> **Live URL**: https://dompas.indoomega.my.id

---

## 📋 Table of Contents
- [Changelog](#-changelog)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Features Overview](#-features-overview)
- [Database Schema](#-database-schema)
- [Key Components](#-key-components)
- [State Management](#-state-management)
- [Authentication](#-authentication)
- [Theming System](#-theming-system)
- [Deployment](#-deployment)
- [Development Commands](#-development-commands)

---

## 🛠 Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React | 19.x |
| **Build Tool** | Vite | 6.x |
| **Language** | TypeScript | 5.8 |
| **Database** | Firebase Firestore | 12.x |
| **Authentication** | Firebase Auth (Google) | 12.x |
| **File Storage** | Firebase Storage | 12.x |
| **Charts** | Recharts | 3.x |
| **Icons** | Lucide React | 0.561.x |
| **AI Service** | Google Gemini AI | 1.34.x |
| **Excel Export** | SheetJS (xlsx) | Latest |
| **File Download** | FileSaver.js | Latest |
| **Styling** | Vanilla CSS + Inline Styles | - |

---

## 📁 Project Structure

```
dompet_cerdas/
├── App.tsx                    # Main app component, routing, state management
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── firebase.ts                # Firebase configuration & initialization
├── types.ts                   # TypeScript type definitions
├── constants.ts               # App constants (colors, icons, initial data)
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
│
├── components/
│   ├── AuthLogin.tsx          # Google login page
│   ├── Dashboard.tsx          # Main dashboard with summary & charts
│   ├── TransactionList.tsx    # Transaction history with filters & attachment preview
│   ├── TransactionForm.tsx    # Add/Edit transaction modal with loading states
│   ├── CategoryManager.tsx    # CRUD categories
│   ├── CategoryFormModal.tsx  # Reusable category add/edit modal
│   ├── SimulationManager.tsx  # Budget simulation with edit feature
│   ├── Settings.tsx           # App settings (theme, delete data, Excel export)
│   ├── ConfirmDialog.tsx      # Reusable confirmation dialog
│   ├── NotificationModal.tsx  # Centered popup notifications (success/error/warning/loading)
│   ├── Toast.tsx              # Standalone toast notification component
│   └── IconDisplay.tsx        # Dynamic Lucide icon renderer
│
├── contexts/
│   └── ThemeContext.tsx       # Theme provider (light/dark mode)
│
├── services/
│   └── geminiService.ts       # AI financial analysis service
│
├── utils/
│   ├── excelExport.ts         # Excel export utility with Data URL approach
│   ├── fileCompression.ts     # Image compression utility
│   └── README.md              # Utils documentation
│
├── public/                    # Static assets (icons, manifest)
│   ├── icon-512.png           # App icon (512x512)
│   ├── icon-192.png           # App icon (192x192)
│   ├── apple-touch-icon.png   # iOS home screen icon
│   ├── favicon-32.png         # Browser tab icon
│   ├── favicon-16.png         # Browser tab icon (small)
│   └── manifest.json          # PWA manifest configuration
│
└── dist/                      # Production build output (committed for deployment)
```

---

## ✨ Features Overview

### 1. 🏠 Dashboard
- **Balance summary**: Total income, expense, current balance
- **Pie chart**: Expense breakdown by category
- **Recent transactions**: Last 10 transactions sorted by creation time (newest first)
- **Transaction count**: Shows "Menampilkan X dari Y transaksi"
- **Version display**: App version shown in header (e.g., "v1.4.0")

### 2. 📋 Transaksi (Transactions)
- **CRUD operations**: Add, view, edit, delete transactions
- **Filters**: By month, by date range
- **Grouping**: Transactions grouped by date
- **Smart sorting**: Within each date group, sorted by creation time (newest first)
- **Attachments**: Support for image (JPG, PNG, GIF, WEBP) and PDF uploads
  - Image compression before upload
  - Proper attachment icons (Image/FileText)
  - Attachment cleanup on delete
  - **Loading indicator**: Shows spinner while loading attachment preview
- **Loading states**: Visual feedback during save with progress messages
- **Popup notifications**: Centered modal notifications for all actions
- **Red delete button**: Solid red delete button by default (no hover required)
- **Long-press edit**: Mobile-friendly edit via long press
- **Quick add category**: Add new category directly from transaction form

### 3. 🎯 Simulasi (Simulation)
- **Budget simulation**: Create "what-if" scenarios
- **Multiple simulations**: Can have multiple simulation sets
- **Edit simulation items**: Full edit capability with modal form
  - Edit name, amount, type, and category
  - Pre-filled form with existing data
  - Changes saved to Firestore immediately
- **Add item popup**: Add new items via popup modal (consistent UX)
- **Apply to real**: Convert simulation items to real transactions
- **Balance preview**: See projected balance after simulation
- **Improved layout**: Category as main text, item name as secondary, price displayed below

### 4. 📁 Master Kategori (Categories)
- **CRUD operations**: Add, edit, delete categories
- **Separated view**: Income and Expense categories displayed in separate sections
- **Icon selection**: 150+ Lucide icons available
- **Color picker**: 8 preset colors
- **Type classification**: Income or Expense
- **Reusable modal**: Same form used in CategoryManager and TransactionForm

### 5. 🤖 Analisis AI
- **Gemini AI integration**: Financial advice based on spending patterns
- **Spending analysis**: Categories breakdown and trends
- **Recommendations**: Personalized saving tips

### 6. ⚙️ Pengaturan (Settings)
- **Theme toggle**: Light/Dark mode with persistence
- **Excel Export**: Export transactions to Excel file
  - Export by date range (Current Month, Custom Range, All Data)
  - File size validation (max 10MB)
  - Proper filename: `Transaksi_YYYY-MM-DD_YYYY-MM-DD.xlsx`
  - Auto-format currency and summary rows
  - Data URL approach for reliable downloads
- **Delete all data**: Clear all transactions with confirmation
- **Account info**: Display logged-in user
- **Cache busting**: Auto-updates in production via content hashing

---

## 🗄 Database Schema

### Firebase Firestore Structure

```
users/
└── {userId}/
    ├── categories/
    │   └── {categoryId}/
    │       ├── id: string
    │       ├── name: string
    │       ├── type: "INCOME" | "EXPENSE"
    │       ├── icon: string (Lucide icon name)
    │       └── color: string (hex color)
    │
    ├── transactions/
    │   └── {transactionId}/
    │       ├── id: string
    │       ├── amount: number
    │       ├── date: string (YYYY-MM-DD)
    │       ├── description: string
    │       ├── categoryId: string
    │       ├── createdAt: string (ISO timestamp)
    │       └── attachment?: {
    │           ├── url: string
    │           ├── path: string
    │           ├── type: "image" | "pdf"
    │           ├── name: string
    │           └── size: number
    │       }
    │
    └── simulations/
        └── {simulationId}/
            ├── id: string
            ├── title: string
            ├── createdAt: string
            └── items: [
                {
                    id: string,
                    name: string,
                    amount: number,
                    type: "INCOME" | "EXPENSE",
                    categoryId: string
                }
            ]
```

---

## 🧩 Key Components

### App.tsx (Main Component)
- **Role**: Root component, handles routing and global state
- **State**: User auth, transactions, categories, simulations
- **Firestore Listeners**: Real-time data sync with onSnapshot
- **Key Functions**:
  - `addTransaction()`, `updateTransaction()`, `deleteTransaction()`
  - `addCategory()`, `updateCategory()`, `deleteCategory()`
  - `createSimulation()`, `deleteSimulation()`, `addSimulationItem()`

### ConfirmDialog.tsx
- **Reusable modal** for delete confirmations
- **Types**: danger, warning, success, info
- **User confirmation** with text input validation

### Toast.tsx
- **Standalone toast component** for notifications
- **Auto-dismiss** after 3 seconds
- **Types**: success, error, info
- **Position**: Top-right with smooth animations

### ThemeContext.tsx
- **Theme Provider**: Wraps entire app
- **Persistence**: Saves preference to localStorage
- **Colors**: Full color palette for light/dark modes

### IconDisplay.tsx
- **Dynamic icon rendering** from Lucide React
- **Fallback**: Shows HelpCircle if icon not found
- **Props passthrough**: Size, color, className, style

---

## 🔐 Authentication

- **Provider**: Firebase Authentication
- **Method**: Google Sign-In only
- **Flow**:
  1. User clicks "Masuk dengan Google"
  2. Firebase handles OAuth popup
  3. On success, user data stored in `auth.currentUser`
  4. All Firestore queries scoped to `users/{userId}/`

```typescript
// Key auth functions in App.tsx
onAuthStateChanged(auth, (currentUser) => {
  setUser(currentUser);
});

signOut(auth); // Logout
```

---

## 🎨 Theming System

### Theme Structure (ThemeContext.tsx)
```typescript
interface Theme {
  name: string;
  colors: {
    bgPrimary: string;      // Main background
    bgCard: string;         // Card backgrounds
    bgHover: string;        // Hover states
    bgMuted: string;        // Muted backgrounds
    textPrimary: string;    // Main text
    textSecondary: string;  // Secondary text
    textMuted: string;      // Muted text
    border: string;         // Border color
    accent: string;         // Primary accent (indigo)
    accentLight: string;    // Light accent bg
    accentText: string;     // Text on accent
    income: string;         // Green for income
    incomeBg: string;       // Light green bg
    expense: string;        // Red for expense
    expenseBg: string;      // Light red bg
    sidebarBg: string;      // Sidebar background
    sidebarText: string;    // Sidebar text
    sidebarActive: string;  // Active menu item
    sidebarActiveBg: string;// Active item bg
  }
}
```

### Usage
```typescript
const { theme, isDark, toggleTheme } = useTheme();
<div style={{ backgroundColor: theme.colors.bgCard }}>
```

---

## 🚀 Deployment

### Infrastructure
- **Server**: Google Cloud VM (Debian)
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **CDN/Proxy**: Cloudflare (SSL Mode: Full)
- **Domain**: dompas.indoomega.my.id

### Deployment Flow
```
Local: npm run build → git push
   ↓
Server: git pull → Files updated via symlink
```

### Server Paths
```
~/dompet-cerdas/              # Git repository
~/dompet-cerdas/dist/         # Production build
   ↓ (symlink)
/var/www/dompas.indoomega.my.id/  # Nginx root
```

### Nginx Config Location
```
/etc/nginx/sites-available/dompas.indoomega.my.id
```

---

## 💻 Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔑 Environment Variables

### Required for AI Feature
```env
GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Config (in firebase.ts)
```typescript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "expensetracker-test-1.firebaseapp.com",
  projectId: "expensetracker-test-1",
  storageBucket: "expensetracker-test-1.firebasestorage.app",
  // ... other config
};
```

---

## 📝 Important Notes

1. **No Backend Server**: App is fully client-side, uses Firebase directly
2. **Real-time Sync**: Firestore listeners update UI automatically
3. **Responsive Design**: Mobile-first with desktop sidebar
4. **PWA Ready**: Includes manifest.json and app icons for home screen installation
5. **Build Committed**: `dist/` folder is in git for low-RAM server deployment
6. **Indonesian UI**: All user-facing text in Bahasa Indonesia
7. **Mobile Navigation**: Bottom nav (4 items) + Header quick access (Simulasi & AI)

---

## 📱 Mobile Navigation Layout

### Bottom Navigation Bar (4 items + FAB)
| Position | Icon | Label | View |
|----------|------|-------|------|
| Left 1 | Home | Home | DASHBOARD |
| Left 2 | BookOpen | Riwayat | TRANSACTIONS |
| Center | Plus | (FAB) | Add Transaction Modal |
| Right 1 | Briefcase | Kategori | CATEGORIES |
| Right 2 | Settings | Setting | SETTINGS |

### Header Quick Access (Mobile Only)
| Element | Icon | Function |
|---------|------|----------|
| AI Button | Zap (⚡) | Opens AI_ADVISOR view |
| Simulasi Button | Calculator | Opens SIMULATION view |
| User Avatar | - | Shows logged-in user |
| Logout Button | LogOut | Signs out user |

---

## 🎨 App Icons & PWA

### Icon Files (in `/public/`)
| File | Size | Purpose |
|------|------|----------|
| `icon-512.png` | 512x512 | PWA install icon (high-res) |
| `icon-192.png` | 192x192 | PWA icon standard |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `favicon-32.png` | 32x32 | Browser tab (retina) |
| `favicon-16.png` | 16x16 | Browser tab (standard) |
| `manifest.json` | - | PWA configuration |

### PWA Features
- **Theme Color**: #4F46E5 (Indigo)
- **Display Mode**: Standalone
- **Orientation**: Portrait
- **Installable**: Yes (via browser "Add to Home Screen")

---

## 🐛 Known Issues / Limitations

1. **index.css warning**: Build shows warning about missing `/index.css` - cosmetic only
2. **Large bundle**: ~1.4MB JS bundle (consider code splitting for optimization)
3. **Limited offline support**: Basic asset caching (v1.4.0), full PWA with offline data planned
4. **Single currency**: Only supports IDR (Indonesian Rupiah)

---

## 📞 Quick Reference

| Need to... | Look at... |
|------------|------------|
| Add new feature | `App.tsx` for state, `components/` for UI |
| Change theme colors | `contexts/ThemeContext.tsx` |
| Add new icon | `types.ts` IconName type, `constants.ts` AVAILABLE_ICONS |
| Modify database | Firebase Console + `App.tsx` Firestore queries |
| Update deployment | `git push` then `git pull` on server |
| Add new category fields | `types.ts` Category interface |
| Change AI prompts | `services/geminiService.ts` |

---

## 🚀 Upcoming Features

### 1. 💾 Backup & Restore Transaksi
Fitur untuk backup dan restore data transaksi pengguna.

**Backup Features:**
- Export semua transaksi ke file JSON
- Include metadata (categories, user info, timestamp)
- Secure file format dengan validasi checksum
- Nama file dengan timestamp untuk versioning

**Restore Features:**
- Upload file backup JSON
- **Validasi format file** sebelum restore:
  - Cek struktur JSON sesuai schema
  - Validasi required fields (id, amount, date, categoryId, description)
  - Cek format tanggal (YYYY-MM-DD)
  - Validasi tipe data (amount = number, dll)
  - Cek referensi categoryId valid
- Preview data sebelum restore
- Opsi: Replace all / Merge with existing

**Technical Approach:**
```typescript
interface BackupFile {
  version: string;
  exportedAt: string;
  userId: string;
  transactions: Transaction[];
  categories: Category[];
  checksum: string;
}

// Validation schema
function validateBackupFile(data: unknown): ValidationResult {
  // Check structure, types, required fields
  // Return { valid: boolean, errors: string[] }
}
```

### 2. 📱 Progressive Web App (PWA) Enhancement
Upgrade aplikasi menjadi full PWA dengan Service Worker untuk pengalaman yang lebih baik.

**Service Worker Features:**
- **Auto-update Detection**
  - Detect new version available
  - Notify user dengan toast/banner
  - Option: "Update Now" atau "Update Later"
  - Seamless update tanpa reload manual

- **Background Sync**
  - Queue transaksi saat offline
  - Auto-sync ketika online kembali
  - Retry failed uploads
  - Status indicator untuk pending sync

- **Offline Support**
  - Cache static assets (HTML, CSS, JS)
  - Cache Firebase data dengan IndexedDB
  - Offline-first strategy
  - "You're offline" indicator

- **App Install Prompt**
  - Custom install banner
  - "Add to Home Screen" prompt
  - Standalone app experience
  - App icon & splash screen

**Technical Approach:**
```typescript
// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showUpdateNotification();
          }
        });
      });
    });
}

// Offline Detection
window.addEventListener('online', syncPendingTransactions);
window.addEventListener('offline', showOfflineIndicator);
```

**Benefits:**
- ✅ Better user experience (faster load, offline access)
- ✅ Auto-updates tanpa user intervention
- ✅ Installable sebagai native app
- ✅ Reduced server load (caching)
- ✅ Better engagement (push notifications ready)

**Libraries:**
- Workbox (Google's PWA toolkit)
- idb (IndexedDB wrapper)

### 3. 💬 Telegram Bot Integration
Integrasi dengan Telegram untuk input dan monitoring transaksi via chat.

**Planned Features:**
- **Quick Input Transaksi via Chat**
  - Format: `/add 50000 makan siang` atau `/tambah 150000 transport`
  - Auto-detect kategori berdasarkan keyword
  - Konfirmasi transaksi berhasil ditambahkan

- **Query Transaksi**
  - `/today` - Transaksi hari ini
  - `/week` - Transaksi minggu ini
  - `/month` - Transaksi bulan ini
  - `/range 2026-01-01 2026-01-15` - Custom range

- **Summary Report**
  - `/summary` - Ringkasan keuangan
  - Total income, expense, balance
  - Top spending categories

- **Account Linking**
  - Link Telegram account ke DompetCerdas account
  - Secure token-based authentication
  - One-time setup via web app

**Technical Considerations:**
- Bot API: Telegram Bot API
- Backend: Firebase Cloud Functions (atau Node.js server)
- Database: Existing Firestore structure
- Auth: Telegram user ID linked to Firebase UID

*Detail implementation akan dibahas lebih lanjut.*

---

## 📝 Changelog

### Version 1.6.0 (January 24, 2026)

**✨ New Features:**
- 🛡️ **Category Similarity Validation**
  - **Offline Check**: Prevents duplicate or redundant categories (e.g., "Food" vs "Makanan")
  - **Synonym Detection**: Built-in dictionary for common financial terms
  - **Typo Detection**: Finds similar names to prevent accidental duplicates (e.g., "Makann" vs "Makan")
  - **Warning UI**: Shows a list of conflicting categories before saving
- 🎯 **Edit Simulation Items** - Full edit capability for simulation items
  - Edit button (pencil icon) on each simulation item
  - Modal form with pre-filled data (name, amount, type, category)
  - Changes saved to Firestore immediately
  - Simulation totals auto-update after edit
- 📝 **Add Item Popup Modal** - Add simulation items via popup (consistent with edit)
  - Replaced inline form with popup modal
  - "+ Tambah Item ke Simulasi" button with dashed border
  - Same form design as edit modal

**🎨 UI/UX Improvements:**
- 📐 **Simulation Item Layout** - Better visual hierarchy
  - Price displayed below item (not beside)
  - Category as main text (bold, large)
  - Item name as secondary info (small, muted)
  - Cleaner vertical layout
- 🔴 **Red Delete Button** - Delete button now red by default
  - Solid red (#ef4444) without hover
  - Darker red (#dc2626) on hover
  - Applied to both desktop and mobile views
- ⏳ **Attachment Loading** - Loading indicator for attachment preview
  - Spinner animation while loading image/PDF
  - "Memuat lampiran..." text
  - Loading positioned in content area (not covered by header)
  - Auto-hides when attachment fully loaded

**🌐 Internationalization:**
- 🇮🇩 **100% Indonesian UI** - All English text translated
  - Navigation: "Home" → "Beranda", "Setting" → "Pengaturan"
  - Simulation: "Mode Sandbox" → "Mode Simulasi", "X Item" → "X Transaksi", "Add Real" → "Tambah ke Utama"
  - Settings: "Toggle theme" → "Ganti tema", "Export ke Excel" → "Ekspor ke Excel"

**Technical Changes:**
- Added `updateSimulationItem` handler in App.tsx
- Enhanced SimulationManager.tsx with edit state and modal
- Updated TransactionForm.tsx delete button styling
- Added loading state to AttachmentModal in TransactionList.tsx
- Translated UI text across App.tsx, SimulationManager.tsx, Settings.tsx

**Files Changed:** 7 files (+922 lines, -436 lines)

---

### Version 1.5.0 (January 8, 2026)

**🎨 Major UX Overhaul:**
- 📱 **Full Screen Forms on Mobile** - Better space utilization and native app feel
- ✨ **Beautiful Gradient FAB** - Floating Action Button with purple gradient and glow effect
- 🎬 **Smooth Animations** - Slide-up for mobile, fade-in for desktop
- ⌨️ **Keyboard Issue Fixed** - FAB always visible above keyboard on mobile
- 🔙 **Native Navigation** - Back button with arrow icon on mobile
- 🎯 **Improved Button Placement** - Delete button moved to header for easy access

**Mobile Experience (< 768px):**
- Full screen form layout instead of cramped modal
- Smooth slide-up animation from bottom (0.3s ease-out)
- Gradient FAB (64x64px) with purple gradient (#667eea → #764ba2)
- Soft glow shadow effect for premium look
- Touch feedback with scale animation (0.9x on press)
- Back button (←) in header for intuitive navigation
- Delete button in header (doesn't take footer space)
- Bottom padding (pb-24) to prevent content hidden by FAB
- No more keyboard covering buttons issue!

**Desktop Experience (≥ 768px):**
- Centered modal with backdrop blur
- Fade-in animation with scale effect (0.2s)
- Traditional footer with action buttons
- Close button (X) in header
- Delete button in footer (when editing)
- Hover effects on all buttons

**Design Improvements:**
- **Gradient FAB**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Glow Shadow**: `0 10px 30px rgba(102, 126, 234, 0.5)`
- **Touch Feedback**: Scale to 0.9x on touch, back to 1.0x on release
- **Responsive Breakpoint**: md (768px) for mobile/desktop switch
- **Consistent Pattern**: Both TransactionForm and CategoryFormModal use same design

**Technical Changes:**
- Added CSS animations in `index.html`:
  - `@keyframes slide-up` for mobile entrance
  - `@keyframes fade-in` for desktop entrance
- Updated TransactionForm.tsx:
  - Responsive classes with Tailwind breakpoints
  - Touch event handlers (onTouchStart, onTouchEnd)
  - Conditional rendering for mobile/desktop layouts
- Updated CategoryFormModal.tsx:
  - Same full screen + FAB pattern
  - Consistent with TransactionForm
- Fixed IconDisplay color prop usage (use style instead)

**Benefits:**
- ✅ More screen space on mobile (full viewport)
- ✅ No keyboard issues (FAB always visible)
- ✅ Better visual appeal (gradient + animations)
- ✅ Native app feel (slide-up + back button)
- ✅ Consistent UX across both forms
- ✅ Improved accessibility (larger touch targets)

**Files Changed:** 3 files (+150 lines, -50 lines)

---

### Version 1.4.0 (January 4, 2026)

**🎉 Major Features:**
- 📊 **Excel Export** - Export transactions to Excel with date range selection
- 💫 **Transaction UX Improvements** - Loading states, progress messages, and toast notifications
- 🔄 **Auto Cache Busting** - Production deployments auto-update without manual cache clearing
- 🖼️ **Enhanced Attachment Icons** - Proper icons for images and PDFs
- 🏷️ **Version Display** - App version shown in header for transparency
- 📲 **PWA Auto-Update** - Automatic reload when new version is detected (for Add to Home Screen users)

**Excel Export Features:**
- Export by date range (Current Month, Custom Range, All Data)
- Data URL approach for reliable filename preservation
- File size validation (max 10MB) with user-friendly warnings
- Auto-format currency and summary rows
- Proper filename format: `Transaksi_YYYY-MM-DD_YYYY-MM-DD.xlsx`
- Located in Settings page

**Transaction Improvements:**
- Added loading states during transaction save
- Progress messages for attachment uploads ("Mengupload lampiran...", "Menyimpan transaksi...")
- Toast notifications for success/error feedback
- Disabled form during submission to prevent double-submit
- Created standalone `Toast.tsx` component for reusable notifications

**Icon Enhancements:**
- `Image` icon (green) for photo attachments
- `FileText` icon (orange) for PDF attachments
- `LogOut` icon for logout button
- `Download` and `Database` icons for export feature

**Attachment Management:**
- Enhanced cleanup on delete/replace operations
- Added legacy attachment format support
- Proper MIME types and error handling
- Verified Firebase Storage deletion in all scenarios

**Cache Busting:**
- Vite build config with content hashing for all assets
- HTML meta tags for no-cache policy
- Auto-updates in production without manual intervention
- Development: Use incognito or hard refresh

**Technical Changes:**
- Added `xlsx` (SheetJS) for Excel generation
- Added `file-saver` for reliable downloads
- Created `/utils/excelExport.ts` utility
- Updated Vite config with build optimization
- Enhanced error handling across components

**Files Changed:** 12 files (+948 lines, -94 lines)

---

### Version 1.3.0 (January 3, 2026)
**UX Improvements:**
- 🎯 **Header Action Buttons**: Moved primary action buttons to modal headers for better accessibility
  - Save/Update and Delete buttons now in header (no need to scroll)
  - Consistent button sizing across all forms (px-3 py-2 padding)
  - All icons standardized to size 16
  - Close button icon-only to save space
  - Clear text labels on action buttons ("Simpan", "Update", "Hapus")
- ✨ **Smart File Compression**: Enhanced compression logic
  - Skip compression for files < 100KB (already optimal)
  - Use original file if compressed version is larger
  - No more negative compression ratios
  - User-friendly feedback messages

**Technical Changes:**
- Updated `TransactionForm.tsx`:
  - Moved action buttons to header with form attribute
  - Standardized button styling and icon sizes
  - Removed redundant bottom action buttons
- Updated `CategoryFormModal.tsx`:
  - Consistent header button layout
  - Matching styling with TransactionForm
- Enhanced `utils/fileCompression.ts`:
  - Added minimum file size check (100KB threshold)
  - Compare compressed vs original size
  - Return original if compression ineffective

**Design Consistency:**
- All modal headers follow same pattern: Title + Actions + Close
- Button hierarchy: Delete (subtle) → Save (prominent) → Close (subtle)
- Uniform spacing and sizing across all interactive elements

### Version 1.2.1 (January 3, 2026)
**New Features:**
- 🗜️ **File Compression**: Automatic image compression before upload to Firebase Storage
  - Images automatically resized to max 1920x1920px
  - JPEG compression at 80% quality
  - Reduces storage costs and improves upload speed
  - Shows compression ratio feedback to users (e.g., "Gambar dikompres 65% (2.5 MB → 875 KB)")
- ✅ **PDF Validation**: Enhanced PDF file size validation (max 2MB)
- 📦 **Storage Optimization**: Increased initial upload limit to 10MB (before compression)

**Technical Changes:**
- Created new utility: `utils/fileCompression.ts`
  - `compressImage()`: Canvas-based image compression with aspect ratio preservation
  - `validatePdfSize()`: PDF size validation
  - `processFileForUpload()`: Main file processing function
  - `formatBytes()`: Human-readable file size formatter
- Updated `TransactionForm.tsx`:
  - Async file handling with compression
  - Compression feedback UI with success message
  - Better error handling for file processing

### Version 1.2.0 (January 3, 2026)
**Improvements:**
- ✨ **Transaction Sorting**: Transactions now sorted by `createdAt` timestamp (newest first) within each date group in History view
- ✨ **Dashboard Enhancement**: Increased recent transactions display from 5 to 10 items with smart sorting
- ✨ **Category Organization**: Income and Expense categories now displayed in separate sections with visual indicators
- ✨ **Quick Category Creation**: Added shortcut to create new categories directly from transaction form
- 🔧 **Code Refactoring**: Extracted `CategoryFormModal` as reusable component (DRY principle)
- 📊 **Better UX**: Added transaction count display in Dashboard ("Menampilkan X dari Y transaksi")

**Technical Changes:**
- Added `createdAt` field to Transaction interface
- Created new component: `CategoryFormModal.tsx`
- Updated `TransactionList.tsx`, `Dashboard.tsx`, `CategoryManager.tsx`, `TransactionForm.tsx`
- Improved sorting logic across all transaction displays

### Version 1.1.0 (January 2, 2026)
**Features:**
- 📱 **Mobile Navigation**: Improved bottom navigation with "Kategori" menu
- 🚀 **Quick Access**: Added header buttons for "Simulasi" and "AI Analisis" on mobile
- 🎨 **PWA Support**: Added app icons and manifest for installable web app
- 📁 **File Attachments**: Support for image and PDF attachments in transactions

---

*This documentation is designed to help AI agents and developers quickly understand the project structure and make changes efficiently.*
