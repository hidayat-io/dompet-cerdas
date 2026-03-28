# 📚 DOKUMENTASI LENGKAP - Dompet Cerdas v2.6.0

**Status**: ✅ Fully Documented  
**Last Updated**: March 28, 2026  
**Version**: 2.6.0  
**Live URL**: https://dompas.indoomega.my.id

---

## 🎯 Ringkasan Eksekutif

**Dompet Cerdas** adalah aplikasi manajemen keuangan pribadi dengan integrasi Telegram bot AI-powered. Pengguna dapat melacak keuangan melalui:
- 📱 **Web App**: Dashboard, entry manual, analytics, rencana, anggaran, hutang piutang
- 🤖 **Telegram Bot**: Receipt scanning, natural language queries, multi-transaksi, voice note, preview + confirm
- 🧠 **AI Integration**: Google Gemini untuk OCR receipt dan analisis keuangan

**Key Features**:
- ✅ Multi-`Akun Keuangan` untuk memisahkan data pribadi, keluarga, bisnis, atau bersama
- ✅ Dashboard dengan pie chart breakdown
- ✅ Receipt scanning via Telegram (Vision API)
- ✅ Natural language queries ("berapa pengeluaran hari ini?")
- ✅ Preview + confirm sebelum transaksi Telegram disimpan
- ✅ Telegram `/akun` untuk cek/ganti akun aktif bot
- ✅ Voice note Telegram untuk transaksi
- ✅ Rencana transaksi, Anggaran, dan Hutang Piutang
- ✅ Onboarding ringan untuk user baru
- ✅ AI financial advisor dengan rekomendasi hemat
- ✅ Web AI analysis dengan 3 mode + backend quota per user
- ✅ Excel export dengan date range selection
- ✅ Multi-category dengan 150+ icons
- ✅ Secure account linking via token
- ✅ PWA-ready dengan manifest

---

## 📋 Daftar File Dokumentasi

| File | Deskripsi |
|------|-----------|
| **README.md** | Quick start, features overview, deployment instructions |
| **DOKUMENTASI_LENGKAP.md** | Canonical project documentation dan indeks dokumentasi |
| **docs/PRODUCT_VOCABULARY.md** | Istilah final yang dipakai user-facing |
| **docs/TELEGRAM_INTEGRATION.md** | Telegram bot technical docs dengan NLU & Vision API |
| **TESTING.md** | Testing guide dengan regression checklist bot |
| **deploy/DEPLOY_GUIDE.md** | Deployment flow + smoke check hosting |
| **landing-page/DOCUMENTATION.md** | Landing page customization guide |
| **utils/README.md** | File compression utility documentation |

---

## 🏗️ Struktur Proyek

```
dompet_cerdas/
├── App.tsx                          # Root component, state management, routing
├── index.tsx                        # React entry point
├── index.html                       # HTML template
├── firebase.ts                      # Firebase config & initialization
├── types.ts                         # TypeScript interfaces & types
├── constants.ts                     # App constants, colors, icons
├── vite.config.ts                   # Vite build configuration
│
├── components/
│   ├── AuthLogin.tsx               # Google login UI
│   ├── Dashboard.tsx               # Analytics & summary view
│   ├── BudgetManager.tsx           # Anggaran berbasis budget plan
│   ├── DebtManager.tsx             # Hutang Piutang
│   ├── OnboardingModal.tsx         # Panduan singkat user baru
│   ├── TransactionList.tsx         # Transaction history with filters
│   ├── TransactionForm.tsx         # Add/edit transaction modal
│   ├── CategoryManager.tsx         # CRUD categories
│   ├── CategoryFormModal.tsx       # Reusable category modal
│   ├── PlanManager.tsx             # Rencana pemasukan/pengeluaran
│   ├── Settings.tsx                # Theme, export, delete data
│   ├── ConfirmDialog.tsx           # Confirmation dialog component
│   ├── NotificationModal.tsx       # Centered notifications
│   ├── Toast.tsx                   # Toast notifications
│   ├── LinkTelegram.tsx            # Telegram account linking page
│   └── IconDisplay.tsx             # Dynamic Lucide icon renderer
│
├── contexts/
│   └── ThemeContext.tsx            # Light/dark theme provider
│
├── services/
│   ├── accountService.ts           # Account-scoped Firestore helpers
│   └── geminiService.ts            # Gemini AI integration
│
├── utils/
│   ├── accountLabels.ts            # Label Akun Keuangan & filename helpers
│   ├── budget.ts                   # Normalisasi anggaran dan ringkasan
│   ├── excelExport.ts              # Excel export with date range
│   ├── fileCompression.ts          # Image compression before upload
│   ├── categoryValidation.ts       # Category validation logic
│   └── README.md                   # Utils documentation
│
├── functions/                      # Firebase Cloud Functions
│   ├── src/
│   │   ├── bot/
│   │   │   ├── commands/
│   │   │   │   ├── start.ts       # /start command
│   │   │   │   └── help.ts        # /help command
│   │   │   └── index.ts           # Bot routing & initialization
│   │   ├── services/
│   │   │   ├── linkService.ts     # Token generation & validation
│   │   │   ├── nluService.ts      # Natural Language Understanding
│   │   │   ├── queryService.ts    # Firestore queries
│   │   │   ├── transactionService.ts    # Transaction management
│   │   │   ├── geminiService.ts   # Receipt analysis & AI advisor
│   │   │   ├── storageService.ts  # Firebase Storage handling
│   │   │   ├── advisorService.ts  # Financial advisor AI
│   │   │   └── responseFormatter.ts # Response formatting
│   │   └── index.ts               # Cloud Functions entry point
│   └── package.json
│
├── landing-page/                  # Marketing landing page
│   ├── index.html                 # Static HTML
│   ├── style.css                  # Vanilla CSS styling
│   └── script.js                  # Vanilla JS (hamburger, smooth scroll)
│
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── icon-512.png               # PWA icon
│   ├── icon-192.png               # PWA icon
│   ├── apple-touch-icon.png       # iOS icon
│   └── favicon-32.png             # Favicon
│
├── scripts/
│   └── hosting-smoke-check.mjs     # Smoke check hosting pasca deploy
│
├── firebase.json                  # Firebase configuration
├── .firebaserc                    # Firebase project aliases
├── firestore.rules                # Firestore security rules
├── firestore.indexes.json         # Firestore indexes
│
├── dist/                          # Production build (committed)
└── [DOKUMENTASI FILES]            # All .md files listed above
```

---

## 🔧 Tech Stack Detail

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.x | UI framework |
| **Build** | Vite | 6.x | Build tool & dev server |
| **Language** | TypeScript | 5.8 | Type safety |
| **UI Library** | Lucide React | 0.561.x | 150+ icons |
| **Charts** | Recharts | 3.x | Expense pie chart |
| **Auth** | Firebase Auth | 12.x | Google sign-in |
| **Database** | Firestore | 12.x | Real-time NoSQL DB |
| **Storage** | Firebase Storage | 12.x | Receipt images |
| **Hosting** | Firebase Hosting | - | CDN global |
| **Functions** | Cloud Functions | Node 22 | Backend serverless |
| **AI - Vision** | Gemini Vision | 2.0 Flash | Receipt OCR |
| **AI - NLU** | Gemini NLU | 2.0 Flash | Intent parsing |
| **AI - Advisor** | Gemini 2.0 Flash | 2.0 Flash | Financial insights |
| **Bot SDK** | node-telegram-bot-api | Latest | Telegram integration |
| **Excel** | ExcelJS | Latest | .xlsx export |
| **Images** | Sharp | Latest | Image compression |

---

## 📱 Fitur Utama

### 1️⃣ Dashboard (Web App)
- **Balance Summary**: Total income, expense, current balance
- **Pie Chart**: Expense breakdown by category dengan persentase
- **Recent Transactions**: Last 10 transactions grouped by date, newest first
- **Getting Started Card**: Muncul saat akun masih kosong untuk membantu user baru mulai dari langkah yang paling aman
- **Onboarding Entry Point**: Bisa buka panduan singkat langsung dari dashboard

### 2️⃣ Akun Keuangan
- **Multi-Account**: Satu user bisa punya beberapa `Akun Keuangan`
- **Active Account Context**: Semua transaksi, kategori, rencana, anggaran, dan hutang piutang scoped ke akun aktif
- **Telegram Default Account**: Bot Telegram punya akun default sendiri yang bisa berbeda dari akun aktif web
- **Migration Support**: User lama otomatis dibuatkan akun default `Pribadi`

### 3️⃣ Transaksi (Transactions)
- **CRUD**: Add, edit, delete transactions
- **Attachments**: JPG, PNG, GIF, WEBP, PDF support dengan preview
- **Image Compression**: Auto-compress images sebelum upload
- **Filters**: By month, by date range, by category
- **Grouping**: Grouped by date dengan smart sorting
- **Search**: Search by description
- **Mobile UX**: Filter panel toggle pada mobile

### 4️⃣ Rencana
- **Multiple Plans**: Buat beberapa rencana sekaligus
- **Edit Items**: Full edit dengan modal form
- **Tanggal Rencana**: Set tanggal rencana per item bila diperlukan
- **Status Item**: Direncanakan, Sudah Dicatat, atau Dibatalkan
- **Balance Preview**: Lihat proyeksi saldo dari item yang masih aktif
- **Balance Mode Toggle**: Pilih memakai total saldo atau saldo bulan berjalan
- **Jadikan Transaksi**: Ubah item rencana jadi transaksi nyata

### 5️⃣ Master Kategori (Categories)
- **CRUD**: Add, edit, delete categories
- **Separated Views**: Income vs Expense categories
- **Icon Selection**: 150+ Lucide icons
- **Color Picker**: 8 preset colors
- **Type Classification**: Income or Expense
- **Reusable Modal**: Consistent UX across app

### 6️⃣ Anggaran
- **Budget Plan Bulanan**: User membuat anggaran yang ingin dipantau, bukan semua kategori sekaligus
- **Multi-Kategori**: Satu anggaran bisa berisi satu atau beberapa kategori
- **Progress Tracking**: Lihat sudah terpakai, sisa anggaran, dan anggaran yang melebihi batas
- **Copy Previous Month**: Salin anggaran bulan lalu ke bulan aktif
- **Dashboard Summary**: Ringkasan anggaran bulan berjalan langsung di dashboard
- **Detail Anggaran**: Lihat transaksi apa saja yang masuk ke satu anggaran
- **Account Scoped**: Tiap Akun Keuangan punya anggaran sendiri

### 7️⃣ AI Financial Advisor
- **Gemini Integration**: Deep financial analysis
- **Three Web Analysis Modes**:
  1. Financial Health: Overall cashflow health & stability
  2. Spending Pattern: Dominant categories, frequency, and outliers
  3. Savings Advice: Data-bounded savings opportunities
- **Smart Sampling**: Top expenses + recent + diverse categories
- **Backend Quota**: 20s cooldown, 12 analyses/day, 30,000 tokens/day per user
- **Scope Limited**: Only user's transaction data

### 8️⃣ Hutang Piutang
- **Catat Hutang & Piutang**: Simpan hutang dan piutang sebagai modul terpisah per Akun Keuangan
- **Progress Pembayaran**: Lihat nominal awal, sudah dibayar, dan sisa yang belum selesai
- **Riwayat Pembayaran**: Setiap pembayaran tersimpan dengan tanggal dan catatan
- **Status Sederhana**: Belum lunas, bayar sebagian, dan lunas
- **Jatuh Tempo**: Tampilkan catatan yang sudah lewat jatuh tempo
- **Modal Form**: Tambah, edit, catat pembayaran, dan tandai lunas via popup modal
- **Separate Tracking**: Saat ini modul ini **tidak otomatis mengubah saldo** karena masih diposisikan sebagai tracker terpisah dari transaksi utama

### 9️⃣ Excel Export
- **Date Range**: Current Month, Custom Range, All Data
- **Auto-Format**: Currency & summary rows
- **Filename**: `Transaksi_YYYY-MM-DD_YYYY-MM-DD.xlsx`
- **File Validation**: Max 10MB
- **Blob Download**: Browser-native download via `writeBuffer()`
- **Library**: ExcelJS with lazy-loaded export chunk

### 🔟 Security & Dependency Hardening
- **Functions Runtime**: Upgraded to Node.js 22
- **Web AI**: Moved to callable Cloud Function for quota enforcement
- **Root Audit**: Frontend dependency audit cleaned after replacing SheetJS
- **Backend Note**: Remaining audit findings are tied to `node-telegram-bot-api` transitive dependencies

### 1️⃣1️⃣ Theme System (Light/Dark)
- **Toggle**: Dark/Light mode switch
- **Persistence**: Saved to localStorage
- **Full Palette**: Complete color scheme per theme
- **Components**: All components theme-aware

---

## 🤖 Telegram Bot Features

### Commands
- **`/start`**: Welcome & account linking flow
- **`/help`**: Usage guide & examples
- **`/akun`**: Menampilkan akun Telegram aktif dan opsi ganti akun
- **`/unlink`**: Disconnect account (optional)

### Natural Language Queries
User dapat query dengan bahasa Indonesia alami:

#### 💰 Expense Queries
- "berapa pengeluaran hari ini?"
- "pengeluaran minggu ini ada berapa?"
- "total pengeluaran 7 hari terakhir"
- "detail pengeluaran kemarin"
- "pengeluaran bulan ini vs bulan lalu"

#### 🔍 Category Queries
- "kategori apa yang paling boros?"
- "rincian kategori Food bulan ini"
- "detail kategori Bill minggu ini"
- "kategori apa aja?" (List categories)

#### 🤖 AI Advisor Queries 🆕
- "gimana keuanganku bulan ini?"
- "analisa pengeluaran aku"
- "tips hemat bulan depan"
- "saran biar lebih hemat"
- "kategori mana yang bisa dikurangi?"

#### 📸 Receipt Features
- **Photo Upload**: Send receipt photo
- **AI OCR**: Auto-extract merchant, amount, date, items
- **Category Suggestion**: AI suggests category
- **Manual Verification**: Confirm or edit before saving
- **Document Format**: Also supports JPG/PNG as documents (not just photos)

#### ✍️ Manual Transaction Input
- **Preview First**: Text transaction tidak auto-save
- **Single Input**: Contoh `makan siang 25rb`
- **Multi Input**: Contoh `kopi 18rb, parkir 5rb`
- **Remove Item**: Saat preview multi-transaksi, user bisa hapus item yang salah sebelum simpan

#### 🎤 Voice Input
- **Voice Note Support**: User bisa kirim voice note transaksi
- **Transcription + Preview**: Audio ditranskrip dulu, lalu ditampilkan preview untuk konfirmasi

#### ➕ Manual Entry
- "tambah 50000 makan siang"
- "catat 150000 bensin"

### Account Linking
1. User sends `/start` to bot
2. Bot generates unique token (expires 5 min)
3. Bot sends web link with token
4. User clicks link → opens web app
5. Web app validates token + Google Auth session
6. Auto-links Telegram ID to Firebase UID
7. Bot confirms successful linking

---

## 🗄️ Database Schema

### Firestore Structure

```javascript
users/
└── {userId}/
    ├── activeAccountId: string
    ├── createdAt: string
    ├── updatedAt: string
    │
    ├── accounts/
    │   └── {accountId}/
    │       ├── name: string
    │       ├── type: "PERSONAL" | "FAMILY" | "BUSINESS" | "SHARED"
    │       ├── role: "OWNER"
    │       ├── createdAt: string
    │       ├── updatedAt: string
    │       │
    │       ├── categories/
    │       │   └── {categoryId}/
    │       │       ├── id: string
    │       │       ├── name: string
    │       │       ├── type: "INCOME" | "EXPENSE"
    │       │       ├── icon: string
    │       │       └── color: string
    │       │
    │       ├── transactions/
    │       │   └── {transactionId}/
    │       │       ├── amount: number
    │       │       ├── date: string (YYYY-MM-DD)
    │       │       ├── description: string
    │       │       ├── categoryId: string
    │       │       ├── createdAt: string
    │       │       └── attachment?: {
    │       │           url: string,
    │       │           path: string,
    │       │           type: "image" | "pdf",
    │       │           name: string,
    │       │           size: number
    │       │       }
    │       │
    │       ├── plans/
    │       │   └── {planId}/
    │       │       ├── title: string
    │       │       ├── createdAt: string
    │       │       └── items: [
    │       │           {
    │       │               id: string,
    │       │               name: string,
    │       │               amount: number,
    │       │               type: "INCOME" | "EXPENSE",
    │       │               categoryId: string,
    │       │               plannedDate?: string,
    │       │               status: "PLANNED" | "DONE" | "CANCELLED"
    │       │           }
    │       │       ]
    │       │
    │       ├── budgets/
    │       │   └── {budgetId}/
    │       │       ├── month: string (YYYY-MM)
    │       │       ├── name: string
    │       │       ├── categoryIds: string[]
    │       │       ├── limitAmount: number
    │       │       ├── createdAt: string
    │       │       └── updatedAt: string
    │       │
    │       └── debts/
    │           └── {debtId}/
    │               ├── kind: "DEBT" | "RECEIVABLE"
    │               ├── personName: string
    │               ├── amount: number
    │               ├── paidAmount: number
    │               ├── remainingAmount: number
    │               ├── status: "UNPAID" | "PARTIAL" | "PAID"
    │               ├── transactionDate: string
    │               ├── dueDate?: string
    │               ├── notes?: string
    │               └── payments: [
    │                   {
    │                       id: string,
    │                       amount: number,
    │                       date: string,
    │                       note?: string,
    │                       createdAt: string
    │                   }
    │               ]
    │
    ├── telegram_link/
    │   └── main/
    │       ├── telegramId: string
    │       ├── username: string | null
    │       ├── firstName: string
    │       ├── lastName: string | null
    │       ├── defaultAccountId: string
    │       ├── linkedAt: Timestamp
    │       ├── active: boolean
    │       └── lastInteraction: Timestamp
    │
    └── advisor_analytics/
        └── {analysisId}/
            ├── type: "health" | "savings" | "reduction"
            ├── createdAt: Timestamp
            ├── tokensUsed: number
            └── userSummary: string

# Global collections (not under user)
link_tokens/
└── {token}/
    ├── telegramId: string
    ├── createdAt: Timestamp
    ├── expiresAt: Timestamp
    ├── used: boolean
    └── usedAt: Timestamp | null

telegram_rate_limits/
└── {telegramId}/
    ├── photoUploadsToday: number
    ├── photoUploadsThisHour: number
    ├── lastPhotoUpload: Timestamp
    ├── messagesThisMinute: number
    └── lastReset: Timestamp
```

---

## 🚀 Deployment

### Environment

**Web App** (`.env.local`):
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Functions** (`functions/.env`):
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
WEB_APP_URL=https://dompas.indoomega.my.id
```

### Firebase Hosting Setup

```bash
# Jalur aman untuk hosting
npm run deploy:hosting:safe

# Atau deploy manual:
firebase deploy                         # semuanya
firebase deploy --only hosting          # frontend
firebase deploy --only functions        # backend
firebase deploy --only firestore:rules  # rules
firebase deploy --only firestore:indexes # indexes
```

`deploy:hosting:safe` akan:
1. build frontend
2. deploy hosting
3. smoke check root `/`
4. smoke check route SPA `/link-telegram`
5. verifikasi asset JS/CSS utama bisa diakses

---

## 🗺️ Phase Summary

Berikut ringkasan implementasi phase yang sudah selesai:

1. **Phase 0 - Product Vocabulary & UX Rules**
   Istilah produk disederhanakan untuk user awam.
2. **Phase 1 - Fondasi Akun Keuangan**
   Semua data utama dipindah ke struktur account-scoped.
3. **Phase 2 - App Core Becomes Space-Aware**
   Dashboard, transaksi, kategori, AI, export, dan Telegram mengikuti akun aktif/default.
4. **Phase 3 - Simulasi → Rencana**
   Fitur simulasi diubah jadi `Rencana`.
5. **Phase 4 - Anggaran**
   Refactor jadi budget plan multi-kategori + salin bulan lalu + detail transaksi per anggaran.
6. **Phase 5 - Shared Transaction Parsing Engine**
   Parser hybrid dengan preview + confirm.
7. **Phase 6 - Telegram Multi-Transaction**
   Batch preview, confirm, cancel, dan hapus item dari draft.
8. **Phase 7 - Voice Input**
   Voice note Telegram ditranskrip lalu dipreview.
9. **Phase 8 - Hutang Piutang**
   Modul tracking hutang/piutang dengan redesign UX lebih sederhana.
10. **Phase 9 - Polish, Onboarding, and Adoption**
    Onboarding user baru, helper dashboard, dan panduan singkat di Settings.

### Telegram Webhook Setup

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d "url=https://asia-southeast1-expensetracker-test-1.cloudfunctions.net/telegramWebhook"

# Check status
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"

# Delete webhook (for local testing)
curl -X POST "https://api.telegram.org/bot{TOKEN}/deleteWebhook"
```

### Infrastructure

- **Frontend Hosting**: Firebase Hosting (CDN Global)
- **Backend**: Cloud Functions (Node.js 22, asia-southeast1 region)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **CDN/Proxy**: Cloudflare Worker (reverse proxy)
- **Domain**: dompas.indoomega.my.id

---

## 🧪 Testing Guide

### Automated Tests

```bash
cd functions
node test-nlu.js
node test-transaction-parser.js
node test-telegram-hardening.js
node test-telegram-bot-flow.js
```

✅ Only deploy jika semua script 100% PASS

### Manual Telegram Query Regression

| # | Query | Expected Result |
|---|-------|-----------------|
| 1 | `saldo` | Show current balance |
| 2 | `pengeluaran hari ini berapa` | Total HARI INI only |
| 3 | `hari ini ada pengeluaran ga` | Total HARI INI (flexible pattern) |
| 4a | `pengeluaran 7 hari terakhir` | Total last 7 DAYS |
| 4c | `20 transaksi terakhir` | Show 20 transactions (all-time, not week/month) |
| 4d | `40 transaksi terakhir` | Show max 30 + cap message |
| 6 | `3 transaksi tertinggi bulan ini` | Top 3 by AMOUNT (not newest) |
| 8 | `transaksi food bulan ini` | Only Food category this month |
| 9 | `kategori paling boros` | Category breakdown |

### Manual Telegram Input Regression

| # | Input | Expected Result |
|---|-------|-----------------|
| 1 | `makan siang 25rb` | Show preview first, not auto-save |
| 2 | Confirm input #1 | Transaction is saved |
| 3 | Cancel input #1 | Draft is cancelled and not saved |
| 4 | `makan 25rb, parkir 5rb` | Preview 2 transactions |
| 5 | `makan 25rb; parkir 5rb` | Preview 2 transactions |
| 6 | `makan 25rb` + newline + `parkir 5rb` | Preview 2 transactions |
| 7 | `makan 25rb dan parkir 5rb` | Preview 2 transactions |
| 8 | `hutang 10k, parkir 10k, beli hadiah 100k` | Preview 3 transactions, no crash |
| 9 | Tap `Hapus 1` from multi-item preview | Removes the selected item and refreshes preview |
| 10 | `/akun` | Shows active Telegram account and switch options when available |
| 11 | Voice note: `makan 25 ribu, parkir 5 ribu` | Bot transcribes voice and shows preview before save |

### Regression Rule for Telegram Input

- Every new Telegram input bug must be converted into a regression test
- Add the case to `test-transaction-parser.js` or `test-telegram-hardening.js`
- If the bug affects preview/confirm/account switching/voice flow, add or update `test-telegram-bot-flow.js`
- Re-run all automated tests before deploy

### View Logs

```bash
firebase functions:log --only telegramWebhook -n 50
```

---

## 🔐 Security & Rate Limiting

### Authentication
- **Provider**: Firebase Authentication
- **Method**: Google Sign-In only
- **Scope**: All Firestore queries limited to `users/{userId}/`

### Rate Limits (Telegram Bot)
```
Photo uploads: 20/day, 5/hour
Messages: 10/minute
Link tokens: 5 attempts/day, 5 min expiry
AI Advisor: 30s cooldown, 10/hour, 50/day per user
```

### Token Security
- 32-character random tokens
- 5-minute expiry
- One-time use only
- Auto-delete after 1 hour

### Firestore Security Rules
- User can only read/write their own data
- Telegram link validation via linkService
- Category references validated

---

## 📊 Performance & Optimization

### Build Output
- ~1.4MB JS bundle
- Committed `dist/` folder for low-RAM server deployment
- Vite cache for fast development rebuilds

### Image Compression
- Auto-resize: max 1920x1920px
- JPEG quality: 80%
- Average reduction: 60-80%
- Canvas API for reliable compression

### Database Optimization
- Efficient Firestore queries
- Collection group indexes for telegram_link
- Real-time listeners with onSnapshot
- Smart pagination (30 transactions max per query)

### PWA Features
- Manifest.json configured
- App icons: 512x512, 192x192, apple touch icon
- Installable to home screen
- Service worker ready (basic assets caching)

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# View build analysis
npm run build -- --ssrManifest

# Functions
cd functions
npm install
npm run build
npm run build:watch
npm run serve (local emulator)
npm run deploy
firebase functions:log
```

---

## 📝 Dokumentasi Per File

### README.md
- Quick start guide
- Features overview
- Tech stack table
- Deployment instructions
- Version history

### docs/TELEGRAM_INTEGRATION.md (403 lines)
- Bot overview & capabilities
- Changelog (v2.2.2 - v2.0)
- Architecture diagrams
- Component breakdown
- Services detail
- Data flows
- Query examples
- Firestore schema

### TESTING.md
- NLU test fix summary
- 9 mandatory test cases
- Automated test script
- Manual regression tests
- Logging guide

### Removed obsolete docs
- `DOCUMENTATION.md` dihapus karena duplikat lama dari dokumentasi utama
- `TELEGRAM_BOT_TECHNICAL_PLAN.md` dihapus karena masih draft/planning phase
- `functions/README.md` dihapus karena status implementasinya tertinggal dari kondisi aktual

### landing-page/DOCUMENTATION.md
- Landing page overview
- File structure
- Customization guide
- Color theme setup
- Deployment options

### utils/README.md
- File compression utility
- Image compression features
- Compression settings
- Benefits & savings
- Example results
- Error handling

---

## 🎯 Quick Reference

### Where to...
| Task | Location |
|------|----------|
| Add new feature | `App.tsx` for state, `components/` for UI |
| Change theme colors | `contexts/ThemeContext.tsx` |
| Add new icon | `types.ts` IconName, `constants.ts` AVAILABLE_ICONS |
| Modify database queries | `App.tsx` or service files in `services/` |
| Update AI advisor | `functions/src/services/advisorService.ts` |
| Change NLU logic | `functions/src/services/nluService.ts` |
| Update bot commands | `functions/src/bot/commands/` |
| Customize landing page | `landing-page/index.html`, `style.css` |
| Export configuration | `vite.config.ts` |
| Firebase settings | `firebase.ts`, `firebase.json` |
| Firestore rules | `firestore.rules` |
| Telegram webhook | Cloud Functions console |

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| **Live App** | https://dompas.indoomega.my.id |
| **Telegram Bot** | @dompas_bot |
| **Firebase Console** | https://console.firebase.google.com/project/expensetracker-test-1 |
| **Firebase Functions** | https://console.firebase.google.com/project/expensetracker-test-1/functions |
| **Firestore** | https://console.firebase.google.com/project/expensetracker-test-1/firestore |
| **Google AI Studio** | https://aistudio.google.com/app/apikey |
| **BotFather** | https://t.me/botfather |

---

## 📈 Cost Analysis

### Monthly Costs (Phase 2.2.2)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Firebase Hosting | 1GB storage, 10GB/month bandwidth | ~500MB, 2GB/month | **$0** ✅ |
| Cloud Functions | 2M invocations/month | ~5K invocations | **$0** ✅ |
| Firestore Reads | 50K/day | ~500/day | **$0** ✅ |
| Firestore Writes | 20K/day | ~100/day | **$0** ✅ |
| Firestore Storage | 1GB | ~100MB | **$0** ✅ |
| Firebase Storage | 5GB | ~200MB | **$0** ✅ |
| Gemini API | Free tier available | ~50-100 calls/day | $0-5 |
| **TOTAL** | | | **$0-5/month** 🎉 |

---

## 🚨 Known Issues

1. **Firestore Index**: Collection group query memerlukan index (auto-created, 5-15 min to build)
2. **Large Bundle**: ~1.4MB JS bundle (consider code splitting)
3. **Single Currency**: Only IDR (Indonesian Rupiah)
4. **Limited Offline**: Basic asset caching, full PWA planned

---

## 📞 Support & Troubleshooting

### Common Issues

**Bot tidak respond**
→ Check webhook status: `curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"`

**Firestore queries error**
→ Check indexes: https://console.firebase.google.com/project/expensetracker-test-1/firestore/indexes

**Web app not loading**
→ Check hosting logs: `firebase hosting:logs`

**Functions deploy error**
→ Check Cloud Functions logs: `firebase functions:log`

---

## 🎓 Learning Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Guide](https://ai.google.dev/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ✅ Checklist Deployment

- [ ] Create Telegram bot via @BotFather
- [ ] Get Gemini API key from Google AI Studio
- [ ] Create `functions/.env` with credentials
- [ ] Run `npm install` dan `cd functions && npm install`
- [ ] Test locally with `npm run dev` & `cd functions && npm run serve`
- [ ] Run NLU tests: `cd functions && node test-nlu.js`
- [ ] Deploy: `firebase deploy`
- [ ] Set webhook: `curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook ...`
- [ ] Test 7 mandatory test cases
- [ ] Monitor logs: `firebase functions:log`
- [ ] Check cost in Firebase console

---

## 🔄 Version History

| Version | Date | Highlights |
|---------|------|-----------|
| **v2.6.0** | Mar 28, 2026 | Akun Keuangan, Rencana, Anggaran, Telegram multi-input + voice, Hutang Piutang, onboarding |
| **v2.2.2** | Feb 2, 2026 | Document upload support, caption parsing, compression |
| **v2.2.1** | Jan 30, 2026 | Gemini model fix, list categories, smarter NLU |
| **v2.2** | Jan 2026 | AI Financial Advisor, savings strategy, expense analysis |
| **v2.1** | Jan 2026 | Category filtering, improved formatting, N days ago support |
| **v2.0** | Dec 2025 | Telegram bot integration, receipt vision, NLU |
| **v1.6.0** | Nov 2025 | AI Financial Advisor (web only) |
| **v1.5.0** | Oct 2025 | Financial Simulations |
| **v1.0.0** | Sep 2025 | Initial Release |

---

## 👥 Credits

**Project**: Dompet Cerdas Smart Expense Tracker  
**Tech Stack**: React, TypeScript, Firebase, Gemini AI, Telegram Bot API  
**Hosting**: Firebase Hosting + Cloud Functions  
**Database**: Firebase Firestore  
**AI**: Google Gemini 2.0 Flash

---

**Last Updated**: March 28, 2026  
**Status**: ✅ Internal Testing Ready  
**Support**: Check documentation or Firebase console logs
