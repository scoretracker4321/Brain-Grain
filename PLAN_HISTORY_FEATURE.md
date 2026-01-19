# Plan History & Management Feature

## Overview
Added comprehensive plan history management to each pod. Users can now view, manage, execute, and delete accepted plans, as well as submit feedback for executed plans.

## Features

### 1. Plan History Storage
- Multiple plan versions per pod stored with unique IDs and timestamps
- Each plan entry includes:
  - Unique ID (timestamp-based)
  - Plan content (raw JSON)
  - Facilitator HTML
  - System Notes
  - Session type (welcome, first, followup, custom)
  - Status (accepted or executed)
  - Timestamps (created, accepted, executed)
  - Provider info

### 2. Plan History Modal
- **New "📋 Plans" button** on each pod card
- Two-tab interface:
  - **Accepted Plans Tab** - Shows all accepted, non-executed plans
  - **Executed Plans Tab** - Shows all executed plans

### 3. Accepted Plans Management
For each accepted plan, users can:
- **View** - Display the facilitator card and details
- **Execute** - Mark the plan as executed for this session
- **Delete** - Remove the plan from history

### 4. Executed Plans Management
For each executed plan, users can:
- **View** - Review the session plan and notes
- **Feedback** - Submit session feedback (existing functionality)

### 5. Plan Information Display
Each plan shows:
- Plan number (most recent first)
- Date and time accepted/executed
- Session type (Welcome, First, Follow-up, or Custom reason)
- Quick action buttons

## User Interface

### Pod Card Changes
```
[Summary] [📋 Plans] [View Plan] [Edit] [Delete]
```

The new "📋 Plans" button opens the plan history modal.

### Plan History Modal Layout
```
┌─────────────────────────────────────┐
│ Pod Name - Plan History         × │
├─────────────────────────────────────┤
│ [Accepted Plans (3)] [Executed (2)]│
│                                     │
│ Plan 3                              │
│ Accepted: Jan 18 2026, 10:30 AM    │
│ Type: Welcome Session              │
│ [View] [Execute] [Delete]          │
│                                     │
│ Plan 2                              │
│ Accepted: Jan 17 2026, 02:15 PM    │
│ Type: Follow-up Session            │
│ [View] [Execute] [Delete]          │
│                                     │
│ Plan 1                              │
│ Accepted: Jan 16 2026, 09:45 AM    │
│ Type: Custom - Leadership Workshop │
│ [View] [Execute] [Delete]          │
└─────────────────────────────────────┘
```

## Technical Implementation

### Storage Structure
```
// Main history storage (per pod)
braingrain_pod_plans_${podId} = [
  {
    id: "1705607000000",
    plan: "raw JSON from AI",
    facilitatorHtml: "formatted HTML",
    systemNotesHtml: "system notes HTML",
    provider: "openai",
    ts: 1705606800000,
    acceptedAt: 1705607000000,
    summary: { ... },
    sessionType: "welcome",
    status: "accepted"
  },
  { ... more plans ... }
]

// Backward compatibility (latest accepted plan)
braingrain_pod_plan_${podId} = { ... current plan entry ... }

// Execution status
braingrain_pod_exec_${podId} = {
  executed: true,
  executedAt: 1705700000000,
  feedbackComplete: false
}
```

### New Functions

**In admin.js:**

1. `getPlanHistory(podId)` - Retrieves all plans for a pod
2. `openPlanHistoryModal(podId)` - Opens the history modal with tabs
3. `closePlanHistoryModal()` - Closes the modal
4. `switchPlanHistoryTab(tab)` - Switches between accepted/executed tabs
5. `viewPlanHistoryItem(podId, planId)` - Displays a plan in the pod plan modal
6. `executePlanFromHistory(podId, planId)` - Marks a plan as executed
7. `deletePlanHistoryItem(podId, planId)` - Deletes a plan from history

### Modified Functions

**acceptCurrentPlan()** - Now creates a plan entry with metadata and stores in history array

**markPlanAsExecuted()** - Now updates the history entry status and stores execution timestamp

## User Workflow

### Accepting a Plan
1. User generates a pod plan
2. Reviews the facilitator card
3. Clicks "Accept plan"
4. Plan is saved to history with "accepted" status
5. Timestamp recorded

### Executing an Accepted Plan
1. User clicks "📋 Plans" on pod card
2. Finds the plan in "Accepted Plans" tab
3. Clicks "Execute" button
4. Plan status changes to "executed"
5. Execution timestamp recorded

### Viewing Plan Details
1. User clicks "📋 Plans" on pod card
2. Selects "Accepted" or "Executed" tab
3. Finds desired plan
4. Clicks "View"
5. Plan displays in pod plan modal with facilitator card

### Submitting Feedback
1. User executes a plan (or clicks "Execute")
2. Plan moves to "Executed Plans" tab
3. Clicks "Feedback" button
4. Session feedback modal opens
5. Records student-specific feedback

### Deleting a Plan
1. User clicks "📋 Plans" on pod card
2. Finds plan in accepted plans
3. Clicks "Delete"
4. Confirms deletion
5. Plan is removed from history

## Backward Compatibility

- Maintains original single-plan storage (`braingrain_pod_plan_${podId}`)
- Keeps execution status tracking (`braingrain_pod_exec_${podId}`)
- Existing "View Plan" button still works
- All new features are non-breaking additions

## Data Validation

- Plans filtered by status before display
- Timestamp validation ensures chronological ordering
- Error handling for corrupted storage data
- Graceful fallbacks for missing fields

## Styling

- Blue background (#f0f9ff) for accepted plans
- Green background (#f0fdf4) for executed plans
- Clear date and time formatting
- Responsive button layout
- Tab switching with visual indicators

## Files Modified

1. **admin.js**
   - Updated `acceptCurrentPlan()` to store plan history
   - Updated `markPlanAsExecuted()` to update history status
   - Added 7 new plan history management functions
   - Added "📋 Plans" button to pod cards
   - Exported all new functions

2. **index.html**
   - Added `planHistoryModal` HTML structure
   - Added `plan-history-tab` CSS class
   - Integrated with existing modal styling

## Features & Benefits

✓ **Plan Tracking** - Keep all generated plans organized
✓ **Execution Management** - Mark plans as executed with timestamps
✓ **Session Context** - Remember what type of session each plan was for
✓ **Feedback Integration** - Link plans to session feedback
✓ **Non-Breaking** - Backward compatible with existing data
✓ **Cloud Sync Ready** - Works with CloudStorage module

## Testing Checklist

- [ ] Can view plan history modal from pod card
- [ ] Accepted and executed tabs display correctly
- [ ] Can view individual plan details
- [ ] Can execute accepted plan
- [ ] Can delete accepted plan
- [ ] Executed plans show in executed tab
- [ ] Can submit feedback from executed plan
- [ ] Plan count badges update correctly
- [ ] Timestamps display properly
- [ ] Session type displays for each plan
- [ ] No errors in console
- [ ] Cloud sync works with new data

## Future Enhancements

- Export plan history as PDF
- Compare two plans side-by-side
- Template creation from executed plans
- Plan notes/annotations
- Plan rating/quality feedback
- Advanced filtering and search
