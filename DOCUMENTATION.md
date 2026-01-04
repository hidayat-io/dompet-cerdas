# 📱 Dompet Cerdas - Technical Documentation

> **Last Updated**: January 4, 2026  
> **Version**: 1.3.0  
> **Live URL**: https://dompas.indoomega.my.id

---

## 📋 Table of Contents
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
│   ├── TransactionList.tsx    # Transaction history with filters
│   ├── TransactionForm.tsx    # Add/Edit transaction modal with loading states
│   ├── CategoryManager.tsx    # CRUD categories
│   ├── CategoryFormModal.tsx  # Reusable category add/edit modal
│   ├── SimulationManager.tsx  # Budget simulation feature
│   ├── Settings.tsx           # App settings (theme, delete data, Excel export)
│   ├── ConfirmDialog.tsx      # Reusable confirmation dialog
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
│   └── excelExport.ts         # Excel export utility with Data URL approach
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

### 2. 📋 Transaksi (Transactions)
- **CRUD operations**: Add, view, edit, delete transactions
- **Filters**: By month, by date range
- **Grouping**: Transactions grouped by date
- **Smart sorting**: Within each date group, sorted by creation time (newest first)
- **Attachments**: Support for image (JPG, PNG, GIF, WEBP) and PDF uploads
  - Image compression before upload
  - Proper attachment icons (Image/FileText)
  - Attachment cleanup on delete
- **Loading states**: Visual feedback during save with progress messages
- **Toast notifications**: Success/error feedback for all operations
- **Long-press edit**: Mobile-friendly edit via long press
- **Quick add category**: Add new category directly from transaction form

### 3. 🎯 Simulasi (Simulation)
- **Budget simulation**: Create "what-if" scenarios
- **Multiple simulations**: Can have multiple simulation sets
- **Apply to real**: Convert simulation items to real transactions
- **Balance preview**: See projected balance after simulation

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
- **Toast component** for success/error notifications
- **Auto-dismiss** toast after 3 seconds

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
3. **No offline support**: Requires internet connection
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

---

## 📝 Changelog

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
