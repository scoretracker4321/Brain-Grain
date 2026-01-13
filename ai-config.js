// AI Configuration & Pod Planning Service
// Handles AI settings, pod plan generation, and formatting

(function() {
  'use strict';

  // Get AI configuration from localStorage
  function getAIConfig() {
    try {
      return {
        endpoint: localStorage.getItem('braingrain_ai_endpoint') || 'https://api.openai.com/v1/chat/completions',
        apiKey: localStorage.getItem('braingrain_ai_api_key') || '',
        model: localStorage.getItem('braingrain_ai_model') || 'gpt-4o-mini'
      };
    } catch (e) {
      return { endpoint: '', apiKey: '', model: '' };
    }
  }

  // Check if endpoint is Gemini-based
  function isGeminiEndpoint(url) {
    return typeof url === 'string' && url.includes('generativelanguage.googleapis.com');
  }

  // Save AI configuration to Firebase (requires CloudStorage to be enabled)
  async function saveAIConfigToFirebase() {
    const endpoint = document.getElementById('aiEndpointInput').value.trim();
    const apiKey = document.getElementById('aiApiKeyInput').value.trim();
    const model = document.getElementById('aiModelInput').value.trim();
    
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }
    
    if (!window.CloudStorage || !window.CloudStorage.isEnabled()) {
      alert('Firebase not enabled. AI config cannot be saved to cloud.');
      return;
    }
    
    const btn = document.getElementById('saveAIConfigBtn');
    if (btn) btn.textContent = 'Saving...';
    
    const result = await window.CloudStorage.saveAIConfig({ endpoint, apiKey, model });
    
    if (result.success) {
      alert('✓ AI configuration saved to Firebase!\n\nThis will be used across all your devices.');
      if (btn) btn.textContent = '✓ Saved';
      setTimeout(() => { if (btn) btn.textContent = 'Save to Firebase'; }, 2000);
    } else {
      alert('✗ Failed to save AI config: ' + (result.error || result.reason));
      if (btn) btn.textContent = 'Save to Firebase';
    }
  }

  // Build pod summary with student data for AI
  function buildPodSummary(pod, members, calculateAcademicAverage) {
    return {
      podName: pod.name,
      studentCount: members.length,
      students: members.map(st => ({
        id: st.id,
        name: `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.phone || st.id,
        grade: st.grade || 'N/A',
        school: st.school || 'N/A',
        academic: {
          maxMarks: st.maxMarks || 60,
          english: st.english || null,
          maths: st.maths || null,
          tamil: st.tamil || null,
          science: st.science || null,
          social: st.social || null,
          averagePercent: calculateAcademicAverage(st)
        },
        assessment: {
          score: typeof st.assessmentScore === 'number' ? st.assessmentScore : null,
          status: st.assessmentStatus || 'Pending',
          selPercent: st.assessmentBreakdown ? st.assessmentBreakdown.selPercent : null,
          ctPercent: st.assessmentBreakdown ? st.assessmentBreakdown.ctPercent : null,
          leadPercent: st.assessmentBreakdown ? st.assessmentBreakdown.leadPercent : null
        },
        supportNeeds: Array.isArray(st.supportNeeds) ? st.supportNeeds : []
      }))
    };
  }

  // Build structured student data for enhanced AI prompting
  function buildStructuredStudentsData(summary) {
    return {
      pod_name: summary.podName,
      session_length_minutes: 45,
      students: summary.students.map(st => {
        // Determine academic status
        const avgPercent = st.academic.averagePercent || 0;
        let academicStatus = '';
        if (avgPercent >= 80) {
          academicStatus = 'Advanced (High-level proficiency)';
        } else if (avgPercent >= 60) {
          academicStatus = 'On Track (Meeting standards)';
        } else if (avgPercent >= 40) {
          academicStatus = 'Extra Practice Needed (Below grade level)';
        } else {
          academicStatus = 'Intensive Support Required (Significant gaps)';
        }

        // Determine SEL status
        const selPercent = st.assessment.selPercent || 0;
        const ctPercent = st.assessment.ctPercent || 0;
        const leadPercent = st.assessment.leadPercent || 0;
        let selStatus = '';
        if (selPercent >= 70) {
          selStatus = 'High emotional awareness, confident, engaged';
        } else if (selPercent >= 50) {
          selStatus = 'Moderate confidence, needs some encouragement';
        } else {
          selStatus = 'Low confidence, shy, needs 1:1 attention and positive reinforcement';
        }

        if (ctPercent < 50) {
          selStatus += ', Needs critical thinking support';
        }
        if (leadPercent >= 70) {
          selStatus += ', Shows leadership potential';
        }

        // Simple language access inference (can improve later)
let languageAccess = 'READY';
if (st.assessment && st.assessment.score !== null && st.assessment.score < 40) {
  languageAccess = 'SUPPORTED';
}
if ((st.supportNeeds || []).includes('reading') || (st.supportNeeds || []).includes('writing')) {
  languageAccess = 'BLOCKED';
}

const lastFb = (summary.sessionFeedback || {})[st.id] || null;
return {
  name: st.name,
  academic_status: academicStatus,
  sel_status: selStatus,
  language_access: languageAccess,
  intervention_tags: st.supportNeeds || [],
  last_feedback: lastFb ? {
    behaviour: lastFb.behaviour || '',
    participation: lastFb.participation || '',
    interest: lastFb.interest || '',
    emotional_signals: lastFb.emotionalSignals || '',
    strengths: lastFb.strengths || '',
    needs: lastFb.needs || '',
    implication_next: lastFb.implicationNext || ''
  } : null
};

      })
    };
  }

  // Build AI prompt for pod planning
  const SYSTEM_RULES = `
You are a Brain Grain mentor-AI.

CORE PRINCIPLES:
- Do NOT assume students can read or write fluently.
- Language is a TOOL, not the goal.
- Avoid worksheets, silent reading, and long written responses.
- Prefer oral, visual, movement-based, and peer-supported activities.
- Build emotional safety before academic challenge.
- Separate THINKING from LANGUAGE.
- Design for inclusion: every student must be able to participate meaningfully.

If any student has language_access = BLOCKED or SUPPORTED:
- Do NOT include written diagnostics
- Replace diagnostics with oral, visual, or action-based checks
- Allow answers via speech, gestures, drawing, or peer explanation

Your role is NOT to teach syllabus content.
Your role is to unlock confidence, thinking habits, and leadership.
`;

  function buildPodPrompt(summary, userEdits = '', previousPlan = '') {
    const structuredData = buildStructuredStudentsData(summary);
    const SESSION_PHASE = summary.sessionPhase || 'FOUNDATION';

    const mentorStyle = [
      '- Write in facilitator-friendly language with exact phrases a mentor can say',
      '- Keep steps short, oral-first, and action-oriented',
      '- Include roles, cues, and observation notes so a mentor can run this without re-writing'
    ].join('\n');

    const editsBlock = userEdits ? [
      '',
      'MENTOR FEEDBACK / CHANGES TO APPLY:',
      userEdits
    ].join('\n') : '';

    const previousPlanBlock = previousPlan ? [
      '',
      'PREVIOUS PLAN (for reference, improve it rather than repeat):',
      typeof previousPlan === 'string' ? previousPlan : JSON.stringify(previousPlan, null, 2)
    ].join('\n') : '';

    return [
      SYSTEM_RULES,
      '',
      `Create a Day 1 Brain Grain pod session for "${summary.podName}" with TWO clear outputs:`,
      '',
      'SESSION CONTEXT:',
      '- Duration: 45 minutes',
      '- Pod-based learning',
      '- Focus on SEL, Critical Thinking, and Leadership',
      '- Students may have uneven language access',
      '',
      `CURRENT SESSION PHASE: ${SESSION_PHASE}`,
      'PHASE RULES:',
      '- FOUNDATION: No writing, no reading pressure',
      '- BRIDGE: Sentence starters allowed',
      '- STRETCH: Short writing with peer support',
      '',
      'DESIGN REQUIREMENTS:',
      '- No worksheets',
      '- No long written tasks',
      '- Instructions must be deliverable orally',
      'MANDATORY ROLES REQUIREMENT:',
      '- You MUST create a section titled exactly: "ROLES FOR TODAY".',
      '- You MUST assign exactly ONE role to EACH student.',
      '- You MUST use the exact student names from POD DATA.',
      '- You MUST show roles in this format:',
      '  Student Name (Role Name)',
      '- Roles MUST guarantee participation without requiring speaking or writing.',
      '- Roles MUST appear BEFORE the first session activity.',
      '- Diagnostics must be observational, oral, or activity-based (not written tests)',
      '',
      'MENTOR-FRIENDLY STYLE:',
      mentorStyle,
      '',
      'MANDATORY ROLE INSTRUCTION:',
      '- You MUST assign ONE role to EACH student.',
      '- Use the exact student names provided in POD DATA.',
      '- Include roles ONLY inside facilitator_card.roles_for_today.',
      '- Role format MUST be: Student Name + Role Name.',
      '- Roles MUST be visible to the facilitator.',
      '- Roles MUST guarantee participation without speaking or writing.',
      '',
      'POD DATA:',
      JSON.stringify(structuredData, null, 2),
      '',
      'LAST SESSION FEEDBACK (per student, if any):',
      JSON.stringify(summary.sessionFeedback || {}, null, 2),
      editsBlock,
      previousPlanBlock,
      '',
      'OUTPUT SPECIFICATION (RETURN STRICT JSON):',
      '{',
      '  "facilitator_card": {',
      '    "duration_minutes": 45,',
      '    "goal": "Safety first. Thinking second.",',
      '    "materials": ["cloth/mat", "6–8 sticks", "one simple picture card", "4 blank papers + pencils (optional)"],',
      '    "roles_for_today": [',
      '      "Alice Kumar (Material Mover)",',
      '      "Bob Sharma (Pattern Watcher)",',
      '      "Charlie Patel (Calm Keeper)",',
      '      "Dana Iyer (Idea Listener)"',
      '    ],',
      '    "sections": [',
      '      {"title":"ROLES FOR TODAY","time_minutes":3, "say":["Assign roles now using the list above.", "Each role helps the team. No writing needed."], "place":[], "watch":["Who hesitates", "Who seems eager"]},',
      '      {"title":"ENTRY","time_minutes":2, "say":["Invite the material mover to place the cloth.", "Ask the pattern watcher to stand where they can see everyone."], "place":[], "watch":["Who stays calm when starting", "Who invites a peer"]},',
      '      {"title":"SAFETY FIRST","time_minutes":5, "say":["Nobody laughs at mistakes.", "Nobody is forced to read or write.", "You can talk or just listen."], "place":[], "watch":[]},',
      '      {"title":"THINKING TASK","time_minutes":15, "say":["This is not a test.", "There is no one right answer.", "You don\u2019t have to write."], "place":["Cloth", "Sticks", "Picture card"], "watch":["What do you notice?", "What did you try first?", "Is there another way?"]},',
      '      {"title":"PAUSE","time_minutes":5, "say":["Let\u2019s pause.", "I can take one small step."], "place":[], "watch":[]},',
      '      {"title":"TRY AGAIN","time_minutes":15, "say":["Try again.", "You may sit closer to one person.", "You can whisper, point, or draw.", "Thinking slowly is allowed."], "place":["Paper & pencils"], "watch":[]},',
      '      {"title":"CLOSE","time_minutes":3, "say":["One small thing before we finish.", "Something you tried", "Something you noticed", "Or just \'I listened\'", "Brain Grain is about trying, not being the best."], "place":[], "watch":[]}',
      '    ]',
      '  },',
      '  "system_notes": {',
      '    "differentiation": [',
      '      "Alice Kumar: needs gentle pace; use tactile prompts",',
      '      "Bob Sharma: give visual pattern first; avoid rapid switches",',
      '      "Charlie Patel: pair with breathing cue; limit overstimulation",',
      '      "Dana Iyer: invite summaries; prevent over-leading"
      '    ],',
      '    "observation_signals": [',
      '      "Alice: shoulders loosen, stays engaged with materials",',
      '      "Bob: tracks sequences without freezing",',
      '      "Charlie: steady breathing, steady eye contact",',
      '      "Dana: invites peers, does not dominate"
      '    ],',
      '    "student_mapping": [',
      '      "Alice Kumar → Material Mover (low confidence, safe entry role)",',
      '      "Bob Sharma → Pattern Watcher (focus + observation)",',
      '      "Charlie Patel → Calm Keeper (self-regulation)",',
      '      "Dana Iyer → Idea Listener (leadership without dominance)"',
      '    ],',
      '    "ai_logic": "Why each step unlocks safety and thinking; how prompts adapt for BLOCKED/SUPPORTED language access."',
      '  }',
      '}',
      '',
      '===============================',
      'BRAIN GRAIN – PLAN GENERATION RULES (V3)',
      'Facilitator-Friendly + Role-Based Participation',
      '===============================',

      'STRICT_RULES:',

      '- FACILITATOR_CARD_RULES:',
      '  - facilitator_card MUST be readable and executable in under 2 minutes.',
      '  - facilitator_card MUST fit on one page (max 250–300 words).',
      '  - facilitator_card MUST NOT include student names, student tags, academic levels, or individual differentiation EXCEPT inside roles_for_today.',
      '  - facilitator_card MUST include a section titled exactly "ROLES FOR TODAY" before any activity sections.',
      '  - facilitator_card MUST be written in simple spoken language, as exact phrases the mentor can say aloud.',
      '  - facilitator_card MUST be structured into short phases, each containing:',
      '    - TIME',
      '    - SAY (exact words to speak)',
      '    - DO (physical actions or materials)',
      '    - WATCH (1–2 emotional or behavioural cues only).',
      '  - facilitator_card MUST limit each phase to:',
      '    - maximum 2 SAY items,',
      '    - maximum 2 DO items,',
      '    - maximum 2 WATCH items.',
      '  - facilitator_card MUST prioritise emotional safety over task completion.',

      '- ROLE_DISTRIBUTION_RULES:',
      '  - EACH session MUST include clearly defined student roles.',
      '  - EVERY student in the pod MUST be assigned exactly one role.',
      '  - Roles MUST guarantee participation without requiring speaking or writing.',
      '  - Roles MUST be simple, neutral, and non-hierarchical.',
      '  - Roles MUST rotate across sessions to avoid fixed identity or labelling.',
      '  - facilitator_card MUST include:',
      '    - a short list of roles,',
      '    - one simple instruction per role,',
      '    - wording that allows the mentor to assign roles verbally on the spot.',
      '  - Roles MUST support regulation, observation, connection, or task movement, not academic performance.',

      '- SYSTEM_NOTES_RULES:',
      '  - system_notes MUST include:',
      '    - student differentiation,',
      '    - learning levels,',
      '    - SEL patterns,',
      '    - leadership signals,',
      '    - observation markers.',
      '  - system_notes MUST map students to roles internally based on:',
      '    - safety needs,',
      '    - confidence levels,',
      '    - energy regulation needs.',
      '  - system_notes MUST translate last-session feedback into:',
      '    - role adjustments,',
      '    - safety scaffolds,',
      '    - prompt modifications.',
      '  - system_notes MUST NEVER surface directly in the facilitator_card.',
      '  - system_notes MAY be verbose and analytical.',

      '- SESSION_CONTINUITY_RULE:',
      '  - Last session feedback MUST be used ONLY to adjust:',
      '    - prompts,',
      '    - pacing,',
      '    - proximity,',
      '    - role selection,',
      '    - safety supports.',
      '  - Task difficulty MUST NOT increase unless emotional safety signals improved in the previous session.',

      '- OUTPUT_RULE:',
      '  - Output MUST be a single JSON object with exactly two keys:',
      '    - facilitator_card',
      '    - system_notes',
      '  - facilitator_card MUST be plain-text and human-readable.',
      '  - system_notes MAY contain structured data and internal logic.',
      '  - Output MUST be valid JSON only.'
    ].filter(Boolean).join('\n');
  }



  // Update modal state for pod plan display
  function setPlanModalState({ title, statusText, contentText, isError = false, showSpinner = false }) {
    const modal = document.getElementById('podPlanModal');
    const titleEl = document.getElementById('podPlanTitle');
    const statusEl = document.getElementById('podPlanStatus');
    const contentEl = document.getElementById('podFacilitatorCard') || document.getElementById('podPlanContent');
    const spinnerEl = document.getElementById('podPlanSpinner');

    if (modal) modal.style.display = 'flex';
    if (titleEl && title) titleEl.textContent = title;
    if (statusEl && statusText !== undefined) {
      statusEl.textContent = statusText;
      statusEl.style.color = isError ? '#b91c1c' : 'var(--color-text-secondary)';
    }
    if (contentEl && contentText !== undefined) {
      // Use innerHTML for formatted HTML content, textContent for plain text
      if (contentText.trim().startsWith('<')) {
        contentEl.innerHTML = contentText;
      } else {
        contentEl.textContent = contentText;
      }
    }
    if (spinnerEl) spinnerEl.style.display = showSpinner ? 'inline-block' : 'none';
  }

  // Close pod plan modal
  function closePodPlanModal() {
    const modal = document.getElementById('podPlanModal');
    if (modal) modal.style.display = 'none';
    window.currentPodPlanId = null;
  }

  // Copy plan content to clipboard
  function copyPlanToClipboard() {
    const contentEl = document.getElementById('podFacilitatorCard') || document.getElementById('podPlanContent');
    if (!contentEl) return;
    const text = contentEl.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert('Plan copied to clipboard');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Plan copied to clipboard');
    });
  }

  // Fallback plan template (when AI is not configured)
  function buildFallbackPlan(summary) {
  const studentCount = summary.studentCount || 3;
  const roles = ["Time Keeper", "Materials Helper", "Observer", "Anchor", "Bridge"];
  const roleSubset = roles.slice(0, studentCount);
  
  return `
Day 1 Brain Grain Pod Session – ${summary.podName}

Objective:
Build safety, observe thinking habits, and encourage participation.

👥 STUDENT ROLES (Assign verbally at start):
${roleSubset.map((role, idx) => `  ${idx + 1}. ${role} - ${getRoleInstruction(role)}`).join('\n')}
🔄 Rotate these roles in future sessions to avoid fixed labels.

1) Welcome & Feelings Check (10 min)
Students share name + feeling using words, gestures, or emojis.
(Time Keeper watches the clock, Observer notices who shares what)

2) Thinking Without Writing (15 min)
Mentor presents a simple visual puzzle.
Students respond orally, by pointing, or by explaining to a peer.
(Materials Helper distributes puzzle cards, Anchor starts first)

3) Group Activity with Roles (10 min)
Students practice their assigned roles during a collaborative task.
Mentor supports students in understanding their role's purpose.

4) Reflection & Close (10 min)
Students share one thing they tried or noticed.
Mentor notes confidence, language access, and engagement.
`;
}

function getRoleInstruction(role) {
  const instructions = {
    "Time Keeper": "Watches the timer and lets the group know when time is up",
    "Materials Helper": "Hands out materials and collects them at the end",
    "Observer": "Notices group energy and shares what they see",
    "Anchor": "Starts each new activity first to set the pace",
    "Bridge": "Connects ideas between activities by summarizing"
  };
  return instructions[role] || "Supports the session flow";
}


  // Format AI response as readable HTML document (legacy single-output)
  function formatSessionPlanAsDocument(plan) {
    if (!plan) return 'No plan data available.';
    
    let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #2d3748;">`;
    
    // Title and objective
    html += `<div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">`;
    html += `<h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #1a202c;">${plan.session_title || 'Session Plan'}</h2>`;
    if (plan.objective) {
      html += `<div style="background: #edf2f7; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #4299e1;">`;
      html += `<strong style="color: #2c5282;">Objective:</strong> <span style="color: #2d3748;">${plan.objective}</span>`;
      html += `</div>`;
    }
    if (plan.duration_minutes) {
      html += `<div style="margin-top: 12px; color: #718096; font-size: 14px;">⏱️ Total Duration: <strong>${plan.duration_minutes} minutes</strong></div>`;
    }
    html += `</div>`;
    
    // Student Roles Section
    if (plan.student_roles) {
      html += `<div style="margin-bottom: 28px; padding: 20px; background: #fef5e7; border-radius: 12px; border: 2px solid #f39c12;">`;
      html += `<h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #d68910;">👥 Student Roles (Assign on the spot)</h3>`;
      
      if (plan.student_roles.role_list && plan.student_roles.instructions) {
        html += `<div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">`;
        plan.student_roles.role_list.forEach((role, idx) => {
          const instruction = plan.student_roles.instructions[idx] || 'Supports the session';
          html += `<div style="margin-bottom: 12px; padding: 12px; background: #fef9f2; border-left: 4px solid #f39c12; border-radius: 6px;">`;
          html += `<div style="font-weight: 700; color: #c77200; margin-bottom: 4px;">🎭 ${role}</div>`;
          html += `<div style="color: #6c5a00; font-size: 14px;">${instruction}</div>`;
          html += `</div>`;
        });
        html += `</div>`;
      }
      
      if (plan.student_roles.rotation_note) {
        html += `<div style="padding: 10px 14px; background: #fff3cd; border-radius: 6px; border-left: 3px solid #f39c12; color: #856404; font-size: 13px;">`;
        html += `🔄 <strong>Remember:</strong> ${plan.student_roles.rotation_note}`;
        html += `</div>`;
      }
      html += `</div>`;
    }
    
    // Activities
    if (plan.activities && Array.isArray(plan.activities)) {
      plan.activities.forEach((activity, index) => {
        html += `<div style="margin-bottom: 28px; padding: 20px; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;">`;
        
        // Activity header
        html += `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">`;
        html += `<div style="background: #4299e1; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;">${index + 1}</div>`;
        html += `<div style="flex: 1;">`;
        html += `<h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">${activity.activity_title || 'Activity'}</h3>`;
        if (activity.duration_minutes) {
          html += `<div style="margin-top: 4px; color: #718096; font-size: 13px;">⏱️ ${activity.duration_minutes} minutes</div>`;
        }
        html += `</div>`;
        html += `</div>`;
        
        // Description
        if (activity.description) {
          html += `<div style="margin-bottom: 16px; padding: 12px; background: white; border-radius: 8px; color: #4a5568;">`;
          html += `<strong style="color: #2d3748;">Description:</strong> ${activity.description}`;
          html += `</div>`;
        }
        
        // Differentiation
        if (activity.differentiation && Array.isArray(activity.differentiation) && activity.differentiation.length > 0) {
          html += `<div style="margin-bottom: 16px;">`;
          html += `<div style="font-weight: 700; color: #2c5282; margin-bottom: 8px; font-size: 15px;">👥 Student-Specific Differentiation:</div>`;
          activity.differentiation.forEach((diff, idx) => {
            // Extract student name (text before the first colon)
            const colonIndex = diff.indexOf(':');
            const studentName = colonIndex > 0 ? diff.substring(0, colonIndex).trim() : `Student ${idx + 1}`;
            const instruction = colonIndex > 0 ? diff.substring(colonIndex + 1).trim() : diff;
            
            html += `<div style="margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; border-left: 3px solid #48bb78;">`;
            html += `<div style="font-weight: 600; color: #2f855a; margin-bottom: 4px;">🎯 ${studentName}</div>`;
            html += `<div style="color: #4a5568; font-size: 14px; line-height: 1.6;">${instruction}</div>`;
            html += `</div>`;
          });
          html += `</div>`;
        }
        
        // Signals
        if (activity.signals) {
          html += `<div style="padding: 12px; background: #fff5e6; border-radius: 8px; border-left: 3px solid #f59e0b;">`;
          html += `<strong style="color: #c05621;">📊 Mentor Observation Signals:</strong> `;
          html += `<span style="color: #744210;">${activity.signals}</span>`;
          html += `</div>`;
        }
        
        html += `</div>`;
      });
    }
    
    html += `</div>`;
    return html;
  }

  // Format Facilitator Execution Card (no names, no tags, no differentiation)
  function formatFacilitatorExecutionCard(card) {
    if (!card) return 'No facilitator card available.';
    const htmlParts = [];
    htmlParts.push(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #2d3748;">`);
    htmlParts.push(`<div style="margin-bottom: 16px;">`);
    if (card.duration_minutes) {
      htmlParts.push(`<div style="color:#718096;">⏱️ ${card.duration_minutes} minutes</div>`);
    }
    if (card.goal) {
      htmlParts.push(`<div style="font-weight:700;">🎯 Goal: <span style="font-weight:500;">${card.goal}</span></div>`);
    }
    htmlParts.push(`</div>`);
    if (Array.isArray(card.materials) && card.materials.length) {
      htmlParts.push(`<div style="margin-bottom: 16px;">`);
      htmlParts.push(`<div style="font-weight:700;">🧰 Materials (Put in one tray)</div>`);
      htmlParts.push(`<ul style="margin:8px 0 0 18px; color:#4a5568;">${card.materials.map(m=>`<li>${m}</li>`).join('')}</ul>`);
      htmlParts.push(`</div>`);
    }
    // Render Roles (Student Name + Role)
    const rolesForToday = Array.isArray(card.roles_for_today)
      ? card.roles_for_today
      : (Array.isArray(card.roles) ? card.roles.map(r => (r && r.student && r.role ? `${r.student} (${r.role})` : '')).filter(Boolean) : []);
    if (rolesForToday.length) {
      htmlParts.push(`<div style="margin-bottom: 16px; padding:12px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px;">`);
      htmlParts.push(`<div style="font-weight:700;">🎭 Roles for Today</div>`);
      htmlParts.push(`<ul style="margin:8px 0 0 18px; color:#7c2d12;">`);
      rolesForToday.forEach(r => {
        htmlParts.push(`<li>${r}</li>`);
      });
      htmlParts.push(`</ul></div>`);
    }
    if (Array.isArray(card.sections)) {
      card.sections.forEach((sec, idx) => {
        htmlParts.push(`<div style="margin-bottom: 16px; padding: 12px; background:#f7fafc; border:1px solid #e2e8f0; border-radius:8px;">`);
        htmlParts.push(`<div style="display:flex; justify-content:space-between; align-items:center;">`);
        htmlParts.push(`<div style="font-weight:700;">${idx+1}️⃣ ${sec.title || 'Step'}</div>`);
        if (sec.time_minutes) htmlParts.push(`<div style="color:#718096;">${sec.time_minutes} min</div>`);
        htmlParts.push(`</div>`);
        if (Array.isArray(sec.say) && sec.say.length) {
          htmlParts.push(`<div style="margin-top:8px; font-weight:700;">Say:</div>`);
          htmlParts.push(`<ul style="margin:6px 0 0 18px; color:#4a5568;">${sec.say.map(s=>`<li>${s}</li>`).join('')}</ul>`);
        }
        if (Array.isArray(sec.place) && sec.place.length) {
          htmlParts.push(`<div style="margin-top:8px; font-weight:700;">Place in centre:</div>`);
          htmlParts.push(`<ul style="margin:6px 0 0 18px; color:#4a5568;">${sec.place.map(p=>`<li>${p}</li>`).join('')}</ul>`);
        }
        if (Array.isArray(sec.watch) && sec.watch.length) {
          htmlParts.push(`<div style="margin-top:8px; font-weight:700;">Watch:</div>`);
          htmlParts.push(`<ul style="margin:6px 0 0 18px; color:#4a5568;">${sec.watch.map(w=>`<li>${w}</li>`).join('')}</ul>`);
        }
        htmlParts.push(`</div>`);
      });
    }
    htmlParts.push(`</div>`);
    return htmlParts.join('');
  }

  // Format System Notes (differentiation, observation signals, student mapping, AI logic)
  function formatSystemNotes(notes) {
    if (!notes) return '<div style="color:#718096;">No system notes available.</div>';
    let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.7; color:#2d3748;">`;
    if (Array.isArray(notes.differentiation) && notes.differentiation.length) {
      html += `<div style="margin-bottom:12px;">`;
      html += `<div style="font-weight:700; color:#2c5282;">Differentiation</div>`;
      html += `<ul style="margin:6px 0 0 18px; color:#4a5568;">${notes.differentiation.map(d=>`<li>${d}</li>`).join('')}</ul>`;
      html += `</div>`;
    }
    if (Array.isArray(notes.observation_signals) && notes.observation_signals.length) {
      html += `<div style="margin-bottom:12px;">`;
      html += `<div style="font-weight:700; color:#2c5282;">Observation Signals</div>`;
      html += `<ul style="margin:6px 0 0 18px; color:#4a5568;">${notes.observation_signals.map(s=>`<li>${s}</li>`).join('')}</ul>`;
      html += `</div>`;
    }
    if (Array.isArray(notes.student_mapping) && notes.student_mapping.length) {
      html += `<div style="margin-bottom:12px;">`;
      html += `<div style="font-weight:700; color:#2c5282;">Student Mapping</div>`;
      html += `<ul style="margin:6px 0 0 18px; color:#4a5568;">${notes.student_mapping.map(s=>`<li>${s}</li>`).join('')}</ul>`;
      html += `</div>`;
    }
    if (notes.ai_logic) {
      html += `<div style="margin-bottom:12px;">`;
      html += `<div style="font-weight:700; color:#2c5282;">AI Logic</div>`;
      html += `<div style="margin-top:6px; color:#4a5568;">${notes.ai_logic}</div>`;
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  // Request pod plan from backend AI service
  async function requestPodPlan(summary, options = {}) {
    const { userEdits = '', previousPlan = '' } = options;
    const prompt = buildPodPrompt(summary, userEdits, previousPlan);
    const structuredData = buildStructuredStudentsData(summary);
    const backendUrl = window.location.origin + '/api/generate-pod-plan';

    setPlanModalState({ statusText: 'Sending to AI...', showSpinner: true });

    try {
      const resp = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podSummary: summary,
          prompt: prompt,
          studentsData: JSON.stringify(structuredData, null, 2),
          userEdits,
          previousPlan
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data.useFallback || resp.status === 503) {
          setPlanModalState({
            statusText: data.error || 'Backend not configured. Using fallback template.',
            contentText: buildFallbackPlan(summary),
            isError: true,
            showSpinner: false
          });
          return;
        }
        throw new Error(data.error || `Request failed: ${resp.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'AI request failed');
      }

      // Parse response expecting dual-output JSON: facilitator_card + system_notes
      let rawText = data.plan || 'AI response empty.';
      let facilitatorHtml = '';
      let systemNotesHtml = '';
      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Fallback: legacy single output
        parsed = null;
      }

      if (parsed && parsed.facilitator_card) {
        if (
          !parsed.facilitator_card.roles_for_today ||
          parsed.facilitator_card.roles_for_today.length !== summary.studentCount
        ) {
          throw new Error('Invalid plan: missing or incomplete roles_for_today');
        }
        if (!Array.isArray(parsed.facilitator_card.sections) || parsed.facilitator_card.sections.length === 0 || parsed.facilitator_card.sections[0].title !== 'ROLES FOR TODAY') {
          throw new Error('Invalid plan: ROLES FOR TODAY section missing or misplaced');
        }
        facilitatorHtml = formatFacilitatorExecutionCard(parsed.facilitator_card);
        systemNotesHtml = formatSystemNotes(parsed.system_notes || {});
      } else {
        // Legacy formatting if not dual-output
        facilitatorHtml = formatSessionPlanAsDocument(parsed || { session_title: 'Session Plan', objective: rawText });
        systemNotesHtml = '<div style="color:#718096;">No system notes provided.</div>';
      }

      window.__lastPlanData = {
        raw: rawText,
        facilitatorHtml,
        systemNotesHtml,
        provider: data.provider || 'AI',
        summary,
        ts: Date.now(),
        userEdits
      };

      setPlanModalState({
        statusText: `Ready (${data.provider || 'AI'})`,
        contentText: facilitatorHtml,
        isError: !data.plan,
        showSpinner: false
      });

      // Also inject System Notes if present
      const sysEl = document.getElementById('podSystemNotesContent');
      if (sysEl) sysEl.innerHTML = systemNotesHtml;
    } catch (e) {
      console.error('AI plan error', e);
      setPlanModalState({
        statusText: e.message || 'AI request failed. Showing fallback plan.',
        contentText: buildFallbackPlan(summary),
        isError: true,
        showSpinner: false
      });
      const sysEl = document.getElementById('podSystemNotesContent');
      if (sysEl) sysEl.innerHTML = '<div style="color:#718096;">System notes unavailable (fallback plan in use).</div>';
    }
  }

  // Expose functions to global scope
  window.getAIConfig = getAIConfig;
  window.isGeminiEndpoint = isGeminiEndpoint;
  window.saveAIConfigToFirebase = saveAIConfigToFirebase;
  window.buildPodSummary = buildPodSummary;
  window.buildStructuredStudentsData = buildStructuredStudentsData;
  window.buildPodPrompt = buildPodPrompt;
  window.setPlanModalState = setPlanModalState;
  window.closePodPlanModal = closePodPlanModal;
  window.copyPlanToClipboard = copyPlanToClipboard;
  window.buildFallbackPlan = buildFallbackPlan;
  window.formatSessionPlanAsDocument = formatSessionPlanAsDocument;
  window.formatFacilitatorExecutionCard = formatFacilitatorExecutionCard;
  window.formatSystemNotes = formatSystemNotes;
  window.requestPodPlan = requestPodPlan;

})();
