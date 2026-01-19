# Plan History Feature - Quick Start Guide

## What's New?

Each pod now has a **"📋 Plans"** button that shows all accepted and executed plans for that pod.

## How to Use

### View Plan History
1. Find a pod in the Admin tab
2. Click **"📋 Plans"** button
3. See all accepted and executed plans

### Accept a New Plan
1. Click "Generate Plan" on a pod
2. Select session type (Welcome, First, Follow-up, Custom)
3. Review the generated facilitator card
4. Click **"Accept plan"**
5. Plan is saved to the pod's history

### Execute a Plan
**Option 1: From Plan History**
1. Click **"📋 Plans"** on pod
2. Find plan in "Accepted Plans" tab
3. Click **"Execute"**
4. Plan moves to "Executed Plans" tab

**Option 2: From View Plan Modal**
1. Click "View Plan" on pod
2. Click **"Execute Plan"** button (if available)

### Submit Feedback
1. Click **"📋 Plans"** on pod
2. Click **"Executed Plans"** tab
3. Find the executed plan
4. Click **"Feedback"**
5. Record student-specific observations

### Delete a Plan
1. Click **"📋 Plans"** on pod
2. Find plan in "Accepted Plans" tab
3. Click **"Delete"**
4. Confirm deletion

## What Gets Saved?

For each accepted plan:
- **ID** - Unique identifier
- **Accepted Date** - When plan was accepted
- **Session Type** - Welcome / First / Follow-up / Custom
- **Facilitator Card** - The full execution plan
- **System Notes** - AI reasoning and differentiation
- **Provider** - Which AI created it (OpenAI, Gemini, etc.)

## Status Flow

```
Generated Plan
    ↓
[Accept] → Accepted Plan (in history)
    ↓
[Execute] → Executed Plan (in history)
    ↓
[Feedback] → Submit session feedback
```

## Color Coding

- **Accepted Plans** - Blue background
- **Executed Plans** - Green background

## Where Plans Are Stored

Plans are stored in your browser's local storage:
- Accepted plans: `braingrain_pod_plans_${podId}`
- Execution status: `braingrain_pod_exec_${podId}`

Cloud sync automatically backs up all plan history if enabled.

## Common Tasks

| Task | Steps |
|------|-------|
| See all plans for a pod | Click "📋 Plans" → View both tabs |
| Execute latest plan | Click "📋 Plans" → Find plan → "Execute" |
| Re-run a previous plan | Click "📋 Plans" → Find plan → "View" → Mention in feedback |
| Delete wrong plan | Click "📋 Plans" → "Delete" → Confirm |
| Remember plan details | Click "📋 Plans" → "View" → Plan displays in detail modal |

## Tips & Tricks

✓ Session type is saved with each plan for context
✓ All plans are dated - most recent plans appear first
✓ Can execute multiple plans for same pod
✓ Plans can be deleted only from accepted status
✓ Executed plans help track what has been tried

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Plan History button not showing | Page may be cached - refresh browser |
| Plans not saved | Check browser storage isn't full |
| Can't delete plan | Plan may already be executed (view/feedback only) |
| Timestamps wrong | Check device time settings |

## Integration with Existing Features

- ✓ Works with session type selection
- ✓ Integrates with session feedback
- ✓ Syncs to cloud storage
- ✓ Compatible with pod summary
- ✓ Supports all AI providers
