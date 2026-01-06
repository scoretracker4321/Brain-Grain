// Admin-related functionality extracted from index.html
(function(){
  'use strict';

  // Use global allStudents if available, otherwise create local
  let allStudents = (typeof window.allStudents !== 'undefined') ? window.allStudents : [];

  function loadStudents() {
    try { 
      const loaded = StorageHelper.loadStudents();
      allStudents = loaded;
      if (typeof window.allStudents !== 'undefined') window.allStudents = loaded;
      console.log('Admin loadStudents: loaded', loaded.length, 'students');

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
        html += `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #d1fae5; border: 1px solid #10b981; border-radius: 6px; font-size: 13px; color: #065f46;">
          <span style="font-size: 16px;">☁️</span> <strong>Auto-sync:</strong> ${cloudAgo}
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
    const btn = document.getElementById('cloudSyncBtn');
    const originalText = btn ? btn.textContent : '';
    
    if (btn) btn.textContent = '☁️ Syncing...';
    
    const result = await window.CloudStorage.syncToCloud(students);
    
    if (result.success) {
      alert(`✓ Successfully synced ${students.length} students to cloud!\n\nYou can now access this data from any device.`);
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
      alert('✓ Loaded ' + result.students.length + ' students from cloud!\n\nRefreshing...');
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
              <div style="font-weight: 600; margin-bottom: 4px;">🔄 Automatic Cloud Sync</div>
              <div style="font-size: 13px; color: var(--color-text-secondary);">Automatically sync to cloud when you save changes (Recommended)</div>
            </div>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <button class="btn btn-primary" onclick="syncToCloudNow(); document.querySelector('div[style*=fixed]').remove();" style="padding: 16px;">
            <div style="font-size: 20px; margin-bottom: 4px;">☁️</div>
            <div style="font-size: 14px;">Sync Now</div>
          </button>
          <button class="btn btn-secondary" onclick="loadFromCloudNow();" style="padding: 16px;">
            <div style="font-size: 20px; margin-bottom: 4px;">⬇️</div>
            <div style="font-size: 14px;">Load from Cloud</div>
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

})();