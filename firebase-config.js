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
  
  // SINGLE USER MODE: Use a fixed user ID for all data
  // This ensures all data is stored in one place regardless of browser/device
  // Change this if you want to separate data (e.g., per computer, per user)
  const FIXED_USER_ID = 'primary_user';

  async function initializeFirebase() {
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
      console.log(`✓ Using fixed user ID: "${FIXED_USER_ID}" for all data`);
      console.log('  (All devices/browsers will share the same data)');

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
      // Use fixed user ID for consistent single-user data storage
      const userId = FIXED_USER_ID;
      const timestamp = new Date().toISOString();
      
      // CRITICAL: Log what we're about to sync
      console.log(`📤 syncToCloud called for user ${userId}:`);
      console.log(`   Students: ${Array.isArray(students) ? students.length : 'NOT ARRAY'}`);
      console.log(`   Pods: ${Array.isArray(pods) ? pods.length : 'NOT ARRAY'}`);
      if (Array.isArray(pods) && pods.length > 0) {
        console.log(`   Pod names: ${pods.map(p => p.name).join(', ')}`);
      }
      
      // Collect all pod-related metadata (plans, execution, feedback)
      const podMetadata = {};
      if (Array.isArray(pods)) {
        pods.forEach(pod => {
          const podId = pod.id;
          const metadata = {
            plan: null,
            planHistory: null,
            execution: null,
            feedback: null
          };
          
          // Get accepted plan (current/latest - for backward compatibility)
          try {
            const planKey = `braingrain_pod_plan_${podId}`;
            const planData = localStorage.getItem(planKey);
            if (planData) metadata.plan = JSON.parse(planData);
          } catch (e) {}
          
          // Get plan history (all accepted and executed plans)
          try {
            const historyKey = `braingrain_pod_plans_${podId}`;
            const historyData = localStorage.getItem(historyKey);
            if (historyData) metadata.planHistory = JSON.parse(historyData);
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
          if (metadata.plan || metadata.planHistory || metadata.execution || metadata.feedback) {
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
      // Use fixed user ID for consistent single-user data storage
      const userId = FIXED_USER_ID;
      
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
          
          // Restore plan (current/latest - for backward compatibility)
          if (metadata.plan) {
            try {
              localStorage.setItem(`braingrain_pod_plan_${podId}`, JSON.stringify(metadata.plan));
            } catch (e) {}
          }
          
          // Restore plan history (all accepted and executed plans)
          if (metadata.planHistory) {
            try {
              localStorage.setItem(`braingrain_pod_plans_${podId}`, JSON.stringify(metadata.planHistory));
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
      // CRITICAL: Always restore pods if they're missing locally, even if timestamp isn't newer
      const missingPods = (localPods.length === 0 && cloudPods.length > 0);
      const missingStudents = (localStudents.length < cloudStudents.length);
      const newerCloudData = (cloudResult.lastSync && getLastCloudSync() && new Date(cloudResult.lastSync) > getLastCloudSync());
      
      const shouldRecover = missingPods || missingStudents || newerCloudData;
      
      if (missingPods) {
        console.log(`⚠️ PODS MISSING LOCALLY: ${cloudPods.length} pods found in cloud backup`);
      }

      if (shouldRecover) {
        console.log(`🔄 AUTO-RECOVERY: Restoring data from cloud...`);
        console.log(`   Reason: ${missingPods ? 'PODS MISSING' : ''} ${missingStudents ? 'STUDENTS MISSING' : ''} ${newerCloudData ? 'NEWER CLOUD DATA' : ''}`);
        console.log(`   Local: ${localStudents.length} students, ${localPods.length} pods`);
        console.log(`   Cloud: ${cloudStudents.length} students, ${cloudPods.length} pods`);
        
        // Save cloud data to localStorage
        // ALWAYS restore both students AND pods to keep them in sync
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
      const userId = FIXED_USER_ID;
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
      const userId = FIXED_USER_ID;

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
      const userId = FIXED_USER_ID;
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
  const FirebaseConfig = {
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
    verifySyncSuccess,
    // Get the fixed user ID being used for all data
    getCurrentUserId: () => FIXED_USER_ID
  };
  
  // Attach to window with both names for compatibility
  window.FirebaseConfig = FirebaseConfig;
  window.CloudStorage = FirebaseConfig;

  // Auto-restore from cloud on first load OR if pods are missing
  async function autoRestoreFromCloud() {
    if (!isFirebaseEnabled) return;

    try {
      const hasLocalStudents = localStorage.getItem('braingrain_students');
      const hasLocalPods = localStorage.getItem('braingrain_pods');
      const hasRestoredBefore = localStorage.getItem('braingrain_cloud_restored');
      
      // Parse to check actual counts
      let localStudentCount = 0;
      let localPodCount = 0;
      try {
        if (hasLocalStudents) localStudentCount = JSON.parse(hasLocalStudents).length;
        if (hasLocalPods) localPodCount = JSON.parse(hasLocalPods).length;
      } catch (e) {}
      
      console.log(`📊 Local data check: ${localStudentCount} students, ${localPodCount} pods`);
      
      // CRITICAL: Restore if no local data OR if pods are missing but students exist
      const needsRestore = !hasLocalStudents || (localStudentCount > 0 && localPodCount === 0);
      
      if (needsRestore || !hasRestoredBefore) {
        console.log('🔄 Attempting auto-restore from Firebase...');
        if (localStudentCount > 0 && localPodCount === 0) {
          console.warn('⚠️ PODS MISSING but students present - checking Firebase...');
        }
        
        const result = await loadFromCloud();
        
        if (result.success && (result.students.length > 0 || result.pods.length > 0)) {
          let restored = false;
          
          // Restore students if needed
          if (result.students.length > 0) {
            localStorage.setItem('braingrain_students', JSON.stringify(result.students));
            restored = true;
          }
          
          // Always restore pods if available in cloud
          if (result.pods && result.pods.length > 0) {
            localStorage.setItem('braingrain_pods', JSON.stringify(result.pods));
            console.log(`✅ Auto-restored ${result.students.length} students and ${result.pods.length} pods from Firebase`);
            restored = true;
          } else if (result.pods && result.pods.length === 0 && result.students.length === 0) {
            console.log(`⚠️ Cloud has no pods or students - initialization may be needed`);
          } else if (result.students.length > 0) {
            console.log(`✅ Auto-restored ${result.students.length} students from Firebase (no pods in cloud)`);
            restored = true;
          }
          
          if (restored) {
            localStorage.setItem('braingrain_cloud_restored', 'true');
            console.log('🔄 Reloading page to refresh UI with restored data...');
            // Reload page to refresh UI with restored data
            setTimeout(() => location.reload(), 100);
          }
        } else {
          console.log('ℹ️ No cloud data to restore');
          // Even if no restore needed, mark that we've checked to prevent infinite loops
          if (localStudentCount > 0 && localPodCount === 0) {
            localStorage.setItem('braingrain_cloud_restored', 'true');
            console.log('✓ Cloud check complete: pods legitimately absent from cloud');
          }
        }
      } else {
        console.log(`✓ Local data present: ${localStudentCount} students, ${localPodCount} pods - no restore needed`);
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
      const initialized = await initializeFirebase();
      
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
  
  // Diagnostic helper - available in browser console as: FirebaseConfig.diagnose()
  FirebaseConfig.diagnose = function() {
    console.log('=== Firebase Diagnostic ===');
    console.log('Enabled:', isFirebaseEnabled);
    console.log('User ID:', FIXED_USER_ID, '(FIXED - same for all browsers/devices)');
    console.log('Mode: Single-user (all data shared across devices)');
    
    const localStudents = localStorage.getItem('braingrain_students');
    const localPods = localStorage.getItem('braingrain_pods');
    
    try {
      const students = localStudents ? JSON.parse(localStudents) : [];
      const pods = localPods ? JSON.parse(localPods) : [];
      console.log('Local students:', students.length);
      console.log('Local pods:', pods.length);
      if (pods.length > 0) {
        console.log('Pod details:');
        pods.forEach(p => console.log(`  - ${p.name} (ID: ${p.id}, Created: ${p.createdAt})`));
      }
    } catch (e) {
      console.error('Error parsing local data:', e);
    }
    
    console.log('Last sync:', localStorage.getItem('braingrain_last_cloud_sync') || 'never');
    console.log('========================');
  };
})();
