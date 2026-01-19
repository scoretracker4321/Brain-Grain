# Session Type Selection Feature - Visual Summary

## User Interface

### Before: Direct Plan Generation
```
Pod Card
├── Summary Button
├── Generate Plan Button  ← Click here
└── Edit Button

→ Plan Modal Opens Immediately
```

### After: Two-Step Process
```
Pod Card
├── Summary Button
├── Generate Plan Button  ← Click here
└── Edit Button

→ Session Type Modal Opens First
   ├── 👋 Welcome Session (Radio)
   ├── 🚀 First Session (Radio)
   ├── 📌 Follow-up Session (Radio)
   └── 🎯 Custom Reason (Radio)
       └── [Text Area - appears when selected]
       
   [Cancel] [Generate Plan] Buttons

→ Plan Modal Opens with AI Plan
```

## Modal Screenshot Layout

```
┌─────────────────────────────────────────────┐
│ Select Session Type                      × │
├─────────────────────────────────────────────┤
│ Choose why this plan is being generated.    │
│ This helps tailor the activities.          │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ ◉ 👋 Welcome Session                 │  │
│ │   First time students are meeting    │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ ○ 🚀 First Session                   │  │
│ │   First full session after intros    │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ ○ 📌 Follow-up Session               │  │
│ │   Continuing from previous sessions  │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ ○ 🎯 Custom Reason                   │  │
│ │   Specify your own reason            │  │
│ └──────────────────────────────────────┘  │
│                                             │
│                        [Cancel] [Generate] │
└─────────────────────────────────────────────┘
```

## Custom Reason Input (When Selected)

```
┌─────────────────────────────────────────────┐
│ ...                                          │
│ ┌──────────────────────────────────────┐   │
│ │ ◉ 🎯 Custom Reason                   │   │
│ │   Specify your own reason            │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ Please describe the reason for this session │
│ ┌─────────────────────────────────────┐   │
│ │ E.g., Focus on leadership skills,   │   │
│ │ catch-up after absences, special    │   │
│ │ activity, etc.                      │   │
│ └─────────────────────────────────────┘   │
│                                             │
│                        [Cancel] [Generate] │
└─────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────┐
│  Pod Card       │
│ [Generate Plan] │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  openSessionTypeModal()      │
│  Show selector              │
└────────┬────────────────────┘
         │
         │ User selects type
         │ (and custom reason)
         ▼
┌─────────────────────────────┐
│ handleSessionTypeSubmit()    │
│ - Validate selection        │
│ - Store custom reason       │
│ - Close modal               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ requestPodPlan(summary, {   │
│   sessionType: 'type'       │
│ })                          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ buildPodPrompt(...,         │
│   sessionType)              │
│ - Add SESSION TYPE context  │
│ - Add guidance text         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Send to Backend API         │
│ with sessionType in request │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ AI Generates Plan           │
│ (with session type guidance)│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Display Pod Plan Modal      │
│ [Facilitator Card]          │
│ [Quick View]                │
│ [System Notes]              │
└─────────────────────────────┘
```

## Prompt Integration

### Before (without session type):
```
Create a Day 1 Brain Grain pod session for "Pod Name" with TWO clear outputs:

SESSION CONTEXT:
- Duration: 45 minutes
- Pod-based learning
- Focus on SEL, Critical Thinking, and Leadership
- Students may have uneven language access
...
```

### After (with session type):
```
Create a Brain Grain pod session for "Pod Name" with TWO clear outputs:

SESSION TYPE & CONTEXT:
Session Type: Welcome Session
Guidance: This is a WELCOME SESSION where students are meeting the pod and 
facilitator for the first time. Prioritize: safety, comfort, establishing ground 
rules, ice-breakers, and peer connection. Keep the tone light, warm, and 
pressure-free.

SESSION CONTEXT:
- Duration: 45 minutes
- Pod-based learning
- Focus on SEL, Critical Thinking, and Leadership
- Students may have uneven language access
...
```

## Expected AI Behavior by Session Type

### Welcome Session
- Focus on getting to know each other
- Build trust and safety
- Light, non-threatening activities
- Establish group norms
- Lots of ice-breakers and bonding

### First Session
- Students know each other but pod is new
- Balance fun with some academic content
- Build confidence
- Start introducing SEL and CT concepts
- Mix energizers with learning

### Follow-up Session
- Students are comfortable together
- Can go deeper with content
- Reference previous sessions
- Increase complexity gradually
- Build on established relationships

### Custom Session
- Uses the specific reason provided
- AI tailors activities to that exact context
- E.g., "catch-up after 2-week break" → focus on re-engagement
- E.g., "leadership workshop" → activities focused on leadership skills
- E.g., "behavioral reset" → structure and positive reinforcement

## Color Coding & Emojis

```
Welcome        👋  (wave emoji) - Warm greeting
First Session  🚀  (rocket emoji) - Launching into activities
Follow-up      📌  (pin emoji) - Continuing/pinned
Custom         🎯  (target emoji) - Specific aim/reason
```

## Styling Enhancements

### Radio Button Label States

#### Default State
```
┌──────────────────────────────┐
│ ○ Label Text                 │
│   Description                │
└──────────────────────────────┘
```

#### Hover State
```
┌──────────────────────────────┐
│ ○ Label Text              ←  │ (border becomes blue)
│   Description                │ (slight background highlight)
└──────────────────────────────┘
```

#### Checked State
```
┌──────────────────────────────┐
│ ◉ Label Text              ←  │ (solid radio button)
│   Description                │ (blue border & background)
└──────────────────────────────┘
```

## Component Hierarchy

```
index.html
├── sessionTypeModal (div)
│   ├── header
│   │   ├── h3 "Select Session Type"
│   │   └── close button (×)
│   ├── info-box
│   │   └── Instructions text
│   └── sessionTypeForm (form)
│       ├── Radio button container
│       │   ├── Welcome label + radio
│       │   ├── First label + radio
│       │   ├── Follow-up label + radio
│       │   └── Custom label + radio
│       ├── customReasonInput (div, hidden by default)
│       │   └── textarea#sessionCustomReason
│       └── Buttons
│           ├── Cancel button
│           └── Generate Plan button
│
admin.js
├── generatePodPlan(podId)
├── openSessionTypeModal()
├── closeSessionTypeModal()
└── handleSessionTypeSubmit(e)
│
ai-config.js
├── buildPodPrompt(..., sessionType)
└── requestPodPlan(summary, options)
```

## Error Prevention

✓ Form validation:
- Radio button must be selected
- Custom reason required if custom type selected
- Modal won't close until valid

✓ Data integrity:
- Session type stored only while needed
- Cleared on modal close (if cancelled)
- Properly passed through entire chain

✓ UX safeguards:
- Clear labeling of each option
- Helpful descriptions
- Hover states show interactivity
- Textarea only shows when needed
