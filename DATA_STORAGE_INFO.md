# Brain Grain - Data Storage & Safety Guide

## Where is your data stored?

### Primary Storage: Browser LocalStorage
- **Location**: Your browser's localStorage (stored locally on your computer)
- **Key**: `braingrain_students`
- **Path**: Varies by browser:
  - Chrome/Edge: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage`
  - Firefox: `%APPDATA%\Mozilla\Firefox\Profiles\[profile]\storage\default`
  
### Automatic Backups: Browser LocalStorage
- **Location**: Same browser localStorage
- **Key**: `braingrain_students_backups`
- **Retention**: Last 5 saves
- **Frequency**: Every time you save student data

## How automatic is the backup?

### ✅ AUTOMATIC (No Action Required)
1. **LocalStorage Backups**: Every time you save/edit a student, a backup is automatically created
   - Keeps last 5 versions
   - Stored in browser alongside main data
   - Can be restored via "🔄 Restore" button

### ⚠️ SEMI-AUTOMATIC (Reminder After 7 Days)
2. **File Backups**: You need to click the button, but the app reminds you
   - System tracks when you last downloaded a backup file
   - After 7 days, shows a warning banner: "⚠️ It's been over a week since your last file backup"
   - Click "💾 Backup to File" to download JSON file to your computer
   - **This is the MOST RELIABLE backup** (can't be deleted by browser)

## Data Safety Concerns

### ❌ LocalStorage Limitations (Why Your Data Disappeared)
Browser localStorage can be cleared by:
- Browser settings → Clear browsing data
- Privacy/CCleaner tools
- Switching browsers or profiles
- Incognito/private browsing mode
- Browser reinstallation
- Storage quota exceeded
- Some browser extensions

### ✅ Safe Storage Solutions (NOW IMPLEMENTED)

1. **File Backups** (MOST RELIABLE)
   - Click "💾 Backup to File" button
   - Saves JSON file to your Downloads folder
   - Can be restored anytime via "📥 Import"
   - Keep these files in a safe location (OneDrive, Google Drive, etc.)

2. **LocalStorage Backups** (GOOD)
   - Automatic on every save
   - Good for accidental edits/deletions
   - NOT safe from browser data clearing

## Best Practices for Data Safety

### Daily Use:
1. Work normally - automatic localStorage backups protect you

### Weekly (RECOMMENDED):
1. Click "💾 Backup to File" at least once a week
2. Save the JSON file to a cloud storage (OneDrive, Google Drive)

### After Important Changes:
1. Always click "💾 Backup to File" after:
   - Adding multiple students
   - Completing assessments
   - Making bulk changes

### Recovery:
1. If data is lost, try "🔄 Restore" first (shows last 5 localStorage backups)
2. If that fails, use "📥 Import" with your downloaded JSON backup file

## New Features Added for Data Safety

### Backup Status Display
- Shows "Last saved: X mins ago" 
- Shows "Last backup: X days ago"
- Warning banner after 7 days without file backup

### Easy Backup/Restore Buttons
- **💾 Backup to File**: Download complete backup as JSON
- **📥 Import**: Restore from backup file
- **🔄 Restore**: View and restore from last 5 automatic backups
- **Export CSV**: Export student list as CSV

## Future Enhancements (Recommended)

For even better safety, consider:
1. **Cloud sync** (Firebase, Supabase) - automatic cloud backup
2. **Database backend** (MongoDB, PostgreSQL) - centralized storage
3. **Scheduled auto-export** - daily automatic file backups to Downloads folder

## Summary

**Current Status:**
- ✅ Automatic localStorage backups (every save)
- ✅ Manual file backups with reminders (every 7 days)
- ✅ Easy restore from backups
- ✅ Import/export functionality

**Your Action Required:**
- Click "💾 Backup to File" weekly (app will remind you)
- Store backup files safely (cloud storage recommended)

This setup provides good data safety with minimal effort!
