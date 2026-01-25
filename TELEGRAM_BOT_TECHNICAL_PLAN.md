# 💬 Telegram Bot Integration - Technical Plan

> **Feature Status**: Planning Phase  
> **Version**: 1.0 (Draft)  
> **Last Updated**: 2026-01-24  
> **Author**: Brainstorming Session with User

---

## 📋 Executive Summary

This document outlines the technical plan for integrating a Telegram Bot with the DompetCerdas (Smart Wallet) application. The bot will enable users to:
- Add transactions via **natural language** or **receipt photo upload**
- Query financial data using **conversational AI**
- Receive **intelligent insights** powered by Google Gemini AI

**Key Innovation**: Deep Gemini AI integration for both **Vision API** (receipt OCR) and **Natural Language Understanding** (conversational interface).

---

## 🎯 Feature Overview

### Core Capabilities

#### 1. **Natural Language Interface**
Users interact with the bot using natural Indonesian language instead of rigid commands.

**Examples:**
```
✅ "berapa pengeluaran minggu ini?"
✅ "tambah 50000 makan siang"
✅ "kategori apa yang paling boros?"
✅ "bandingkan bulan ini vs bulan lalu"
```

**Traditional commands are minimal:**
- `/start` - Welcome & account linking
- `/link` - Generate link token
- `/help` - Usage guide

#### 2. **Receipt Vision Analysis**
Upload receipt photos for automatic transaction extraction using Gemini Vision API.

**Capabilities:**
- ✅ OCR (Optical Character Recognition)
- ✅ Merchant detection
- ✅ Total amount extraction
- ✅ Date detection
- ✅ Item-level breakdown
- ✅ Auto-category suggestion
- ✅ Confidence scoring

**Supported Formats:**
- JPG, PNG, WEBP
- Max file size: 5MB
- 1 receipt = 1 transaction (security constraint)

#### 3. **Secure Account Linking**
OAuth-style web authentication flow for privacy and security.

**Flow:**
1. User sends `/start` to bot
2. Bot generates unique token (expires in 5 minutes)
3. Bot sends web link with token
4. User clicks link → Opens web app
5. Web app validates token + current Google Auth session
6. Auto-links Telegram ID to Firebase UID
7. Bot confirms successful linking

---

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interactions                        │
├─────────────────────────────────────────────────────────────┤
│  Telegram App                                                │
│  - Send messages (natural language)                          │
│  - Upload receipt photos                                     │
│  - Click inline buttons                                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│              Telegram Bot API (Webhook)                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│         Firebase Cloud Functions (Node.js)                   │
├─────────────────────────────────────────────────────────────┤
│  - Message Handler                                           │
│  - Intent Parser (Gemini AI)                                 │
│  - Receipt Analyzer (Gemini Vision)                          │
│  - Transaction Manager                                       │
│  - Query Engine                                              │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
         ↓                           ↓
┌──────────────────┐      ┌──────────────────────────┐
│  Gemini AI API   │      │  Firebase Firestore      │
├──────────────────┤      ├──────────────────────────┤
│ - Intent Parse   │      │ - User data              │
│ - Vision OCR     │      │ - Transactions           │
│ - Category AI    │      │ - Categories             │
│ - Conversation   │      │ - Telegram links         │
└──────────────────┘      │ - Link tokens            │
                          │ - Rate limit tracking    │
                          └──────────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Bot Framework** | node-telegram-bot-api | Latest |
| **Backend** | Firebase Cloud Functions | Gen 2 |
| **Runtime** | Node.js | 20.x |
| **Database** | Firebase Firestore | - |
| **AI Service** | Google Gemini AI | 2.0 Flash |
| **Vision API** | Gemini Vision (multimodal) | 2.0 Flash |
| **Authentication** | Firebase Auth (existing) | - |
| **Storage** | Firebase Storage (receipts) | - |

---

## 🧠 Gemini AI Integration

### 1. Natural Language Understanding (NLU)

**Purpose**: Parse user messages to extract intent and parameters.

**Gemini Model**: `gemini-2.0-flash-exp`

**Prompt Strategy:**
```javascript
const NLU_PROMPT = `
You are a financial assistant bot for DompetCerdas app. 
Parse this Indonesian user message and extract intent + parameters.

User message: "${userMessage}"

Return JSON:
{
  "intent": "get_expenses | get_income | get_balance | get_summary | add_transaction | compare | help | unknown",
  "parameters": {
    "time_range": "today | this_week | last_week | this_month | last_month | custom",
    "start_date": "YYYY-MM-DD" (if custom),
    "end_date": "YYYY-MM-DD" (if custom),
    "amount": number (if add_transaction),
    "description": "string" (if add_transaction),
    "category_hint": "string" (optional),
    "category_filter": "string" (if category-specific query)
  },
  "confidence": "high | medium | low",
  "clarification_needed": "string or null" (if ambiguous)
}

Examples:
- "berapa pengeluaran minggu ini?" 
  → intent: get_expenses, time_range: this_week, confidence: high

- "tambah 50000 makan siang"
  → intent: add_transaction, amount: 50000, description: "makan siang", 
    category_hint: "makanan", confidence: high

- "pengeluaran" (ambiguous)
  → intent: get_expenses, confidence: low, 
    clarification_needed: "Periode mana? (hari ini/minggu ini/bulan ini)"
`;
```

**Supported Intents:**

| Intent | Description | Example |
|--------|-------------|---------|
| `get_expenses` | Query total expenses | "pengeluaran bulan ini" |
| `get_income` | Query total income | "pemasukan minggu ini" |
| `get_balance` | Check current balance | "saldo saya berapa?" |
| `get_summary` | Financial overview | "ringkasan keuangan" |
| `add_transaction` | Add transaction manually | "tambah 50000 kopi" |
| `compare` | Compare time periods | "bandingkan bulan ini vs lalu" |
| `category_breakdown` | Category analysis | "kategori paling boros" |
| `help` | Usage guide | "cara pakai bot" |

---

### 2. Receipt Vision Analysis

**Purpose**: Extract transaction data from receipt photos.

**Gemini Model**: `gemini-2.0-flash-exp` (multimodal)

**Prompt Strategy:**
```javascript
const RECEIPT_ANALYSIS_PROMPT = `
Analyze this Indonesian receipt image and extract transaction information.

Return JSON:
{
  "merchant": "store/restaurant name",
  "total_amount": number (final total only, not subtotals),
  "date": "YYYY-MM-DD" (if found, else today),
  "items": ["item1", "item2", ...] (optional),
  "category_suggestion": "Makanan | Belanja Harian | Transport | Kesehatan | Hiburan | Tagihan | Lainnya",
  "receipt_type": "retail | restaurant | transport | bill | other",
  "confidence": "high | medium | low",
  "currency": "IDR" (default),
  "notes": "any special observations"
}

Rules:
1. Extract ONLY the final total (Grand Total / Total Bayar / Total)
2. Ignore tax, service charge, subtotals individually
3. If date not found, use current date
4. Suggest category based on merchant type and items
5. For handwritten receipts, mark confidence as "medium" or "low"
6. Return valid JSON only, no markdown formatting

Examples:
- Indomaret receipt → category: "Belanja Harian", type: "retail"
- Restaurant receipt → category: "Makanan", type: "restaurant"
- Grab/Gojek receipt → category: "Transport", type: "transport"
- PLN/PDAM bill → category: "Tagihan", type: "bill"
`;
```

**Response Example:**
```json
{
  "merchant": "Indomaret",
  "total_amount": 127500,
  "date": "2026-01-24",
  "items": ["Susu Ultra 1L", "Roti Tawar", "Telur 10pcs", "Mie Instan"],
  "category_suggestion": "Belanja Harian",
  "receipt_type": "retail",
  "confidence": "high",
  "currency": "IDR",
  "notes": "Clear receipt, all text readable"
}
```

**Validation & Confirmation:**
```javascript
// After Gemini analysis
if (confidence === "high") {
  // Direct confirmation
  bot.sendMessage(chatId, `
📸 Struk berhasil dianalisis!

🏪 ${merchant}
💰 Rp ${total_amount.toLocaleString('id-ID')}
📁 ${category_suggestion}
📅 ${date}

✅ Simpan transaksi ini?
  `, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Ya", callback_data: "confirm_yes" },
        { text: "✏️ Edit", callback_data: "confirm_edit" },
        { text: "❌ Batal", callback_data: "confirm_cancel" }
      ]]
    }
  });
} else {
  // Request manual verification
  bot.sendMessage(chatId, `
📸 Struk terdeteksi, tapi kurang jelas

💰 Total: Rp ${total_amount.toLocaleString('id-ID')} (?)
📁 Kategori: ${category_suggestion}

⚠️ Mohon konfirmasi atau edit manual
  `);
}
```

---

## 🔐 Account Linking Flow

### Web-Based OAuth-Style Authentication

**Why this approach?**
- ✅ Privacy-friendly (no phone number sharing)
- ✅ Secure (token-based, time-limited)
- ✅ Reliable (works regardless of phone number visibility)
- ✅ Standard practice (OAuth pattern)

### Detailed Flow

```
┌─────────────┐
│ User: /start│
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ Bot checks if Telegram ID already linked│
└──────┬──────────────────────────────────┘
       │
       ├─→ [Already Linked]
       │   └─→ "✅ Akun sudah terhubung!"
       │
       └─→ [Not Linked]
           │
           ↓
   ┌────────────────────────┐
   │ Generate unique token  │
   │ (32-char random string)│
   └──────┬─────────────────┘
          │
          ↓
   ┌─────────────────────────────────┐
   │ Save to Firestore:              │
   │ link_tokens/{token}             │
   │ {                               │
   │   telegramId: 123456,           │
   │   createdAt: timestamp,         │
   │   expiresAt: +5 minutes,        │
   │   used: false                   │
   │ }                               │
   └──────┬──────────────────────────┘
          │
          ↓
   ┌─────────────────────────────────────┐
   │ Send link to user:                  │
   │ https://dompas.indoomega.my.id/     │
   │   link-telegram?token=ABC123        │
   │                                     │
   │ [🔗 Hubungkan Akun] (inline button)│
   └──────┬──────────────────────────────┘
          │
          ↓
   ┌─────────────────┐
   │ User clicks link│
   └──────┬──────────┘
          │
          ↓
   ┌──────────────────────────────┐
   │ Web App: /link-telegram page │
   └──────┬───────────────────────┘
          │
          ↓
   ┌─────────────────────────────────┐
   │ Validate token:                 │
   │ 1. Token exists?                │
   │ 2. Not expired? (<5 min)        │
   │ 3. Not used?                    │
   │ 4. User logged in? (Google Auth)│
   └──────┬──────────────────────────┘
          │
          ├─→ [Invalid] → Show error
          │
          └─→ [Valid]
              │
              ↓
       ┌──────────────────────────────┐
       │ Link Telegram ID to Firebase │
       │ users/{userId}/telegram_link │
       │ {                            │
       │   telegramId: 123456,        │
       │   linkedAt: timestamp,       │
       │   active: true               │
       │ }                            │
       └──────┬───────────────────────┘
              │
              ↓
       ┌─────────────────────────┐
       │ Mark token as used      │
       └──────┬──────────────────┘
              │
              ↓
       ┌─────────────────────────────┐
       │ Notify bot via Cloud Func   │
       │ POST /notify-link-success   │
       └──────┬──────────────────────┘
              │
              ↓
       ┌─────────────────────────────┐
       │ Bot sends confirmation:     │
       │ "✅ Akun berhasil terhubung!"│
       └──────┬──────────────────────┘
              │
              ↓
       ┌─────────────────────────────┐
       │ Web app redirects to home   │
       └─────────────────────────────┘
```

### Firestore Schema Updates

**New Collections:**

```javascript
// Link tokens (temporary, auto-delete after 1 hour)
link_tokens/{token}
{
  telegramId: string,
  createdAt: Timestamp,
  expiresAt: Timestamp,
  used: boolean,
  usedAt: Timestamp | null
}

// Telegram link (per user)
users/{userId}/telegram_link/main
{
  telegramId: string,
  username: string | null,
  firstName: string,
  lastName: string | null,
  linkedAt: Timestamp,
  active: boolean,
  lastInteraction: Timestamp
}

// Rate limiting (per Telegram user)
telegram_rate_limits/{telegramId}
{
  photoUploadsToday: number,
  photoUploadsThisHour: number,
  lastPhotoUpload: Timestamp,
  messagesThisMinute: number,
  lastReset: Timestamp
}
```

---

## 🛡️ Security & Rate Limiting

### Rate Limits

**Per User Quotas:**
```javascript
const RATE_LIMITS = {
  // Photo uploads
  PHOTO_UPLOADS_PER_DAY: 20,
  PHOTO_UPLOADS_PER_HOUR: 5,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Messages
  MESSAGES_PER_MINUTE: 10,
  
  // Link tokens
  LINK_TOKEN_EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_LINK_ATTEMPTS_PER_DAY: 5
};
```

**Implementation:**
```javascript
const checkRateLimit = async (telegramId, action) => {
  const limitDoc = await getDoc(doc(db, 'telegram_rate_limits', telegramId));
  
  if (!limitDoc.exists()) {
    // First interaction, create limit doc
    await setDoc(doc(db, 'telegram_rate_limits', telegramId), {
      photoUploadsToday: 0,
      photoUploadsThisHour: 0,
      messagesThisMinute: 0,
      lastReset: new Date()
    });
    return true;
  }
  
  const limits = limitDoc.data();
  
  if (action === 'photo_upload') {
    if (limits.photoUploadsToday >= 20) {
      return { allowed: false, reason: 'daily_limit' };
    }
    if (limits.photoUploadsThisHour >= 5) {
      return { allowed: false, reason: 'hourly_limit' };
    }
  }
  
  return { allowed: true };
};
```

### Security Measures

1. **Token Security**
   - Random 32-character tokens
   - 5-minute expiry
   - One-time use only
   - Auto-delete after 1 hour

2. **File Validation**
   - MIME type checking
   - File size limits (5MB)
   - Image format validation (JPG, PNG, WEBP only)

3. **Input Sanitization**
   - Escape user input before Gemini prompts
   - Validate JSON responses from Gemini
   - SQL injection prevention (Firestore is NoSQL, but still validate)

4. **Privacy Protection**
   - No phone number storage
   - Telegram ID hashed in logs
   - Receipt images stored with user-scoped paths
   - Auto-delete old receipts (optional, configurable)

---

## 📊 Data Flow Examples

### Example 1: Receipt Upload

```
User uploads receipt photo
    ↓
Cloud Function receives webhook
    ↓
Check rate limit (5/hour, 20/day)
    ↓ [OK]
Download photo from Telegram servers
    ↓
Convert to base64
    ↓
Send to Gemini Vision API
    ↓
Receive JSON response:
{
  merchant: "Indomaret",
  total_amount: 127500,
  category_suggestion: "Belanja Harian",
  confidence: "high"
}
    ↓
Store pending transaction in Firestore:
pending_transactions/{telegramId}/{tempId}
    ↓
Send confirmation to user with inline buttons
    ↓
User clicks "✅ Ya"
    ↓
Move to actual transactions collection:
users/{userId}/transactions/{transactionId}
    ↓
Upload receipt to Firebase Storage
    ↓
Send success message
```

### Example 2: Natural Language Query

```
User: "berapa pengeluaran minggu ini?"
    ↓
Cloud Function receives message
    ↓
Send to Gemini NLU
    ↓
Receive intent:
{
  intent: "get_expenses",
  time_range: "this_week",
  confidence: "high"
}
    ↓
Calculate date range (Mon-Sun)
    ↓
Query Firestore:
users/{userId}/transactions
  .where('date', '>=', '2026-01-20')
  .where('date', '<=', '2026-01-26')
  .where('categoryType', '==', 'EXPENSE')
    ↓
Aggregate results
    ↓
Format response with charts
    ↓
Send to user:
"💰 Pengeluaran 20-26 Jan: Rp 1.250.000
 📊 Breakdown:
 🍔 Makanan: Rp 650k (52%)
 🚗 Transport: Rp 350k (28%)
 ..."
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Setup infrastructure and account linking

- [ ] **Setup Telegram Bot**
  - Create bot via @BotFather
  - Get bot token
  - Configure webhook URL
  
- [ ] **Setup Firebase Cloud Functions**
  - Initialize Functions in project
  - Setup Node.js environment
  - Install dependencies: `node-telegram-bot-api`, `@google/generative-ai`
  
- [ ] **Setup Gemini API**
  - Create API key in Google Cloud Console
  - Enable Gemini API
  - Test basic API call
  
- [ ] **Implement Account Linking**
  - Create `/start` command handler
  - Implement token generation
  - Create web app route: `/link-telegram`
  - Test full linking flow

**Deliverables:**
- ✅ Bot responds to `/start`
- ✅ Link token generation works
- ✅ Web app can validate and link accounts
- ✅ Bot confirms successful linking

---

### Phase 2: Receipt Vision (Week 2)
**Goal**: Implement photo upload and AI analysis

- [ ] **Photo Upload Handler**
  - Handle photo messages
  - Download from Telegram servers
  - Convert to base64
  
- [ ] **Gemini Vision Integration**
  - Create receipt analysis prompt
  - Send image to Gemini Vision API
  - Parse JSON response
  - Handle errors and edge cases
  
- [ ] **Confirmation Flow**
  - Send extracted data to user
  - Implement inline keyboard (Ya/Edit/Batal)
  - Handle user responses
  - Save to Firestore on confirmation
  
- [ ] **Receipt Storage**
  - Upload to Firebase Storage
  - Link to transaction document
  - Implement cleanup on delete

**Deliverables:**
- ✅ Users can upload receipt photos
- ✅ Gemini extracts merchant, amount, category
- ✅ Confirmation flow works
- ✅ Transactions saved with receipt attachment

---

### Phase 3: Natural Language Interface (Week 3)
**Goal**: Implement conversational AI

- [ ] **Gemini NLU Integration**
  - Create intent parsing prompt
  - Implement intent classifier
  - Handle ambiguous queries
  
- [ ] **Query Handlers**
  - `get_expenses` - Total expenses by time range
  - `get_income` - Total income by time range
  - `get_balance` - Current balance
  - `get_summary` - Financial overview
  - `compare` - Compare time periods
  - `category_breakdown` - Category analysis
  
- [ ] **Manual Transaction Input**
  - Parse "tambah 50000 makan siang"
  - Auto-detect category with Gemini
  - Confirmation flow
  
- [ ] **Response Formatting**
  - Rich text formatting
  - Text-based charts
  - Emoji usage
  - Currency formatting

**Deliverables:**
- ✅ Users can ask questions in natural language
- ✅ Bot understands Indonesian queries
- ✅ Responses are formatted beautifully
- ✅ Manual transaction input works

---

### Phase 4: Security & Polish (Week 4)
**Goal**: Production-ready bot

- [ ] **Rate Limiting**
  - Implement per-user quotas
  - Photo upload limits
  - Message rate limits
  - Graceful error messages
  
- [ ] **Error Handling**
  - Network errors
  - Gemini API errors
  - Invalid input handling
  - Fallback responses
  
- [ ] **Testing**
  - Unit tests for Cloud Functions
  - Integration tests for full flows
  - Load testing
  - Edge case testing
  
- [ ] **Documentation**
  - User guide (/help command)
  - Developer documentation
  - Deployment guide
  - Troubleshooting guide

**Deliverables:**
- ✅ Rate limiting active
- ✅ Error handling robust
- ✅ Tests passing
- ✅ Documentation complete
- ✅ Ready for production launch

---

## 💰 Cost Estimation

### Gemini API Costs

**Gemini 2.0 Flash Pricing:**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Estimated Usage per User per Month:**
- 10 receipt uploads = ~10,000 tokens input + ~500 tokens output
- 30 NLU queries = ~15,000 tokens input + ~3,000 tokens output
- **Total per user**: ~$0.01/month

**For 1,000 active users**: ~$10/month

### Firebase Costs

**Cloud Functions:**
- Invocations: ~100,000/month (1,000 users × 100 interactions)
- Compute time: ~10 hours/month
- **Estimated**: $5/month

**Firestore:**
- Reads: ~500,000/month
- Writes: ~100,000/month
- Storage: ~1GB
- **Estimated**: $3/month

**Storage (Receipts):**
- ~1,000 receipts/month × 500KB avg = 500MB/month
- **Estimated**: $0.50/month

**Total Monthly Cost (1,000 users)**: ~$18.50/month

---

## 🔮 Future Enhancements

### Phase 5: Advanced Features (Future)

1. **Multi-language Support**
   - English interface option
   - Auto-detect user language
   
2. **Budget Alerts**
   - Proactive notifications
   - "⚠️ Pengeluaran bulan ini 80% dari budget"
   
3. **Daily Reminders**
   - "📝 Jangan lupa catat pengeluaran hari ini!"
   - Customizable reminder time
   
4. **Recurring Transactions**
   - "Tambah langganan Netflix Rp 186rb setiap tanggal 1"
   - Auto-create monthly
   
5. **Voice Input**
   - Voice message → Speech-to-text → NLU
   - "Tambah lima puluh ribu makan siang"
   
6. **Group Chat Support**
   - Shared expense tracking
   - Split bills
   - Group summaries

---

## 📚 References

### Documentation Links
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Google Gemini AI](https://ai.google.dev/docs)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

### Related Files
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Main app documentation
- [firebase.ts](./firebase.ts) - Firebase configuration
- [services/geminiService.ts](./services/geminiService.ts) - Existing Gemini integration

---

## ✅ Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-24 | Use Firebase Cloud Functions instead of separate Node.js server | Already using Firebase ecosystem, serverless is cost-effective |
| 2026-01-24 | Use Gemini AI for both NLU and Vision | Deep integration, single API, cost-effective |
| 2026-01-24 | Natural language interface instead of rigid commands | Better UX, more intuitive, modern approach |
| 2026-01-24 | Web-based account linking (OAuth-style) | Privacy-friendly, secure, reliable |
| 2026-01-24 | 1 receipt per transaction limit | Security, clarity, cost control |
| 2026-01-24 | Rate limiting: 20 photos/day, 5/hour | Prevent abuse, control costs |

---

## 🤝 Contributing

This is a living document. Future AI agents or developers should:
1. Update this document when implementing features
2. Add new sections as needed
3. Document any deviations from the plan
4. Keep the decision log updated

---

**Document Version**: 1.0 (Draft)  
**Next Review**: After Phase 1 completion  
**Maintained by**: Development Team
