// Admin-related functionality extracted from index.html
(function(){
  'use strict';
  
  // Import utilities and configuration
  const { $, $$, create, showToast, formatDate, formatTime } = window.CoreUtils || {};
  const config = window.BrainGrainConfig || {};
  
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
        const students = StorageHelper.loadStudents();
        const pods = StorageHelper.loadPods();
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
    console.log('🔵 generatePodPlan called with podId:', podId);
    
    const pod = StorageHelper.getPodById(podId);
    console.log('🔵 Pod retrieved:', pod ? pod.name : 'NULL');
    
    if (!pod) {
      alert('Pod not found');
      return;
    }

    // Ensure allStudents is loaded
    console.log('🔵 allStudents count:', allStudents.length);
    if (!allStudents || allStudents.length === 0) {
      console.log('⚠️ allStudents is empty, reloading from storage...');
      allStudents = StorageHelper.loadStudents();
      if (typeof window.allStudents !== 'undefined') window.allStudents = allStudents;
      console.log('🔵 After reload, allStudents count:', allStudents.length);
    }

    const members = (pod.studentIds || []).map(id => allStudents.find(s => s.id === id)).filter(Boolean);
    console.log('🔵 Members found:', members.length);
    
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
    
    console.log('🔵 window.currentPodForPlanGeneration set:', !!window.currentPodForPlanGeneration);
    console.log('🔵 Pod data:', window.currentPodForPlanGeneration.pod.name);

    // Show session type selector modal
    console.log('🔵 Opening session type modal...');
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
    console.log('🟢 openSessionTypeModal called');
    console.log('🟢 currentPodForPlanGeneration exists:', !!window.currentPodForPlanGeneration);
    
    const modal = document.getElementById('sessionTypeModal');
    if (modal) {
      modal.style.display = 'flex';
      console.log('🟢 Modal display set to flex');
      // Reset form
      const form = document.getElementById('sessionTypeForm');
      if (form) form.reset();
      document.getElementById('customReasonInput').style.display = 'none';
    } else {
      console.error('❌ Session type modal not found!');
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

    console.log('🟡 handleSessionTypeSubmit - checking pod data...');
    console.log('🟡 window.currentPodForPlanGeneration:', window.currentPodForPlanGeneration);
    
    // Check pod data BEFORE closing modal (closeSessionTypeModal sets it to null)
    if (!window.currentPodForPlanGeneration) {
      console.error('❌ Pod data not found!');
      alert('Pod data not found');
      return;
    }

    const podData = window.currentPodForPlanGeneration;
    console.log('🟡 Pod data retrieved successfully:', podData.pod.name);

    // Close modal after retrieving pod data
    closeSessionTypeModal();
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

  // ==================== ANALYTICS FUNCTIONS ====================

  /**
   * Show the analytics view
   */
  function showAnalytics() {
    document.getElementById('adminListView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'none';
    document.getElementById('assessmentScreen').style.display = 'none';
    document.getElementById('analyticsView').style.display = 'block';
    
    // Default to student analytics
    switchAnalyticsView('student');
  }

  /**
   * Switch between student and pod analytics views
   */
  function switchAnalyticsView(type) {
    const studentBtn = document.getElementById('studentAnalyticsBtn');
    const podBtn = document.getElementById('podAnalyticsBtn');
    const studentSection = document.getElementById('studentAnalyticsSection');
    const podSection = document.getElementById('podAnalyticsSection');
    
    if (type === 'student') {
      studentBtn.className = 'btn btn-primary';
      podBtn.className = 'btn btn-secondary';
      studentSection.style.display = 'block';
      podSection.style.display = 'none';
      
      // Populate student dropdown
      populateStudentAnalyticsDropdown();
      
      // Auto-select first student
      setTimeout(() => {
        const select = document.getElementById('studentAnalyticsSelect');
        if (select && select.options.length > 1) {
          const firstStudentId = select.options[1].value;
          select.value = firstStudentId;
          loadStudentAnalytics(firstStudentId);
        }
      }, 50);
    } else {
      studentBtn.className = 'btn btn-secondary';
      podBtn.className = 'btn btn-primary';
      studentSection.style.display = 'none';
      podSection.style.display = 'block';
      
      // Populate pod dropdown
      populatePodAnalyticsDropdown();
      
      // Auto-select first pod
      setTimeout(() => {
        const select = document.getElementById('podAnalyticsSelect');
        if (select && select.options.length > 1) {
          const firstPodId = select.options[1].value;
          select.value = firstPodId;
          loadPodAnalytics(firstPodId);
        }
      }, 50);
    }
  }

  /**
   * Populate student dropdown for analytics
   */
  function populateStudentAnalyticsDropdown() {
    const select = document.getElementById('studentAnalyticsSelect');
    if (!select) return;
    
    const students = StorageHelper.loadStudents().filter(s => !s.archived);
    
    select.innerHTML = '<option value="">-- Choose a student --</option>' +
      students.map(s => {
        const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.phone || s.id;
        return `<option value="${s.id}">${name} (Grade ${s.grade || 'N/A'})</option>`;
      }).join('');
  }

  /**
   * Populate pod dropdown for analytics
   */
  function populatePodAnalyticsDropdown() {
    const select = document.getElementById('podAnalyticsSelect');
    if (!select) return;
    
    const pods = StorageHelper.loadPods();
    
    select.innerHTML = '<option value="">-- Choose a pod --</option>' +
      pods.map(p => {
        const studentCount = (p.studentIds || []).length;
        return `<option value="${p.id}">${p.name} (${studentCount} student${studentCount === 1 ? '' : 's'})</option>`;
      }).join('');
  }

  /**
   * Load and display student analytics
   */
  function loadStudentAnalytics(studentId) {
    const contentDiv = document.getElementById('studentAnalyticsContent');
    if (!contentDiv || !studentId) {
      contentDiv.innerHTML = '';
      return;
    }
    
    const student = StorageHelper.getStudentById(studentId);
    if (!student) {
      contentDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#ef4444;">Student not found</div>';
      return;
    }
    
    // Calculate analytics using the analytics module
    if (!window.AnalyticsModule) {
      contentDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#ef4444;">Analytics module not loaded</div>';
      return;
    }
    
    const analytics = window.AnalyticsModule.calculateStudentAnalytics(student);
    contentDiv.innerHTML = renderStudentAnalytics(analytics);
  }

  /**
   * Render student analytics HTML
   */
  function renderStudentAnalytics(analytics) {
    if (!analytics) return '<div style="padding:20px; text-align:center;">No analytics available</div>';
    
    // Header Card
    const headerHTML = `
      <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
          <div style="width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700;">${analytics.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style="margin:0; font-size:28px; font-weight:800;">${analytics.name}</h2>
            <div style="opacity:0.9; font-size:16px;">Grade ${analytics.grade}</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-top:16px;">
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:32px; font-weight:800;">${analytics.overall.score}%</div>
            <div style="font-size:12px; opacity:0.9;">Overall Performance</div>
          </div>
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:32px; font-weight:800;">${analytics.academic.average}%</div>
            <div style="font-size:12px; opacity:0.9;">Academic Average</div>
          </div>
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:32px; font-weight:800;">${analytics.assessment.status}</div>
            <div style="font-size:12px; opacity:0.9;">Assessment Status</div>
          </div>
        </div>
      </div>
    `;
    
    // Academic Performance Section
    const subjectsHTML = Object.entries(analytics.academic.subjects).map(([subject, data]) => {
      const color = data.percent >= 80 ? '#10b981' : data.percent >= 60 ? '#3b82f6' : data.percent >= 40 ? '#f59e0b' : '#ef4444';
      return `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-weight:600; text-transform:capitalize;">${subject}</span>
            <span style="font-weight:700; color:${color};">${data.percent}% (${data.grade})</span>
          </div>
          <div style="background:#e2e8f0; height:8px; border-radius:4px; overflow:hidden;">
            <div style="background:${color}; height:100%; width:${data.percent}%; transition:width 0.3s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
    
    const academicHTML = `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #e2e8f0;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#0b66d0;">
          <span style="font-size:24px;">📚</span> Academic Performance
        </h3>
        ${subjectsHTML || '<div style="color:#94a3b8;">No academic data available</div>'}
        <div style="margin-top:16px; padding:12px; background:#f8fafc; border-radius:8px; border-left:4px solid #3b82f6;">
          <div style="font-weight:600; color:#1e40af;">Performance Level: ${analytics.academic.performanceLevel}</div>
        </div>
      </div>
    `;
    
    // Assessment Skills Section
    const assessmentHTML = `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #e2e8f0;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#0b66d0;">
          <span style="font-size:24px;">🎯</span> Assessment Skills
        </h3>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">
          ${renderSkillCard('Social-Emotional Learning', analytics.assessment.sel, '#fbbf24')}
          ${renderSkillCard('Critical Thinking', analytics.assessment.criticalThinking, '#3b82f6')}
          ${renderSkillCard('Leadership', analytics.assessment.leadership, '#10b981')}
        </div>
      </div>
    `;
    
    // Strengths Section
    const strengthsHTML = analytics.strengths.length > 0 ? `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #10b981;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#10b981;">
          <span style="font-size:24px;">💪</span> Strengths
        </h3>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
          ${analytics.strengths.map(s => `
            <div style="padding:12px; background:#f0fdf4; border-radius:8px; border-left:4px solid #10b981;">
              <div style="font-weight:700; color:#166534;">${s.area}</div>
              <div style="font-size:24px; font-weight:800; color:#10b981;">${s.score}%</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';
    
    // Weaknesses Section
    const weaknessesHTML = analytics.weaknesses.length > 0 ? `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #f59e0b;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#f59e0b;">
          <span style="font-size:24px;">⚠️</span> Areas for Improvement
        </h3>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
          ${analytics.weaknesses.map(w => `
            <div style="padding:12px; background:#fef3c7; border-radius:8px; border-left:4px solid #f59e0b;">
              <div style="font-weight:700; color:#92400e;">${w.area}</div>
              <div style="font-size:24px; font-weight:800; color:#f59e0b;">${w.score}%</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';
    
    // Recommendations Section
    const recommendationsHTML = analytics.recommendations.length > 0 ? `
      <div style="background:white; padding:24px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #3b82f6;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#3b82f6;">
          <span style="font-size:24px;">💡</span> Recommendations
        </h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${analytics.recommendations.map(r => {
            const priorityColor = r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#f59e0b' : '#10b981';
            const priorityBg = r.priority === 'high' ? '#fee2e2' : r.priority === 'medium' ? '#fef3c7' : '#f0fdf4';
            return `
              <div style="padding:16px; background:${priorityBg}; border-radius:8px; border-left:4px solid ${priorityColor};">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span style="font-weight:700; color:${priorityColor};">${r.category}</span>
                  <span style="font-size:11px; padding:2px 8px; background:${priorityColor}; color:white; border-radius:12px; text-transform:uppercase; font-weight:600;">${r.priority}</span>
                </div>
                <div style="color:#334155; font-size:14px;">${r.message}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';
    
    return headerHTML + academicHTML + assessmentHTML + strengthsHTML + weaknessesHTML + recommendationsHTML;
  }

  /**
   * Render a skill card
   */
  function renderSkillCard(name, skillData, color) {
    return `
      <div style="padding:16px; background:#f8fafc; border-radius:8px; text-align:center; border:2px solid ${color};">
        <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${name}</div>
        <div style="font-size:32px; font-weight:800; color:${color}; margin:8px 0;">${skillData.percent}%</div>
        <div style="font-size:14px; font-weight:600; color:${color};">${skillData.grade}</div>
        <div style="margin-top:8px; padding:4px 8px; background:${color}; color:white; border-radius:12px; font-size:11px; font-weight:600;">${skillData.level}</div>
      </div>
    `;
  }

  /**
   * Load and display pod analytics
   */
  function loadPodAnalytics(podId) {
    const contentDiv = document.getElementById('podAnalyticsContent');
    if (!contentDiv || !podId) {
      contentDiv.innerHTML = '';
      return;
    }
    
    const pod = StorageHelper.getPodById(podId);
    if (!pod) {
      contentDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#ef4444;">Pod not found</div>';
      return;
    }
    
    const members = (pod.studentIds || []).map(id => allStudents.find(s => s.id === id)).filter(Boolean);
    if (members.length === 0) {
      contentDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#f59e0b;">This pod has no students</div>';
      return;
    }
    
    // Calculate analytics using the analytics module
    if (!window.AnalyticsModule) {
      contentDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#ef4444;">Analytics module not loaded</div>';
      return;
    }
    
    const analytics = window.AnalyticsModule.calculatePodAnalytics(pod, members, calculateAcademicAverage);
    contentDiv.innerHTML = renderPodAnalytics(analytics);
  }

  /**
   * Render pod analytics HTML
   */
  function renderPodAnalytics(analytics) {
    if (!analytics) return '<div style="padding:20px; text-align:center;">No analytics available</div>';
    
    // Header Card
    const headerHTML = `
      <div style="background:linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
          <div style="width:60px; height:60px; border-radius:12px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:32px;">👥</div>
          <div>
            <h2 style="margin:0; font-size:28px; font-weight:800;">${analytics.podName}</h2>
            <div style="opacity:0.9; font-size:16px;">${analytics.studentCount} student${analytics.studentCount === 1 ? '' : 's'}</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-top:16px;">
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:28px; font-weight:800;">${analytics.academic.average}%</div>
            <div style="font-size:11px; opacity:0.9;">Academic Avg</div>
          </div>
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:28px; font-weight:800;">${analytics.assessment.completionRate}%</div>
            <div style="font-size:11px; opacity:0.9;">Assessments Done</div>
          </div>
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:28px; font-weight:800;">${analytics.academic.highest}%</div>
            <div style="font-size:11px; opacity:0.9;">Top Performer</div>
          </div>
          <div style="background:rgba(255,255,255,0.15); padding:12px; border-radius:8px; text-align:center;">
            <div style="font-size:28px; font-weight:800;">${analytics.academic.range}%</div>
            <div style="font-size:11px; opacity:0.9;">Performance Range</div>
          </div>
        </div>
      </div>
    `;
    
    // Academic Overview
    const academicHTML = `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #e2e8f0;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#0b66d0;">
          <span style="font-size:24px;">📊</span> Academic Overview
        </h3>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:16px;">
          <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:8px;">
            <div style="font-size:12px; color:#64748b; margin-bottom:4px;">Average</div>
            <div style="font-size:32px; font-weight:800; color:#3b82f6;">${analytics.academic.average}%</div>
          </div>
          <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:8px;">
            <div style="font-size:12px; color:#64748b; margin-bottom:4px;">Median</div>
            <div style="font-size:32px; font-weight:800; color:#8b5cf6;">${analytics.academic.median}%</div>
          </div>
          <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:8px;">
            <div style="font-size:12px; color:#64748b; margin-bottom:4px;">Range</div>
            <div style="font-size:24px; font-weight:800; color:#f59e0b;">${analytics.academic.lowest}% - ${analytics.academic.highest}%</div>
          </div>
        </div>
        <div style="padding:12px; background:#f0f9ff; border-radius:8px; border-left:4px solid #3b82f6;">
          <div style="font-weight:600; color:#1e40af;">Performance Level: ${analytics.academic.performanceLevel}</div>
        </div>
      </div>
    `;
    
    // Skills Overview
    const skillsHTML = `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #e2e8f0;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#0b66d0;">
          <span style="font-size:24px;">🎯</span> Skills Assessment Overview
        </h3>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">
          ${renderPodSkillCard('SEL', analytics.assessment.sel, '#fbbf24')}
          ${renderPodSkillCard('Critical Thinking', analytics.assessment.criticalThinking, '#3b82f6')}
          ${renderPodSkillCard('Leadership', analytics.assessment.leadership, '#10b981')}
        </div>
      </div>
    `;
    
    // Distribution
    const distributionHTML = `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #e2e8f0;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#0b66d0;">
          <span style="font-size:24px;">📈</span> Student Distribution
        </h3>
        <div style="margin-bottom:20px;">
          <div style="font-weight:600; margin-bottom:8px; color:#334155;">Academic Performance:</div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
            ${renderDistributionBar('Advanced', analytics.distribution.academic.advanced, '#10b981')}
            ${renderDistributionBar('On Track', analytics.distribution.academic.onTrack, '#3b82f6')}
            ${renderDistributionBar('Needs Support', analytics.distribution.academic.needsSupport, '#f59e0b')}
            ${renderDistributionBar('Intensive', analytics.distribution.academic.intensive, '#ef4444')}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">
          ${renderSkillDistribution('SEL', analytics.distribution.sel)}
          ${renderSkillDistribution('Critical Thinking', analytics.distribution.criticalThinking)}
          ${renderSkillDistribution('Leadership', analytics.distribution.leadership)}
        </div>
      </div>
    `;
    
    // Student Comparison
    const studentsHTML = `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #e2e8f0;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#0b66d0;">
          <span style="font-size:24px;">👥</span> Student Comparison
        </h3>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                <th style="padding:12px; text-align:left; font-size:12px; color:#64748b; text-transform:uppercase;">Student</th>
                <th style="padding:12px; text-align:center; font-size:12px; color:#64748b; text-transform:uppercase;">Academic</th>
                <th style="padding:12px; text-align:center; font-size:12px; color:#64748b; text-transform:uppercase;">SEL</th>
                <th style="padding:12px; text-align:center; font-size:12px; color:#64748b; text-transform:uppercase;">CT</th>
                <th style="padding:12px; text-align:center; font-size:12px; color:#64748b; text-transform:uppercase;">Leadership</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.students.map(s => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:12px; font-weight:600;">${s.name}</td>
                  <td style="padding:12px; text-align:center; font-weight:700; color:${getScoreColor(s.academicAvg)};">${s.academicAvg}%</td>
                  <td style="padding:12px; text-align:center; font-weight:700; color:${getScoreColor(s.sel)};">${s.sel}%</td>
                  <td style="padding:12px; text-align:center; font-weight:700; color:${getScoreColor(s.ct)};">${s.ct}%</td>
                  <td style="padding:12px; text-align:center; font-weight:700; color:${getScoreColor(s.lead)};">${s.lead}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Insights
    const insightsHTML = analytics.insights.length > 0 ? `
      <div style="background:white; padding:24px; border-radius:12px; margin-bottom:24px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #8b5cf6;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#8b5cf6;">
          <span style="font-size:24px;">💡</span> Insights
        </h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${analytics.insights.map(insight => {
            const levelColor = insight.level === 'success' ? '#10b981' : insight.level === 'warning' ? '#f59e0b' : '#3b82f6';
            const levelBg = insight.level === 'success' ? '#f0fdf4' : insight.level === 'warning' ? '#fef3c7' : '#f0f9ff';
            const icon = insight.level === 'success' ? '✓' : insight.level === 'warning' ? '⚠️' : 'ℹ️';
            return `
              <div style="padding:12px; background:${levelBg}; border-radius:8px; border-left:4px solid ${levelColor}; display:flex; align-items:center; gap:12px;">
                <span style="font-size:20px;">${icon}</span>
                <span style="color:#334155; font-size:14px;">${insight.message}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';
    
    // Recommendations
    const recommendationsHTML = analytics.recommendations.length > 0 ? `
      <div style="background:white; padding:24px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:2px solid #3b82f6;">
        <h3 style="margin:0 0 16px 0; display:flex; align-items:center; gap:8px; color:#3b82f6;">
          <span style="font-size:24px;">🎯</span> Recommendations
        </h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${analytics.recommendations.map(r => {
            const priorityColor = r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#f59e0b' : '#10b981';
            const priorityBg = r.priority === 'high' ? '#fee2e2' : r.priority === 'medium' ? '#fef3c7' : '#f0fdf4';
            return `
              <div style="padding:16px; background:${priorityBg}; border-radius:8px; border-left:4px solid ${priorityColor};">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span style="font-weight:700; color:${priorityColor};">${r.category}</span>
                  <span style="font-size:11px; padding:2px 8px; background:${priorityColor}; color:white; border-radius:12px; text-transform:uppercase; font-weight:600;">${r.priority}</span>
                </div>
                <div style="color:#334155; font-size:14px;">${r.message}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';
    
    return headerHTML + academicHTML + skillsHTML + distributionHTML + studentsHTML + insightsHTML + recommendationsHTML;
  }

  /**
   * Render pod skill card
   */
  function renderPodSkillCard(name, skillData, color) {
    return `
      <div style="padding:16px; background:#f8fafc; border-radius:8px; border:2px solid ${color};">
        <div style="font-size:13px; font-weight:600; color:#64748b; margin-bottom:12px; text-align:center;">${name}</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-size:11px; color:#64748b;">Average:</span>
          <span style="font-size:18px; font-weight:800; color:${color};">${skillData.average}%</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="font-size:11px; color:#64748b;">Highest:</span>
          <span style="font-size:14px; font-weight:700; color:#10b981;">${skillData.highest}%</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="font-size:11px; color:#64748b;">Lowest:</span>
          <span style="font-size:14px; font-weight:700; color:#ef4444;">${skillData.lowest}%</span>
        </div>
      </div>
    `;
  }

  /**
   * Render distribution bar
   */
  function renderDistributionBar(label, count, color) {
    return `
      <div style="text-align:center; padding:12px; background:#f8fafc; border-radius:8px; border:2px solid ${color};">
        <div style="font-size:24px; font-weight:800; color:${color};">${count}</div>
        <div style="font-size:11px; color:#64748b;">${label}</div>
      </div>
    `;
  }

  /**
   * Render skill distribution
   */
  function renderSkillDistribution(skillName, dist) {
    return `
      <div style="padding:12px; background:#f8fafc; border-radius:8px;">
        <div style="font-weight:600; font-size:12px; color:#334155; margin-bottom:8px;">${skillName}</div>
        <div style="display:flex; gap:8px; font-size:11px;">
          <div style="flex:1; text-align:center; padding:6px; background:#dcfce7; border-radius:4px;">
            <div style="font-weight:800; color:#166534;">${dist.strong}</div>
            <div style="color:#166534;">Strong</div>
          </div>
          <div style="flex:1; text-align:center; padding:6px; background:#dbeafe; border-radius:4px;">
            <div style="font-weight:800; color:#1e40af;">${dist.developing}</div>
            <div style="color:#1e40af;">Developing</div>
          </div>
          <div style="flex:1; text-align:center; padding:6px; background:#fef3c7; border-radius:4px;">
            <div style="font-weight:800; color:#92400e;">${dist.needsSupport}</div>
            <div style="color:#92400e;">Needs Support</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get color based on score
   */
  function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
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
  // ==================== DEEP ANALYTICS FUNCTIONS ====================
  
  /**
   * Show cohort statistics view
   */
  function showCohortStats() {
    try {
      const students = StorageHelper.loadStudents().filter(s => !s.archived);
      
      if (!window.DeepAnalytics) {
        alert('Deep Analytics module not loaded. Please refresh the page.');
        console.error('DeepAnalytics module not found');
        return;
      }
      
      if (students.length === 0) {
        alert('No students found. Please register students first.');
        return;
      }
      
      const cohortStats = window.DeepAnalytics.analyzeCohort(students);
      const correlations = window.DeepAnalytics.analyzeCorrelations(students);
      const atRisk = window.DeepAnalytics.identifyAtRiskStudents(students);
      
      if (!cohortStats) {
        alert('Unable to generate statistics. Please ensure student data is complete.');
        console.error('Failed to analyze cohort');
        return;
      }
    
    // Create modal
    const modal = document.getElementById('deepAnalyticsModal') || createDeepAnalyticsModal();
    const content = document.getElementById('deepAnalyticsContent');
    
    let html = '<div style="padding: 16px;">';
    
    // Summary Cards
    html += `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Total Students</div>
          <div style="font-size: 36px; font-weight: 800;">${cohortStats.cohortSize}</div>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">At-Risk Students</div>
          <div style="font-size: 36px; font-weight: 800;">${atRisk.length}</div>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Average Academic</div>
          <div style="font-size: 36px; font-weight: 800;">${cohortStats.academic.mean.toFixed(1)}%</div>
        </div>
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Average Assessment</div>
          <div style="font-size: 36px; font-weight: 800;">${cohortStats.assessment.mean.toFixed(1)}</div>
        </div>
      </div>
    `;
    
    // Tabs for different views
    html += `
      <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
        <button class="btn btn-primary btn-small" onclick="switchDeepAnalyticsTab('statistics')" data-deep-tab="statistics" style="border-bottom: 3px solid #0b66d0; border-radius: 8px 8px 0 0;">📊 Statistics</button>
        <button class="btn btn-secondary btn-small" onclick="switchDeepAnalyticsTab('correlations')" data-deep-tab="correlations" style="border-radius: 8px 8px 0 0;">📈 Correlations</button>
        <button class="btn btn-secondary btn-small" onclick="switchDeepAnalyticsTab('atrisk')" data-deep-tab="atrisk" style="border-radius: 8px 8px 0 0;">⚠️ At-Risk</button>
        <button class="btn btn-secondary btn-small" onclick="switchDeepAnalyticsTab('export')" data-deep-tab="export" style="border-radius: 8px 8px 0 0;">💾 Export</button>
      </div>
    `;
    
    // Statistics Tab
    html += `<div id="deepAnalyticsStatistics" class="deep-analytics-tab">`;
    html += renderCohortStatistics(cohortStats);
    html += '</div>';
    
    // Correlations Tab
    html += `<div id="deepAnalyticsCorrelations" class="deep-analytics-tab" style="display: none;">`;
    html += renderCorrelations(correlations);
    html += '</div>';
    
    // At-Risk Tab
    html += `<div id="deepAnalyticsAtrisk" class="deep-analytics-tab" style="display: none;">`;
    html += renderAtRiskStudents(atRisk);
    html += '</div>';
    
    // Export Tab
    html += `<div id="deepAnalyticsExport" class="deep-analytics-tab" style="display: none;">`;
    html += renderExportOptions();
    html += '</div>';
    
    html += '</div>';
    
    content.innerHTML = html;
    modal.style.display = 'flex';
    } catch (error) {
      console.error('showCohortStats error:', error);
      alert('Failed to load deep analytics. Please try again.');
    }
  }
  
  function createDeepAnalyticsModal() {
    const modal = document.createElement('div');
    modal.id = 'deepAnalyticsModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h2>🔬 Deep Analytics & Insights</h2>
          <button class="close-btn" onclick="closeDeepAnalyticsModal()">&times;</button>
        </div>
        <div id="deepAnalyticsContent"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }
  
  function closeDeepAnalyticsModal() {
    const modal = document.getElementById('deepAnalyticsModal');
    if (modal) modal.style.display = 'none';
  }
  
  function switchDeepAnalyticsTab(tabName) {
    // Update buttons
    document.querySelectorAll('[data-deep-tab]').forEach(btn => {
      if (btn.getAttribute('data-deep-tab') === tabName) {
        btn.className = 'btn btn-primary btn-small';
        btn.style.borderBottom = '3px solid #0b66d0';
      } else {
        btn.className = 'btn btn-secondary btn-small';
        btn.style.borderBottom = 'none';
      }
    });
    
    // Update content
    document.querySelectorAll('.deep-analytics-tab').forEach(tab => {
      tab.style.display = 'none';
    });
    
    const activeTab = document.getElementById(`deepAnalytics${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (activeTab) activeTab.style.display = 'block';
  }
  
  function renderCohortStatistics(stats) {
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
    
    // Academic Statistics
    html += `
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0b66d0;">📚 Academic Performance</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: 600;">Mean:</td><td style="text-align: right;">${stats.academic.mean.toFixed(2)}%</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Median:</td><td style="text-align: right;">${stats.academic.median.toFixed(2)}%</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Std Dev:</td><td style="text-align: right;">${stats.academic.stdDev.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Min:</td><td style="text-align: right;">${stats.academic.min.toFixed(2)}%</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Max:</td><td style="text-align: right;">${stats.academic.max.toFixed(2)}%</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">25th Percentile:</td><td style="text-align: right;">${stats.academic.p25.toFixed(2)}%</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">75th Percentile:</td><td style="text-align: right;">${stats.academic.p75.toFixed(2)}%</td></tr>
        </table>
      </div>
    `;
    
    // Assessment Statistics
    html += `
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0b66d0;">🎯 Assessment Scores</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: 600;">Mean:</td><td style="text-align: right;">${stats.assessment.mean.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Median:</td><td style="text-align: right;">${stats.assessment.median.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Std Dev:</td><td style="text-align: right;">${stats.assessment.stdDev.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Min:</td><td style="text-align: right;">${stats.assessment.min.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Max:</td><td style="text-align: right;">${stats.assessment.max.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">25th Percentile:</td><td style="text-align: right;">${stats.assessment.p25.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">75th Percentile:</td><td style="text-align: right;">${stats.assessment.p75.toFixed(2)}</td></tr>
        </table>
      </div>
    `;
    
    html += '</div>';
    
    // Distribution
    html += `
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0b66d0;">📊 Performance Distribution</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;
    
    Object.entries(stats.academic.distribution).forEach(([range, count]) => {
      const percentage = (count / stats.cohortSize * 100).toFixed(1);
      const color = range.includes('Excellent') ? '#22c55e' : range.includes('Good') ? '#3b82f6' : range.includes('Average') ? '#f59e0b' : '#ef4444';
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
            <span style="font-weight: 600;">${range}</span>
            <span>${count} students (${percentage}%)</span>
          </div>
          <div style="background: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden;">
            <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
    
    return html;
  }
  
  function renderCorrelations(correlations) {
    if (!correlations) {
      return '<div style="padding: 40px; text-align: center; color: #64748b;">Insufficient data for correlation analysis (minimum 3 students with complete data required)</div>';
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
    
    Object.entries(correlations).forEach(([key, corr]) => {
      const absCoeff = Math.abs(corr.coefficient);
      const color = absCoeff >= 0.7 ? '#22c55e' : absCoeff >= 0.5 ? '#3b82f6' : absCoeff >= 0.3 ? '#f59e0b' : '#64748b';
      
      html += `
        <div style="background: white; border: 2px solid ${color}; border-radius: 12px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <h4 style="margin: 0; color: #0b66d0;">${formatCorrelationName(key)}</h4>
            <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 700;">${corr.strength}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: ${color};">${corr.coefficient.toFixed(3)}</div>
              <div style="font-size: 12px; color: #64748b;">Correlation (r)</div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: ${color};">${corr.regression.r2.toFixed(3)}</div>
              <div style="font-size: 12px; color: #64748b;">R² Value</div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: ${color};">${corr.regression.slope.toFixed(2)}</div>
              <div style="font-size: 12px; color: #64748b;">Slope</div>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            ${corr.interpretation}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  function renderAtRiskStudents(atRisk) {
    if (atRisk.length === 0) {
      return '<div style="padding: 40px; text-align: center; color: #22c55e; font-size: 18px;">✓ No at-risk students identified</div>';
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    atRisk.forEach((item, idx) => {
      const levelColor = item.riskLevel === 'high' ? '#ef4444' : item.riskLevel === 'medium' ? '#f59e0b' : '#64748b';
      const levelBg = item.riskLevel === 'high' ? '#fee2e2' : item.riskLevel === 'medium' ? '#fef3c7' : '#f1f5f9';
      
      html += `
        <div style="background: white; border-left: 4px solid ${levelColor}; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <h4 style="margin: 0 0 4px 0; color: #0b66d0;">${item.student.name}</h4>
              <div style="font-size: 13px; color: #64748b;">Grade ${item.student.grade} • Risk Score: ${item.riskScore}</div>
            </div>
            <span style="background: ${levelColor}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${item.riskLevel} RISK</span>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">⚠️ Risk Factors:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${item.risks.map(r => `<span style="background: ${levelBg}; color: ${levelColor}; padding: 4px 10px; border-radius: 12px; font-size: 12px;">${r}</span>`).join('')}
            </div>
          </div>
          <div>
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">💡 Recommended Interventions:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
              ${item.recommendations.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  function renderExportOptions() {
    let html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 12px 0; color: #0b66d0;">📊 Analytics Reports</h3>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">Export comprehensive analytics data</p>
          <button class="btn btn-primary" onclick="exportFullAnalyticsCSV()" style="width: 100%; margin-bottom: 8px;">
            📄 Export Full Analytics (CSV)
          </button>
          <button class="btn btn-secondary" onclick="exportCorrelationsCSV()" style="width: 100%; margin-bottom: 8px;">
            📈 Export Correlations (CSV)
          </button>
          <button class="btn btn-secondary" onclick="exportCohortStatsCSV()" style="width: 100%;">
            📊 Export Cohort Stats (CSV)
          </button>
        </div>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 12px 0; color: #0b66d0;">💾 Complete Data</h3>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">Export all data in JSON format</p>
          <button class="btn btn-primary" onclick="exportComprehensiveJSON()" style="width: 100%; margin-bottom: 8px;">
            📦 Export Complete Report (JSON)
          </button>
          <button class="btn btn-secondary" onclick="exportAtRiskStudentsCSV()" style="width: 100%;">
            ⚠️ Export At-Risk Students (CSV)
          </button>
        </div>
      </div>
      
      <div style="background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-top: 20px;">
        <div style="display: flex; align-items: start; gap: 12px;">
          <span style="font-size: 24px;">ℹ️</span>
          <div style="font-size: 13px; color: #475569; line-height: 1.6;">
            <strong>Export Tips:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>CSV files can be opened in Excel or Google Sheets</li>
              <li>JSON files contain the complete data structure</li>
              <li>All exports include data as of ${new Date().toLocaleString()}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }
  
  function formatCorrelationName(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/Vs/g, 'vs')
      .replace(/SEL/g, 'SEL')
      .trim();
  }
  
  // Export functions
  function exportFullAnalyticsCSV() {
    try {
      const students = StorageHelper.loadStudents().filter(s => !s.archived);
      const pods = StorageHelper.loadPods();
      
      if (students.length === 0) {
        alert('No students to export');
        return;
      }
      
      const csv = window.DeepAnalytics.exportAnalyticsCSV(students, pods);
      
      if (csv.startsWith('Error:')) {
        alert(csv);
        return;
      }
      
      downloadFile(csv, `brain-grain-analytics-${Date.now()}.csv`, 'text/csv');
    } catch (error) {
      console.error('exportFullAnalyticsCSV:', error);
      alert('Failed to export analytics. Please try again.');
    }
  }
  
  function exportCorrelationsCSV() {
    try {
      const students = StorageHelper.loadStudents().filter(s => !s.archived);
      
      if (students.length < 3) {
        alert('Need at least 3 students with complete data for correlations');
        return;
      }
      
      const correlations = window.DeepAnalytics.analyzeCorrelations(students);
      
      if (!correlations) {
        alert('Unable to calculate correlations');
        return;
      }
      
      const csv = window.DeepAnalytics.exportCorrelationsCSV(students);
      downloadFile(csv, `brain-grain-correlations-${Date.now()}.csv`, 'text/csv');
    } catch (error) {
      console.error('exportCorrelationsCSV:', error);
      alert('Failed to export correlations. Please try again.');
    }
  }
  
  function exportCohortStatsCSV() {
    try {
      const students = StorageHelper.loadStudents().filter(s => !s.archived);
      const cohortStats = window.DeepAnalytics.analyzeCohort(students);
      
      if (!cohortStats) {
        alert('Unable to generate statistics');
        return;
      }
      
      const csv = window.DeepAnalytics.exportCohortStatsCSV(cohortStats);
      downloadFile(csv, `brain-grain-cohort-stats-${Date.now()}.csv`, 'text/csv');
    } catch (error) {
      console.error('exportCohortStatsCSV:', error);
      alert('Failed to export cohort statistics. Please try again.');
    }
  }
  
  function exportComprehensiveJSON() {
    try {
      const students = StorageHelper.loadStudents().filter(s => !s.archived);
      const pods = StorageHelper.loadPods();
      
      if (students.length === 0) {
        alert('No data to export');
        return;
      }
      
      const json = window.DeepAnalytics.exportComprehensiveJSON(students, pods);
      downloadFile(json, `brain-grain-complete-report-${Date.now()}.json`, 'application/json');
    } catch (error) {
      console.error('exportComprehensiveJSON:', error);
      alert('Failed to export JSON report. Please try again.');
    }
  }
  
  function exportAtRiskStudentsCSV() {
    try {
      const students = StorageHelper.loadStudents().filter(s => !s.archived);
      
      if (students.length === 0) {
        alert('No students to export');
        return;
      }
      
      const atRisk = window.DeepAnalytics.identifyAtRiskStudents(students);
    
      if (atRisk.length === 0) {
        alert('No at-risk students identified (good news!)');
        return;
      }
      
      const rows = [['Student ID', 'Name', 'Grade', 'Risk Level', 'Risk Score', 'Risk Factors', 'Recommendations']];
      atRisk.forEach(item => {
        rows.push([
          item.student.id,
          item.student.name,
          item.student.grade,
          item.riskLevel,
          item.riskScore,
          item.risks.join('; '),
          item.recommendations.join('; ')
        ]);
      });
      
      const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      downloadFile(csv, `brain-grain-at-risk-students-${Date.now()}.csv`, 'text/csv');
    } catch (error) {
      console.error('exportAtRiskStudentsCSV:', error);
      alert('Failed to export at-risk students. Please try again.');
    }
  }
  
  function downloadFile(content, filename, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('downloadFile:', error);
      alert('Failed to download file. Please check browser permissions.');
    }
  }

  // Analytics functions
  window.showAnalytics = showAnalytics;
  window.switchAnalyticsView = switchAnalyticsView;
  window.loadStudentAnalytics = loadStudentAnalytics;
  window.loadPodAnalytics = loadPodAnalytics;
  window.showCohortStats = showCohortStats;
  window.closeDeepAnalyticsModal = closeDeepAnalyticsModal;
  window.switchDeepAnalyticsTab = switchDeepAnalyticsTab;
  window.exportFullAnalyticsCSV = exportFullAnalyticsCSV;
  window.exportCorrelationsCSV = exportCorrelationsCSV;
  window.exportCohortStatsCSV = exportCohortStatsCSV;
  window.exportComprehensiveJSON = exportComprehensiveJSON;
  window.exportAtRiskStudentsCSV = exportAtRiskStudentsCSV;

})();