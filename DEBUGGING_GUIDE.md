# Debugging Guide - Telegram Bot Not Responding

## Issue
Bot tidak merespons command `/start`

## Root Cause
**Firestore Collection Group Index Missing**

Error di logs:
```
Error at QueryUtil._getResponse
collectionGroup query requires an index
```

## Solution Applied

### 1. ✅ Added Firestore Index
Created index in `firestore.indexes.json`:
```json
{
  "collectionGroup": "telegram_link",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    {"fieldPath": "telegramId", "order": "ASCENDING"},
    {"fieldPath": "active", "order": "ASCENDING"}
  ]
}
```

### 2. ✅ Deployed Index
```bash
firebase deploy --only firestore:indexes
```

### 3. ⏳ Wait for Index to Build
**IMPORTANT**: Firestore indexes can take **5-15 minutes** to build!

## Check Index Status

### Option 1: Firebase Console
1. Go to: https://console.firebase.google.com/project/expensetracker-test-1/firestore/indexes
2. Look for `telegram_link` collection group index
3. Status should change from "Building" → "Enabled"

### Option 2: Command Line
```bash
# This will show if index is ready
firebase firestore:indexes
```

## Testing After Index is Ready

### 1. Test /start Command
```
1. Open Telegram
2. Find @dompas_bot
3. Send: /start
4. Should get welcome message with link button
```

### 2. Check Logs
```bash
# View recent logs
firebase functions:log

# Or check in console
https://console.firebase.google.com/project/expensetracker-test-1/logs
```

### 3. Test Webhook
```bash
# Check webhook status
curl "https://api.telegram.org/bot8407923805:AAESgk1FGgxefiSPRipuxykkERZJ32IP4UQ/getWebhookInfo"
```

## Expected Timeline

- **Now**: Index is building ⏳
- **5-15 minutes**: Index ready ✅
- **After index ready**: Bot will respond normally 🤖

## Alternative: Temporary Fix

If you want to test immediately without waiting for index, you can modify the code to skip the `checkTelegramLink` query for now:

1. Comment out the collectionGroup query in `linkService.ts`
2. Redeploy functions
3. Test
4. Uncomment after index is ready

But **recommended**: Just wait for the index to build! ⏰

## Verification Steps

Once index is ready:

- [ ] Send `/start` to bot
- [ ] Bot responds with welcome message
- [ ] Click link button
- [ ] Web app opens with token
- [ ] Account linking works
- [ ] Bot sends confirmation

## Status

**Current**: ⏳ Waiting for Firestore index to build (5-15 min)  
**Next**: Test bot after index is ready  
**ETA**: ~10 minutes from now

---

**Pro Tip**: Sambil nunggu index build, kamu bisa setup bot commands di @BotFather:

```
/setcommands
start - Hubungkan akun DompetCerdas
help - Panduan penggunaan bot
link - Generate link token
```

This will make the bot look more professional! 😊
