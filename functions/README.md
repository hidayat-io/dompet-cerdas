# Firebase Cloud Functions - DompetCerdas Telegram Bot

This directory contains the Firebase Cloud Functions for the Telegram Bot integration.

## Structure

```
functions/
├── src/
│   ├── bot/
│   │   ├── commands/
│   │   │   ├── start.ts      # /start command handler
│   │   │   └── help.ts       # /help command handler
│   │   └── index.ts          # Bot initialization & message routing
│   ├── services/
│   │   └── linkService.ts    # Account linking service
│   ├── utils/
│   │   └── crypto.ts         # Token generation utilities
│   └── index.ts              # Cloud Functions entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Add your credentials to `.env`**:
   - `TELEGRAM_BOT_TOKEN` - Get from @BotFather
   - `GEMINI_API_KEY` - Get from Google AI Studio
   - `WEB_APP_URL` - Your web app URL (e.g., https://dompas.indoomega.my.id)

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run build:watch
```

### Local testing with emulator
```bash
npm run serve
```

## Deployment

### Deploy all functions
```bash
npm run deploy
```

### Deploy specific function
```bash
firebase deploy --only functions:telegramWebhook
```

## Functions

### `telegramWebhook`
- **Type**: HTTP
- **Region**: asia-southeast1
- **Purpose**: Receives updates from Telegram Bot API
- **URL**: Set this as webhook in Telegram

### `notifyLinkSuccess`
- **Type**: HTTP
- **Region**: asia-southeast1
- **Purpose**: Notifies bot when account is linked from web app

### `healthCheck`
- **Type**: HTTP
- **Region**: asia-southeast1
- **Purpose**: Health check endpoint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `GEMINI_API_KEY` | Gemini AI API key | Yes (Phase 2+) |
| `WEB_APP_URL` | Web app base URL | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |

## Phase 1 Implementation

Phase 1 includes:
- ✅ Bot initialization
- ✅ `/start` command (account linking)
- ✅ `/help` command
- ✅ Account linking service
- ✅ Token generation & validation
- ✅ Web app integration

Phase 2 & 3 (Coming soon):
- 📸 Receipt vision analysis
- 🤖 Natural language processing
- 📊 Query handlers

## Testing

### Set Telegram Webhook
After deploying, set the webhook URL:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://asia-southeast1-expensetracker-test-1.cloudfunctions.net/telegramWebhook"
```

### Check webhook status
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Remove webhook (for local testing)
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

## Troubleshooting

### Function logs
```bash
npm run logs
```

### Check function status
```bash
firebase functions:list
```

### Common issues

1. **"Module not found" errors**: Run `npm install`
2. **TypeScript errors**: Run `npm run build` to check compilation
3. **Webhook not receiving updates**: Check webhook URL and bot token
4. **CORS errors**: Functions are configured for asia-southeast1 region

## Security Notes

- Never commit `.env` file
- Keep bot token secure
- Use environment variables for sensitive data
- Rate limiting is implemented in bot logic
- Token expiry is 5 minutes for security

## Support

For issues or questions, check:
- [TELEGRAM_BOT_TECHNICAL_PLAN.md](../TELEGRAM_BOT_TECHNICAL_PLAN.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md)
