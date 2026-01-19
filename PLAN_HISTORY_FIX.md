# Plan History Storage & Sync Fix

## Issue Identified
Accepted plans were not showing up in the Plan History modal because:
1. **Missing sessionType in plan data**: The `sessionType` was not being stored in `window.__lastPlanData` when the AI generated the plan
2. **Plan history not syncing to cloud**: The cloud sync was only syncing the current plan (`braingrain_pod_plan_${podId}`) but not the plan history array (`braingrain_pod_plans_${podId}`)

## Fixes Applied

### 1. Fixed sessionType Storage (ai-config.js)
**Location**: [ai-config.js](ai-config.js#L894-L904)

**Change**: Added `sessionType` to the plan data object that gets stored when AI generates a plan.

```javascript
window.__lastPlanData = {
  raw: rawText,
  facilitatorHtml,
  systemNotesHtml,
  quickViewHtml,
  provider: data.provider || 'AI',
  summary,
  ts: Date.now(),
  userEdits,
  sessionType: sessionType || 'followup'  // ✅ NOW STORED
};
```

**Impact**: When you accept a plan, it now correctly stores which session type was selected (Welcome, First, Follow-up, or Custom).

---

### 2. Fixed Cloud Sync - Upload (firebase-config.js)
**Location**: [firebase-config.js](firebase-config.js#L94-L134)

**Change**: Added `planHistory` field to metadata collection and sync.

```javascript
const metadata = {
  plan: null,
  planHistory: null,     // ✅ NEW: Syncs all accepted/executed plans
  execution: null,
  feedback: null
};

// Get plan history (all accepted and executed plans)
try {
  const historyKey = `braingrain_pod_plans_${podId}`;
  const historyData = localStorage.getItem(historyKey);
  if (historyData) metadata.planHistory = JSON.parse(historyData);
} catch (e) {}
```

**Impact**: All accepted and executed plans are now automatically synced to Firebase cloud storage.

---

### 3. Fixed Cloud Sync - Download (firebase-config.js)
**Location**: [firebase-config.js](firebase-config.js#L195-L221)

**Change**: Added restoration of `planHistory` from cloud to localStorage.

```javascript
// Restore plan history (all accepted and executed plans)
if (metadata.planHistory) {
  try {
    localStorage.setItem(`braingrain_pod_plans_${podId}`, JSON.stringify(metadata.planHistory));
  } catch (e) {}
}
```

**Impact**: When you load data from cloud (on another device or after clearing localStorage), all plan history is restored.

---

## Storage Structure

Each pod now has the following localStorage keys:

| Key | Purpose | Format |
|-----|---------|--------|
| `braingrain_pod_plan_${podId}` | Current/latest plan (backward compatibility) | Single plan object |
| `braingrain_pod_plans_${podId}` | **Plan history array** (all accepted/executed) | Array of plan objects |
| `braingrain_pod_exec_${podId}` | Execution status | Object with execution metadata |
| `braingrain_session_feedback_${podId}` | Session feedback | Array of feedback objects |

### Plan History Entry Structure
```javascript
{
  id: "1737244800000",           // Timestamp-based unique ID
  plan: "raw AI response",       // Original AI JSON response
  facilitatorHtml: "<div>...</div>", // Formatted HTML for display
  systemNotesHtml: "<div>...</div>", // System notes HTML
  provider: "OpenAI",            // AI provider used
  ts: 1737244800000,             // Generation timestamp
  acceptedAt: 1737244801000,     // When user clicked "Accept"
  summary: {...},                // Pod summary used for generation
  sessionType: "welcome",        // Session type selected
  status: "accepted"             // "accepted" or "executed"
}
```

---

## How to Verify the Fix

### Test 1: Accept a New Plan
1. **Open a pod** and click "Generate Plan"
2. **Select session type**: Welcome / First / Follow-up / Custom
3. **Review the generated plan**
4. **Click "Accept Plan"**
5. **Close the modal**
6. **Click "📋 Plans" button** on the pod card
7. ✅ **Expected**: You should see the plan listed under "Accepted Plans" with correct session type

### Test 2: Execute a Plan
1. **Open "📋 Plans"** for a pod with accepted plans
2. **Click "Execute"** on an accepted plan
3. **Switch to "Executed Plans" tab**
4. ✅ **Expected**: Plan should now appear under "Executed Plans" tab (not in Accepted)

### Test 3: Cloud Sync Verification
1. **Accept a few plans** for different pods
2. **Open browser console** (F12)
3. **Look for sync messages**: `✓ Cloud synced after action`
4. **Check Firebase console** (if you have access) - look for `podMetadata` → `${podId}` → `planHistory`
5. ✅ **Expected**: Console shows successful sync, Firebase contains plan history array

### Test 4: Cloud Restore (Multi-Device)
1. **Accept plans on Device A**
2. **Open the app on Device B** (or clear localStorage and reload)
3. **Click "Load from Cloud"** in Settings
4. **Open "📋 Plans"** for any pod
5. ✅ **Expected**: All plan history restored and visible

---

## Debugging Tips

### Check localStorage directly
Open browser console and run:
```javascript
// Check plan history for a specific pod
const podId = 'YOUR_POD_ID_HERE';
const history = JSON.parse(localStorage.getItem(`braingrain_pod_plans_${podId}`) || '[]');
console.log('Plan History:', history);
console.log('Accepted:', history.filter(p => p.status === 'accepted'));
console.log('Executed:', history.filter(p => p.status === 'executed'));
```

### Check if sessionType is saved
```javascript
const podId = 'YOUR_POD_ID_HERE';
const history = JSON.parse(localStorage.getItem(`braingrain_pod_plans_${podId}`) || '[]');
history.forEach((plan, idx) => {
  console.log(`Plan ${idx + 1}: Type="${plan.sessionType}", Status="${plan.status}"`);
});
```

### Check cloud sync status
```javascript
// Last sync timestamp
console.log('Last Cloud Sync:', localStorage.getItem('braingrain_last_cloud_sync'));

// Check if auto-sync is enabled
console.log('Auto Sync Enabled:', localStorage.getItem('braingrain_auto_cloud_sync'));
```

---

## Migration Notes

### Backward Compatibility
- Existing plans stored in `braingrain_pod_plan_${podId}` continue to work
- Old plans without `sessionType` will default to "followup"
- No data migration required - history builds incrementally as you accept new plans

### Future Plans
Plans accepted AFTER this fix will have:
- ✅ Correct `sessionType` field
- ✅ Automatic cloud sync of history
- ✅ Proper status tracking (accepted → executed)

---

## Technical Summary

### Files Modified
1. **ai-config.js** (Line ~900): Added `sessionType` to `window.__lastPlanData`
2. **firebase-config.js** (Lines 94-134): Added `planHistory` collection in `syncToCloud()`
3. **firebase-config.js** (Lines 195-221): Added `planHistory` restoration in `loadFromCloud()`

### No Breaking Changes
- All existing functionality preserved
- Backward compatible with old plan storage
- Auto-sync continues to work as before
- No changes to UI or user workflow

---

## Next Steps

1. **Test the fix** using the verification steps above
2. **Accept new plans** to build up history for each pod
3. **Verify cloud sync** is working by checking console logs
4. **Test multi-device sync** if you have access to multiple devices
5. **Report any issues** if plans still don't appear in history

---

## Support

If plans still don't show up after this fix:
1. Open browser console (F12)
2. Look for errors related to localStorage or cloud sync
3. Run the debugging commands above
4. Check if `braingrain_pod_plans_${podId}` key exists in localStorage
5. Verify Firebase connection status in Settings → Backup section
