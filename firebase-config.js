// Firebase Configuration for Brain Grain
// This file handles cloud storage for accessing data from anywhere

(function() {
  'use strict';

  // Firebase configuration - YOU NEED TO ADD YOUR OWN FIREBASE PROJECT CREDENTIALS
  // Get these from: https://console.firebase.google.com/
  // For quick setup: See CLOUD_SETUP_GUIDE.md
  const firebaseConfig = {
    apiKey: "AIzaSyBgv-Ux6V_D2pJhg9k2DPdKabphif1Zn28",
    authDomain: "brain-grain.firebaseapp.com",
    projectId: "brain-grain",
    storageBucket: "brain-grain.firebasestorage.app",
    messagingSenderId: "90394112124",
    appId: "1:90394112124:web:fbc5352420ac372e5ed9f9",
    measurementId: "G-M3XZHB2LC4",
    databaseURL: "https://brain-grain-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

  // Quick setup instructions:
  // 1. Go to https://console.firebase.google.com/
  // 2. Create new project or select existing
  // 3. Click gear icon → Project Settings
  // 4. Scroll to "Your apps" → Add web app
  // 5. Copy the config object and replace above
  // 6. Enable Realtime Database in Firebase console
  // 7. Refresh this page

  // Check if Firebase is loaded and configured
  let firebaseApp = null;
  let db = null;
  let auth = null;
  let isFirebaseEnabled = false;

  function initializeFirebase() {
    try {
      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        console.log('Firebase SDK not loaded. Using localStorage only.');
        return false;
      }

      // Check if config is set (not placeholder)
      if (firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
        console.log('Firebase not configured. Using localStorage only. See firebase-config.js');
        return false;
      }

      // Initialize Firebase
      firebaseApp = firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      auth = firebase.auth();
      isFirebaseEnabled = true;

      console.log('✓ Firebase initialized successfully');

      // Sign in anonymously for now (can upgrade to email/password later)
      // Note: You need to enable Anonymous Authentication in Firebase Console
      // Go to: Authentication → Sign-in method → Anonymous → Enable
      auth.signInAnonymously().catch(err => {
        console.warn('⚠️ Firebase anonymous auth not enabled. Cloud sync will work but use default user ID.');
        console.warn('To enable: Firebase Console → Authentication → Sign-in method → Enable Anonymous');
        console.warn('Error details:', err.code);
      });

      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  // Cloud sync functions
  async function syncToCloud(students) {
    if (!isFirebaseEnabled || !db) {
      return { success: false, reason: 'Firebase not enabled' };
    }

    try {
      // Use authenticated user ID if available, otherwise use 'default' for shared access
      const userId = (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'default';
      const timestamp = new Date().toISOString();
      
      await db.ref(`brain_grain/${userId}/students`).set({
        data: students,
        lastSync: timestamp,
        version: '1.0'
      });

      // Update last sync time in localStorage
      try {
        localStorage.setItem('braingrain_last_cloud_sync', timestamp);
      } catch (e) {}

      console.log('✓ Data synced to cloud');
        try {
          localStorage.setItem('braingrain_last_sync_error', '');
        } catch (e) {}
        return { success: true, timestamp };
    } catch (error) {
      console.error('Cloud sync failed:', error);
      try {
        localStorage.setItem('braingrain_last_sync_error', error.message);
      } catch (e) {}
      return { success: false, error: error.message };
    }
  }

  function getLastSyncError() {
    try {
      return localStorage.getItem('braingrain_last_sync_error') || '';
    } catch (e) {
      return '';
    }
  }

  async function loadFromCloud() {
    if (!isFirebaseEnabled || !db) {
      return { success: false, reason: 'Firebase not enabled' };
    }

    try {
      // Use authenticated user ID if available, otherwise use 'default' for shared access
      const userId = (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'default';
      const snapshot = await db.ref(`brain_grain/${userId}/students`).once('value');
      
      if (!snapshot.exists()) {
        return { success: false, reason: 'No cloud data found' };
      }

      const cloudData = snapshot.val();
      const students = cloudData.data || [];
      const lastSync = cloudData.lastSync;

      console.log(`✓ Loaded ${students.length} students from cloud (last sync: ${lastSync})`);
      return { success: true, students, lastSync };
    } catch (error) {
      console.error('Load from cloud failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function enableAutoSync() {
    if (!isFirebaseEnabled) return false;

    try {
      localStorage.setItem('braingrain_auto_cloud_sync', 'true');
      console.log('✓ Auto cloud sync enabled');
      return true;
    } catch (e) {
      return false;
    }
  }

  function disableAutoSync() {
    try {
      localStorage.setItem('braingrain_auto_cloud_sync', 'false');
      console.log('Auto cloud sync disabled');
      return true;
    } catch (e) {
      return false;
    }
  }

  function isAutoSyncEnabled() {
    try {
      const val = localStorage.getItem('braingrain_auto_cloud_sync');
      return val === 'true';
    } catch (e) {
      return false;
    }
  }

  function getLastCloudSync() {
    try {
      const ts = localStorage.getItem('braingrain_last_cloud_sync');
      return ts ? new Date(ts) : null;
    } catch (e) {
      return null;
    }
  }

  // Export to global
  window.CloudStorage = {
    initializeFirebase,
    syncToCloud,
    loadFromCloud,
    enableAutoSync,
    disableAutoSync,
    isAutoSyncEnabled,
    getLastCloudSync,
    getLastSyncError,
    isEnabled: () => isFirebaseEnabled
  };

  // Auto-initialize on load
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      initializeFirebase();
    });
  }
})();
