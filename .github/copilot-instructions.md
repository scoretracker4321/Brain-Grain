# Brain Grain - AI Agent Instructions

## Project Overview
Brain Grain is an educational platform for student assessment, pod-based learning management, and AI-powered session planning. The app uses a **hybrid storage model**: localStorage for primary persistence + Firebase for cloud sync.

## Architecture & Data Flow

### Core Components
- **Frontend**: Single-page app in [index.html](../index.html) (2056 lines) - self-contained HTML/CSS/JS
- **Backend**: Express server in [server.js](../server.js) - handles AI requests, keeps API keys secure
- **Storage**: Dual-layer system (see below)
- **AI Integration**: Gemini API via backend proxy for session plan generation

### Data Storage Pattern (CRITICAL)
```
LocalStorage (Primary)          Firebase (Cloud Backup)
├─ braingrain_students     →   /users/{FIXED_USER_ID}/students
├─ braingrain_pods         →   /users/{FIXED_USER_ID}/pods  
├─ braingrain_pod_plans    →   /users/{FIXED_USER_ID}/pod_plans
└─ braingrain_executions   →   /users/{FIXED_USER_ID}/executions
```

**Key localStorage keys** (all prefixed with `braingrain_`):
- `students` - Student records array
- `pods` - Pod groupings
- `pod_plans_{podId}` - Plan history per pod
- `pod_plan_{podId}` - Current plan metadata
- `students_backups` - Last 5 auto-backups
- `last_save` / `last_file_export` - Backup timestamps
- `auto_backup` - Feature toggle (default: enabled)

**Fixed user ID**: `primary_user` - All data stored under single Firebase path (see [firebase-config.js](../firebase-config.js#L43))

### State Management
Global arrays in [index.html](../index.html):
- `allStudents` - Main student array
- `allPods` - Pod configurations
- Helper functions in [utils.js](../utils.js): `loadStudents()`, `saveStudents()`, `loadPods()`, `savePods()`

## Critical Workflows

### 1. Student Data Lifecycle
```javascript
// Load (on page load)
allStudents = StorageHelper.loadStudents(); // utils.js

// Save (on any modification)
StorageHelper.saveStudents(allStudents); // Triggers:
  ├─ Auto-backup (last 5 in localStorage)
  ├─ Cloud sync (if enabled)
  └─ Export reminder (after 7 days)
```

### 2. Pod Plan Generation & Acceptance
```
User clicks "Generate Plan" 
  → SessionType modal (Welcome/First/Follow-up/Custom)
  → POST /api/generate-pod-plan with student data
  → AI returns JSON plan (activities, differentiation, signals)
  → Store in pod.__lastPlanData {raw, facilitatorHtml, sessionType, timestamp}
  → Display in modal

User clicks "Accept Plan"
  → acceptCurrentPlan() adds to pod_plans_{podId} history
  → Immediate sync to Firebase
  → Verify sync success (retry once if failed)
```
See [COMPLETE_WORKFLOW_GUIDE.md](../COMPLETE_WORKFLOW_GUIDE.md) for full flow diagrams.

### 3. Cloud Sync (Firebase)
Auto-triggers on:
- `saveStudents()` / `savePods()` calls
- Plan acceptance
- Execution marking

Manual recovery available via `CloudStorage.autoRecoverFromCloud()` - checks for missing data on dashboard load.

## Development Workflows

### Setup & Run
```bash
# Automated setup (installs deps, creates .env)
npm run setup        # or setup.bat (Windows) / ./setup.sh (Linux/Mac)

# Add Gemini API key to .env
AI_API_KEY=AIza...   # Get from https://aistudio.google.com/app/apikey

# Start dev server
npm start            # Runs server.js on http://localhost:3000
```

### Testing
```bash
npm test             # Jest with jsdom environment (jest.config.js)
```
Test files in [test/](../test/): `storage.test.js`, `setup.js`, `add-test-students.js`

### Backup & Version Control
```bash
# Automated backup (commits + pushes)
backup.bat           # or run task "Backup: Commit and Push"
```

## Project Conventions

### File Organization
- **Root**: Main app files (`index.html`, `server.js`, `utils.js`, `config.js`)
- **Modular JS**: `firebase-config.js`, `deep-analytics.js`, `admin.js`, `analytics.js`
- **Documentation**: `*.md` files (guides, status reports, quick starts)
- **Test**: [test/](../test/) directory
- **Assets**: [assets/](../assets/) (logo, images)

### Configuration Pattern
Centralized config in [config.js](../config.js):
```javascript
window.BrainGrainConfig = {
  app: { name, version, environment },
  features: { cloudSync, autoBackup, analytics, ... },
  ui: { theme, animationsEnabled, toastDuration, ... },
  validation: { minNameLength, phonePattern, ... }
}
```

### Student Data Schema
```javascript
{
  id: "STU_123456",              // Auto-generated
  firstName, lastName, grade, school,
  phone, parentName, parentPhone,
  academicScores: { english, maths, tamil, science, social },
  assessmentStatus: "Pending|Completed",
  assessmentScore: 125,          // Total SEL score
  assessmentSEL: 85,             // Social-Emotional Learning
  assessmentCT: 90,              // Critical Thinking
  assessmentLead: 80,            // Leadership
  intervention_tags: ["focus", "confidence"],
  sel_status: "green|yellow|red"
}
```

### Error Handling Pattern
- UI shows toast notifications via global `showToast(message, type)`
- Backend returns `{ success: boolean, error?: string, useFallback?: boolean }`
- Storage operations wrapped in try-catch with fallback to empty arrays

### Naming Conventions
- Functions: camelCase (`loadStudents`, `generatePodPlan`)
- Global state: camelCase (`allStudents`, `allPods`)
- CSS classes: kebab-case (`btn-primary`, `form-input`)
- localStorage keys: snake_case with prefix (`braingrain_students`)

## Integration Points

### Backend API
- `/api/generate-pod-plan` - AI session plan generation
- `/api/health` - Server + AI config status check

**Request format**:
```javascript
{
  podSummary: "3 students: ...",
  prompt: "Generate Day 1 welcome session...",
  studentsData: JSON.stringify(students) // Full student objects
}
```

### Firebase Realtime Database
Path structure: `/users/primary_user/{students|pods|pod_plans|executions}`
Sync functions in [firebase-config.js](../firebase-config.js): `syncToCloud()`, `autoRecoverFromCloud()`, `verifySyncSuccess()`

### External Dependencies
- **Gemini API**: AI plan generation (configured in `.env`)
- **Firebase SDK**: Loaded via CDN in HTML (`firebase-app.js`, `firebase-database.js`)
- **Express + CORS**: Backend server for API key security

## Common Tasks

### Adding New Student Field
1. Update schema in [index.html](../index.html) form
2. Modify `allStudents` object creation
3. Update `StorageHelper.saveStudents()` if needed
4. Add validation in [config.js](../config.js) `validation` object

### Modifying AI Prompts
Edit system instruction and schema in [server.js](../server.js#L60-100) `POST /api/generate-pod-plan` endpoint.

### Changing Storage Keys
Update constants in [utils.js](../utils.js) - search for `'braingrain_'` prefix. Must also update Firebase paths in [firebase-config.js](../firebase-config.js).

### Adding Analytics
Use [deep-analytics.js](../deep-analytics.js) - provides statistical utilities (mean, median, correlation, regression) for advanced insights.

## Deployment
- **Frontend**: Can deploy to Netlify/Vercel/GitHub Pages (static HTML)
- **Backend**: Configured for Vercel ([vercel.json](../vercel.json)) - routes `/api/*` to [server.js](../server.js)
- **Environment**: Set `AI_API_KEY` in deployment platform's env vars

## Gotchas & Best Practices

⚠️ **Always preserve localStorage key prefixes** - `braingrain_` is used for namespacing
⚠️ **Firebase uses FIXED_USER_ID** - Don't add auth without understanding single-user model
⚠️ **Plan history stored per-pod** - Key format: `braingrain_pod_plans_{podId}`
⚠️ **Auto-backup triggers on every save** - Can be disabled via `braingrain_auto_backup=false`
⚠️ **AI responses must be valid JSON** - Backend parses and validates before returning

✅ Always call `persistStudents()` or `savePods()` after state changes
✅ Use `CloudStorage.isEnabled()` before cloud operations
✅ Verify sync success for critical operations (plans, executions)
✅ Test localStorage operations with mock storage in tests (see [test/setup.js](../test/setup.js))
