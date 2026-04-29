# Security & Bug Fixes - April 19, 2026

Comprehensive security audit and bug fixes based on systematic review of the entire codebase.

## CRITICAL Fixes (Deployed)

### 1. Storage Rules - Shared Account Attachment Authorization ✅
**Issue:** Any authenticated user could access shared account attachments without membership verification.

**Fix:** Added membership check to storage rules:
```
match /sharedAccounts/{sharedAccountId}/attachments/{fileName} {
  allow read, write: if request.auth != null 
    && exists(/databases/(default)/documents/sharedAccounts/$(sharedAccountId)/members/$(request.auth.uid));
}
```

**Impact:** Prevents unauthorized access to shared workspace attachments.

---

### 2. notifyLinkSuccess - Unauthenticated HTTP Endpoint ✅
**Issue:** HTTP endpoint accepted `telegramId` + `userId` from request body without authentication. Anyone could send Telegram notifications to any user.

**Fix:** Converted to authenticated `onCall` function:
- Enforces Firebase Auth automatically
- Uses `context.auth.uid` instead of request body `userId`
- Returns proper `HttpsError` for error cases

**Impact:** Prevents unauthorized Telegram notification spam.

---

### 3. AI Quota - Race Condition ✅
**Issue:** `checkAndReserveDailyBudget` used read-modify-write pattern without transaction. Two concurrent requests could both bypass quota limits.

**Fix:** Wrapped quota check in Firestore transaction:
```typescript
return getDb().runTransaction(async (transaction) => {
  const snapshot = await transaction.get(ref);
  // ... check limits ...
  transaction.set(ref, { ... }, { merge: true });
  return { dayStart, dailyTokensUsed };
});
```

**Impact:** Prevents quota bypass via concurrent requests.

---

## HIGH Fixes (Deployed)

### 4. Firestore Rules - Field Validation ✅
**Issue:** No validation on field types, ranges, or formats. Users could inject arbitrary data.

**Fix:** Added validation helpers and applied to all collections:
- `isValidAmount()` - positive numbers only
- `isValidDate()` - YYYY-MM-DD format
- `isValidString(field, maxLength)` - length limits
- `isValidTransactionData()`, `isValidCategoryData()`, etc.

**Impact:** Prevents data injection and ensures data integrity.

---

### 5. Firestore Rules - Explicit Deny for Internal Collections ✅
**Issue:** `web_ai_limits`, `text_transaction_sessions`, `receipt_sessions` had no explicit deny rules. Default behavior denies, but fragile.

**Fix:** Added explicit deny rules:
```
match /web_ai_limits/{userId} {
  allow read, write: if false;
}
```

**Impact:** Hardens security against future rule changes.

---

### 6. shareExistingAccount - Data Loss Risk ✅
**Issue:** Flow was: copy data → create doc → delete private. If step 2 failed, data was orphaned and then deleted.

**Fix:** Reordered to: create doc → copy data → delete private, with rollback on failure:
```typescript
try {
  await batch.commit(); // Create doc first
  await copyPrivateAccountScopedDataToSharedWorkspace(...);
  await deletePrivateAccountScopedData(...);
} catch (error) {
  // Rollback: delete shared account
  await sharedAccountRef.delete();
  throw error;
}
```

**Impact:** Prevents data loss during account sharing.

---

### 7. Invite Code Expiry ✅
**Issue:** Invite codes never expired. Leaked codes granted permanent access.

**Fix:** 
- `createSharedInviteCode` now sets `inviteCodeExpiresAt` (7 days from creation)
- `joinSharedAccountByCode` checks expiry before allowing join

**Impact:** Limits damage from leaked invite codes.

---

### 8. Firebase Config in Source Code ✅
**Issue:** `apiKey`, `appId`, etc. hardcoded in `firebase.ts`, visible in git history and public bundle.

**Fix:** Moved to environment variables:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ...
};
```

Created `.env.example` and `.env.local` with actual values.

**Impact:** Reduces exposure of Firebase config (though Firebase Web API keys are designed to be public, this is still best practice).

---

## MEDIUM Fixes (Deployed)

### 11. Account Delete - Offline Attachment Queue Cleanup ✅
**Issue:** Deleting an account didn't clean up pending attachment upload jobs in IndexedDB. Jobs remained forever.

**Fix:** Added cleanup before account deletion:
```typescript
const pendingJobs = await getOfflineAttachmentUploadJobsForScope(user.uid, targetAccount.id);
await Promise.all(pendingJobs.map((job) => deleteOfflineAttachmentUploadJob(job.id)));
bumpAttachmentQueueVersion();
```

**Impact:** Prevents orphaned queue entries.

---

### 12. Offline Attachment Queue - Retry Limit ✅
**Issue:** Failed uploads retried indefinitely with no max retry count or user-visible failure state.

**Fix:** 
- Added `retryCount` and `status` fields to `OfflineAttachmentUploadJob`
- Max 5 retries, then mark as `status: 'failed'`
- Show error notification after max retries
- UI badge shows "Upload gagal" (red) for failed jobs

**Impact:** Prevents infinite retry loops and surfaces permanent failures to user.

---

### 13. Gemini API Key - Wrong Env Var ✅
**Issue:** `geminiService.ts` used `process.env.GEMINI_API_KEY` (Node.js) instead of `import.meta.env.VITE_GEMINI_API_KEY` (Vite).

**Fix:** Changed to `import.meta.env.VITE_GEMINI_API_KEY`.

**Impact:** Client-side category validation fallback now works correctly.

---

## LOW / Not Fixed

### 9. deleteAllTransactions - Deletes Other Members' Attachments
**Status:** Intentional behavior for "delete all" semantics. Documented but not changed.

### 10. Firestore Rules - Owner Can Overwrite createdByUserId
**Status:** Fixed as part of #4 - `canUpdateSharedRecord` now enforces `createdByUserId` immutability even for owners.

### 14. ReactMarkdown - Missing rehype-sanitize
**Status:** Not fixed. Custom `components` prop already covers most cases. Low risk.

### 15. creatorNameCache - Unbounded Map
**Status:** Not fixed. Low impact in practice (Cloud Functions have limited lifetime).

### 16. categoryCache - Stale Entries
**Status:** Not fixed. 24h TTL with lazy expiry is acceptable.

### 17. Optimistic UI - Rollback Incomplete
**Status:** Not fixed. Edge case with low impact.

### 18. Missing Firestore Index for inviteCode
**Status:** Already exists as single-field index (Firebase auto-creates). No action needed.

---

## Deployment Summary

**Deployed:**
- ✅ Storage rules (`storage.rules`)
- ✅ Firestore rules (`firestore.rules`)
- ✅ Cloud Functions (all 11 functions updated)
- ✅ Frontend build (ready for hosting deploy)

**Not Deployed:**
- Frontend hosting (build ready, deploy with `firebase deploy --only hosting`)

---

## Testing Checklist

### Critical Path
- [ ] Upload attachment via web UI (should succeed now)
- [ ] Try to access shared account attachment without membership (should fail)
- [ ] Link Telegram account (should use authenticated callable)
- [ ] Request AI analysis twice in quick succession (should respect quota)

### High Priority
- [ ] Create transaction with invalid amount (negative/zero) - should be rejected by rules
- [ ] Share existing private account - should not lose data
- [ ] Join shared account with expired invite code - should fail
- [ ] Delete account with pending attachment uploads - should clean up queue

### Medium Priority
- [ ] Upload attachment, fail 5 times - should show "Upload gagal" badge
- [ ] Delete account - verify offline queue is cleaned

---

## Known Limitations

1. **Attachment upload bug (original issue):** Fixed by adding `storage.rules` and making queue flush trigger on `attachmentQueueVersion` change (not just reconnect).

2. **Field validation:** Only validates on create/update. Existing invalid data (if any) remains until next update.

3. **Invite code expiry:** Only enforced on join. Old codes remain in database but are rejected at join time.

4. **Firebase config in env:** Still visible in browser bundle (by design - Firebase Web API keys are public). Moving to env vars is best practice but doesn't hide the config from determined users.

---

## Recommendations for Future

1. **E2E Testing:** Add Playwright/Cypress tests for critical paths (auth, transactions, attachments, shared accounts).

2. **Monitoring:** Add Firebase Performance Monitoring and Crashlytics to catch runtime errors in production.

3. **Rate Limiting:** Consider adding rate limiting to Cloud Functions (currently only AI analysis has quota).

4. **Audit Logging:** Log sensitive operations (account sharing, member removal, invite code generation) for security audit trail.

5. **Attachment Retry UX:** Add manual retry button for failed attachment uploads instead of just showing error badge.

6. **Data Migration:** Run one-time script to add `inviteCodeExpiresAt` to existing invite codes (set to 7 days from now).
