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
      if (!storage) return [];
      return safeParse(storage.getItem('braingrain_students'));
    } catch (e) { console.error('loadStudents failed', e); return []; }
  }

  function saveStudents(arr) {
    try {
      // debug: ensure storage available
      if (typeof console !== 'undefined' && console && console.log) {
        try { console.log('_getStorage debug:', typeof window !== 'undefined', !!(typeof window !== 'undefined' && window.localStorage), !!(typeof global !== 'undefined' && global.localStorage)); } catch(e){}
      }
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
    const demo = [
      { firstName: 'Demo', lastName: 'Student', grade: '8', phone: '9876500000', id: 'DEMO_1', registeredAt: new Date().toISOString() },
      { firstName: 'Sample', lastName: 'User', grade: '6', phone: '9876500001', id: 'DEMO_2', registeredAt: new Date().toISOString() }
    ];
    return saveStudents(demo);
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
    setAutoBackup
  };
  window.DOM = { getEl, setText, setHTML, show, hide };
})();