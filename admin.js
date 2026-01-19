// Admin-related functionality extracted from index.html
(function(){
  'use strict';
  // Fallback shims if ai-config.js hasn't attached modal helpers yet
  if (typeof window.setPlanModalState !== 'function') {
    window.setPlanModalState = function({ title, statusText, contentText, isError = false, showSpinner = false }) {
      const modal = document.getElementById('podPlanModal');
      const titleEl = document.getElementById('podPlanTitle');
      const statusEl = document.getElementById('podPlanStatus');
      const spinnerEl = document.getElementById('podPlanSpinner');
      const contentEl = document.getElementById('podFacilitatorCard') || document.getElementById('podPlanContent');
      if (modal) modal.style.display = 'flex';
      if (titleEl && title) titleEl.textContent = title;
      if (statusEl && statusText !== undefined) {
        statusEl.textContent = statusText;
        statusEl.style.color = isError ? '#b91c1c' : 'var(--color-text-secondary)';
      }
      if (contentEl && contentText !== undefined) {
        if (typeof contentText === 'string' && contentText.trim().startsWith('<')) {
          contentEl.innerHTML = contentText;
        } else if (typeof contentText === 'string') {
          // Wrap plain text in HTML
          contentEl.innerHTML = `<div style="padding: 16px; background: #f5f5f5; border-radius: 8px; white-space: pre-wrap; font-family: monospace;">${contentText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
        } else {
          contentEl.textContent = contentText;
        }
      }
      if (spinnerEl) spinnerEl.style.display = showSpinner ? 'inline-block' : 'none';
    };
  }
  if (typeof window.closePodPlanModal !== 'function') {
    window.closePodPlanModal = function() {
      const modal = document.getElementById('podPlanModal');
      if (modal) modal.style.display = 'none';
      window.currentPodPlanId = null;
    };
  }
  // Ensure global alias is available for calls without window.
  var setPlanModalState = window.setPlanModalState;

  // Helper to trigger immediate cloud sync after any action with visual feedback
  async function triggerCloudSync() {
    if (window.CloudStorage && window.CloudStorage.isEnabled() && window.CloudStorage.isAutoSyncEnabled()) {
      // Show syncing indicator
      const statusDiv = document.getElementById('backupStatusDiv');
      if (statusDiv) {
        statusDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; font-size: 13px; color: #92400e;">
          <span style="font-size: 16px; animation: pulse 1s infinite;">☁️</span> <strong>Syncing...</strong>
        </div>`;
      }
      
      try {
        const students = loadStudents();
        const pods = loadPods();
        const result = await window.CloudStorage.syncToCloud(students, pods);
        if (result.success) {
          console.log('✓ Cloud synced after action');
          // Refresh status to show "just now"
          if (window.showBackupStatus) {
            setTimeout(() => window.showBackupStatus(), 100);
          }
        } else {
          // Show error briefly
          if (statusDiv) {
            statusDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fee2e2; border: 1px solid #ef4444; border-radius: 6px; font-size: 13px; color: #991b1b;">
              <span style="font-size: 16px;">⚠️</span> <strong>Sync failed</strong>
            </div>`;
            setTimeout(() => { if (window.showBackupStatus) window.showBackupStatus(); }, 2000);
          }
        }
      } catch (e) {
        console.warn('Cloud sync skipped:', e);
        if (window.showBackupStatus) {
          setTimeout(() => window.showBackupStatus(), 100);
        }
      }
    }
  }

  // Use global allStudents if available, otherwise create local
  let allStudents = (typeof window.allStudents !== 'undefined') ? window.allStudents : [];
  let editingPodId = null;
  let currentPodPlanId = null;

  async function loadStudents() {
    try { 
      const loaded = StorageHelper.loadStudents();
      allStudents = loaded;
      if (typeof window.allStudents !== 'undefined') window.allStudents = loaded;
      console.log('Admin loadStudents: loaded', loaded.length, 'students');

      // AUTO-RECOVERY: Check cloud for missing data
      if (window.CloudStorage && window.CloudStorage.autoRecoverFromCloud) {
        try {
          const recovery = await window.CloudStorage.autoRecoverFromCloud();
          if (recovery.recovered) {
            console.log(`🔄 DATA RECOVERED FROM CLOUD: ${recovery.studentsRestored} students, ${recovery.podsRestored} pods, ${recovery.metadataRestored} pod metadata`);
            // Reload after recovery
            const reloaded = StorageHelper.loadStudents();
            allStudents = reloaded;
            if (typeof window.allStudents !== 'undefined') window.allStudents = reloaded;
            
            // CRITICAL: Also reload pods to refresh UI
            if (typeof loadPods === 'function') {
              console.log('🔄 Reloading pods after recovery...');
              loadPods();
            }
            
            // Show recovery notification
            alert(`✓ Data recovered from cloud backup!\n\n${recovery.studentsRestored} students\n${recovery.podsRestored} pods\n${recovery.metadataRestored} plans/executions restored`);
          } else {
            // Even if no recovery triggered, verify pods are loaded
            console.log('Auto-recovery: No recovery needed. Verifying pods loaded...');
            const currentPods = StorageHelper.loadPods();
            console.log(`Current pods in localStorage: ${currentPods.length}`);
          }
        } catch (e) {
          console.warn('Auto-recovery check failed:', e);
        }
      }

      // If no data, auto-restore rich demo dataset for meaningful summaries/reports
      if (!loaded || loaded.length === 0) {
        try {
          const restored = StorageHelper.restoreDemoData();
          if (restored) {
            const demoLoaded = StorageHelper.loadStudents();
            allStudents = demoLoaded;
            if (typeof window.allStudents !== 'undefined') window.allStudents = demoLoaded;
            console.log('Demo data restored automatically:', demoLoaded.length, 'students');
          }
        } catch (e) {
          console.warn('Auto demo data restore skipped:', e);
        }
      }
    } catch(e) { 
      console.error('loadStudents error:', e); 
      allStudents = []; 
    }

    // sync autoBackup toggle into the UI when admin view loads
    try { const chk = document.getElementById('autoBackupToggle'); if (chk) chk.checked = StorageHelper.isAutoBackupEnabled(); } catch(e) {}

    // Show backup status and reminder
    try { showBackupStatus(); } catch(e) { console.error('showBackupStatus error:', e); }

    const showArchived = document.getElementById('showArchived') && document.getElementById('showArchived').checked;
    const tbody = document.getElementById('studentTableBody');
    
    if (!tbody) {
      console.error('studentTableBody element not found!');
      return;
    }
    
    const displayList = (allStudents || []).filter(s => showArchived ? true : !s.archived);
    
    console.log('Displaying', displayList.length, 'students out of', allStudents.length, 'total');

    if (displayList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No students registered yet</td></tr>';
      const countEl = document.getElementById('studentCount');
      if (countEl) countEl.textContent = displayList.length;
      return;
    }

    let html = '';
    displayList.forEach(student => {
      const academicAvg = calculateAcademicAverage(student);
      const statusClass = student.assessmentStatus === 'Completed' ? 'completed' : (student.assessmentStatus === 'In Progress' ? 'in-progress' : 'pending');

      // Name cell
      const nameCell = `${student.firstName || ''} ${student.lastName || ''}`;

      // Assessment cell
      const assessmentCell = (student.assessmentBreakdown || typeof student.assessmentScore === 'number') 
        ? `<a href="javascript:;" class="link-small" onclick="openAssessment('${student.id}')">View Report</a>` 
        : `<a href="javascript:;" class="link-small" onclick="openAssessment('${student.id}')">Take Assessment</a>`;

      // Registration cell
      const registrationCell = student.registeredAt ? `<a href="javascript:;" class="link-small" onclick="viewStudent('${student.id}')">Summary</a>` : (student.registrationStatus || 'Incomplete');

      // Actions menu
      const actionsMenu = `
        <div class="action-btns" style="position:relative">
          <button class="icon-btn" title="More" aria-haspopup="true" aria-expanded="false" onclick="toggleRowMenu('${student.id}')">⋯</button>
          <div id="row-menu-${student.id}" class="row-menu" style="display:none; position:absolute; right:0; top:28px; z-index:100;">
            <div><button class="icon-btn" onclick="editStudent('${student.id}')">✎ Edit</button></div>
            <div><button class="icon-btn" onclick="if(confirm('${student.archived ? 'Restore this student from archives?' : 'Archive this student?'}')){toggleArchive('${student.id}')}">${student.archived ? '♻ Restore' : '🗄 Archive'}</button></div>
            <div><button class="icon-btn" onclick="if(confirm('Delete this student permanently?')){deleteStudentConfirm('${student.id}')}">🗑️ Delete</button></div>
          </div>
        </div>`;

      html += `
        <tr ${student.archived ? 'style="opacity:0.6"' : ''}>
          <td>${nameCell}</td>
          <td>${student.grade || ''}</td>
          <td>${student.school || ''}</td>
          <td>${student.phone || ''}</td>
          <td>${academicAvg}%</td>
          <td>${registrationCell}</td>
          <td>${assessmentCell}</td>
          <td style="position:relative">${actionsMenu}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
    const countEl = document.getElementById('studentCount');
    if (countEl) countEl.textContent = displayList.length;
    try { renderPods(); } catch(e) { console.warn('renderPods failed', e); }
    console.log('Student table updated with', displayList.length, 'rows');
  }

  function calculateAcademicAverage(student) {
    const subjects = ['english', 'maths', 'tamil', 'science', 'social'];
    const scores = subjects
      .map(s => parseInt(student[s]) || 0)
      .filter(s => s > 0);
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = parseInt(student.maxMarks) || 60;
    const scaledTo100 = Math.round((avg / max) * 100);
    return scaledTo100;
  }

  function viewStudent(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    currentViewedStudentId = studentId;

    const detailContainer = document.getElementById('studentDetailContent');

    const examDisplay = student.examType === 'custom'
      ? (student.customExamName || 'Custom')
      : (student.examType || 'Not selected');

    const subjects = [];
    const max = student.maxMarks || 60;
    if (student.english) subjects.push(`English: ${student.english}/${max}`);
    if (student.maths) subjects.push(`Maths: ${student.maths}/${max}`);
    if (student.tamil) subjects.push(`Tamil: ${student.tamil}/${max}`);
    if (student.science) subjects.push(`Science: ${student.science}/${max}`);
    if (student.social) subjects.push(`Social: ${student.social}/${max}`);

    let supportText = 'Not specified';
    if (Array.isArray(student.supportNeeds) && student.supportNeeds.length > 0) {
      const labels = {
        'extra-practice': 'Extra practice worksheets',
        'one-on-one': 'One-on-one tutoring',
        'doubt-clearing': 'Doubt-clearing sessions',
        'mock-tests': 'Mock tests & practice exams',
        'study-plan': 'Study plan & time management',
        'other': 'Other'
      };
      const items = student.supportNeeds.map(v => labels[v] || v);
      if (student.supportNeeds.includes('other') && student.supportOther) {
        items.push(`Other: ${student.supportOther}`);
      }
      supportText = items.join(', ');
    }

    const html = `
      <div class="detail-section">
        <h3>Student Information</h3>
        <div class="detail-row"><span class="detail-label">Name:</span> ${student.firstName || ''} ${student.lastName || ''}</div>
        <div class="detail-row"><span class="detail-label">DOB:</span> ${student.dob || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Grade:</span> ${student.grade || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">School:</span> ${student.school || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Phone:</span> ${student.phone || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Address:</span> ${student.doorNo || ''}, ${student.street || ''}, ${student.area || ''}, ${student.city || ''} - ${student.pincode || ''}</div>
        <div class="detail-row"><span class="detail-label">When I don't understand:</span> ${student.whenDontUnderstand ? (student.whenDontUnderstand === 'ask-help' ? 'Ask for help' : (student.whenDontUnderstand === 'try-own' ? 'Try on my own' : (student.whenDontUnderstand === 'feel-stuck' ? 'Feel stuck' : student.whenDontUnderstand))) : 'Not answered'}</div>
        <div class="detail-row"><span class="detail-label">One thing I enjoy doing:</span> ${student.enjoyDoing || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">One thing I find difficult:</span> ${student.findDifficult || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Registered At:</span> ${student.registeredAt || 'N/A'}</div>
      </div>

      <div class="detail-section">
        <h3>Parent / Guardian</h3>
        <div class="detail-row"><span class="detail-label">Name:</span> ${student.parentName || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Relationship:</span> ${student.parentRelation || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Phone:</span> ${student.parentPhone || 'N/A'}${student.parentPhoneAlt ? ' | Alt: ' + student.parentPhoneAlt : ''}</div>
        <div class="detail-row"><span class="detail-label">Email:</span> ${student.parentEmail || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Child is good at:</span> ${student.childGoodAt || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Parent wish:</span> ${student.wishForChild || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Heard From:</span> ${student.source || 'N/A'}</div>
      </div>

      <div class="detail-section">
        <h3>Academic</h3>
        <div class="detail-row"><span class="detail-label">Recent Exam:</span> ${examDisplay}</div>
        <div class="detail-row"><span class="detail-label">Subject Scores:</span> ${subjects.length > 0 ? subjects.join(', ') : 'Not provided'}</div>
        <div class="detail-row"><span class="detail-label">Behaviour:</span> ${student.behaviour || 'Not selected'}</div>
      </div>

      <div class="detail-section">
        <h3>Support Needed</h3>
        <div class="detail-row"><span class="detail-label">Requested Support:</span> ${supportText}</div>
      </div>
    `;

    detailContainer.innerHTML = html;

    document.getElementById('adminListView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'block';
    document.getElementById('assessmentScreen').style.display = 'none';
  }

  function backToStudentList() {
    document.getElementById('studentDetailView').style.display = 'none';
    document.getElementById('adminListView').style.display = 'block';
  }

  function toggleArchive(studentId) {
    try {
      if (!studentId) return;
      const student = StorageHelper.getStudentById(studentId);
      const newVal = !(student && student.archived);
      StorageHelper.archiveStudent(studentId, newVal);
      loadStudents();
    } catch (e) {
      console.error('toggleArchive failed', e);
    }
  }

  function toggleRowMenu(studentId) {
    try {
      const id = 'row-menu-' + studentId;
      const el = document.getElementById(id);
      if (!el) return;
      document.querySelectorAll('.row-menu').forEach(m => { if (m.id !== id) m.style.display = 'none'; });
      el.style.display = (el.style.display === 'block') ? 'none' : 'block';
    } catch (e) { console.error('toggleRowMenu failed', e); }
  }

  function deleteStudentConfirm(studentId) {
    if (!studentId) return;
    if (!confirm('Delete this student permanently?')) return;
    try {
      const ok = StorageHelper.deleteStudent(studentId);
      if (ok) {
        initializeStudents();
        loadStudents();
      } else {
        alert('Delete failed');
      }
    } catch (e) {
      console.error('deleteStudentConfirm failed', e);
      alert('Delete failed');
    }
  }

  function restoreDemoData() {
    if (!confirm('This will replace all current students with demo data. Continue?')) return;
    try {
      const ok = StorageHelper.restoreDemoData();
      if (ok) {
        loadStudents();
        alert('Demo data restored');
      } else {
        alert('Restore failed');
      }
    } catch(e) { console.error('restoreDemoData failed', e); alert('Restore failed'); }
  }

  function replaceWithDemoDataNow() {
    if (!confirm('Replace ALL current data with the new demo dataset?')) return;
    try {
      const ok = StorageHelper.restoreDemoData();
      if (ok) {
        alert('Demo data loaded successfully. Refreshing UI...');
        location.reload();
      } else {
        alert('Failed to load demo data.');
      }
    } catch(e) {
      console.error('replaceWithDemoDataNow failed', e);
      alert('Failed to load demo data.');
    }
  }

  function restoreLatestBackup() {
    if (!confirm('Restore latest backup? This will replace current students. Continue?')) return;
    try {
      const ok = StorageHelper.restoreLatestBackup();
      if (ok) {
        loadStudents();
        alert('Latest backup restored');
      } else {
        alert('No backups available to restore');
      }
    } catch(e) { console.error('restoreLatestBackup failed', e); alert('Restore failed'); }
  }

  function toggleAutoBackup(enabled) {
    try { StorageHelper.setAutoBackup(!!enabled); } catch(e) { console.error('toggleAutoBackup failed', e); }
  }

  function openAssessment(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    currentAssessmentStudentId = studentId;

    const avg = calculateAcademicAverage(student);
    const summaryDiv = document.getElementById('assessmentStudentSummary');
    summaryDiv.innerHTML = `
      <strong>${student.firstName || ''} ${student.lastName || ''}</strong> (Grade ${student.grade || 'N/A'})<br>
      School: ${student.school || 'N/A'}<br>
      Phone: ${student.phone || 'N/A'}<br>
      Academic average (scaled to 100): ${avg}%
    `;
    const headerNameEl = document.getElementById('assessmentHeaderName');
    if (headerNameEl) headerNameEl.textContent = `${student.firstName || ''} ${student.lastName || ''}`;

    if (student.assessmentBreakdown) {
      const ab = student.assessmentBreakdown;
      summaryDiv.innerHTML += `
        <div style="margin-top:8px">
          <strong>Assessment:</strong> ${student.assessmentScore || 'N/A'} pts — SEL: ${ab.selPercent}% / CT: ${ab.ctPercent}% / Lead: ${ab.leadPercent}%
        </div>
      `;

      const selEl = document.getElementById('sel-score');
      if (selEl) {
        document.getElementById('welcome-screen').classList.remove('active');
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('assessment-screen').style.display = 'none';
        const results = document.getElementById('results-screen');
        if (results) {
          results.style.display = 'block';
          results.classList.add('active');
        }

        const ctEl = document.getElementById('ct-score');
        const leadEl = document.getElementById('lead-score');
        const selBar = document.getElementById('sel-bar');
        const ctBar = document.getElementById('ct-bar');
        const leadBar = document.getElementById('lead-bar');

        if (selEl) selEl.textContent = (ab.selPercent || 0) + '%';
        if (ctEl) ctEl.textContent = (ab.ctPercent || 0) + '%';
        if (leadEl) leadEl.textContent = (ab.leadPercent || 0) + '%';
        if (selBar) selBar.style.width = (ab.selPercent || 0) + '%';
        if (ctBar) ctBar.style.width = (ab.ctPercent || 0) + '%';
        if (leadBar) leadBar.style.width = (ab.leadPercent || 0) + '%';
      }
    }

    const form = document.getElementById('assessmentForm');
    if (form) {
      form.assessmentScore.value = student.assessmentScore || '';
      form.assessmentComments.value = student.assessmentComments || '';
      form.assessmentStatus.value = student.assessmentStatus || 'Pending';

      document.getElementById('adminListView').style.display = 'none';
      document.getElementById('studentDetailView').style.display = 'none';
      document.getElementById('assessmentScreen').style.display = 'block';
      return;
    }

    if (window.open) {
      const hasResults = !!(student.assessmentScore || (student.assessmentBreakdown && (typeof student.assessmentBreakdown.selPercent === 'number' || typeof student.assessmentBreakdown.ctPercent === 'number' || typeof student.assessmentBreakdown.leadPercent === 'number')));
      const url = `assessment.html?studentId=${encodeURIComponent(studentId)}${hasResults ? '&view=report' : ''}`;
      window.open(url, '_blank');
      return;
    }

    const userInput = document.getElementById('user-name');
    if (userInput) {
      userInput.value = `${student.firstName || ''}${student.lastName ? ' ' + student.lastName : ''}`.trim();

      try {
        const startBtn = document.getElementById('start-assessment-btn');
        if (startBtn) {
          if (student.assessmentScore || (student.assessmentBreakdown && (typeof student.assessmentBreakdown.selPercent === 'number' || typeof student.assessmentBreakdown.ctPercent === 'number' || typeof student.assessmentBreakdown.leadPercent === 'number'))) {
            startBtn.textContent = 'Retake';
          } else {
            startBtn.textContent = 'Start assessment';
          }
        }
      } catch(e) {}

      const welcome = document.getElementById('welcome-screen');
      const assessScreen = document.getElementById('assessment-screen');
      const results = document.getElementById('results-screen');
      if (welcome) { welcome.classList.add('active'); welcome.style.display = 'block'; }
      if (assessScreen) { assessScreen.classList.remove('active'); assessScreen.style.display = 'none'; }
      if (results) { results.classList.remove('active'); results.style.display = 'none'; }

      document.getElementById('adminListView').style.display = 'none';
      document.getElementById('studentDetailView').style.display = 'none';
      document.getElementById('assessmentScreen').style.display = 'block';
    }
  }

  function exportStudents() {
    try {
      const students = StorageHelper.loadStudents() || [];
      const dataStr = JSON.stringify(students, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brain-grain-students-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  }

  function closeAssessment() {
    currentAssessmentStudentId = null;
    document.getElementById('assessmentScreen').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'none';
    document.getElementById('adminListView').style.display = 'block';
  }

  function showBackupStatus() {
    const statusDiv = document.getElementById('backupStatusDiv');
    if (!statusDiv) return;

    const lastSave = StorageHelper.getLastSaveTime();
    const cloudEnabled = window.CloudStorage && window.CloudStorage.isEnabled();
    const lastCloudSync = cloudEnabled ? window.CloudStorage.getLastCloudSync() : null;
    const autoSyncEnabled = cloudEnabled && window.CloudStorage.isAutoSyncEnabled();

    let html = '';
    
    if (cloudEnabled && autoSyncEnabled) {
      if (lastCloudSync) {
        const cloudAgo = getTimeAgo(lastCloudSync);
        const isRecent = (Date.now() - lastCloudSync.getTime()) < 5000; // Within 5 seconds
        html += `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #d1fae5; border: 1px solid #10b981; border-radius: 6px; font-size: 13px; color: #065f46;">
          <span style="font-size: 16px;">☁️</span> <strong>Auto-sync:</strong> ${cloudAgo}${isRecent ? ' <span style="color: #10b981; font-weight: 700;">✓</span>' : ''}
        </div>`;
      } else {
        html += `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; font-size: 13px; color: #92400e;">
          <span style="font-size: 16px;">☁️</span> <strong>Never synced</strong> - Click Profile to sync
        </div>`;
      }
    } else if (cloudEnabled && !autoSyncEnabled) {
      html += `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #e0e7ff; border: 1px solid #6366f1; border-radius: 6px; font-size: 13px; color: #3730a3;">
        <span style="font-size: 16px;">☁️</span> Cloud ready - <a href="javascript:;" onclick="showUserProfile()" style="color: #3730a3; text-decoration: underline; font-weight: 600;">Enable auto-sync</a>
      </div>`;
    } else {
      html += `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #6b7280;">
        <span style="font-size: 16px;">💾</span> Local storage only
      </div>`;
    }

    statusDiv.innerHTML = html;
  }

  function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  async function syncToCloudNow() {
    if (!window.CloudStorage || !window.CloudStorage.isEnabled()) {
      alert('Cloud storage not configured. Click ⚙️ Cloud Settings to set up.');
      return;
    }

    const students = StorageHelper.loadStudents();
    const pods = StorageHelper.loadPods();
    const btn = document.getElementById('cloudSyncBtn');
    const originalText = btn ? btn.textContent : '';
    
    if (btn) btn.textContent = '☁️ Syncing...';
    
    const result = await window.CloudStorage.syncToCloud(students, pods);
    
    if (result.success) {
      alert(`✓ Successfully synced ${students.length} students and ${pods.length} pods to cloud!\n\nYou can now access this data from any device.`);
      loadStudents(); // Refresh to show new sync time
    } else {
      alert(`✗ Cloud sync failed: ${result.error || result.reason}\n\nData is still safe in your browser.`);
      if (btn) btn.textContent = originalText;
    }
  }

  async function loadFromCloudNow() {
    if (!window.CloudStorage || !window.CloudStorage.isEnabled()) {
      alert('Cloud storage not configured.');
      return;
    }

    if (!confirm('Load data from cloud? This will replace your current local data.\n\nMake sure you\'ve backed up first!')) {
      return;
    }

    const result = await window.CloudStorage.loadFromCloud();
    
    if (result.success) {
      StorageHelper.saveStudents(result.students);
      if (result.pods && result.pods.length > 0) {
        const storage = localStorage;
        storage.setItem('braingrain_pods', JSON.stringify(result.pods));
      }
      alert(`✓ Loaded ${result.students.length} students and ${result.pods ? result.pods.length : 0} pods from cloud!\n\nRefreshing...`);
      location.reload();
    } else {
      alert('✗ Failed to load from cloud: ' + (result.error || result.reason));
    }
  }



  function showCloudSettings() {
    const cloudEnabled = window.CloudStorage && window.CloudStorage.isEnabled();
    const autoSyncEnabled = cloudEnabled && window.CloudStorage.isAutoSyncEnabled();
    
    let html = `
      <div style="padding: 32px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">👤</div>
          <h2 style="margin: 0 0 8px 0;">User Profile</h2>
          <p style="margin: 0; color: var(--color-text-secondary);">Manage your account and cloud sync</p>
        </div>
    `;
    
    // AI Configuration Section
    if (cloudEnabled) {
      const cachedConfig = localStorage.getItem('braingrain_ai_config');
      let currentConfig = { endpoint: '', apiKey: '', model: 'gemini-1.5-flash' };
      try {
        if (cachedConfig) currentConfig = JSON.parse(cachedConfig);
      } catch (e) {}
      
      html += `
        <div style="padding: 20px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; margin-bottom: 24px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="font-size: 32px; margin-bottom: 8px;">🤖</div>
            <h3 style="margin: 0 0 8px 0; color: #0c4a6e;">AI Configuration</h3>
            <p style="margin: 0; font-size: 13px; color: #075985;">Configure once, use everywhere (synced via Firebase)</p>
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px;">API Endpoint:</label>
            <input type="text" id="aiEndpointInput" value="${currentConfig.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'}" placeholder="API endpoint URL" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;">
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px;">API Key:</label>
            <input type="password" id="aiApiKeyInput" value="${currentConfig.apiKey || ''}" placeholder="Your Gemini API key (AIza...)" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size: 12px; color: #0ea5e9; text-decoration: none;">Get free Gemini API key →</a>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px;">Model:</label>
            <input type="text" id="aiModelInput" value="${currentConfig.model || 'gemini-1.5-flash'}" placeholder="gemini-1.5-flash" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;">
          </div>
          
          <button id="saveAIConfigBtn" class="btn btn-primary" onclick="saveAIConfigToFirebase()" style="width: 100%;">Save to Firebase</button>
        </div>
      `;
    }
    
    if (!cloudEnabled) {
      html += `
        <div style="padding: 20px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 12px;">☁️</div>
          <h3 style="margin: 0 0 12px 0; color: #92400e;">Cloud Sync Not Active</h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #78350f;">
            Your data is only stored locally in this browser. Enable cloud sync to:
          </p>
          <ul style="text-align: left; margin: 16px 0; padding-left: 24px; font-size: 14px; color: #78350f;">
            <li>Access data from any device</li>
            <li>Automatic backup to cloud</li>
            <li>Never lose data when browser clears</li>
            <li>Share data across multiple users</li>
          </ul>
          <p style="margin: 16px 0 0 0; font-size: 13px; color: #78350f;">
            <strong>Note:</strong> Check the browser console for Firebase connection issues.
          </p>
        </div>
      `;
    } else {
      const lastSync = window.CloudStorage.getLastCloudSync();
      const syncTime = lastSync ? getTimeAgo(lastSync) : 'Never';
      
      html += `
        <div style="padding: 20px; background: #d1fae5; border: 1px solid #10b981; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 12px;">✅</div>
          <h3 style="margin: 0 0 8px 0; color: #065f46;">Cloud Sync Active</h3>
          <p style="margin: 0; font-size: 14px; color: #047857;">
            Your data is automatically backed up to Firebase
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;">
            <strong>Last sync:</strong> ${syncTime}
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <label style="display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid ${autoSyncEnabled ? '#10b981' : 'var(--color-border)'}; border-radius: 12px; cursor: pointer; background: ${autoSyncEnabled ? '#f0fdf4' : 'white'};">
            <input type="checkbox" id="autoCloudSyncToggle" ${autoSyncEnabled ? 'checked' : ''} onchange="toggleAutoCloudSync(this.checked)" style="width: 20px; height: 20px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">🔄 Automatic Cloud Sync (Active)</div>
              <div style="font-size: 13px; color: var(--color-text-secondary);">All changes sync to cloud automatically. Toggle off only if needed.</div>
            </div>
          </label>
        </div>

        <div style="margin-bottom: 24px;">
          <button class="btn btn-primary" onclick="loadFromCloudNow();" style="width: 100%; padding: 20px; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 12px;">
            <span style="font-size: 24px;">🔄</span>
            <div style="text-align: left;">
              <div style="font-weight: 700;">Restore from Cloud</div>
              <div style="font-size: 13px; opacity: 0.8;">Replace local data with cloud backup</div>
            </div>
          </button>
        </div>

        <div style="border-top: 1px solid var(--color-border); padding-top: 20px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--color-text-secondary);">Manual Backup Options</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary" onclick="StorageHelper.exportStudentsToFile(); document.querySelector('div[style*=fixed]').remove();" style="justify-content: flex-start; text-align: left;">
              💾 Download Backup File
            </button>
            <button class="btn btn-secondary" onclick="StorageHelper.triggerFileImport(false); document.querySelector('div[style*=fixed]').remove();" style="justify-content: flex-start; text-align: left;">
              📥 Import from File
            </button>
            <button class="btn btn-secondary" onclick="document.querySelector('div[style*=fixed]').remove(); showBackupManager();" style="justify-content: flex-start; text-align: left;">
              🔄 Restore from History
            </button>
            <button class="btn btn-secondary" onclick="document.querySelector('div[style*=fixed]').remove(); replaceWithDemoDataNow();" style="justify-content: flex-start; text-align: left;">
              📦 Replace with Demo Dataset
            </button>
          </div>
        </div>
      `;
    }

    html += `</div>`;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `<div style="background: white; border-radius: 16px; max-width: 700px; max-height: 85vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <button onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 28px; cursor: pointer; color: var(--color-text-secondary); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">×</button>
      ${html}
    </div>`;
    document.body.appendChild(modal);
  }

  function showUserProfile() {
    showCloudSettings();
  }

  function toggleAutoCloudSync(enabled) {
    if (enabled) {
      window.CloudStorage.enableAutoSync();
    } else {
      window.CloudStorage.disableAutoSync();
    }
  }

  function showBackupManager() {
    const backups = StorageHelper.getBackups();
    if (backups.length === 0) {
      alert('No backups found. The system automatically creates backups when you save student data.');
      return;
    }
    let html = '<div style="padding: 20px; max-width: 600px; margin: 0 auto;">';
    html += '<h3 style="margin-bottom: 16px;">Available Backups</h3>';
    html += '<p style="margin-bottom: 16px; color: var(--color-text-secondary);">Select a backup to restore:</p>';
    backups.reverse().forEach((backup, i) => {
      const realIndex = backups.length - 1 - i;
      const date = new Date(backup.ts).toLocaleString();
      const studentCount = backup.data.length;
      html += `<div style="padding: 12px; margin-bottom: 8px; border: 1px solid var(--color-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${date}</strong><br>
          <span style="color: var(--color-text-secondary); font-size: 13px;">${studentCount} student${studentCount !== 1 ? 's' : ''}</span>
        </div>
        <button class="btn btn-primary btn-small" onclick="restoreBackup(${realIndex})">Restore</button>
      </div>`;
    });
    html += '</div>';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `<div style="background: white; border-radius: 12px; max-width: 700px; max-height: 80vh; overflow-y: auto; position: relative;">
      <button onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 24px; cursor: pointer; color: var(--color-text-secondary);">×</button>
      ${html}
    </div>`;
    document.body.appendChild(modal);
  }

  function restoreBackup(index) {
    if (confirm('This will replace your current student data with this backup. Continue?')) {
      const success = StorageHelper.restoreBackupByIndex(index);
      if (success) {
        alert('Backup restored successfully!');
        location.reload();
      } else {
        alert('Failed to restore backup.');
      }
    }
  }

  function renderPodStudentOptions(selectedIds = []) {
    const listEl = document.getElementById('podStudentCheckboxes');
    if (!listEl) return;

    const activeStudents = (allStudents || []).filter(s => !s.archived);
    if (activeStudents.length === 0) {
      listEl.innerHTML = '<div style="color: var(--color-text-secondary); font-size: 13px;">Add students first to build a pod.</div>';
      return;
    }

    listEl.innerHTML = activeStudents.map(st => {
      const id = `pod-stu-${st.id}`;
      const checked = selectedIds.includes(st.id) ? 'checked' : '';
      const name = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.phone || st.id;
      const grade = st.grade ? ` • Grade ${st.grade}` : '';
      return `<label class="form-checkbox" for="${id}" style="margin-bottom:6px;">
        <input type="checkbox" id="${id}" value="${st.id}" ${checked}> ${name}${grade}
      </label>`;
    }).join('');
  }

  function renderPods() {
    const podContainer = document.getElementById('podList');
    if (!podContainer) return;

    const pods = StorageHelper.loadPods();
    if (!Array.isArray(pods) || pods.length === 0) {
      podContainer.innerHTML = '<div style="padding: 14px; color: var(--color-text-secondary);">No pods yet. Click "Create Pod" to group students.</div>';
      return;
    }

    let html = '';
    pods.forEach(pod => {
      const members = (pod.studentIds || []).map(id => {
        const st = allStudents.find(s => s.id === id);
        if (!st) return null;
        const name = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.phone || st.id;
        return st.grade ? `${name} (G${st.grade})` : name;
      }).filter(Boolean);

      const memberText = members.length ? members.join(', ') : 'No students yet';
      const studentCount = members.length;
      const updated = pod.updatedAt ? new Date(pod.updatedAt).toLocaleDateString() : '';
      
      // Check if pod has accepted plan and execution status
      const planKey = `braingrain_pod_plan_${pod.id}`;
      const execKey = `braingrain_pod_exec_${pod.id}`;
      const hasPlan = !!localStorage.getItem(planKey);
      let execStatus = '';
      try {
        const execData = JSON.parse(localStorage.getItem(execKey) || 'null');
        if (execData && execData.executed) {
          execStatus = '<span style="display:inline-block; margin-left:8px; padding:2px 8px; background:#10b981; color:white; border-radius:4px; font-size:11px;">✓ Executed</span>';
        }
      } catch {}

      html += `
        <div class="pod-card">
          <div class="pod-card__header">
            <div>
              <div class="pod-name">${pod.name || 'Untitled pod'}${execStatus}</div>
              <div class="pod-meta">${studentCount} student${studentCount === 1 ? '' : 's'}${updated ? ' • Updated ' + updated : ''}</div>
            </div>
            <div class="pod-actions" style="display:flex; align-items:center; gap:8px;">
              <button class="btn btn-secondary btn-small" onclick="showPodSummary('${pod.id}')">Summary</button>
              <button class="btn btn-secondary btn-small" onclick="openPlanHistoryModal('${pod.id}')">📋 Plans</button>
              <button class="btn btn-primary btn-small" onclick="generatePodPlan('${pod.id}')">🎯 New Plan</button>
              <div style="position:relative;">
                <button class="btn btn-secondary btn-small" onclick="togglePodMenu('${pod.id}')" style="padding:6px 10px;">⋮</button>
                <div id="podMenu_${pod.id}" style="display:none; position:absolute; right:0; top:100%; margin-top:4px; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:100; min-width:120px;">
                  <button class="btn btn-secondary btn-small" onclick="openPodModal('${pod.id}'); togglePodMenu('${pod.id}')" style="width:100%; text-align:left; border:none; border-radius:0; border-bottom:1px solid #e2e8f0;">✎ Edit</button>
                  <button class="btn btn-secondary btn-small" onclick="deletePod('${pod.id}'); togglePodMenu('${pod.id}')" style="width:100%; text-align:left; border:none; border-radius:0; color:#ef4444;">🗑 Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div class="pod-members">${memberText}</div>
        </div>`;
    });

    podContainer.innerHTML = html;
    updatePodSyncStatus();
  }

  function openPodModal(podId) {
    editingPodId = podId || null;
    const pods = StorageHelper.loadPods();
    const pod = podId ? pods.find(p => p.id === podId) : null;

    const modal = document.getElementById('podModal');
    const titleEl = document.getElementById('podModalTitle');
    const nameInput = document.getElementById('podNameInput');

    if (titleEl) titleEl.textContent = pod ? 'Edit Pod' : 'Create Pod';
    if (nameInput) nameInput.value = pod ? (pod.name || '') : '';

    renderPodStudentOptions(pod && Array.isArray(pod.studentIds) ? pod.studentIds : []);

    if (modal) modal.style.display = 'flex';
  }

  function closePodModal() {
    const modal = document.getElementById('podModal');
    if (modal) modal.style.display = 'none';
    editingPodId = null;
  }

  async function savePodFromModal(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('podNameInput');
    const listEl = document.getElementById('podStudentCheckboxes');
    const podName = nameInput ? nameInput.value.trim() : '';
    const selectedIds = listEl ? Array.from(listEl.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value) : [];

    if (!podName) {
      alert('Please enter a pod name.');
      return;
    }
    if (selectedIds.length === 0) {
      alert('Select at least one student for this pod.');
      return;
    }

    const payload = { id: editingPodId, name: podName, studentIds: selectedIds };
    console.log(`💾 Saving pod: ${podName} with ${selectedIds.length} students`);
    
    const saved = StorageHelper.savePod(payload);
    if (!saved) {
      alert('Could not save pod. Please try again.');
      return;
    }
    
    console.log(`✓ Pod saved successfully: ${saved.name} (${saved.id})`);
    
    // Wait a moment for cloud sync to initiate
    await new Promise(resolve => setTimeout(resolve, 500));

    closePodModal();
    renderPods();
  }

  function deletePod(podId) {
    if (!podId) return;
    if (!confirm('Delete this pod? Students remain in the system.')) return;
    const ok = StorageHelper.deletePod(podId);
    if (ok) renderPods(); else alert('Failed to delete pod.');
  }

  function togglePodMenu(podId) {
    const menu = document.getElementById(`podMenu_${podId}`);
    if (!menu) return;
    
    // Close all other menus first
    document.querySelectorAll('[id^="podMenu_"]').forEach(m => {
      if (m.id !== `podMenu_${podId}`) m.style.display = 'none';
    });
    
    // Toggle current menu
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }

  // Close menus when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.pod-actions')) {
      document.querySelectorAll('[id^="podMenu_"]').forEach(m => m.style.display = 'none');
    }
  });

  function updatePodSyncStatus() {
    // This function can be called from renderPods() to show sync status
    // For now, it's a placeholder that can be expanded later
    if (typeof window.CloudStorage !== 'undefined' && window.CloudStorage.isEnabled()) {
      const pods = StorageHelper.loadPods();
      console.log(`Pod sync status: ${pods.length} pods in localStorage, auto-sync: ${window.CloudStorage.isAutoSyncEnabled()}`);
    }
  }

  async function syncPodsToCloud() {
    if (!window.CloudStorage || !window.CloudStorage.isEnabled()) {
      alert('⚠️ Firebase Cloud Sync is not configured.\n\nClick the "👤 Profile" button to set up cloud sync.');
      return;
    }

    const students = StorageHelper.loadStudents();
    const pods = StorageHelper.loadPods();
    
    console.log(`📊 Pre-sync check: ${students.length} students, ${pods.length} pods in localStorage`);
    
    if (pods.length === 0) {
      alert('⚠️ No pods found in localStorage!\n\nIf you just created a pod, please refresh the page and try again.');
      return;
    }

    console.log(`🔄 MANUAL SYNC: Syncing ${students.length} students and ${pods.length} pods to Firebase...`);
    console.log(`  Pod details: ${pods.map(p => `${p.name} (${p.studentIds.length} students)`).join(', ')}`);
    
    const result = await window.CloudStorage.syncToCloud(students, pods);
    
    if (result.success) {
      // Verify the sync by loading back from cloud
      const verification = await window.CloudStorage.loadFromCloud();
      const cloudPodCount = verification.pods ? verification.pods.length : 0;
      
      if (cloudPodCount === pods.length) {
        alert(`✅ SYNC VERIFIED!\n\n${pods.length} pod${pods.length === 1 ? '' : 's'} successfully synced to Firebase.\n${cloudPodCount} pod${cloudPodCount === 1 ? '' : 's'} verified in cloud.\n\nYour data is safe and accessible from any device!`);
        console.log(`✓ SYNC VERIFIED: ${cloudPodCount} pods confirmed in cloud`);
      } else {
        alert(`⚠️ SYNC WARNING\n\nSynced ${pods.length} pods but only ${cloudPodCount} found in cloud.\n\nPlease try syncing again.`);
        console.error(`⚠️ SYNC MISMATCH: Sent ${pods.length} pods, found ${cloudPodCount} in cloud`);
      }
      
      // Refresh the backup status indicator to show new sync time
      setTimeout(() => showBackupStatus(), 100);
    } else {
      alert(`❌ Sync failed: ${result.error || result.reason}\n\nYour data is still safe in your browser.\n\nTry enabling auto-sync in Profile settings.`);
      console.error('Sync error:', result);
    }
  }

  function getAIConfig() {
    return window.getAIConfig();
  }

  function generatePodPlan(podId) {
    const pod = StorageHelper.getPodById(podId);
    if (!pod) {
      alert('Pod not found');
      return;
    }

    // Ensure allStudents is loaded
    if (!allStudents || allStudents.length === 0) {
      console.log('⚠️ allStudents is empty, reloading from storage...');
      allStudents = StorageHelper.loadStudents();
      if (typeof window.allStudents !== 'undefined') window.allStudents = allStudents;
    }

    const members = (pod.studentIds || []).map(id => allStudents.find(s => s.id === id)).filter(Boolean);
    if (members.length === 0) {
      alert('This pod has no active students.');
      return;
    }

    // Store pod info for session type modal handler
    window.currentPodForPlanGeneration = {
      podId: podId,
      pod: pod,
      members: members,
      summary: window.buildPodSummary(pod, members, calculateAcademicAverage)
    };
    window.currentPodForPlanGeneration.summary.sessionFeedback = getLastFeedbackForPodStudents(podId);

    // Show session type selector modal
    openSessionTypeModal();
  }

  // --- Pod summary view/copy ---
  let lastPodSummaryText = '';

  function buildPodSummaryText(summary) {
    const lines = [];
    lines.push(`Pod: ${summary.podName}`);
    lines.push(`Students: ${summary.studentCount}`);
    summary.students.forEach((st, idx) => {
      const avg = typeof st.academic.averagePercent === 'number' ? `${st.academic.averagePercent}%` : 'N/A';
      const score = typeof st.assessment.score === 'number' ? `${st.assessment.score}` : 'N/A';
      const sel = st.assessment.selPercent != null ? `${st.assessment.selPercent}%` : 'N/A';
      const ct = st.assessment.ctPercent != null ? `${st.assessment.ctPercent}%` : 'N/A';
      const lead = st.assessment.leadPercent != null ? `${st.assessment.leadPercent}%` : 'N/A';
      const tags = Array.isArray(st.supportNeeds) && st.supportNeeds.length ? st.supportNeeds.join(', ') : 'None';
      lines.push(`
${idx + 1}. ${st.name} (Grade ${st.grade || 'N/A'})`);
      lines.push(`   Academic avg: ${avg}`);
      lines.push(`   Support needs: ${tags}`);
      lines.push(`   Assessment: ${st.assessment.status || 'Pending'} | Score: ${score} | SEL: ${sel} | CT: ${ct} | Lead: ${lead}`);
    });
    return lines.join('\n');
  }

  function renderPodSummaryHTML(summary) {
    const studentCards = summary.students.map(st => {
      const avg = typeof st.academic.averagePercent === 'number' ? `${st.academic.averagePercent}%` : 'N/A';
      const score = typeof st.assessment.score === 'number' ? `${st.assessment.score}` : 'N/A';
      const sel = st.assessment.selPercent != null ? `${st.assessment.selPercent}%` : 'N/A';
      const ct = st.assessment.ctPercent != null ? `${st.assessment.ctPercent}%` : 'N/A';
      const lead = st.assessment.leadPercent != null ? `${st.assessment.leadPercent}%` : 'N/A';
      const tags = Array.isArray(st.supportNeeds) && st.supportNeeds.length ? st.supportNeeds.join(', ') : 'None';
      
      // Determine academic performance color
      let avgColor = '#64748b';
      if (typeof st.academic.averagePercent === 'number') {
        if (st.academic.averagePercent >= 80) avgColor = '#10b981';
        else if (st.academic.averagePercent >= 60) avgColor = '#3b82f6';
        else if (st.academic.averagePercent >= 40) avgColor = '#f59e0b';
        else avgColor = '#ef4444';
      }
      
      return `
        <div style="padding:8px; border:1px solid #e2e8f0; border-radius:6px; background:#ffffff; margin-bottom:6px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:5px; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:5px;">
              <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:12px;">${st.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:700; font-size:13px;">${st.name}</div>
                <div style="font-size:11px; color: #64748b;">🎓 Grade ${st.grade || 'N/A'}</div>
              </div>
            </div>
            <div style="padding:2px 8px; background:${avgColor}; color:white; border-radius:12px; font-size:11px; font-weight:600;">${avg}</div>
          </div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">
            <div style="padding:6px; background:#f8fafc; border-radius:4px;">
              <div style="font-size:10px; color:#64748b; margin-bottom:1px;">Status</div>
              <div style="font-size:11px; font-weight:600; color:#334155;">${st.assessment.status || 'Pending'}</div>
            </div>
            <div style="padding:6px; background:#f8fafc; border-radius:4px;">
              <div style="font-size:10px; color:#64748b; margin-bottom:1px;">Score</div>
              <div style="font-size:11px; font-weight:600; color:#334155;">${score}</div>
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; margin-bottom:6px;">
            <div style="text-align:center; padding:4px; background:#fef3c7; border-radius:4px;">
              <div style="font-size:9px; color:#92400e; margin-bottom:1px;">SEL</div>
              <div style="font-size:11px; font-weight:700; color:#92400e;">${sel}</div>
            </div>
            <div style="text-align:center; padding:4px; background:#dbeafe; border-radius:4px;">
              <div style="font-size:9px; color:#1e40af; margin-bottom:1px;">CT</div>
              <div style="font-size:11px; font-weight:700; color:#1e40af;">${ct}</div>
            </div>
            <div style="text-align:center; padding:4px; background:#dcfce7; border-radius:4px;">
              <div style="font-size:9px; color:#166534; margin-bottom:1px;">Lead</div>
              <div style="font-size:11px; font-weight:700; color:#166534;">${lead}</div>
            </div>
          </div>
          
          ${tags !== 'None' ? `<div style="padding:6px; background:#fef2f2; border-left:2px solid #ef4444; border-radius:4px;">
            <div style="font-size:10px; color:#991b1b; margin-bottom:1px;">⚠️ Support Needs</div>
            <div style="font-size:11px; color:#991b1b;">${tags}</div>
          </div>` : '<div style="font-size:11px; color:#10b981; padding:6px; background:#f0fdf4; border-radius:4px;">✓ No special support needed</div>'}
        </div>`;
    }).join('');

    return `
      <div style="padding:8px 10px; border:2px solid #3b82f6; border-radius:6px; background:linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); margin-bottom:10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:30px; height:30px; border-radius:6px; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:16px; box-shadow: 0 1px 2px rgba(59,130,246,0.3);">👥</div>
          <div>
            <div style="font-weight:700; font-size:14px; color:#1e40af;">${summary.podName}</div>
            <div style="font-size:11px; color:#1e3a8a;">${summary.studentCount} student${summary.studentCount === 1 ? '' : 's'} • ${summary.sessionPhase || 'FOUNDATION'}</div>
          </div>
        </div>
      </div>
      <div style="max-height:60vh; overflow-y:auto; padding-right:6px;">${studentCards || '<div style="padding:20px; text-align:center; color: #94a3b8; font-size:12px;">📭 No students in this pod.</div>'}</div>
    `;
  }

  function showPodSummary(podId) {
    const pod = StorageHelper.getPodById(podId);
    if (!pod) {
      alert('Pod not found');
      return;
    }

    const members = (pod.studentIds || []).map(id => allStudents.find(s => s.id === id)).filter(Boolean);
    if (members.length === 0) {
      alert('This pod has no active students.');
      return;
    }

    const summary = window.buildPodSummary(pod, members, calculateAcademicAverage);
    lastPodSummaryText = buildPodSummaryText(summary);

    const modal = document.getElementById('podSummaryModal');
    const titleEl = document.getElementById('podSummaryTitle');
    const contentEl = document.getElementById('podSummaryContent');
    if (titleEl) titleEl.textContent = `${pod.name || 'Pod'} summary`;
    if (contentEl) contentEl.innerHTML = renderPodSummaryHTML(summary);
    if (modal) modal.style.display = 'flex';
  }

  function closePodSummaryModal() {
    const modal = document.getElementById('podSummaryModal');
    if (modal) modal.style.display = 'none';
  }

  function copyPodSummary() {
    const text = lastPodSummaryText || (document.getElementById('podSummaryContent') ? document.getElementById('podSummaryContent').textContent.trim() : '');
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert('Pod summary copied');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Pod summary copied');
    });
  }

  // --- Pod plan acceptance & feedback regeneration ---
  function acceptCurrentPlan() {
    if (!window.currentPodPlanId) {
      alert('No pod selected. Open a pod plan first.');
      return;
    }
    const data = window.__lastPlanData;
    if (!data || !data.raw) {
      alert('Generate a plan before accepting.');
      return;
    }
    
    try {
      // Get existing plan history or create new
      const historyKey = `braingrain_pod_plans_${window.currentPodPlanId}`;
      let planHistory = [];
      try {
        planHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      } catch { }
      
      // Create new plan entry
      const planEntry = {
        id: Date.now().toString(),
        plan: data.raw,
        facilitatorHtml: data.facilitatorHtml || data.html,
        systemNotesHtml: data.systemNotesHtml || '',
        quickViewHtml: data.quickViewHtml || '',
        provider: data.provider,
        ts: data.ts || Date.now(),
        acceptedAt: Date.now(),
        summary: data.summary,
        sessionType: data.sessionType || 'followup',
        userEdits: data.userEdits || '',
        status: 'accepted'
      };
      
      // Add to history
      planHistory.unshift(planEntry);
      localStorage.setItem(historyKey, JSON.stringify(planHistory));
      
      // Also set current plan (for backward compatibility)
      const key = `braingrain_pod_plan_${window.currentPodPlanId}`;
      localStorage.setItem(key, JSON.stringify(planEntry));
      
      console.log(`✓ Plan accepted and saved for pod ${window.currentPodPlanId}`);
      
      // CRITICAL: Immediately sync to cloud after accepting plan
      triggerCloudSync();
      
      setPlanModalState({ statusText: 'Accepted and saved ✓ Syncing to cloud...', contentText: data.facilitatorHtml || data.html, showSpinner: false });
      
      // Hide Accept button after accepting
      const acceptBtn = document.querySelector('button[onclick="acceptCurrentPlan()"]');
      if (acceptBtn) acceptBtn.style.display = 'none';
      
      alert('Plan accepted and saved for this pod.');
      renderPods(); // Refresh to show View Plan button
    } catch (e) {
      console.error('Error saving plan:', e);
      alert('Could not save the plan locally.');
    }
  }

  function regeneratePlanWithFeedback() {
    if (!window.currentPodPlanId) {
      alert('Open a pod plan first.');
      return;
    }
    const feedbackEl = document.getElementById('planFeedbackInput');
    const feedback = feedbackEl ? feedbackEl.value.trim() : '';

    const pod = StorageHelper.getPodById(window.currentPodPlanId);
    if (!pod) {
      alert('Pod not found');
      return;
    }
    const members = (pod.studentIds || []).map(id => allStudents.find(s => s.id === id)).filter(Boolean);
    if (members.length === 0) {
      alert('This pod has no active students.');
      return;
    }

    const summary = window.buildPodSummary(pod, members, calculateAcademicAverage);
    summary.sessionFeedback = getLastFeedbackForPodStudents(window.currentPodPlanId);
    window.__lastPodSummary = summary;
    setPlanModalState({ statusText: 'Regenerating with your edits...', showSpinner: true });
    window.requestPodPlan(summary, { userEdits: feedback, previousPlan: (window.__lastPlanData && window.__lastPlanData.raw) || '' });
  }

  // --- Session Type Modal ---
  function openSessionTypeModal() {
    const modal = document.getElementById('sessionTypeModal');
    if (modal) {
      modal.style.display = 'flex';
      // Reset form
      const form = document.getElementById('sessionTypeForm');
      if (form) form.reset();
      document.getElementById('customReasonInput').style.display = 'none';
    }
  }

  function closeSessionTypeModal() {
    const modal = document.getElementById('sessionTypeModal');
    if (modal) modal.style.display = 'none';
    window.currentPodForPlanGeneration = null;
  }

  function handleSessionTypeSubmit(e) {
    e.preventDefault();
    
    const sessionTypeInput = document.querySelector('input[name="sessionType"]:checked');
    if (!sessionTypeInput) {
      alert('Please select a session type');
      return;
    }

    const sessionType = sessionTypeInput.value;
    let customReason = '';
    
    if (sessionType === 'custom') {
      const reasonInput = document.getElementById('sessionCustomReason');
      customReason = reasonInput ? reasonInput.value.trim() : '';
      if (!customReason) {
        alert('Please describe the reason for this session');
        return;
      }
      window.__customSessionReason = customReason;
    }

    // Close modal
    closeSessionTypeModal();

    // Prepare pod data and generate plan
    if (!window.currentPodForPlanGeneration) {
      alert('Pod data not found');
      return;
    }

    const podData = window.currentPodForPlanGeneration;
    window.currentPodPlanId = podData.podId;
    
    window.setPlanModalState({
      title: podData.pod.name || 'Pod plan',
      statusText: 'Preparing pod data...',
      contentText: '',
      showSpinner: true
    });

    window.__lastPodSummary = podData.summary;
    window.requestPodPlan(podData.summary, { sessionType: sessionType });
  }

  // --- Session Feedback storage ---
  function getFeedbackKey(podId) { return `braingrain_session_feedback_${podId}`; }
  function loadSessionFeedback(podId) {
    try {
      return JSON.parse(localStorage.getItem(getFeedbackKey(podId)) || '[]');
    } catch { return []; }
  }
  function saveSessionFeedback(podId, entries) {
    try { localStorage.setItem(getFeedbackKey(podId), JSON.stringify(entries)); } catch {}
  }
  function getLastFeedbackForPodStudents(podId) {
    const entries = loadSessionFeedback(podId);
    const map = {};
    entries.forEach(e => { map[e.studentId] = e; });
    return map;
  }

  function openSessionFeedback() {
    if (!window.currentPodPlanId) { alert('Open a pod plan first.'); return; }
    const podId = window.currentPodPlanId;
    const pod = StorageHelper.getPodById(podId);
    const members = (pod.studentIds || []).map(id => allStudents.find(s => s.id === id)).filter(Boolean);
    const select = document.getElementById('feedbackStudentSelect');
    if (!select) return;
    select.innerHTML = members.map(m => `<option value="${m.id}">${m.firstName || ''} ${m.lastName || ''}`.trim() || m.phone || m.id + `</option>`).join('');
    // Prefill with last feedback if available
    const lastMap = getLastFeedbackForPodStudents(podId);
    const firstId = members[0] && members[0].id;
    if (firstId && lastMap[firstId]) fillFeedbackForm(lastMap[firstId]); else clearFeedbackForm();
    const modal = document.getElementById('sessionFeedbackModal');
    if (modal) modal.style.display = 'flex';
  }
  function closeSessionFeedback() {
    const modal = document.getElementById('sessionFeedbackModal');
    if (modal) modal.style.display = 'none';
  }
  function clearFeedbackForm() {
    // Reset all radio buttons
    ['fbBehaviour', 'fbParticipation', 'fbInterest', 'fbEmotional'].forEach(name => {
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.checked = false);
    });
    // Clear all text areas
    ['fbBehaviourNote', 'fbParticipationNote', 'fbInterestNote', 'fbEmotionalNote', 'fbStrengths', 'fbNeeds', 'fbNextSession'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }
  function fillFeedbackForm(entry) {
    // Fill emoji selections
    const radioFields = {
      behaviour: 'fbBehaviour',
      participation: 'fbParticipation',
      interest: 'fbInterest',
      emotional: 'fbEmotional'
    };
    Object.keys(radioFields).forEach(key => {
      if (entry[key]) {
        const radios = document.querySelectorAll(`input[name="${radioFields[key]}"]`);
        radios.forEach(r => {
          if (r.value === entry[key]) r.checked = true;
        });
      }
    });
    // Fill text notes
    const textFields = {
      behaviourNote: 'fbBehaviourNote',
      participationNote: 'fbParticipationNote',
      interestNote: 'fbInterestNote',
      emotionalNote: 'fbEmotionalNote',
      strengths: 'fbStrengths',
      needs: 'fbNeeds',
      nextSession: 'fbNextSession'
    };
    Object.keys(textFields).forEach(key => {
      const el = document.getElementById(textFields[key]);
      if (el && entry[key]) el.value = entry[key];
    });
  }
  // When student changes, prefill
  document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'feedbackStudentSelect') {
      const podId = window.currentPodPlanId;
      const map = getLastFeedbackForPodStudents(podId);
      const entry = map[e.target.value];
      if (entry) fillFeedbackForm(entry); else clearFeedbackForm();
    }
  });

  function saveSessionFeedbackEntry() {
    if (!window.currentPodPlanId) { alert('Open a pod plan first.'); return; }
    const podId = window.currentPodPlanId;
    const studentId = document.getElementById('feedbackStudentSelect').value;
    const student = allStudents.find(s => s.id === studentId);
    
    // Get emoji selections
    const getRadioValue = (name) => {
      const radio = document.querySelector(`input[name="${name}"]:checked`);
      return radio ? radio.value : '';
    };
    
    // Get text values
    const getTextValue = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    
    const entry = {
      studentId,
      studentName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.phone || studentId,
      ts: Date.now(),
      behaviour: getRadioValue('fbBehaviour'),
      behaviourNote: getTextValue('fbBehaviourNote'),
      participation: getRadioValue('fbParticipation'),
      participationNote: getTextValue('fbParticipationNote'),
      interest: getRadioValue('fbInterest'),
      interestNote: getTextValue('fbInterestNote'),
      emotional: getRadioValue('fbEmotional'),
      emotionalNote: getTextValue('fbEmotionalNote'),
      strengths: getTextValue('fbStrengths'),
      needs: getTextValue('fbNeeds'),
      nextSession: getTextValue('fbNextSession')
    };
    const entries = loadSessionFeedback(podId);
    // Replace last entry for this student or append
    const idx = entries.findIndex(e => e.studentId === studentId);
    if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    saveSessionFeedback(podId, entries);
    
    // Mark session as feedback-complete
    const execKey = `braingrain_pod_exec_${podId}`;
    try {
      const execData = JSON.parse(localStorage.getItem(execKey) || '{}');
      execData.feedbackComplete = true;
      localStorage.setItem(execKey, JSON.stringify(execData));
      console.log(`✓ Execution marked complete for pod ${podId}`);
    } catch {}
    
    // Increment session index for role rotation
    try {
      const pod = StorageHelper.getPodById(podId);
      if (pod) {
        pod.sessionIndex = (pod.sessionIndex || 0) + 1;
        StorageHelper.savePod(pod);
        console.log(`✓ Session index incremented to ${pod.sessionIndex} for role rotation`);
      }
    } catch (e) {
      console.warn('Failed to increment session index:', e);
    }
    
    // CRITICAL: Immediately sync to cloud after marking execution
    triggerCloudSync();
    
    // Auto-advance to next student if available
    const select = document.getElementById('feedbackStudentSelect');
    const currentIndex = select.selectedIndex;
    if (currentIndex < select.options.length - 1) {
      select.selectedIndex = currentIndex + 1;
      const nextId = select.value;
      const lastMap = getLastFeedbackForPodStudents(podId);
      const nextEntry = lastMap[nextId];
      clearFeedbackForm();
      if (nextEntry) fillFeedbackForm(nextEntry);
    } else {
      alert('✓ Done!');
      triggerCloudSync(); // Final sync when all feedback complete
      closeSessionFeedback();
    }
  }

  // --- View accepted plan and execution workflow ---
  function viewAcceptedPlan(podId) {
    const planKey = `braingrain_pod_plan_${podId}`;
    const stored = localStorage.getItem(planKey);
    if (!stored) {
      alert('No accepted plan found for this pod.');
      return;
    }
    const pod = StorageHelper.getPodById(podId);
    if (!pod) {
      alert('Pod not found');
      return;
    }
    let planData;
    try {
      planData = JSON.parse(stored);
    } catch {
      alert('Could not load plan data.');
      return;
    }

    window.currentPodPlanId = podId;
    // Ensure __lastPlanData has all required fields including 'raw'
    window.__lastPlanData = {
      raw: planData.plan || planData.raw || '',
      facilitatorHtml: planData.facilitatorHtml || planData.html || '',
      systemNotesHtml: planData.systemNotesHtml || '',
      quickViewHtml: planData.quickViewHtml || '',
      provider: planData.provider || 'Stored',
      summary: planData.summary || {},
      ts: planData.ts || planData.acceptedAt || Date.now(),
      userEdits: planData.userEdits || '',
      sessionType: planData.sessionType || 'followup'
    };

    setPlanModalState({
      title: `${pod.name || 'Pod'} - Accepted Plan`,
      statusText: `Accepted ${new Date(planData.acceptedAt || planData.ts || Date.now()).toLocaleDateString()}`,
      contentText: window.__lastPlanData.facilitatorHtml || 'No plan content',
      showSpinner: false
    });

    // Inject quick view if available
    const qvEl = document.getElementById('podQuickViewContent');
    if (qvEl) {
      if (window.__lastPlanData.quickViewHtml) {
        qvEl.innerHTML = window.__lastPlanData.quickViewHtml;
        qvEl.style.display = 'none'; // Hidden by default, button toggles it
      } else {
        // Generate fallback quick view for old plans without quickViewHtml
        const fallbackQv = {
          one_line_purpose: 'Pod learning session',
          before_session: ['Review student data', 'Prepare materials'],
          session_feel: ['Safe', 'Engaging', 'Student-centered'],
          flow: ['Welcome', 'Main Activity', 'Reflection'],
          if_things_go_wrong: ['Pause and breathe', 'Check student comfort', 'Adjust pace'],
          success_check: ['Students participated', 'Safe atmosphere maintained']
        };
        if (window.formatQuickView) {
          qvEl.innerHTML = window.formatQuickView(fallbackQv);
        } else {
          qvEl.innerHTML = '<div style="padding:12px; color:#718096;">Quick view not available</div>';
        }
        qvEl.style.display = 'none';
      }
    }

    // Inject system notes if available
    const sysEl = document.getElementById('podSystemNotesContent');
    if (sysEl && window.__lastPlanData.systemNotesHtml) sysEl.innerHTML = window.__lastPlanData.systemNotesHtml;

    // Hide Accept button since this is already an accepted plan
    const acceptBtn = document.querySelector('button[onclick="acceptCurrentPlan()"]');
    if (acceptBtn) acceptBtn.style.display = 'none';

    // Check execution status and show Execute button if not done
    const execKey = `braingrain_pod_exec_${podId}`;
    let execData = null;
    try {
      execData = JSON.parse(localStorage.getItem(execKey) || 'null');
    } catch {}

    if (!execData || !execData.executed) {
      // Add Execute button dynamically if not present
      addExecuteButtonToPlanModal(podId);
    }
  }

  function addExecuteButtonToPlanModal(podId) {
    const modal = document.getElementById('podPlanModal');
    if (!modal) return;
    const existingBtn = document.getElementById('executePlanBtn');
    if (existingBtn) return; // Already added

    const btnContainer = modal.querySelector('.modal-card > div:has(button.btn)');
    if (!btnContainer) return;

    const btn = document.createElement('button');
    btn.id = 'executePlanBtn';
    btn.className = 'btn btn-primary btn-small';
    btn.textContent = 'Mark as Executed';
    btn.onclick = () => markPlanAsExecuted(podId);
    btnContainer.appendChild(btn);
  }

  function markPlanAsExecuted(podId) {
    try {
      // Get current plan from history
      const historyKey = `braingrain_pod_plans_${podId}`;
      let planHistory = [];
      try {
        planHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      } catch { }
      
      // Mark first (most recent) plan as executed
      if (planHistory.length > 0) {
        planHistory[0].status = 'executed';
        planHistory[0].executedAt = Date.now();
        localStorage.setItem(historyKey, JSON.stringify(planHistory));
      }
      
      // Also update exec key for backward compatibility
      const execKey = `braingrain_pod_exec_${podId}`;
      const execData = {
        executed: true,
        executedAt: Date.now(),
        feedbackComplete: false
      };
      localStorage.setItem(execKey, JSON.stringify(execData));
      
      console.log(`✓ Plan marked as EXECUTED for pod ${podId} at ${new Date(execData.executedAt).toISOString()}`);
      alert('Plan marked as executed! Now you can record session feedback.');
      renderPods(); // Refresh to show execution badge
      // Remove Execute button from modal
      const btn = document.getElementById('executePlanBtn');
      if (btn) btn.remove();
      setPlanModalState({ statusText: 'Executed ✓ - Syncing to cloud...', showSpinner: true });
      
      // CRITICAL: Immediately sync to cloud after marking as executed
      triggerCloudSync().then(() => {
        setPlanModalState({ statusText: 'Executed ✓ - Synced to cloud! Record feedback now', showSpinner: false });
      }).catch(() => {
        setPlanModalState({ statusText: 'Executed ✓ - Record feedback now', showSpinner: false });
      });
    } catch (e) {
      console.error('Failed to save execution status:', e);
      alert('Could not save execution status.');
    }
  }

  // --- Plan History Management ---
  function getPlanHistory(podId) {
    const historyKey = `braingrain_pod_plans_${podId}`;
    try {
      return JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch {
      return [];
    }
  }

  function openPlanHistoryModal(podId) {
    const pod = StorageHelper.getPodById(podId);
    if (!pod) {
      alert('Pod not found');
      return;
    }

    const planHistory = getPlanHistory(podId);
    const acceptedPlans = planHistory.filter(p => p.status === 'accepted');
    const executedPlans = planHistory.filter(p => p.status === 'executed');

    const modal = document.getElementById('planHistoryModal');
    if (!modal) return;

    // Set title
    const titleEl = document.getElementById('planHistoryTitle');
    if (titleEl) titleEl.textContent = `${pod.name} - Plan History`;

    // Render content with improved tabs
    let html = '<div style="display: flex; gap: 6px; margin-bottom: 14px; background:#f1f5f9; padding:4px; border-radius:8px;">';
    html += `<button class="btn btn-primary btn-small" onclick="switchPlanHistoryTab('accepted')" data-tab="accepted" style="flex:1; border-bottom: 2px solid #3b82f6; background:#ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); font-size:12px; padding:6px 10px;">📋 Accepted (${acceptedPlans.length})</button>`;
    html += `<button class="btn btn-secondary btn-small" onclick="switchPlanHistoryTab('executed')" data-tab="executed" style="flex:1; font-size:12px; padding:6px 10px;">✅ Executed (${executedPlans.length})</button>`;
    html += '</div>';

    // Accepted Plans
    html += `<div id="acceptedPlansTab" class="plan-history-tab" style="max-height:55vh; overflow-y:auto; padding-right:6px;">`;
    if (acceptedPlans.length === 0) {
      html += '<div style="padding: 40px 16px; text-align: center; color: #94a3b8; background:#f8fafc; border-radius:8px; border:2px dashed #cbd5e1;">📋 No accepted plans yet<br><span style="font-size:12px; margin-top:6px; display:block;">Generate a new plan to get started</span></div>';
    } else {
      acceptedPlans.forEach((plan, idx) => {
        const date = new Date(plan.acceptedAt).toLocaleDateString();
        const time = new Date(plan.acceptedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const sessionTypeEmoji = {welcome:'👋', first:'🚀', followup:'📌', custom:'🎯'}[plan.sessionType] || '📌';
        const sessionTypeName = {welcome:'Welcome', first:'First', followup:'Follow-up', custom:'Custom'}[plan.sessionType] || 'Follow-up';
        html += `
          <div style="padding: 8px; margin-bottom: 6px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #3b82f6; border-radius: 6px; box-shadow: 0 1px 2px rgba(59,130,246,0.1); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 4px rgba(59,130,246,0.15)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 1px 2px rgba(59,130,246,0.1)';">
            <div style="display: flex; justify-content: space-between; align-items: start; gap:6px;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                  <div style="width:22px; height:22px; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius:5px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:10px; box-shadow: 0 1px 2px rgba(59,130,246,0.25);">#${acceptedPlans.length - idx}</div>
                  <div>
                    <div style="font-weight: 700; color: #1e40af; font-size:12px;">Plan ${acceptedPlans.length - idx}</div>
                    <div style="font-size: 10px; color: #1e3a8a; display:flex; align-items:center; gap:3px;"><span>📅 ${date}</span> <span>• ⏰ ${time}</span></div>
                  </div>
                </div>
                <div style="padding:2px 7px; background:white; border-radius:3px; display:inline-block; font-size:10px; font-weight:600; color:#1e40af;">${sessionTypeEmoji} ${sessionTypeName}</div>
              </div>
              <div style="display: flex; flex-direction:column; gap: 4px;">
                <button class="btn btn-secondary btn-small" onclick="viewPlanHistoryItem('${podId}', '${plan.id}')" style="white-space:nowrap; font-size:11px; padding:4px 8px;">👁️ View</button>
                <button class="btn btn-primary btn-small" onclick="executePlanFromHistory('${podId}', '${plan.id}')" style="white-space:nowrap; font-size:11px; padding:4px 8px;">▶️ Execute</button>
                <button class="btn btn-secondary btn-small" style="border-color: #ef4444; color: #ef4444; white-space:nowrap; font-size:11px; padding:4px 8px;" onclick="deletePlanHistoryItem('${podId}', '${plan.id}')">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `;
      });
    }
    html += '</div>';

    // Executed Plans
    html += `<div id="executedPlansTab" class="plan-history-tab" style="display: none; max-height:55vh; overflow-y:auto; padding-right:6px;">`;
    if (executedPlans.length === 0) {
      html += '<div style="padding: 40px 16px; text-align: center; color: #94a3b8; background:#f8fafc; border-radius:8px; border:2px dashed #cbd5e1;">✅ No executed plans yet<br><span style="font-size:12px; margin-top:6px; display:block;">Execute a plan to see it here</span></div>';
    } else {
      executedPlans.forEach((plan, idx) => {
        const date = new Date(plan.executedAt).toLocaleDateString();
        const time = new Date(plan.executedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const sessionTypeEmoji = {welcome:'👋', first:'🚀', followup:'📌', custom:'🎯'}[plan.sessionType] || '📌';
        const sessionTypeName = {welcome:'Welcome', first:'First', followup:'Follow-up', custom:'Custom'}[plan.sessionType] || 'Follow-up';
        html += `
          <div style="padding: 8px; margin-bottom: 6px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 6px; box-shadow: 0 1px 2px rgba(16,185,129,0.1); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 4px rgba(16,185,129,0.15)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 1px 2px rgba(16,185,129,0.1)';">
            <div style="display: flex; justify-content: space-between; align-items: start; gap:6px;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                  <div style="width:22px; height:22px; background:linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius:5px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:10px; box-shadow: 0 1px 2px rgba(16,185,129,0.25);">✓</div>
                  <div>
                    <div style="font-weight: 700; color: #065f46; font-size:12px;">Plan ${executedPlans.length - idx}</div>
                    <div style="font-size: 10px; color: #064e3b; display:flex; align-items:center; gap:3px;"><span>📅 ${date}</span> <span>• ⏰ ${time}</span></div>
                  </div>
                </div>
                <div style="padding:2px 7px; background:white; border-radius:3px; display:inline-block; font-size:10px; font-weight:600; color:#065f46;">${sessionTypeEmoji} ${sessionTypeName}</div>
              </div>
              <div style="display: flex; flex-direction:column; gap: 4px;">
                <button class="btn btn-secondary btn-small" onclick="viewPlanHistoryItem('${podId}', '${plan.id}')" style="white-space:nowrap; font-size:11px; padding:4px 8px;">👁️ View</button>
                <button class="btn btn-primary btn-small" onclick="openSessionFeedback()" style="white-space:nowrap; font-size:11px; padding:4px 8px;">💬 Feedback</button>
              </div>
            </div>
          </div>
        `;
      });
    }
    html += '</div>';

    const contentEl = document.getElementById('planHistoryContent');
    if (contentEl) contentEl.innerHTML = html;

    modal.style.display = 'flex';
  }

  function closePlanHistoryModal() {
    const modal = document.getElementById('planHistoryModal');
    if (modal) modal.style.display = 'none';
  }

  function switchPlanHistoryTab(tab) {
    const acceptedTab = document.getElementById('acceptedPlansTab');
    const executedTab = document.getElementById('executedPlansTab');
    const acceptedBtn = document.querySelector('[data-tab="accepted"]');
    const executedBtn = document.querySelector('[data-tab="executed"]');

    if (tab === 'accepted') {
      if (acceptedTab) acceptedTab.style.display = 'block';
      if (executedTab) executedTab.style.display = 'none';
      if (acceptedBtn) {
        acceptedBtn.classList.remove('btn-secondary');
        acceptedBtn.classList.add('btn-primary');
        acceptedBtn.style.borderBottom = '3px solid var(--color-primary)';
      }
      if (executedBtn) {
        executedBtn.classList.remove('btn-primary');
        executedBtn.classList.add('btn-secondary');
        executedBtn.style.borderBottom = 'none';
      }
    } else {
      if (acceptedTab) acceptedTab.style.display = 'none';
      if (executedTab) executedTab.style.display = 'block';
      if (acceptedBtn) {
        acceptedBtn.classList.remove('btn-primary');
        acceptedBtn.classList.add('btn-secondary');
        acceptedBtn.style.borderBottom = 'none';
      }
      if (executedBtn) {
        executedBtn.classList.remove('btn-secondary');
        executedBtn.classList.add('btn-primary');
        executedBtn.style.borderBottom = '3px solid var(--color-primary)';
      }
    }
  }

  function viewPlanHistoryItem(podId, planId) {
    const planHistory = getPlanHistory(podId);
    const plan = planHistory.find(p => p.id === planId);
    if (!plan) {
      alert('Plan not found');
      return;
    }

    // Close plan history modal first
    closePlanHistoryModal();
    
    // Restore complete __lastPlanData for Accept button to work
    window.currentPodPlanId = podId;
    window.__lastPlanData = {
      raw: plan.plan || plan.raw || '',
      facilitatorHtml: plan.facilitatorHtml || '',
      systemNotesHtml: plan.systemNotesHtml || '',
      quickViewHtml: plan.quickViewHtml || '',
      provider: plan.provider || 'Stored',
      summary: plan.summary || {},
      ts: plan.ts || plan.acceptedAt || Date.now(),
      userEdits: plan.userEdits || '',
      sessionType: plan.sessionType || 'followup'
    };

    // Display in pod plan modal
    window.setPlanModalState({
      title: `Plan - ${new Date(plan.acceptedAt).toLocaleDateString()}`,
      statusText: `${plan.status === 'executed' ? '✓ Executed' : 'Accepted'} - ${plan.sessionType || 'followup'}`,
      contentText: plan.facilitatorHtml || plan.plan,
      isError: false,
      showSpinner: false
    });

    // Inject quick view if available
    const qvEl = document.getElementById('podQuickViewContent');
    if (qvEl) {
      if (plan.quickViewHtml) {
        qvEl.innerHTML = plan.quickViewHtml;
        qvEl.style.display = 'none'; // Hidden by default
      } else {
        // Generate fallback quick view for old plans without quickViewHtml
        const fallbackQv = {
          one_line_purpose: 'Pod learning session',
          before_session: ['Review student data', 'Prepare materials'],
          session_feel: ['Safe', 'Engaging', 'Student-centered'],
          flow: ['Welcome', 'Main Activity', 'Reflection'],
          if_things_go_wrong: ['Pause and breathe', 'Check student comfort', 'Adjust pace'],
          success_check: ['Students participated', 'Safe atmosphere maintained']
        };
        if (window.formatQuickView) {
          qvEl.innerHTML = window.formatQuickView(fallbackQv);
        } else {
          qvEl.innerHTML = '<div style="padding:12px; color:#718096;">Quick view not available</div>';
        }
        qvEl.style.display = 'none';
      }
    }

    // Inject system notes if available
    const sysEl = document.getElementById('podSystemNotesContent');
    if (sysEl && plan.systemNotesHtml) sysEl.innerHTML = plan.systemNotesHtml;

    // Hide Accept button since this is already an accepted plan
    const acceptBtn = document.querySelector('button[onclick="acceptCurrentPlan()"]');
    if (acceptBtn) acceptBtn.style.display = 'none';
    
    // Hide execute button if already executed
    const execBtn = document.getElementById('executePlanBtn');
    if (execBtn && plan.status === 'executed') execBtn.style.display = 'none';
  }

  function executePlanFromHistory(podId, planId) {
    if (!confirm('Mark this plan as executed?')) return;
    
    const planHistory = getPlanHistory(podId);
    const plan = planHistory.find(p => p.id === planId);
    if (!plan) {
      alert('Plan not found');
      return;
    }

    try {
      plan.status = 'executed';
      plan.executedAt = Date.now();
      localStorage.setItem(`braingrain_pod_plans_${podId}`, JSON.stringify(planHistory));

      // Update exec key
      const execKey = `braingrain_pod_exec_${podId}`;
      localStorage.setItem(execKey, JSON.stringify({
        executed: true,
        executedAt: Date.now(),
        feedbackComplete: false
      }));

      alert('Plan marked as executed!');
      
      // CRITICAL: Trigger cloud sync after execution
      triggerCloudSync();
      
      renderPods();
      openPlanHistoryModal(podId); // Refresh modal
    } catch (e) {
      console.error('Error executing plan:', e);
      alert('Could not mark plan as executed');
    }
  }

  function deletePlanHistoryItem(podId, planId) {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    
    try {
      let planHistory = getPlanHistory(podId);
      planHistory = planHistory.filter(p => p.id !== planId);
      localStorage.setItem(`braingrain_pod_plans_${podId}`, JSON.stringify(planHistory));

      alert('Plan deleted');
      
      // CRITICAL: Trigger cloud sync after deletion
      triggerCloudSync();
      
      openPlanHistoryModal(podId); // Refresh modal
    } catch (e) {
      console.error('Error deleting plan:', e);
      alert('Could not delete plan');
    }
  }

  // Manual recovery function for the UI button
  async function manualRecoveryFromCloud() {
    if (!window.CloudStorage || !window.CloudStorage.isEnabled()) {
      alert('Firebase cloud storage is not enabled. Please configure Firebase first.');
      return;
    }

    if (!confirm('This will restore all data from your cloud backup.\\n\\nPods, plans, and execution status will be recovered.\\n\\nContinue?')) {
      return;
    }

    try {
      const recovery = await window.CloudStorage.autoRecoverFromCloud();
      
      if (recovery.recovered) {
        alert(`✓ DATA RECOVERED FROM CLOUD!\\n\\nRestored:\\n• ${recovery.studentsRestored} students\\n• ${recovery.podsRestored} pods\\n• ${recovery.metadataRestored} plans/executions\\n\\nRefreshing page...`);
        window.location.reload();
      } else {
        if (recovery.reason === 'No cloud backup') {
          alert('No cloud backup found. Make sure you have synced data to cloud before.');
        } else if (recovery.reason === 'Local data is current') {
          alert('Your local data is already up-to-date with the cloud backup.\\n\\nNo recovery needed.');
        } else {
          alert(`Recovery not needed: ${recovery.reason}`);
        }
      }
    } catch (error) {
      console.error('Manual recovery failed:', error);
      alert(`Recovery failed: ${error.message}`);
    }
  }

  // Expose to global scope (already named functions will be global when file is included normally)
  window.loadStudents = loadStudents;
  window.calculateAcademicAverage = calculateAcademicAverage;
  window.viewStudent = viewStudent;
  window.backToStudentList = backToStudentList;
  window.toggleArchive = toggleArchive;
  window.toggleRowMenu = toggleRowMenu;
  window.deleteStudentConfirm = deleteStudentConfirm;
  window.openAssessment = openAssessment;
  window.closeAssessment = closeAssessment;
  window.exportStudents = exportStudents;
  window.showBackupManager = showBackupManager;
  window.restoreBackup = restoreBackup;
  window.showBackupStatus = showBackupStatus;
  window.syncToCloudNow = syncToCloudNow;
  window.loadFromCloudNow = loadFromCloudNow;
  window.showCloudSettings = showCloudSettings;
  window.showUserProfile = showUserProfile;
  window.replaceWithDemoDataNow = replaceWithDemoDataNow;
  window.toggleAutoCloudSync = toggleAutoCloudSync;
  window.manualRecoveryFromCloud = manualRecoveryFromCloud;
  window.renderPods = renderPods;
  window.openPodModal = openPodModal;
  window.closePodModal = closePodModal;
  window.savePodFromModal = savePodFromModal;
  window.deletePod = deletePod;
  window.togglePodMenu = togglePodMenu;
  window.syncPodsToCloud = syncPodsToCloud;
  window.generatePodPlan = generatePodPlan;
  window.showPodSummary = showPodSummary;
  window.closePodSummaryModal = closePodSummaryModal;
  window.copyPodSummary = copyPodSummary;
  window.acceptCurrentPlan = acceptCurrentPlan;
  window.regeneratePlanWithFeedback = regeneratePlanWithFeedback;
  window.closePodPlanModal = closePodPlanModal;
  window.saveAIConfigToFirebase = saveAIConfigToFirebase;
  window.openSessionFeedback = openSessionFeedback;
  window.closeSessionFeedback = closeSessionFeedback;
  window.saveSessionFeedbackEntry = saveSessionFeedbackEntry;
  window.viewAcceptedPlan = viewAcceptedPlan;
  window.markPlanAsExecuted = markPlanAsExecuted;
  window.openSessionTypeModal = openSessionTypeModal;
  window.closeSessionTypeModal = closeSessionTypeModal;
  window.handleSessionTypeSubmit = handleSessionTypeSubmit;
  window.getPlanHistory = getPlanHistory;
  window.openPlanHistoryModal = openPlanHistoryModal;
  window.closePlanHistoryModal = closePlanHistoryModal;
  window.switchPlanHistoryTab = switchPlanHistoryTab;
  window.viewPlanHistoryItem = viewPlanHistoryItem;
  window.executePlanFromHistory = executePlanFromHistory;
  window.deletePlanHistoryItem = deletePlanHistoryItem;

})();