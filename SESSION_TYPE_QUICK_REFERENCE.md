# Session Type Feature - Quick Reference Guide

## User Workflow

### Generating a Pod Plan with Session Type Selection

1. **Navigate to Admin Tab** → View existing pods or create a new one
2. **Click "Generate Plan"** on a pod card
3. **Session Type Modal Opens** with 4 options:
   - 👋 Welcome Session
   - 🚀 First Session
   - 📌 Follow-up Session
   - 🎯 Custom Reason (shows text area when selected)
4. **Select an Option** - If custom, describe the session reason
5. **Click "Generate Plan"** - AI creates a tailored plan based on selection
6. **View & Accept/Edit Plan** - Use as normal

## API Implementation

### Backend Request Structure

```json
{
  "podSummary": { ... },
  "prompt": "... includes SESSION TYPE & CONTEXT ...",
  "studentsData": "...",
  "userEdits": "",
  "previousPlan": "",
  "sessionType": "welcome|first|followup|custom"
}
```

### Prompt Addition Example

```
SESSION TYPE & CONTEXT:
Session Type: Welcome Session
Guidance: This is a WELCOME SESSION where students are meeting the pod and facilitator for the first time. Prioritize: safety, comfort, establishing ground rules, ice-breakers, and peer connection. Keep the tone light, warm, and pressure-free.
```

## Code Entry Points

### From User Perspective
- **Start**: Click "Generate Plan" on pod card
- **Trigger**: `generatePodPlan(podId)` in admin.js
- **Action**: Opens `sessionTypeModal` via `openSessionTypeModal()`

### From Developer Perspective
- **Session Type Modal**: `sessionTypeModal` div in index.html
- **Form Handler**: `sessionTypeForm` form with submit listener
- **Processing**: `handleSessionTypeSubmit(e)` in admin.js
- **API Call**: `requestPodPlan(summary, { sessionType: 'type' })` in ai-config.js
- **Prompt Building**: `buildPodPrompt(..., sessionType)` in ai-config.js

## Session Type Guidance (in AI Prompts)

### Welcome
"This is a WELCOME SESSION where students are meeting the pod and facilitator for the first time. Prioritize: safety, comfort, establishing ground rules, ice-breakers, and peer connection. Keep the tone light, warm, and pressure-free."

### First
"This is the FIRST FULL SESSION after students know each other. They have basic comfort with the group. Introduce academic/SEL content gradually with confidence-building activities. Balance exploration with structure."

### Follow-up
"This is a FOLLOW-UP SESSION. Students are familiar with the pod and each other. You can increase cognitive challenge while maintaining emotional safety. Reference previous activities to show progression."

### Custom
Uses the user-provided text from the textarea.

## Key Variables

### Window Objects
- `window.currentPodForPlanGeneration` - Stores pod data while modal is open
- `window.__customSessionReason` - Stores custom session reason for AI use
- `window.currentPodPlanId` - Tracks current pod during plan generation
- `window.__lastPodSummary` - Stores pod summary for API call

### HTML Elements
- `sessionTypeModal` - Main modal container
- `sessionTypeForm` - Form containing radio buttons
- `sessionCustomReason` - Textarea for custom reason
- `customReasonInput` - Container that shows/hides for custom option

### CSS Classes
- `session-type-label` - Styled radio button labels
- `modal-overlay` - Modal background overlay
- `modal-card` - Modal dialog box

## Function Call Chain

```
User clicks "Generate Plan"
    ↓
generatePodPlan(podId)
    ↓ Stores pod data in window.currentPodForPlanGeneration
    ↓
openSessionTypeModal()
    ↓ Modal displays with options
    ↓
User selects type and clicks "Generate Plan"
    ↓
handleSessionTypeSubmit(event)
    ↓ Extracts selected type and custom reason
    ↓ Stores custom reason in window.__customSessionReason
    ↓
requestPodPlan(summary, { sessionType: type })
    ↓
buildPodPrompt(summary, userEdits, previousPlan, sessionType)
    ↓ Maps sessionType to guidance text
    ↓ Adds "SESSION TYPE & CONTEXT" to prompt
    ↓ Returns enriched prompt
    ↓
Backend API receives prompt with session type context
    ↓
AI generates tailored plan
    ↓
Plan displayed to user
```

## Testing Checklist

- [ ] Modal opens when "Generate Plan" is clicked
- [ ] All 4 session type options are selectable
- [ ] Custom reason textarea shows only when custom is selected
- [ ] Form validation requires custom reason if custom selected
- [ ] Plan generation works with each session type
- [ ] AI incorporates session type guidance in prompts
- [ ] Custom reason text appears in AI guidance
- [ ] Modal closes after plan generation starts
- [ ] Regenerate with edits works (sessionType may not be needed here)
- [ ] Styling looks good (hover effects, checked states)
- [ ] No JavaScript console errors

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal won't open | Check if `openSessionTypeModal()` is exported to window |
| Custom reason not showing | Verify radio button change listener is attached |
| Session type not affecting prompt | Check `buildPodPrompt()` receives sessionType parameter |
| AI doesn't mention session type | Verify prompt includes "SESSION TYPE & CONTEXT" section |
| Form won't submit | Ensure form has id="sessionTypeForm" and listener is attached |

## Files Reference

- **index.html** - UI elements, styling, event listeners
  - Lines 321-345: CSS styling for session type labels
  - Lines 1215-1270: Session type modal HTML
  - Lines 1895-1910: Event listener initialization

- **admin.js** - Logic and handlers
  - Line 1008: Modified generatePodPlan()
  - Lines 1191-1243: New session type modal functions
  - Lines 1588-1590: Function exports

- **ai-config.js** - AI prompt building
  - Line 197: Updated buildPodPrompt() signature
  - Lines 203-212: Session type guidance mapping
  - Line 797: Updated requestPodPlan() signature
  - Line 798: buildPodPrompt() call with sessionType
