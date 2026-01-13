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
  async function syncToCloud(students, pods) {
    if (!isFirebaseEnabled || !db) {
      return { success: false, reason: 'Firebase not enabled' };
    }

    try {
      // Use authenticated user ID if available, otherwise use 'default' for shared access
      const userId = (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'default';
      const timestamp = new Date().toISOString();
      
      // Collect all pod-related metadata (plans, execution, feedback)
      const podMetadata = {};
      if (Array.isArray(pods)) {
        pods.forEach(pod => {
          const podId = pod.id;
          const metadata = {
            plan: null,
            execution: null,
            feedback: null
          };
          
          // Get accepted plan
          try {
            const planKey = `braingrain_pod_plan_${podId}`;
            const planData = localStorage.getItem(planKey);
            if (planData) metadata.plan = JSON.parse(planData);
          } catch (e) {}
          
          // Get execution status
          try {
            const execKey = `braingrain_pod_exec_${podId}`;
            const execData = localStorage.getItem(execKey);
            if (execData) metadata.execution = JSON.parse(execData);
          } catch (e) {}
          
          // Get session feedback
          try {
            const feedbackKey = `braingrain_session_feedback_${podId}`;
            const feedbackData = localStorage.getItem(feedbackKey);
            if (feedbackData) metadata.feedback = JSON.parse(feedbackData);
          } catch (e) {}
          
          // Only include if there's any metadata
          if (metadata.plan || metadata.execution || metadata.feedback) {
            podMetadata[podId] = metadata;
          }
        });
      }
      
      // Sync students, pods, and all pod metadata
      await db.ref(`brain_grain/${userId}/data`).set({
        students: students,
        pods: pods || [],
        podMetadata: podMetadata,
        lastSync: timestamp,
        version: '1.2'
      });

      // Update last sync time in localStorage
      try {
        localStorage.setItem('braingrain_last_cloud_sync', timestamp);
      } catch (e) {}

      console.log('✓ Data synced to cloud (students, pods, and all pod metadata)');
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
      
      // Try new format first (v1.2 with pods and metadata)
      let snapshot = await db.ref(`brain_grain/${userId}/data`).once('value');
      
      if (snapshot.exists()) {
        const cloudData = snapshot.val();
        const students = cloudData.students || [];
        const pods = cloudData.pods || [];
        const podMetadata = cloudData.podMetadata || {};
        const lastSync = cloudData.lastSync;
        
        // Restore pod metadata to localStorage
        Object.keys(podMetadata).forEach(podId => {
          const metadata = podMetadata[podId];
          
          // Restore plan
          if (metadata.plan) {
            try {
              localStorage.setItem(`braingrain_pod_plan_${podId}`, JSON.stringify(metadata.plan));
            } catch (e) {}
          }
          
          // Restore execution status
          if (metadata.execution) {
            try {
              localStorage.setItem(`braingrain_pod_exec_${podId}`, JSON.stringify(metadata.execution));
            } catch (e) {}
          }
          
          // Restore feedback
          if (metadata.feedback) {
            try {
              localStorage.setItem(`braingrain_session_feedback_${podId}`, JSON.stringify(metadata.feedback));
            } catch (e) {}
          }
        });
        
        console.log(`✓ Loaded ${students.length} students, ${pods.length} pods, and metadata for ${Object.keys(podMetadata).length} pods from cloud (last sync: ${lastSync})`);
        return { success: true, students, pods, lastSync };
      }
      
      // Fallback to old format (v1.0 without pods)
      snapshot = await db.ref(`brain_grain/${userId}/students`).once('value');
      
      if (!snapshot.exists()) {
        return { success: false, reason: 'No cloud data found' };
      }

      const cloudData = snapshot.val();
      const students = cloudData.data || [];
      const lastSync = cloudData.lastSync;

      console.log(`✓ Loaded ${students.length} students from cloud (old format, last sync: ${lastSync})`);
      return { success: true, students, pods: [], lastSync };
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
      // Default to true if not set (enable auto-sync by default)
      return val !== 'false';
    } catch (e) {
      return true; // Default to enabled
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

  // AUTO-RECOVERY: Check for data loss and restore from cloud
  async function autoRecoverFromCloud() {
    if (!isFirebaseEnabled || !db) {
      console.log('Auto-recovery: Firebase not enabled, skipping');
      return { recovered: false, reason: 'Firebase not enabled' };
    }

    try {
      // Check if local data exists
      let localStudents = [];
      let localPods = [];
      try {
        const studentsRaw = localStorage.getItem('braingrain_students');
        localStudents = studentsRaw ? JSON.parse(studentsRaw) : [];
        const podsRaw = localStorage.getItem('braingrain_pods');
        localPods = podsRaw ? JSON.parse(podsRaw) : [];
      } catch (e) {
        console.error('Error reading local storage:', e);
      }

      // Load from cloud
      const cloudResult = await loadFromCloud();
      
      if (!cloudResult.success) {
        console.log('Auto-recovery: No cloud backup available');
        return { recovered: false, reason: 'No cloud backup' };
      }

      const cloudStudents = cloudResult.students || [];
      const cloudPods = cloudResult.pods || [];

      // Check if cloud has more recent or more complete data
      const shouldRecover = (
        (localPods.length === 0 && cloudPods.length > 0) ||
        (localStudents.length < cloudStudents.length) ||
        (cloudResult.lastSync && getLastCloudSync() && new Date(cloudResult.lastSync) > getLastCloudSync())
      );

      if (shouldRecover) {
        console.log(`🔄 AUTO-RECOVERY: Restoring data from cloud...`);
        console.log(`   Local: ${localStudents.length} students, ${localPods.length} pods`);
        console.log(`   Cloud: ${cloudStudents.length} students, ${cloudPods.length} pods`);
        
        // Save cloud data to localStorage
        try {
          localStorage.setItem('braingrain_students', JSON.stringify(cloudStudents));
          localStorage.setItem('braingrain_pods', JSON.stringify(cloudPods));
          console.log(`✓ AUTO-RECOVERY COMPLETE: Restored ${cloudStudents.length} students and ${cloudPods.length} pods`);
          return { 
            recovered: true, 
            studentsRestored: cloudStudents.length,
            podsRestored: cloudPods.length,
            metadataRestored: Object.keys(cloudResult.podMetadata || {}).length
          };
        } catch (e) {
          console.error('Auto-recovery save failed:', e);
          return { recovered: false, reason: 'Failed to save restored data' };
        }
      } else {
        console.log('Auto-recovery: Local data is up-to-date');
        return { recovered: false, reason: 'Local data is current' };
      }
    } catch (error) {
      console.error('Auto-recovery failed:', error);
      return { recovered: false, error: error.message };
    }
  }

  // Verify sync was successful by checking cloud
  async function verifySyncSuccess(expectedStudentCount, expectedPodCount) {
    if (!isFirebaseEnabled || !db) return { verified: false, reason: 'Firebase not enabled' };

    try {
      const userId = (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'default';
      const snapshot = await db.ref(`brain_grain/${userId}/data`).once('value');
      
      if (!snapshot.exists()) {
        return { verified: false, reason: 'No data in cloud' };
      }

      const cloudData = snapshot.val();
      const cloudStudents = (cloudData.students || []).length;
      const cloudPods = (cloudData.pods || []).length;

      const verified = cloudStudents === expectedStudentCount && cloudPods === expectedPodCount;
      
      if (verified) {
        console.log(`✓ VERIFIED: Cloud has ${cloudStudents} students and ${cloudPods} pods`);
      } else {
        console.warn(`⚠️ VERIFICATION FAILED: Expected ${expectedStudentCount} students and ${expectedPodCount} pods, but cloud has ${cloudStudents} students and ${cloudPods} pods`);
      }

      return { verified, cloudStudents, cloudPods };
    } catch (error) {
      console.error('Verification failed:', error);
      return { verified: false, error: error.message };
    }
  }

  // AI Configuration Management
  async function saveAIConfig(config) {
    if (!isFirebaseEnabled || !db) {
      return { success: false, reason: 'Firebase not enabled' };
    }

    try {
      const userId = (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'default';
      
      await db.ref(`brain_grain/${userId}/ai_config`).set({
        endpoint: config.endpoint || '',
        apiKey: config.apiKey || '',
        model: config.model || 'gemini-1.5-flash',
        updatedAt: new Date().toISOString()
      });

      // Cache locally
      try {
        localStorage.setItem('braingrain_ai_config', JSON.stringify(config));
      } catch (e) {}

      console.log('✓ AI config saved to Firebase');
      
      // Notify backend of new config
      try {
        await fetch(window.location.origin + '/api/ai-config/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
      } catch (e) {
        console.log('Backend config update skipped:', e.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Save AI config failed:', error);
      return { success: false, error: error.message };
    }
  }

  async function loadAIConfig() {
    if (!isFirebaseEnabled || !db) {
      // Try local cache
      try {
        const cached = localStorage.getItem('braingrain_ai_config');
        if (cached) {
          return { success: true, config: JSON.parse(cached), source: 'local-cache' };
        }
      } catch (e) {}
      return { success: false, reason: 'Firebase not enabled' };
    }

    try {
      const userId = (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'default';
      const snapshot = await db.ref(`brain_grain/${userId}/ai_config`).once('value');
      
      if (!snapshot.exists()) {
        return { success: false, reason: 'No AI config found in Firebase' };
      }

      const config = snapshot.val();
      
      // Cache locally
      try {
        localStorage.setItem('braingrain_ai_config', JSON.stringify(config));
      } catch (e) {}
      
      // Update backend
      try {
        await fetch(window.location.origin + '/api/ai-config/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
      } catch (e) {
        console.log('Backend config update skipped:', e.message);
      }

      console.log('✓ AI config loaded from Firebase');
      return { success: true, config, source: 'firebase' };
    } catch (error) {
      console.error('Load AI config failed:', error);
      return { success: false, error: error.message };
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
    saveAIConfig,
    loadAIConfig,
    isEnabled: () => isFirebaseEnabled,
    autoRecoverFromCloud,
    verifySyncSuccess
  };

  // Auto-restore from cloud on first load
  async function autoRestoreFromCloud() {
    if (!isFirebaseEnabled) return;

    try {
      const hasLocalData = localStorage.getItem('braingrain_students');
      const hasRestoredBefore = localStorage.getItem('braingrain_cloud_restored');
      
      // If no local data and haven't restored before, try cloud restore
      if (!hasLocalData && !hasRestoredBefore) {
        console.log('🔄 Attempting auto-restore from Firebase...');
        const result = await loadFromCloud();
        
        if (result.success && result.students.length > 0) {
          localStorage.setItem('braingrain_students', JSON.stringify(result.students));
          // Also restore pods if available
          if (result.pods && result.pods.length > 0) {
            localStorage.setItem('braingrain_pods', JSON.stringify(result.pods));
            console.log(`✅ Auto-restored ${result.students.length} students and ${result.pods.length} pods from Firebase`);
          } else {
            console.log(`✅ Auto-restored ${result.students.length} students from Firebase`);
          }
          localStorage.setItem('braingrain_cloud_restored', 'true');
          
          // Reload page to refresh UI with restored data
          setTimeout(() => location.reload(), 100);
        } else {
          console.log('ℹ️ No cloud data to restore');
        }
      }
    } catch (error) {
      console.log('Auto-restore skipped:', error.message);
    }
  }

  // Auto-load AI config from Firebase
  async function autoLoadAIConfig() {
    if (!isFirebaseEnabled) return;

    try {
      console.log('🤖 Loading AI config from Firebase...');
      const result = await loadAIConfig();
      
      if (result.success) {
        console.log(`✅ AI configured: ${result.config.model} (${result.source})`);
      } else {
        console.log('ℹ️ No AI config in Firebase - configure in User Profile');
      }
    } catch (error) {
      console.log('AI config load skipped:', error.message);
    }
  }

  // Auto-initialize on load
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
      const initialized = initializeFirebase();
      
      if (initialized) {
        // Enable auto-sync by default
        const autoSyncPref = localStorage.getItem('braingrain_auto_cloud_sync');
        if (autoSyncPref === null) {
          // First time - enable auto-sync by default
          await enableAutoSync();
          console.log('✅ Auto-sync enabled by default');
        }
        
        // Auto-restore from cloud if no local data
        await autoRestoreFromCloud();
        
        // Auto-load AI config from Firebase
        await autoLoadAIConfig();
      }
    });
  }
})();
