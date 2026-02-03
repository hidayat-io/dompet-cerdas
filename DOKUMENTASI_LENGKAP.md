# 📚 DOKUMENTASI LENGKAP - Dompet Cerdas v2.2.3

**Status**: ✅ Fully Documented  
**Last Updated**: February 3, 2026  
**Version**: 2.2.3  
**Live URL**: https://dompas.indoomega.my.id

---

## 🎯 Ringkasan Eksekutif

**Dompet Cerdas** adalah aplikasi manajemen keuangan pribadi dengan integrasi Telegram bot AI-powered. Pengguna dapat melacak pengeluaran melalui:
- 📱 **Web App**: Dashboard, entry manual, analytics
- 🤖 **Telegram Bot**: Receipt scanning, natural language queries, AI advisor
- 🧠 **AI Integration**: Google Gemini untuk OCR receipt dan analisis keuangan

**Key Features**:
- ✅ Dashboard dengan pie chart breakdown
- ✅ Receipt scanning via Telegram (Vision API)
- ✅ Natural language queries ("berapa pengeluaran hari ini?")
- ✅ AI financial advisor dengan rekomendasi hemat
- ✅ Excel export dengan date range selection
- ✅ Multi-category dengan 150+ icons
- ✅ Secure account linking via token
- ✅ PWA-ready dengan manifest

---

## 📋 Daftar File Dokumentasi

| File | Deskripsi |
|------|-----------|
| **README.md** | Quick start, features overview, deployment instructions |
| **DOCUMENTATION.md** | Technical documentation lengkap (919 lines) |
| **TELEGRAM_BOT_TECHNICAL_PLAN.md** | Detailed Telegram bot architecture & flows (838 lines) |
| **docs/TELEGRAM_INTEGRATION.md** | Telegram bot technical docs dengan NLU & Vision API |
| **functions/README.md** | Cloud Functions setup & deployment guide |
| **TESTING.md** | Testing guide dengan 9 test cases & NLU fixes |
| **PHASE_1_COMPLETE.md** | Phase 1 implementation summary & checklist |
| **DEPLOYMENT_SUCCESS.md** | Phase 1 deployment confirmation & status |
| **DEBUGGING_GUIDE.md** | Firestore index troubleshooting |
| **CORS_FIX_COMPLETE.md** | CORS headers fix untuk bot notifications |
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
│   ├── TransactionList.tsx         # Transaction history with filters
│   ├── TransactionForm.tsx         # Add/edit transaction modal
│   ├── CategoryManager.tsx         # CRUD categories
│   ├── CategoryFormModal.tsx       # Reusable category modal
│   ├── SimulationManager.tsx       # Budget "what-if" scenarios
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
│   └── geminiService.ts            # Gemini AI integration
│
├── utils/
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
| **Functions** | Cloud Functions | Node 20 | Backend serverless |
| **AI - Vision** | Gemini Vision | 2.0 Flash | Receipt OCR |
| **AI - NLU** | Gemini NLU | 2.0 Flash | Intent parsing |
| **AI - Advisor** | Gemini 2.0 Flash | 2.0 Flash | Financial insights |
| **Bot SDK** | node-telegram-bot-api | Latest | Telegram integration |
| **Excel** | SheetJS | Latest | .xlsx export |
| **Images** | Sharp | Latest | Image compression |
| **File Download** | FileSaver.js | Latest | Browser download |

---

## 📱 Fitur Utama

### 1️⃣ Dashboard (Web App)
- **Balance Summary**: Total income, expense, current balance
- **Pie Chart**: Expense breakdown by category dengan persentase
- **Recent Transactions**: Last 10 transactions grouped by date, newest first
- **Version Display**: Shows app version (e.g., "v2.2.2")

### 2️⃣ Transaksi (Transactions)
- **CRUD**: Add, edit, delete transactions
- **Attachments**: JPG, PNG, GIF, WEBP, PDF support dengan preview
- **Image Compression**: Auto-compress images sebelum upload
- **Filters**: By month, by date range, by category
- **Grouping**: Grouped by date dengan smart sorting
- **Search**: Search by description
- **Mobile UX**: Filter panel toggle pada mobile

### 3️⃣ Simulasi (Budget Simulation)
- **What-If Scenarios**: Create multiple simulations
- **Edit Items**: Full edit dengan modal form
- **Category Mapping**: Map to actual categories
- **Balance Preview**: See projected balance
- **Balance Mode Toggle**: Switch between total balance or current month balance
  - Toggle at simulation level (applies to all items in that simulation)
  - Visual indicator with calendar icon on cards using current month balance
  - Projected balance calculated from selected base
- **Apply to Real**: Convert simulation to real transaction

### 4️⃣ Master Kategori (Categories)
- **CRUD**: Add, edit, delete categories
- **Separated Views**: Income vs Expense categories
- **Icon Selection**: 150+ Lucide icons
- **Color Picker**: 8 preset colors
- **Type Classification**: Income or Expense
- **Reusable Modal**: Consistent UX across app

### 5️⃣ AI Financial Advisor 🆕
- **Gemini Integration**: Deep financial analysis
- **Three Analysis Types**:
  1. Financial Health: Overall insights & recommendations
  2. Savings Strategy: Forward-looking savings plan
  3. Expense Analysis: Identify reducible expenses
- **Smart Sampling**: Top expenses + recent + diverse categories
- **Rate Limiting**: 30s cooldown, 10/hour, 50/day per user
- **Scope Limited**: Only user's transaction data

### 6️⃣ Excel Export
- **Date Range**: Current Month, Custom Range, All Data
- **Auto-Format**: Currency & summary rows
- **Filename**: `Transaksi_YYYY-MM-DD_YYYY-MM-DD.xlsx`
- **File Validation**: Max 10MB
- **Data URL Approach**: Reliable download

### 7️⃣ Theme System (Light/Dark)
- **Toggle**: Dark/Light mode switch
- **Persistence**: Saved to localStorage
- **Full Palette**: Complete color scheme per theme
- **Components**: All components theme-aware

---

## 🤖 Telegram Bot Features

### Commands
- **`/start`**: Welcome & account linking flow
- **`/help`**: Usage guide & examples
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
    ├── simulations/
    │   └── {simulationId}/
    │       ├── id: string
    │       ├── title: string
    │       ├── createdAt: string
    │       └── items: [
    │           {
    │               id: string,
    │               name: string,
    │               amount: number,
    │               type: "INCOME" | "EXPENSE",
    │               categoryId: string
    │           }
    │       ]
    │
    ├── telegram_link/
    │   └── main/
    │       ├── telegramId: string
    │       ├── username: string | null
    │       ├── firstName: string
    │       ├── lastName: string | null
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
# Build frontend
npm run build

# Deploy semua (Hosting + Functions + Rules + Indexes)
firebase deploy

# Atau deploy terpisah:
firebase deploy --only hosting          # Frontend only
firebase deploy --only functions        # Backend only
firebase deploy --only firestore:rules  # Firestore rules
firebase deploy --only firestore:indexes # Firestore indexes
```

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
- **Backend**: Cloud Functions (Node.js 20, asia-southeast1 region)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **CDN/Proxy**: Cloudflare Worker (reverse proxy)
- **Domain**: dompas.indoomega.my.id

---

## 🧪 Testing Guide

### Automated NLU Test

```bash
cd functions
node test-nlu.js
```

✅ Only deploy jika hasil 100% PASS

### Manual Telegram Testing (7 Mandatory Test Cases)

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

### DOCUMENTATION.md (919 lines)
- Complete technical reference
- Database schema detail
- Component architecture
- Theme system
- Deployment flow
- Mobile navigation layout

### TELEGRAM_BOT_TECHNICAL_PLAN.md (838 lines)
- Executive summary
- Feature overview (NLU, Vision, Account Linking)
- Detailed architecture diagrams
- Gemini AI integration strategy
- Account linking flow
- Security measures
- Rate limiting

### docs/TELEGRAM_INTEGRATION.md (403 lines)
- Bot overview & capabilities
- Changelog (v2.2.2 - v2.0)
- Architecture diagrams
- Component breakdown
- Services detail
- Data flows
- Query examples
- Firestore schema

### functions/README.md
- Setup instructions
- Directory structure
- Development & deployment
- Environment variables
- Function descriptions
- Testing procedures
- Troubleshooting guide

### TESTING.md
- NLU test fix summary
- 9 mandatory test cases
- Automated test script
- Manual regression tests
- Logging guide

### PHASE_1_COMPLETE.md
- Implementation summary
- Files created/modified
- Next steps for user
- Testing checklist
- Phase 2 & 3 preview
- Cost estimate

### DEPLOYMENT_SUCCESS.md
- Phase 1 deployment status
- Deployed functions list
- Bot configuration
- Testing checklist
- Useful commands

### DEBUGGING_GUIDE.md
- Firestore index missing issue
- Solution applied
- Check index status
- Testing after fix
- Timeline

### CORS_FIX_COMPLETE.md
- Bot notification issue
- CORS headers fix
- Testing end-to-end flow
- What's working now

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

**Last Updated**: February 3, 2026  
**Status**: ✅ Production Ready  
**Support**: Check documentation or Firebase console logs

