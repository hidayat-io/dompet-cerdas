<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DompetCerdas - Smart Expense Tracker v2.0.1

Personal finance management with AI-powered receipt scanning and Telegram bot integration.

## Features

### 🌐 Web Application
- Dashboard with expense analytics
- Manual transaction entry
- Category management
- Financial simulations
- AI financial advisor

### 🤖 Telegram Bot (@dompas_bot)
- **Receipt Scanning**: Upload photos, AI extracts data automatically
- **Natural Language**: "berapa pengeluaran minggu ini?"
- **Quick Entry**: "tambah 50000 makan siang"
- **Account Linking**: Secure token-based connection

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Firebase Functions (Node.js 20) |
| Database | Firestore |
| Storage | Firebase Storage |
| AI | Gemini 2.0 (Vision & NLU) |
| Bot | node-telegram-bot-api |

## Quick Start

### Web App

```bash
npm install
cp .env.example .env.local  # Add your API keys
npm run dev
```

### Firebase Functions

```bash
cd functions
npm install
cp .env.example .env  # Add TELEGRAM_BOT_TOKEN & GEMINI_API_KEY
npm run build
firebase deploy --only functions
```

## Documentation

- [Telegram Integration](docs/TELEGRAM_INTEGRATION.md) - Technical docs for bot implementation
- [Firebase Setup](firebase.json) - Firebase configuration

## Environment Variables

### Web App (.env.local)
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Functions (.env)
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
```

## Version History

- **v2.0.1** - Bot category selection via Firestore categories + cache refresh, improved NLU for shorthand amounts
- **v2.0.0** - Telegram Bot Integration (Receipt OCR, Natural Language, Account Linking)
- **v1.6.0** - AI Financial Advisor
- **v1.5.0** - Financial Simulations
- **v1.0.0** - Initial Release

## License

MIT
