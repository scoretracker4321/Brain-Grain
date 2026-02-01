# Firebase Database Rules Setup

## 🔥 Quick Fix for Permission Errors

Your platform is showing Firebase permission errors because the database rules need to be configured. Follow these steps:

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your **brain-grain** project
3. Click **Realtime Database** in the left sidebar
4. Click the **Rules** tab

### Step 2: Update Security Rules

Replace the existing rules with these:

```json
{
  "rules": {
    "brain_grain": {
      "primary_user": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** button
2. Wait for confirmation message

### ✅ What This Does

- **Allows public read/write** to the `brain_grain/primary_user` path
- **Enables cloud sync** for students, pods, and plans
- **Fixes permission denied errors** in browser console

### 🔒 Production Security (Later)

For production with multiple users, use:

```json
{
  "rules": {
    "brain_grain": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

This requires Firebase Authentication setup.

### 🚀 Alternative: Disable Cloud Sync

If you prefer to skip Firebase for now:

1. Open User Profile in the platform
2. Toggle **Auto Cloud Sync** to OFF
3. Use localStorage only (works offline, no multi-device sync)

---

**Current Setup**: Single-user mode with fixed ID "primary_user" - suitable for demos and single-device usage.
