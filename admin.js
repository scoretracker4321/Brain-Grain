// Admin-related functionality extracted from index.html
(function(){
  'use strict';

  function loadStudents() {
    try { allStudents = StorageHelper.loadStudents(); } catch(e) { /* ignore */ }

    // sync autoBackup toggle into the UI when admin view loads
    try { const chk = document.getElementById('autoBackupToggle'); if (chk) chk.checked = StorageHelper.isAutoBackupEnabled(); } catch(e) {}

    const showArchived = document.getElementById('showArchived') && document.getElementById('showArchived').checked;
    const tbody = document.getElementById('studentTableBody');
    const displayList = (allStudents || []).filter(s => showArchived ? true : !s.archived);

    if (displayList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No students registered yet</td></tr>';
      document.getElementById('studentCount').textContent = displayList.length;
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
    document.getElementById('studentCount').textContent = displayList.length;
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
        initializeStudents();
        loadStudents();
        alert('Demo data restored');
      } else {
        alert('Restore failed');
      }
    } catch(e) { console.error('restoreDemoData failed', e); alert('Restore failed'); }
  }

  function restoreLatestBackup() {
    if (!confirm('Restore latest backup? This will replace current students. Continue?')) return;
    try {
      const ok = StorageHelper.restoreLatestBackup();
      if (ok) {
        initializeStudents();
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
      const url = `assessment.html?studentId=${encodeURIComponent(studentId)}`;
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

})();