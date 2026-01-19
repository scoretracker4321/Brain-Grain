# Complete Pod Plan Workflow - Visual Guide

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         POD CARD                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐        │
│  │📋 Plans    │  │📝 Summary    │  │Generate/View Plan│        │
│  └────────────┘  └──────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
        │                    │                     │
        │                    │                     │
        ▼                    ▼                     ▼
    Plan History        Pod Summary      Session Type Selection
      Modal              Display               Modal
```

---

## 🔄 Complete Workflow

### Step 1: Generate New Plan
```
User clicks "Generate Plan"
         │
         ▼
┌─────────────────────────────┐
│  Session Type Modal Opens   │
│                             │
│  ○ Welcome Session          │
│  ○ First Session            │
│  ○ Follow-up Session        │
│  ○ Custom: [________]       │
│                             │
│     [Generate Plan]         │
└─────────────────────────────┘
         │
         ▼
    User selects type
    & clicks Generate
         │
         ▼
┌─────────────────────────────┐
│   Plan Generation Process   │
│                             │
│  1. Store sessionType       │
│  2. Build AI prompt         │
│  3. Send to backend         │
│  4. Parse AI response       │
│  5. Store in __lastPlanData │
│     - raw (AI JSON)         │
│     - facilitatorHtml       │
│     - sessionType ✅        │
│     - timestamp            │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Plan Modal Opens          │
│                             │
│  Facilitator Card           │
│  Quick View                 │
│  System Notes               │
│                             │
│  [Accept] [Regenerate]      │
└─────────────────────────────┘
```

### Step 2: Accept Plan
```
User clicks "Accept Plan"
         │
         ▼
┌─────────────────────────────────────┐
│   acceptCurrentPlan() Function      │
│                                     │
│  1. Get __lastPlanData              │
│  2. Create plan entry:              │
│     {                               │
│       id: timestamp                 │
│       plan: raw AI response         │
│       facilitatorHtml: HTML         │
│       sessionType: "welcome" ✅     │
│       status: "accepted"            │
│       acceptedAt: timestamp         │
│     }                               │
│  3. Load existing history           │
│  4. Add new plan to array           │
│  5. Save to localStorage:           │
│     - braingrain_pod_plans_${id}    │
│     - braingrain_pod_plan_${id}     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   triggerCloudSync()        │
│                             │
│  1. Get students & pods     │
│  2. Collect pod metadata:   │
│     - plan (current)        │
│     - planHistory ✅        │
│     - execution status      │
│     - feedback              │
│  3. Upload to Firebase      │
└─────────────────────────────┘
         │
         ▼
    ✅ Plan saved & synced
```

### Step 3: View Plan History
```
User clicks "📋 Plans" button
         │
         ▼
┌─────────────────────────────────────┐
│   openPlanHistoryModal(podId)       │
│                                     │
│  1. Load from localStorage:         │
│     braingrain_pod_plans_${podId}   │
│  2. Filter by status:               │
│     - accepted: status="accepted"   │
│     - executed: status="executed"   │
│  3. Render tabs with counts         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│    Plan History Modal               │
│                                     │
│  ┌────────────┬────────────┐        │
│  │📋 Accepted │✓ Executed  │        │
│  │   (3)      │   (2)      │        │
│  └────────────┴────────────┘        │
│                                     │
│  Each plan shows:                   │
│  - Plan number (reversed)           │
│  - Accepted date & time             │
│  - Session type (welcome/first)     │
│  - [View] [Execute] [Delete]        │
└─────────────────────────────────────┘
```

### Step 4: Execute Plan
```
User clicks "Execute" on accepted plan
         │
         ▼
┌─────────────────────────────────────┐
│   executePlanFromHistory()          │
│                                     │
│  1. Find plan by ID in history      │
│  2. Update plan.status to:          │
│     "executed"                      │
│  3. Save updated history            │
│  4. Trigger cloud sync              │
│  5. Refresh modal display           │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Updated Plan History      │
│                             │
│  📋 Accepted (2) ← reduced  │
│  ✓ Executed (3) ← increased │
└─────────────────────────────┘
```

---

## 💾 Storage Architecture

### localStorage Structure
```
braingrain_pod_plans_${podId}  →  Array of plan objects
  ├─ [0] Plan 3 (most recent)
  │   ├─ id: "1737244803000"
  │   ├─ status: "accepted"
  │   ├─ sessionType: "welcome"
  │   └─ ...
  ├─ [1] Plan 2
  │   ├─ id: "1737244802000"
  │   ├─ status: "executed"
  │   ├─ sessionType: "first"
  │   └─ ...
  └─ [2] Plan 1 (oldest)
      ├─ id: "1737244801000"
      ├─ status: "executed"
      ├─ sessionType: "followup"
      └─ ...

braingrain_pod_plan_${podId}  →  Current/latest plan (backward compat)
  └─ Same structure as array item
```

### Firebase Cloud Structure
```
brain_grain/
  └─ fixed_user/
      └─ data/
          ├─ students: [...]
          ├─ pods: [...]
          ├─ podMetadata:
          │   ├─ pod_1:
          │   │   ├─ plan: {...}            ← Current plan
          │   │   ├─ planHistory: [...]     ← All plans ✅
          │   │   ├─ execution: {...}
          │   │   └─ feedback: [...]
          │   └─ pod_2:
          │       └─ ...
          ├─ lastSync: "2026-01-18T..."
          └─ version: "1.2"
```

---

## 🔍 Data Flow Diagram

```
┌──────────────┐
│ Generate Plan│
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Session Type Modal   │
│ (Welcome/First/...)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ requestPodPlan()             │
│ - Includes sessionType param │
└──────┬───────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ window.__lastPlanData          │
│ {                              │
│   sessionType: "welcome" ✅    │
│   facilitatorHtml: "..."       │
│   raw: "..."                   │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ User clicks Accept       │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ acceptCurrentPlan()            │
│ - Reads __lastPlanData         │
│ - Saves to pod_plans array     │
│ - Triggers cloud sync          │
└──────┬─────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ localStorage│   │   Firebase   │   │  UI Update   │
│ pod_plans   │   │  planHistory │   │  Show "View  │
│   array     │   │   synced ✅  │   │   Plan"      │
└─────────────┘   └──────────────┘   └──────────────┘
```

---

## 🎯 Key Integration Points

### 1. Session Type → AI Prompt
```javascript
// ai-config.js: buildPodPrompt()
const sessionTypeGuidance = {
  welcome: 'WELCOME SESSION where students meet for first time...',
  first: 'FIRST FULL SESSION after students know each other...',
  followup: 'FOLLOW-UP SESSION. Students familiar with pod...',
  custom: '' // Filled with user input
};
```

### 2. AI Response → Plan Data
```javascript
// ai-config.js: requestPodPlan()
window.__lastPlanData = {
  raw: rawText,
  facilitatorHtml,
  sessionType: sessionType || 'followup'  ← STORED HERE
};
```

### 3. Accept → History Array
```javascript
// admin.js: acceptCurrentPlan()
const planEntry = {
  id: Date.now().toString(),
  sessionType: data.sessionType || 'followup',  ← RETRIEVED HERE
  status: 'accepted'
};
planHistory.unshift(planEntry);
```

### 4. History → Cloud Sync
```javascript
// firebase-config.js: syncToCloud()
const historyKey = `braingrain_pod_plans_${podId}`;
const historyData = localStorage.getItem(historyKey);
metadata.planHistory = JSON.parse(historyData);  ← SYNCED HERE
```

### 5. Cloud → Local Restore
```javascript
// firebase-config.js: loadFromCloud()
if (metadata.planHistory) {
  localStorage.setItem(
    `braingrain_pod_plans_${podId}`,
    JSON.stringify(metadata.planHistory)  ← RESTORED HERE
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Session type selection appears when clicking "Generate Plan"
- [ ] Custom reason textarea shows/hides based on selection
- [ ] Generated plan includes correct session type context
- [ ] Accepted plan appears in "📋 Plans" modal under "Accepted"
- [ ] Session type displayed correctly (Welcome/First/Follow-up/Custom)
- [ ] Execute button moves plan to "Executed Plans" tab
- [ ] Delete button removes plan from history
- [ ] Cloud sync shows "Syncing..." indicator
- [ ] Console shows "✓ Cloud synced after action"
- [ ] Load from cloud restores all plan history
- [ ] Plan history persists across browser sessions

---

## 🐛 Common Issues & Solutions

### Issue: Plan not appearing in history
**Solution**: Check console for:
```javascript
const podId = 'YOUR_POD_ID';
const key = `braingrain_pod_plans_${podId}`;
console.log(localStorage.getItem(key));
```
If `null`, the plan wasn't saved. Verify `acceptCurrentPlan()` was called.

### Issue: Session type shows as "undefined"
**Solution**: Regenerate plans after the fix. Old plans default to "followup".

### Issue: Cloud sync fails
**Solution**: 
1. Check Firebase connection in Settings
2. Look for console errors: `Cloud sync skipped: ...`
3. Verify auto-sync is enabled
4. Check internet connection

### Issue: Plans duplicated after cloud load
**Solution**: This shouldn't happen with array structure, but if it does:
```javascript
// Manually deduplicate
const podId = 'YOUR_POD_ID';
let plans = JSON.parse(localStorage.getItem(`braingrain_pod_plans_${podId}`) || '[]');
plans = plans.filter((plan, idx, arr) => arr.findIndex(p => p.id === plan.id) === idx);
localStorage.setItem(`braingrain_pod_plans_${podId}`, JSON.stringify(plans));
```

---

## 📝 Summary

✅ **Session Type** properly flows from modal → AI prompt → plan data → history
✅ **Plan History** stored in versioned array per pod
✅ **Cloud Sync** includes full plan history for all pods
✅ **Backward Compatible** with existing single-plan storage
✅ **Multi-Device** sync works seamlessly via Firebase

**Next**: Test the workflow, accept plans with different session types, and verify cloud sync!
