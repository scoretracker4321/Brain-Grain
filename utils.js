(function(){
  'use strict';

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : []; } catch (e) { console.error('safeParse failed', e); return []; }
  }

  function _getStorage() {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    // Fallback: create an in-memory storage to keep behavior consistent in tests
    if (typeof globalThis !== 'undefined') {
      if (!globalThis.__bg_local_storage) {
        globalThis.__bg_local_storage = (function(){
          let s = {};
          return { getItem(k){ return s[k] || null; }, setItem(k,v){ s[k] = String(v); }, removeItem(k){ delete s[k]; } };
        })();
      }
      return globalThis.__bg_local_storage;
    }
    return null;
  }

  function loadStudents() {
    try {
      const storage = _getStorage();
      console.log('loadStudents: storage =', storage);
      if (!storage) {
        console.error('loadStudents: no storage available');
        return [];
      }
      const raw = storage.getItem('braingrain_students');
      console.log('loadStudents: raw data =', raw ? raw.substring(0, 100) + '...' : 'null');
      const parsed = safeParse(raw);
      console.log('loadStudents: parsed count =', parsed.length);
      return parsed;
    } catch (e) { 
      console.error('loadStudents failed', e); 
      return []; 
    }
  }

  function saveStudents(arr) {
    try {
      const storage = _getStorage();
      if (!storage) return false;
      storage.setItem('braingrain_students', JSON.stringify(arr));

      // Automatic backups (keep recent history) - enabled by default unless explicitly disabled
      try {
        const autoVal = storage.getItem('braingrain_auto_backup');
        const autoEnabled = (autoVal !== 'false');
        if (autoEnabled) {
          const rawBackups = storage.getItem('braingrain_students_backups');
          const backups = safeParse(rawBackups || '[]');
          backups.push({ ts: new Date().toISOString(), data: arr });
          // keep only last 5 backups
          while (backups.length > 5) backups.shift();
          storage.setItem('braingrain_students_backups', JSON.stringify(backups));
        }
      } catch(e) { /* ignore backup failures */ }

      // Update last save timestamp
      try {
        storage.setItem('braingrain_last_save', new Date().toISOString());
      } catch(e) {}

      // Sync to cloud if enabled
      if (typeof window !== 'undefined' && window.CloudStorage && window.CloudStorage.isEnabled() && window.CloudStorage.isAutoSyncEnabled()) {
        const pods = loadPods();
        window.CloudStorage.syncToCloud(arr, pods).then(result => {
          if (result.success) {
            console.log('✓ Auto-synced to cloud');
            // Refresh the status indicator if the function is available
            if (typeof window !== 'undefined' && window.showBackupStatus) {
              setTimeout(() => window.showBackupStatus(), 100);
            }
          }
        }).catch(e => console.warn('Cloud sync skipped:', e));
      }

      // Remind user to download backup if hasn't done so in 7 days
      try {
        const lastExport = storage.getItem('braingrain_last_file_export');
        if (!lastExport) {
          // First time - show reminder
          storage.setItem('braingrain_last_file_export', new Date().toISOString());
        } else {
          const daysSinceExport = (Date.now() - new Date(lastExport).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceExport > 7) {
            // Show reminder (will be picked up by UI)
            storage.setItem('braingrain_needs_export_reminder', 'true');
          }
        }
      } catch(e) {}

      return true;
    } catch (e) { console.error('saveStudents failed', e); return false; }
  }

  function getBackups() {
    try { const storage = _getStorage(); if (!storage) return []; return safeParse(storage.getItem('braingrain_students_backups')); } catch(e) { return []; }
  }

  function restoreBackupByIndex(idx) {
    try {
      const backups = getBackups();
      if (!Array.isArray(backups) || backups.length === 0) return false;
      const entry = backups[idx >= 0 ? idx : (backups.length - 1)];
      if (!entry) return false;
      return saveStudents(entry.data);
    } catch(e) { return false; }
  }

  function restoreLatestBackup() { return restoreBackupByIndex(-1); }

  function restoreDemoData() {
    const today = new Date().toISOString();
    const demo = [
      {
        id: 'ALICE_LOW',
        firstName: 'Alice', lastName: 'Kumar', grade: '6', school: 'Sunrise Public School',
        phone: '9876500100', registeredAt: today,
        dob: '2013-05-21',
        doorNo: '12A', street: 'Lake Road', area: 'Shanthi Nagar', city: 'Chennai', pincode: '600042',
        parentName: 'Ravi Kumar', parentRelation: 'Father', parentPhone: '9876500199', parentEmail: 'ravi@example.com',
        childGoodAt: 'Drawing and storytelling', wishForChild: 'Improve confidence in maths', source: 'Friend',
        examType: 'midterm', customExamName: '', maxMarks: 60,
        english: 22, maths: 18, tamil: 26, science: 24, social: 25,
        behaviour: 'Calm, needs encouragement to ask doubts',
        supportNeeds: ['extra-practice', 'one-on-one', 'study-plan'],
        supportOther: 'Focus on fundamentals in arithmetic',
        enjoyDoing: 'Reading comics', findDifficult: 'Word problems',
        assessmentScore: 12,
        assessmentBreakdown: { selPercent: 20, ctPercent: 40, leadPercent: 40 },
        assessmentStatus: 'Completed', assessmentComments: 'Requires foundational support; responds well to positive feedback.'
      },
      {
        id: 'BOB_DEVELOPING',
        firstName: 'Bob', lastName: 'Sharma', grade: '7', school: 'Green Valley School',
        phone: '9876500200', registeredAt: today,
        dob: '2012-08-15',
        doorNo: '44', street: 'MG Road', area: 'Indiranagar', city: 'Bengaluru', pincode: '560038',
        parentName: 'Neha Sharma', parentRelation: 'Mother', parentPhone: '9876500299', parentEmail: 'neha@example.com',
        childGoodAt: 'Sports, teamwork', wishForChild: 'Better study habits', source: 'Facebook',
        examType: 'midterm', maxMarks: 60,
        english: 32, maths: 28, tamil: 30, science: 34, social: 29,
        behaviour: 'Active, occasional distractibility; benefits from structure',
        supportNeeds: ['extra-practice', 'mock-tests', 'study-plan'],
        supportOther: 'Weekly goal-setting and review',
        enjoyDoing: 'Football', findDifficult: 'Long-form writing',
        assessmentScore: 28,
        assessmentBreakdown: { selPercent: 35, ctPercent: 45, leadPercent: 20 },
        assessmentStatus: 'Completed', assessmentComments: 'Developing skills; practice tests improve performance.'
      },
      {
        id: 'CHARLIE_PROGRESSING',
        firstName: 'Charlie', lastName: 'Patel', grade: '8', school: 'Riverdale High',
        phone: '9876500300', registeredAt: today,
        dob: '2011-01-30',
        doorNo: '7/2', street: 'Station Road', area: 'RK Puram', city: 'New Delhi', pincode: '110022',
        parentName: 'Anil Patel', parentRelation: 'Father', parentPhone: '9876500399', parentEmail: 'anil@example.com',
        childGoodAt: 'Problem solving, presentations', wishForChild: 'Balanced academics', source: 'WhatsApp',
        examType: 'midterm', maxMarks: 60,
        english: 38, maths: 36, tamil: 34, science: 40, social: 35,
        behaviour: 'Responsible and collaborative; seeks feedback',
        supportNeeds: ['mock-tests', 'doubt-clearing'],
        supportOther: 'Target weak topics via weekly reviews',
        enjoyDoing: 'Science experiments', findDifficult: 'Memorizing dates in Social',
        assessmentScore: 42,
        assessmentBreakdown: { selPercent: 40, ctPercent: 40, leadPercent: 20 },
        assessmentStatus: 'Completed', assessmentComments: 'Consistent progress; ready for advanced practice sets.'
      },
      {
        id: 'DANA_ADVANCED',
        firstName: 'Dana', lastName: 'Iyer', grade: '8', school: 'Blue Ridge Academy',
        phone: '9876500400', registeredAt: today,
        dob: '2011-11-12',
        doorNo: '88B', street: 'Park Street', area: 'Alwarpet', city: 'Chennai', pincode: '600018',
        parentName: 'Sanjay Iyer', parentRelation: 'Father', parentPhone: '9876500499', parentEmail: 'sanjay@example.com',
        childGoodAt: 'Logical reasoning, reading comprehension', wishForChild: 'Olympiad preparation', source: 'Website',
        examType: 'midterm', maxMarks: 60,
        english: 52, maths: 50, tamil: 48, science: 54, social: 49,
        behaviour: 'Self-driven and focused; mentors peers',
        supportNeeds: ['mock-tests', 'study-plan'],
        supportOther: 'Advanced worksheets and timed practice',
        enjoyDoing: 'Chess', findDifficult: 'Maintaining neat notes',
        assessmentScore: 56,
        assessmentBreakdown: { selPercent: 45, ctPercent: 35, leadPercent: 20 },
        assessmentStatus: 'Completed', assessmentComments: 'High performer; challenge with olympiad-level material.'
      }
    ];
    const ok = saveStudents(demo);
    if (ok) {
      try { savePods([]); } catch (e) { /* ignore */ }
    }
    return ok;
  }

  function isAutoBackupEnabled() { try { const s = _getStorage(); if (!s) return true; return s.getItem('braingrain_auto_backup') !== 'false'; } catch(e) { return true; } }

  function setAutoBackup(enabled) { try { const s = _getStorage(); if (!s) return false; s.setItem('braingrain_auto_backup', enabled ? 'true' : 'false'); return true; } catch(e) { return false; } }

  function getEl(id) { try { return document.getElementById(id); } catch (e) { return null; } }
  function setText(id, text) { const el = getEl(id); if (el) el.textContent = text; }
  function setHTML(id, html) { const el = getEl(id); if (el) el.innerHTML = html; }
  function show(id) { const el = getEl(id); if (el) el.style.display = ''; }
  function hide(id) { const el = getEl(id); if (el) el.style.display = 'none'; }

  function getStudentById(id) {
    if (!id) return null;
    const arr = loadStudents();
    return arr.find(s => s.id === id) || null;
  }

  function saveStudent(student) {
    try {
      if (!student || typeof student !== 'object') return false;
      const arr = loadStudents();
      let idx = -1;
      if (student.id) idx = arr.findIndex(s => s.id === student.id);

      // Ensure stable id and timestamps
      if (!student.id) student.id = 'STU_' + Date.now();
      if (!student.registeredAt) student.registeredAt = new Date().toISOString();

      if (idx !== -1) {
        arr[idx] = Object.assign({}, arr[idx], student);
      } else {
        arr.push(Object.assign({}, student));
      }

      const ok = saveStudents(arr);
      if (!ok) return false;
      return getStudentById(student.id);
    } catch (e) { console.error('saveStudent failed', e); return false; }
  }

  function archiveStudent(id, archived = true) {
    try {
      const arr = loadStudents();
      const idx = arr.findIndex(s => s.id === id);
      if (idx === -1) return false;
      arr[idx].archived = !!archived;
      saveStudents(arr);
      return true;
    } catch (e) { console.error('archiveStudent failed', e); return false; }
  }

  function deleteStudent(id) {
    try {
      if (!id) return false;
      const arr = loadStudents().filter(s => s.id !== id);
      return saveStudents(arr);
    } catch (e) { console.error('deleteStudent failed', e); return false; }
  }

  function loadPods() {
    try {
      const storage = _getStorage();
      if (!storage) return [];
      const raw = storage.getItem('braingrain_pods');
      const parsed = safeParse(raw);
      const pods = Array.isArray(parsed) ? parsed : [];
      console.log(`Loaded ${pods.length} pods from localStorage`);
      return pods;
    } catch (e) {
      console.error('loadPods failed', e);
      return [];
    }
  }

  function savePods(arr) {
    try {
      const storage = _getStorage();
      if (!storage) return false;
      const normalized = Array.isArray(arr) ? arr : [];
      storage.setItem('braingrain_pods', JSON.stringify(normalized));
      console.log(`✓ Saved ${normalized.length} pods to localStorage`);
      
      // CRITICAL: Auto-sync to cloud with verification
      if (typeof window !== 'undefined' && window.CloudStorage && window.CloudStorage.isEnabled() && window.CloudStorage.isAutoSyncEnabled()) {
        const students = loadStudents();
        console.log(`🔄 Syncing ${students.length} students and ${normalized.length} pods to cloud...`);
        
        window.CloudStorage.syncToCloud(students, normalized).then(async result => {
          if (result.success) {
            console.log('✓ Pods auto-synced to cloud successfully');
            
            // VERIFY the sync was successful
            if (window.CloudStorage.verifySyncSuccess) {
              try {
                const verification = await window.CloudStorage.verifySyncSuccess(students.length, normalized.length);
                if (!verification.verified) {
                  console.error('⚠️ SYNC VERIFICATION FAILED - Retrying...');
                  // Retry once
                  setTimeout(() => {
                    window.CloudStorage.syncToCloud(students, normalized).then(retry => {
                      if (retry.success) {
                        console.log('✓ Retry sync successful');
                      } else {
                        console.error('❌ Retry sync failed:', retry.error);
                      }
                    });
                  }, 1000);
                }
              } catch (verifyErr) {
                console.warn('Verification check failed:', verifyErr);
              }
            }
            
            // Refresh the status indicator if the function is available
            if (typeof window !== 'undefined' && window.showBackupStatus) {
              setTimeout(() => window.showBackupStatus(), 100);
            }
          } else {
            console.error('❌ Pod cloud sync failed:', result.error || result.reason);
          }
        }).catch(err => console.error('Pod cloud sync error:', err));
      }
      
      return true;
    } catch (e) {
      console.error('savePods failed', e);
      return false;
    }
  }

  function getPodById(id) {
    if (!id) return null;
    const pods = loadPods();
    return pods.find(p => p.id === id) || null;
  }

  function savePod(pod) {
    try {
      if (!pod || typeof pod !== 'object') return false;
      const pods = loadPods();
      const payload = Object.assign({}, pod);
      payload.name = (payload.name || '').trim();
      payload.studentIds = Array.from(new Set(payload.studentIds || [])).filter(Boolean);
      if (!payload.id) payload.id = 'POD_' + Date.now();
      const idx = pods.findIndex(p => p.id === payload.id);
      const existing = idx >= 0 ? pods[idx] : null;
      const now = new Date().toISOString();
      if (!payload.createdAt && existing && existing.createdAt) payload.createdAt = existing.createdAt;
      if (!payload.createdAt) payload.createdAt = now;
      payload.updatedAt = now;
      if (idx >= 0) {
        pods[idx] = Object.assign({}, pods[idx], payload);
      } else {
        pods.push(payload);
      }

      const ok = savePods(pods);
      if (!ok) return false;
      return getPodById(payload.id);
    } catch (e) {
      console.error('savePod failed', e);
      return false;
    }
  }

  function deletePod(id) {
    try {
      if (!id) return false;
      const pods = loadPods().filter(p => p.id !== id);
      return savePods(pods);
    } catch (e) {
      console.error('deletePod failed', e);
      return false;
    }
  }

  function exportStudentsToFile() {
    try {
      const students = loadStudents();
      const pods = loadPods();
      const backups = getBackups();
      const exportData = {
        students: students,
        pods: pods,
        backups: backups,
        exportDate: new Date().toISOString(),
        version: '1.1'
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `braingrain-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      markExported();
      return true;
    } catch (e) { console.error('exportStudentsToFile failed', e); return false; }
  }

  function importStudentsFromFile(fileContent, replaceExisting = false) {
    try {
      const importData = JSON.parse(fileContent);
      if (!importData.students || !Array.isArray(importData.students)) {
        throw new Error('Invalid file format');
      }
      const pods = Array.isArray(importData.pods) ? importData.pods : null;
      let students = importData.students;
      if (!replaceExisting) {
        const existing = loadStudents();
        const existingIds = existing.map(s => s.id);
        students = students.filter(s => !existingIds.includes(s.id));
        students = existing.concat(students);
      }
      const success = saveStudents(students);
      if (success && pods) {
        try { savePods(pods); } catch (e) { console.warn('savePods skipped during import', e); }
      }
      if (success && importData.backups && Array.isArray(importData.backups)) {
        try {
          const storage = _getStorage();
          if (storage) {
            storage.setItem('braingrain_students_backups', JSON.stringify(importData.backups));
          }
        } catch (e) { /* ignore backup restore failure */ }
      }
      return success;
    } catch (e) { console.error('importStudentsFromFile failed', e); return false; }
  }

  function triggerFileImport(replaceExisting = false) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        const success = importStudentsFromFile(event.target.result, replaceExisting);
        if (success) {
          alert('Data imported successfully! Refreshing...');
          if (typeof window.loadStudents === 'function') window.loadStudents();
          location.reload();
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function getLastSaveTime() {
    try {
      const storage = _getStorage();
      if (!storage) return null;
      const ts = storage.getItem('braingrain_last_save');
      return ts ? new Date(ts) : null;
    } catch(e) { return null; }
  }

  function getLastExportTime() {
    try {
      const storage = _getStorage();
      if (!storage) return null;
      const ts = storage.getItem('braingrain_last_file_export');
      return ts ? new Date(ts) : null;
    } catch(e) { return null; }
  }

  function needsExportReminder() {
    try {
      const storage = _getStorage();
      if (!storage) return false;
      return storage.getItem('braingrain_needs_export_reminder') === 'true';
    } catch(e) { return false; }
  }

  function markExported() {
    try {
      const storage = _getStorage();
      if (!storage) return;
      storage.setItem('braingrain_last_file_export', new Date().toISOString());
      storage.removeItem('braingrain_needs_export_reminder');
    } catch(e) {}
  }

  window.StorageHelper = {
    loadStudents,
    saveStudents,
    saveStudent,
    getStudentById,
    archiveStudent,
    deleteStudent,
    getBackups,
    restoreBackupByIndex,
    restoreLatestBackup,
    restoreDemoData,
    isAutoBackupEnabled,
    setAutoBackup,
    exportStudentsToFile,
    importStudentsFromFile,
    triggerFileImport,
    getLastSaveTime,
    getLastExportTime,
    needsExportReminder,
    markExported,
    loadPods,
    savePods,
    savePod,
    deletePod,
    getPodById
  };
  window.DOM = { getEl, setText, setHTML, show, hide };
})();