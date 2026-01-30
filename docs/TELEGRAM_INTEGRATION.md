# Telegram Bot Integration - Technical Documentation

## Overview

DompetCerdas v2.1 includes full Telegram bot integration for expense tracking via @dompas_bot. Users can upload receipt photos, add transactions via natural language, and query their expenses directly from Telegram.

## Changelog

### v2.2.1 (January 30, 2026) - Bug Fixes & Improvements
- 🔧 **Gemini Model Fix**: Migrated from deprecated `gemini-2.0-flash-exp` to stable `gemini-2.0-flash`
- 📋 **List Categories**: New `list_categories` intent to show available categories (master data)
- 🧠 **Smarter NLU**: "kategori apa aja" now correctly shows category list, not breakdown
- ⚡ **Better Intent Detection**: Category queries properly distinguished from breakdown queries

### v2.2 (January 2026) - AI Financial Advisor
- 🤖 **AI Financial Advisor**: Intelligent financial health analysis with personalized insights
- 💡 **Savings Strategy**: AI-powered recommendations for reducing expenses
- 🔍 **Expense Analysis**: Identify spending areas that can be reduced without suffering
- ⚡ **Token Optimized**: Smart data aggregation (50 transactions max) for cost efficiency
- 🔒 **Scope Limited**: AI strictly limited to user's transaction data only
- 🛡️ **Rate Limited**: 30s cooldown, 10 analyses/hour, 50/day per user
- 📊 **Smart Sampling**: Mix of largest amounts + recent + diverse categories

### v2.1 (January 2026)
- ✨ **Category Filtering**: Query specific categories (e.g., "detailkan kategori Bill bulan ini")
- ⏳ **Immediate Feedback**: "Mohon tunggu..." message while processing requests
- 🗑️ **Auto Cleanup**: Processing message auto-deleted after response
- 🎨 **Enhanced Format**: Transaction details with category icons and improved layout
- 📅 **N Days Ago**: Support queries like "transaksi 2 hari lalu", "pengeluaran 3 hari lalu"
- 🤖 **Smarter NLU**: Better understanding of flexible time expressions

### v2.0 (Initial Release)
- Receipt photo scanning with Gemini Vision AI
- Natural language query support
- Account linking system
- Basic time range queries (today, yesterday, this week, last week, this month, last month)

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Telegram User  │────▶│  Firebase Functions  │────▶│    Firestore    │
│   (@dompas_bot) │     │  (telegramWebhook)   │     │   (Database)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Gemini Vision AI   │
                        │  (Receipt Analysis)  │
                        └──────────────────────┘
```

## Components

### 1. Bot Entry Point
**File:** `functions/src/bot/index.ts`

- Initializes TelegramBot instance
- Routes updates (messages, callbacks)
- Handles photo, text, and command messages

### 2. Commands
**Directory:** `functions/src/bot/commands/`

| Command | File | Description |
|---------|------|-------------|
| `/start` | `start.ts` | Account linking flow |
| `/help` | `help.ts` | Usage guide and examples |
| `/unlink` | `index.ts` | Disconnect account |

### 3. Services

#### Link Service (`services/linkService.ts`)
- Generates secure tokens for account linking
- Validates token expiry (5 minutes)
- Maps Telegram ID to Firebase User ID

#### Gemini Service (`services/geminiService.ts`)
- Receipt image analysis using Gemini Vision API
- Extracts: merchant, amount, date, items, category
- Returns `is_receipt` flag for validation

#### Transaction Service (`services/transactionService.ts`)
- Creates transactions from receipt data
- Maps category names to category IDs
- Stores attachment metadata

#### Storage Service (`services/storageService.ts`)
- Compresses images using sharp
- Uploads to Firebase Storage
- Returns public URL for attachments

#### NLU Service (`services/nluService.ts`)
- Parses natural language queries using Gemini 2.0 Flash
- Detects intents: 
  - **Query intents**: `query_expenses`, `query_details`, `category_breakdown`, `list_categories`, `add_transaction`
  - **AI Advisor intents**: `financial_advice`, `savings_strategy`, `expense_analysis`
- Fast keyword detection for advice queries (gimana, analisa, tips, hemat, kurangi)
- Extracts parameters: 
  - `time_range`: today, yesterday, this_week, last_week, this_month, last_month
  - `days_ago`: N (for queries like "2 hari lalu")
  - `category_filter`: Specific category name (e.g., "Bill", "Food")
  - `amount`, `description`, `category_hint`: For manual transactions

#### Query Service (`services/queryService.ts`)
- Queries Firestore for expense totals and transaction details
- Calculates category breakdowns with percentages
- Supports:
  - Time ranges (today, yesterday, week, month)
  - Specific days ago (N days back)
  - Category filtering for detail queries

#### Advisor Service (`services/advisorService.ts`) 🆕
- **AI-powered financial analysis** using Gemini 2.0 Flash
- **Token-efficient**: Smart data aggregation (max 50-100 transactions)
- **Three analysis types**:
  1. `analyzeFinancialHealth()`: Overall financial insights & recommendations
  2. `generateSavingsStrategy()`: Forward-looking savings plan
  3. `analyzeExpenseReduction()`: Identify reducible expenses
- **Rate limiting**: 30s cooldown, 10/hour, 50/day per user
- **Smart sampling**: Top by amount + recent + diverse categories
- **Scope limiting**: System instructions prevent off-topic responses
- **Usage analytics**: Logs to `advisor_analytics` collection

#### Gemini Service (`services/geminiService.ts`)
- Receipt image analysis using Gemini Vision API
- Extracts: merchant, amount, date, items, category
- Returns `is_receipt` flag for validation
- **Financial insights generation** 🆕:
  - Strict system instructions for scope limiting
  - Temperature 0.7 for balanced creativity
  - Max 1000 output tokens
  - Hallucination detection for off-topic responses

#### Response Formatter (`services/responseFormatter.ts`)
- Formats responses with emojis and Markdown
- Indonesian Rupiah formatting (Rp 1.000.000)
- Category emoji mapping (🍔 Food, 📄 Bills, 🚗 Transportation, etc.)
- Clean transaction detail format with category icons
- **AI response formatters** 🆕:
  - `formatFinancialAdvice()`: Wraps advice with header & follow-up hints
  - `formatSavingsStrategy()`: Formats savings recommendations
  - `formatExpenseAnalysis()`: Formats expense reduction analysis

## Data Flow

### Receipt Upload Flow

```
1. User sends photo to bot
2. Bot validates:
   - Single photo (no albums)
   - JPG/PNG format (no PDF)
   - Max 5MB size
3. Gemini Vision analyzes image
4. Bot validates:
   - is_receipt == true
   - totalAmount > 0
5. Shows confirmation with inline buttons
6. On confirm:
   - Download photo from Telegram
   - Compress with sharp
   - Upload to Firebase Storage
   - Map category to categoryId
   - Save transaction to Firestore
7. Send success message
```

### Natural Language Flow

```
1. User sends text message
2. Bot sends "⏳ Mohon tunggu..." immediately
3. NLU Service parses intent and parameters:
   - Fast keyword check for advice queries
   - Gemini AI for complex intent classification
4. Route to handler based on intent:
   - query_expenses → Query Service → formatExpenseResponse
   - query_details → Query Service → formatTransactionDetails
   - category_breakdown → Query Service → formatCategoryBreakdown
   - add_transaction → Transaction Service → formatTransactionAdded
   - financial_advice → Advisor Service → formatFinancialAdvice 🆕
   - savings_strategy → Advisor Service → formatSavingsStrategy 🆕
   - expense_analysis → Advisor Service → formatExpenseAnalysis 🆕
5. Send formatted response
6. Auto-delete "Mohon tunggu..." message
```

### AI Advisor Flow 🆕

```
1. User sends advice query (e.g., "gimana keuanganku?")
2. NLU detects advice intent via keyword matching
3. Advisor Service checks rate limit:
   - 30 seconds cooldown
   - Max 10 analyses per hour
   - Max 50 analyses per day
4. Gather data in parallel:
   - Current month expenses & breakdown
   - Last month for comparison
   - Top 100 transactions (will be sampled)
   - 3-month historical aggregates
5. Smart sampling (50 transactions max):
   - Top 30 by amount (outliers)
   - Top 20 most recent (trends)
   - 1 per category (diversity)
6. Compose compact prompt (~2-3K tokens):
   - Current period detail
   - Historical context (aggregated)
   - Spending patterns detected
7. Call Gemini with strict system instructions:
   - Scope limited to user's data
   - Temperature 0.7, max 1000 tokens output
   - Hallucination detection
8. Format & send response with follow-up hints
9. Log usage to advisor_analytics
```

### Query Examples

**Time Range Queries:**
- "berapa pengeluaran bulan ini?" → Total expenses this month
- "pengeluaran 7 hari terakhir" → Last 7 days total
- "detailkan hari ini" → Today's transaction details

**Days Ago Queries:**
- "transaksi 2 hari lalu" → Transactions from 2 days ago
- "pengeluaran 3 hari lalu berapa" → Total from 3 days ago
- "detailkan 5 hari yang lalu" → Details from 5 days ago

**Category Filtered Queries:**
- "detailkan kategori Bill bulan ini" → Only Bill transactions this month
- "rincian Food minggu ini" → Only Food transactions this week
- "detail Shopping hari ini" → Only Shopping transactions today

**Category Breakdown:**
- "kategori paling boros bulan ini" → Categories sorted by spending
- "bulan ini pengeluaran per kategori" → Category breakdown

**AI Advisor Queries:** 🆕
- "gimana keuanganku bulan ini?" → Financial health analysis
- "analisa pengeluaran aku" → General financial insights
- "tips hemat bulan depan" → Savings strategy recommendations
- "saran biar lebih hemat" → Forward-looking savings plan
- "kategori mana yang bisa dikurangi?" → Expense reduction analysis
- "pengeluaran apa yang bisa dipotong tanpa suffering?" → Identify reducible expenses

### Account Linking Flow

```
1. User sends /start to bot
2. Bot generates link token (expires in 5 min)
3. User enters token in web app Settings
4. Web app creates telegram_link subcollection
5. Bot now has access to user's data
```

## Environment Variables

```bash
# functions/.env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
GEMINI_API_KEY=your_gemini_api_key
```

## Firestore Schema

### Transaction Document
```javascript
{
  amount: number,           // Transaction amount
  categoryId: string,       // Reference to category
  description: string,      // Merchant or description
  date: string,             // YYYY-MM-DD format
  createdAt: string,        // ISO timestamp
  attachment?: {            // Optional receipt photo
    url: string,
    path: string,
    type: 'image',
    name: string,
    size: number
  }
}
```

### Link Token Document
```javascript
{
  token: string,
  telegramId: number,
  createdAt: Timestamp,
  expiresAt: Timestamp,
  used: boolean
}
```

### Telegram Link Document
```javascript
{
  telegramId: number,
  username?: string,
  firstName: string,
  linkedAt: Timestamp,
  active: boolean
}
```

### Advisor Rate Limit Document 🆕
```javascript
// Collection: advisor_limits/{userId}
{
  hourlyCount: number,      // Analyses in current hour
  dailyCount: number,       // Analyses today
  lastRequest: number,      // Timestamp of last request (ms)
  hourStart: number,        // Hour window start timestamp (ms)
  dayStart: number          // Day window start timestamp (ms)
}
```

### Advisor Analytics Document 🆕
```javascript
// Collection: advisor_analytics/{autoId}
{
  userId: string,
  intentType: string,       // 'financial_advice', 'savings_strategy', 'expense_analysis'
  transactionCount: number, // Number of transactions analyzed
  timestamp: string,        // ISO timestamp
  createdAt: Timestamp
}
```

## Validation Rules

| Validation | Error Message |
|------------|---------------|
| Not linked | "Akun belum terhubung. Ketik /start" |
| Album (>1 photo) | "Mohon kirim 1 foto saja" |
| PDF/Document | "Format file tidak didukung. JPG/PNG saja" |
| File > 5MB | "Ukuran foto terlalu besar" |
| Not a receipt | "Foto ini bukan struk belanja" |
| Rate limit (30s) | "Mohon tunggu X detik lagi" 🆕 |
| Rate limit (hourly) | "Limit analisis per jam tercapai (10)" 🆕 |
| Rate limit (daily) | "Limit analisis harian tercapai (50)" 🆕 |
| No amount found | "Nominal total tidak ditemukan" |

## Deployment

```bash
# Deploy bot function
firebase deploy --only functions:telegramWebhook

# Set webhook (one-time)
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<REGION>-<PROJECT>.cloudfunctions.net/telegramWebhook"
```

## Rate Limiting

- 20 receipts per user per day
- Tracked in `telegram_rate_limits` collection
- Resets at midnight

## Dependencies

```json
{
  "node-telegram-bot-api": "^0.66.0",
  "@google/generative-ai": "^0.21.0",
  "sharp": "^0.34.5",
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^5.0.0"
}
```

## Error Handling

All handlers use try-catch with:
- Console logging for debugging
- User-friendly error messages
- Graceful degradation (e.g., save without attachment if upload fails)

## Testing

Test commands via Telegram:
1. `/start` - Should show link token
2. Upload receipt photo - Should analyze and confirm
3. "berapa pengeluaran bulan ini?" - Should return total
4. "tambah 50000 makan siang" - Should create transaction
