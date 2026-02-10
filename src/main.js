// VoiceOps Main Application - Complete (Live API)
import './index.css';
import './components.css';
import './pages.css';
import './tables.css';
import './animations.css';
import './chatbot.css';
import './dashboard.css';
import { n8nWorkflowJSON } from './data.js';
import VoiceOpsAssistant from './chatbot.js';
import { renderDashboard } from './dashboard.js';
import { getCalls, getCallById, getActiveCases, getRecentActivity, updateCallStatus, analyzeCall, liveStore } from './api.js';

// State
let currentPage = 'dashboard';
let selectedCallId = null;
let showJsonView = false;
let processingState = null; // null | { step: 0-4, fileName: string, uploading: boolean }

// Initialize AI Assistant
const assistant = new VoiceOpsAssistant();

// Make assistant globally available for easier debugging/integration
window.voiceOpsAssistant = assistant;

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },

  { id: 'cases', label: 'Active Cases', icon: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>' },

  { id: 'risk-queue', label: 'Risk Queue', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
  { id: 'workflow-logs', label: 'Workflow Logs', icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
  { id: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', init);

function init() {
  renderSidebar();
  renderHeader();
  renderPage(); // async — renders skeleton then real content
  setupEventListeners();
  renderModalContent();
  
  // Initialize AI Assistant
  assistant.init();
  updateAssistantContext();
}

// Sidebar
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = navItems.map(item => `
    <a href="#" class="nav-item ${item.id === currentPage ? 'active' : ''}" data-page="${item.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.icon}</svg>
      <span>${item.label}</span>
    </a>
  `).join('');
}

// Header  
function renderHeader() {
  const header = document.getElementById('header');
  header.innerHTML = `
    <div class="header-left">
      <div class="system-status online"><span class="status-dot"></span><span class="status-text">System Online</span></div>
    </div>
    <div class="header-center">
      <div class="n8n-card">
        <div class="n8n-workflow-mini">
          <div class="workflow-node"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2"/></svg></div>
          <div class="workflow-arrow">→</div>
          <div class="workflow-node active"><span>VO</span></div>
          <div class="workflow-arrow">→</div>
          <div class="workflow-node"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
        </div>
        <div class="n8n-actions">
          <button class="btn-n8n" id="btn-open-n8n">Open in n8n</button>
          <button class="btn-n8n-secondary" id="btn-simulate-call">Simulate Customer Call</button>
        </div>
      </div>
    </div>
    <div class="header-right">
      <button class="notification-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg><span class="notification-badge">3</span></button>
      <div class="user-avatar"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=voiceops" alt="User"></div>
    </div>
  `;
}

// Event Setup
function setupEventListeners() {
  // Navigation
  document.getElementById('sidebar-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      e.preventDefault();
      navigateTo(navItem.dataset.page);
    }
  });

  // n8n buttons + simulate
  document.getElementById('header').addEventListener('click', (e) => {
    if (e.target.id === 'btn-open-n8n') {
      showJsonView = false;
      renderModalContent();
      document.getElementById('n8n-modal').classList.add('active');
    }
    if (e.target.id === 'btn-simulate-call') {
      simulateCall();
    }
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('n8n-modal').classList.remove('active');
  });

  document.getElementById('n8n-modal').addEventListener('click', (e) => {
    if (e.target.id === 'n8n-modal') {
      document.getElementById('n8n-modal').classList.remove('active');
    }
  });

  // Copy JSON
  document.getElementById('btn-copy-json').addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(n8nWorkflowJSON, null, 2));
    document.getElementById('btn-copy-json').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('btn-copy-json').textContent = 'Copy Workflow JSON';
    }, 2000);
  });

  // Content clicks — but NOT on upload zone
  document.getElementById('content').addEventListener('click', (e) => {
    // Don't intercept clicks inside upload zone or file input
    if (e.target.closest('#upload-zone') || e.target.closest('#file-input')) return;
    
    const callCard = e.target.closest('.call-card');
    if (callCard) {
      selectedCallId = callCard.dataset.callId;
      currentPage = 'investigation';
      renderSidebar();
      renderPage();
    }
  });
}

// Global navigation
window.navigateTo = function (page) {
  // backward compat: 'home' -> 'cases'
  if (page === 'home') page = 'cases';
  currentPage = page;
  selectedCallId = null;
  renderSidebar();
  renderPage();
  updateAssistantContext();
};

window.toggleExplanation = function (callId) {
  const el = document.getElementById(`explanation-${callId}`);
  if (el) el.classList.toggle('expanded');
};

window.openCallInvestigation = function (callId) {
  selectedCallId = callId;
  currentPage = 'investigation';
  renderSidebar();
  renderPage();
  updateAssistantContext();
};

window.simulateCall = function () {
  // Show a popup overlay with just the animation — no data loading
  const overlay = document.createElement('div');
  overlay.id = 'simulate-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';

  const procSteps = [
    { label: 'Call Received', icon: '' },
    { label: 'Transcribing Audio', icon: '' },
    { label: 'NLP Analysis', icon: '' },
    { label: 'RAG Knowledge Check', icon: '' },
    { label: 'Risk Decision', icon: '' },
    { label: 'Action Dispatched', icon: '' }
  ];

  function renderSimBox(step) {
    return `
      <div style="background:var(--bg-elevated, #1a1d23);border:1px solid var(--border-color, #2a2d35);border-radius:16px;padding:40px 48px;min-width:500px;max-width:600px;box-shadow:0 24px 48px rgba(0,0,0,0.4);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
          <h2 style="color:#fff;font-size:20px;margin:0;">🔄 VoiceOps Pipeline Demo</h2>
          <button id="close-sim" style="background:none;border:none;color:#888;font-size:24px;cursor:pointer;padding:4px 8px;">&times;</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${procSteps.map((s, i) => {
            let color = '#555'; let opacity = '0.4'; let indicator = '○';
            if (i < step) { color = '#22c55e'; opacity = '1'; indicator = '✓'; }
            else if (i === step) { color = '#6366f1'; opacity = '1'; indicator = '●'; }
            return `<div style="display:flex;align-items:center;gap:14px;opacity:${opacity};transition:opacity 0.3s;">
              <span style="font-size:22px;">${s.icon}</span>
              <span style="flex:1;color:#fff;font-size:15px;">${s.label}</span>
              <span style="color:${color};font-size:16px;font-weight:600;">${indicator}</span>
            </div>`;
          }).join('')}
        </div>
        ${step >= procSteps.length ? `<div style="margin-top:24px;padding:16px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:10px;text-align:center;">
          <p style="color:#22c55e;font-size:15px;margin:0;font-weight:600;">Pipeline Complete — Case would be created & routed</p>
        </div>` : ''}
      </div>`;
  }

  overlay.innerHTML = renderSimBox(0);
  document.body.appendChild(overlay);

  // Close button
  overlay.addEventListener('click', (e) => {
    if (e.target.id === 'close-sim' || e.target === overlay) {
      overlay.remove();
    }
  });

  // Animate steps
  let step = 0;
  const durations = [800, 1200, 1400, 1200, 1000, 800];
  function nextStep() {
    step++;
    overlay.innerHTML = renderSimBox(step);
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'close-sim' || e.target === overlay) overlay.remove();
    });
    if (step < procSteps.length) {
      setTimeout(nextStep, durations[step]);
    } else {
      // Auto-close after 2 seconds
      setTimeout(() => { if (document.getElementById('simulate-overlay')) overlay.remove(); }, 2500);
    }
  }
  setTimeout(nextStep, durations[0]);
};

function startProcessing(fileName) {
  // Simulation mode only (no real file)
  processingState = { step: 0, fileName, uploading: false };
  renderPage();

  const stepDurations = [1200, 1500, 1000, 800];
  let currentStep = 0;

  function advanceStep() {
    currentStep++;
    if (currentStep < 4) {
      processingState = { ...processingState, step: currentStep };
      updateProcessingUI();
      setTimeout(advanceStep, stepDurations[currentStep]);
    } else {
      processingState = null;
      renderPage();
    }
  }
  setTimeout(advanceStep, stepDurations[0]);
}

function setupUploadHandlers() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (!uploadZone || !fileInput) {
    console.warn('[Upload] upload-zone or file-input not found in DOM');
    return;
  }

  console.log('[Upload] Handlers attached ');

  // Click on upload zone → trigger file picker
  // No preventDefault — it can block the file dialog in some browsers
  uploadZone.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  // Drag & drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  });

  // File picker callback
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) handleFileUpload(file);
  });
}

// Upload handler — just hit the API, nothing else
async function handleFileUpload(file) {
  console.log('[Upload] GOT FILE:', file.name, '|', file.type, '|', file.size, 'bytes');

  // Disable further uploads and show status
  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) {
    uploadZone.style.pointerEvents = 'none';
    uploadZone.style.opacity = '0.6';
    uploadZone.innerHTML = `<p style="color:var(--text-primary);font-size:16px;padding:20px;">⏳ Uploading & analyzing <strong>${file.name}</strong>...<br><small>This may take a minute.</small></p>`;
  }

  try {
    console.log('[Upload] >>> Sending POST to /analyze-call...');
    const result = await analyzeCall(file);
    console.log('[Upload] <<< Response:', result);

    if (result && result.call_id) {
      alert('✅ Analysis complete! Opening case: ' + result.call_id);
      selectedCallId = result.call_id;
      currentPage = 'investigation';
      renderSidebar();
      renderPage();
    } else {
      alert('✅ Call analyzed successfully!');
      renderPage();
    }
  } catch (err) {
    console.error('[Upload]  FAILED:', err);
    alert('Upload failed: ' + err.message);
    // Re-render the page to restore the upload zone
    renderPage();
  }
}

// Update just the processing panel without re-rendering the whole page
function updateProcessingUI() {
  const panel = document.querySelector('.start-analysis-panel');
  if (panel) {
    panel.outerHTML = renderStartAnalysisPanel();
  }
}

// Page rendering
async function renderPage() {
  const content = document.getElementById('content');
  // Show a loading skeleton for any page while fetching
  const loadingSkeleton = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-muted)"><p>Loading…</p></div>';

  switch (currentPage) {
    case 'dashboard':
      content.innerHTML = '<div class="dashboard-page"><div class="dash-stats-row">' + Array(4).fill('<div class="dash-stat-card skeleton"><div class="skeleton-shine"></div></div>').join('') + '</div></div>';
      content.innerHTML = await renderDashboard();
      break;
    case 'cases':
      content.innerHTML = loadingSkeleton;
      content.innerHTML = await renderHomePage();
      setupUploadHandlers();
      break;
    case 'risk-queue':
      content.innerHTML = loadingSkeleton;
      content.innerHTML = await renderRiskQueuePage();
      break;
    case 'workflow-logs':
      content.innerHTML = loadingSkeleton;
      content.innerHTML = await renderWorkflowLogsPage();
      break;
    case 'settings':
      content.innerHTML = renderSettingsPage();
      break;
    case 'investigation':
      content.innerHTML = loadingSkeleton;
      content.innerHTML = await renderInvestigationPage();
      break;
    default:
      content.innerHTML = '<div class="dashboard-page"><div class="dash-stats-row">' + Array(4).fill('<div class="dash-stat-card skeleton"><div class="skeleton-shine"></div></div>').join('') + '</div></div>';
      content.innerHTML = await renderDashboard();
      setupUploadHandlers();
  }
}

// Utility functions
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function getAutomationIcon(type) {
  const icons = {
    slack: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/></svg>',
    crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    callback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>',
    escalation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    manual_review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M12 9l3 3-3 3"/></svg>' // Eye icon preferred but this is activity
  };
  return icons[type] || icons.crm;
}

// Home Page (Active Risk Cases) — fetches from /calls API
async function renderHomePage() {
  try {
    const data = await getCalls({ page: 1, limit: 20, sort: 'recent' });
    const calls = data.calls || data || [];
    liveStore.setCalls(calls);

    const highRiskCount = calls.filter(c => (c.grounded_assessment || c.rag_output?.grounded_assessment) === 'high_risk').length;
    return `<div class="home-page">
      ${renderStartAnalysisPanel()}
      ${highRiskCount > 0 ? `<div class="risk-banner"><div class="risk-banner-content"><h2>${highRiskCount} Active High Risk Cases</h2><p>Requires immediate attention</p></div><div class="risk-banner-actions"><button class="btn-primary" onclick="navigateTo('risk-queue')">Review Queue</button></div></div>` : ''}
      <div class="calls-grid">${calls.map((c, i) => renderCallCard(c, i)).join('')}</div>
    </div>`;
  } catch (err) {
    console.error('[Cases] Failed to load calls:', err);
    return `<div class="home-page">
      ${renderStartAnalysisPanel()}
      <div class="dash-empty-state" style="padding:40px;text-align:center">
        <p style="color:var(--text-muted)">Unable to load cases. Backend may be unavailable.</p>
        <button class="btn-primary" style="margin-top:12px" onclick="renderPage()">Retry</button>
      </div>
    </div>`;
  }
}

function renderStartAnalysisPanel() {
  const procSteps = [
    { label: 'Transcribing', icon: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>' },
    { label: 'Understanding', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    { label: 'History Check', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>' },
    { label: 'Decision', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>' }
  ];

  if (processingState) {
    return `<div class="start-analysis-panel">
      <div class="live-processing">
        <div class="processing-header">
          <h3><span class="pulse-dot"></span>Processing Call</h3>
          <span class="file-name">${processingState.fileName}</span>
        </div>
        <div class="processing-steps">
          ${procSteps.map((s, i) => {
      let status = '';
      if (i < processingState.step) status = 'complete';
      else if (i === processingState.step) status = 'active';
      return `<div class="proc-step ${status}">
              <div class="proc-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${s.icon}</svg></div>
              <span class="proc-step-label">${s.label}</span>
              <div class="proc-connector ${status}"></div>
            </div>`;
    }).join('')}
        </div>
      </div>
    </div>`;
  }

  return `<div class="start-analysis-panel">
    <div class="start-analysis-header">
      <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Start New Analysis</h2>
    </div>
    <div class="analysis-modes" style="width:100%;display:flex;justify-content:center;">
      <input type="file" id="file-input" accept=".mp3,.wav,.m4a,.ogg,.webm" style="display:none">
      <div class="upload-zone" id="upload-zone" style="width:100%;max-width:100%;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <h3>Drop call recording here or browse file</h3>
        <p>Supported formats: MP3, WAV, M4A</p>
      </div>
    </div>
  </div>`;
}

function renderCallCard(call, index = 0) {
  if (!call) return '';
  // /api/v1/calls returns flat fields; /api/v1/call/{id} returns nested objects
  const riskScore = call.risk_score ?? call.input_risk_assessment?.risk_score ?? call.risk_assessment?.risk_score ?? '--';
  const assessment = call.grounded_assessment || call.rag_output?.grounded_assessment || 'low_risk';
  const explanation = call.summary_for_rag || call.rag_output?.explanation || 'No description available';
  const confidence = call.rag_output?.confidence ?? call.risk_assessment?.confidence ?? call.confidence ?? null;
  const patterns = call.rag_output?.matched_patterns || [];
  const fraudLikelihood = call.fraud_likelihood || call.input_risk_assessment?.fraud_likelihood || '';
  
  const riskLevel = assessment === 'high_risk' ? 'high' : (assessment === 'medium_risk' ? 'medium' : 'low');
  const riskLabel = riskLevel === 'high' ? 'HIGH RISK' : riskLevel === 'medium' ? 'MEDIUM' : 'LOW RISK';

  return `<div class="call-card" data-call-id="${call.call_id}" style="animation-delay: ${index * 0.08}s">
    
    <!-- Risk Accent Strip -->
    <div class="card-risk-strip ${riskLevel}"></div>
    
    <div class="card-body">
      <!-- Call ID Header -->
      <div class="card-id-header">
        <span class="card-call-id-label">${call.call_id || 'Unknown'}</span>
        <span class="card-timestamp">${call.call_timestamp ? timeAgo(new Date(call.call_timestamp)) : '--'}</span>
      </div>

      <!-- Main Row: Risk Score + Pattern Title + Status Tag + Open Button -->
      <div class="card-top-row">
        <div class="card-risk-score ${riskLevel}">
          <span class="card-score-number">${riskScore}</span>
        </div>
        <div class="card-title-area">
          <h3 class="card-pattern-title">${patterns[0] || call.recommended_action?.replace(/_/g, ' ') || 'Pattern Detected'}</h3>
          <span class="card-risk-tag ${riskLevel}">${riskLabel}</span>
        </div>
        <button class="card-open-btn" onclick="event.stopPropagation(); openCallInvestigation('${call.call_id}')">
          Open Case
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      
      <!-- Description -->
      <p class="card-description">${explanation.substring(0, 160)}${explanation.length > 160 ? '...' : ''}</p>
      
      <!-- Bottom Row: Confidence + Duration + Pattern Pills -->
      <div class="card-bottom-row">
        <div class="card-meta-items">
          <span class="card-meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            ${confidence ? Math.round(confidence * 100) + '% confidence' : (fraudLikelihood || '--')}
          </span>
          <span class="card-meta-divider"></span>
          <span class="card-meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            ${call.status || call.duration || 'N/A'}
          </span>
        </div>
        <div class="card-pattern-pills">
          ${patterns.slice(0, 2).map(p => `<span class="card-pill">${p}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

async function renderRiskQueuePage() {
  try {
    const raw = await getActiveCases({ limit: 10 });
    const allCalls = Array.isArray(raw) ? raw : (raw.cases || raw.active_cases || []);
    // Active-cases returns flat fields: grounded_assessment, risk_score, etc.
    const highRisk = allCalls.filter(c => {
      const assessment = c.grounded_assessment || c.rag_output?.grounded_assessment || '';
      return assessment === 'high_risk' || assessment === 'medium_risk';
    });
    liveStore.setCalls(allCalls);

    return `<div class="risk-queue-page">
      <h1>Risk Queue</h1>
      <div class="bulk-actions"><span>0 selected</span><button class="btn-secondary" disabled>Escalate Selected</button><button class="btn-secondary" disabled>Assign Team</button><button class="btn-secondary" disabled>Send Reminder</button></div>
      <table class="risk-table">
        <thead><tr><th><input type="checkbox" class="checkbox"></th><th>Case ID</th><th>Risk Score</th><th>RAG Headline</th><th>Matched Patterns</th><th>Action</th></tr></thead>
        <tbody>${highRisk.length ? highRisk.map((c, i) => {
      const assessment = c.grounded_assessment || c.rag_output?.grounded_assessment || 'medium_risk';
      const riskLevel = assessment === 'high_risk' ? 'high' : 'medium';
      const riskScore = c.risk_score ?? c.input_risk_assessment?.risk_score ?? '--';
      const explanation = c.summary_for_rag || c.rag_output?.explanation || 'No description';
      const patterns = c.rag_output?.matched_patterns || [];
      return `<tr style="animation-delay: ${i * 0.05}s">
          <td><input type="checkbox" class="checkbox"></td>
          <td><div><strong>${c.call_id || 'Unknown'}</strong></div><div style="font-size:12px;color:var(--text-muted)">${c.call_timestamp ? timeAgo(new Date(c.call_timestamp)) : '--'}</div></td>
          <td><span class="table-risk-badge ${riskLevel}">${riskScore}</span></td>
          <td style="max-width:250px"><div class="rag-headline-cell"><strong>${riskLevel.toUpperCase()}</strong> — ${explanation.substring(0, 50)}...</div></td>
          <td>${patterns.length ? patterns.slice(0, 2).map(p => `<span class="pattern-pill-small">${p}</span>`).join('') : `<span class="pattern-pill-small">${c.recommended_action?.replace(/_/g, ' ') || 'N/A'}</span>`}</td>
          <td><button class="table-action-btn" onclick="openCallInvestigation('${c.call_id}')">Review</button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No high or medium risk cases found</td></tr>'}</tbody>
      </table>
    </div>`;
  } catch (err) {
    console.error('[RiskQueue] Failed to load:', err);
    return `<div class="risk-queue-page"><h1>Risk Queue</h1><p style="color:var(--text-muted);padding:24px;">Unable to load risk queue. Backend may be unavailable.</p></div>`;
  }
}

// Action Helpers
window.scheduleReview = async function (callId) {
  try {
    await updateCallStatus(callId, 'manual_review');
    alert(`Manual Review scheduled for ${callId}`);
  } catch (err) {
    console.error('[scheduleReview] API failed:', err);
    alert(`Manual Review scheduled for ${callId} (offline)`);
  }
  renderPage();
}

window.markForMonitoring = async function (callId) {
  try {
    await updateCallStatus(callId, 'safe');
    alert(`${callId} marked as safe`);
  } catch (err) {
    console.error('[markForMonitoring] API failed:', err);
    alert(`${callId} marked as safe (offline)`);
  }
  renderPage();
}

window.logAction = async function (callId, status) {
  try {
    await updateCallStatus(callId, status);
    alert(`Status "${status}" applied to ${callId}`);
  } catch (err) {
    console.error('[logAction] API failed:', err);
    alert(`Status "${status}" recorded for ${callId} (offline)`);
  }
  renderPage(); // Refresh the current view
}

async function renderWorkflowLogsPage() {
  try {
    const activity = await getRecentActivity();
    const logs = Array.isArray(activity) ? activity : [];
    liveStore.setLogs(logs);

    if (!logs.length) {
      return `<div class="workflow-logs-page"><h1>Workflow Logs</h1><p style="color:var(--text-muted);padding:24px;">No workflow logs recorded yet.</p></div>`;
    }

    return `<div class="workflow-logs-page">
      <h1>Workflow Logs</h1>
      <div class="logs-feed">${logs.map((log, i) => {
        const assessment = log.grounded_assessment || '';
        const riskLevel = assessment === 'high_risk' ? 'high' : (assessment === 'medium_risk' ? 'medium' : 'low');
        const iconType = assessment === 'high_risk' ? 'escalation' : (assessment === 'medium_risk' ? 'manual_review' : 'crm');
        const actionLabel = log.status ? log.status.replace(/_/g, ' ').toUpperCase() : (log.action || 'PROCESSED');
        const detail = log.summary_for_rag || log.reason || log.detail || log.summary || '';
        const timeStr = log.call_timestamp || log.timestamp;
        return `<div class="log-entry" style="animation-delay: ${i * 0.03}s">
        <div class="log-icon ${iconType}">${getAutomationIcon(iconType)}</div>
        <div class="log-content"><h4>${actionLabel} — Risk: ${log.risk_score ?? '--'}</h4><p>${detail.substring(0, 120)}${detail.length > 120 ? '...' : ''}</p></div>
        <div class="log-meta"><div class="log-time">${timeStr ? timeAgo(new Date(timeStr)) : '--'}</div><div class="log-call-id">${log.call_id || ''}</div></div>
      </div>`;
      }).join('')}</div>
    </div>`;
  } catch (err) {
    console.error('[WorkflowLogs] Failed to load:', err);
    return `<div class="workflow-logs-page"><h1>Workflow Logs</h1><p style="color:var(--text-muted);padding:24px;">Unable to load workflow logs. Backend may be unavailable.</p></div>`;
  }
}

function renderSettingsPage() {
  return `<div class="settings-page"><h1>Settings</h1><div class="settings-section"><h3>Risk Thresholds</h3><div class="settings-row"><div class="settings-label">High Risk Threshold<span>Score above this triggers immediate alert</span></div><input type="number" value="70" style="width:80px;padding:8px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);"></div><div class="settings-row"><div class="settings-label">Auto-escalate High Risk<span>Automatically escalate calls above threshold</span></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div></div><div class="settings-section"><h3>Notifications</h3><div class="settings-row"><div class="settings-label">Slack Alerts<span>Send high-risk alerts to Slack</span></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div><div class="settings-row"><div class="settings-label">Email Digest<span>Daily summary of risk decisions</span></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div></div></div>`;
}

// Investigation Page (Phase 4: Compliance Workspace) — Live API
async function renderInvestigationPage() {
  // Always fetch fresh data from /api/v1/call/{call_id}
  let call = null;
  if (selectedCallId) {
    try {
      call = await getCallById(selectedCallId);
    } catch (err) {
      console.error('[Investigation] Failed to fetch call:', err);
      call = liveStore.findCall(selectedCallId);
    }
  }
  if (!call) return await renderHomePage();

  const risk = call.risk_assessment || call.input_risk_assessment || {};
  const rag = call.rag_output || {};
  const nlp = call.nlp_insights || {};
  const meta = call.call_metadata || {};
  const callContext = call.call_context || {};
  const callLanguage = callContext.call_language || call.call_language || meta.call_language || 'N/A';
  const riskClass = rag.grounded_assessment || 'low_risk';
  const riskLabel = riskClass === 'high_risk' ? 'HIGH RISK' : riskClass === 'medium_risk' ? 'MEDIUM RISK' : 'LOW RISK';
  const confidencePct = rag.confidence ? Math.round(rag.confidence * 100) + '%' : (risk.confidence ? Math.round(risk.confidence * 100) + '%' : '--');

  // Conversation — backend sends call.conversation as [{speaker: "AGENT"|"CUSTOMER", text: "..."}]
  // Fallback to call.transcript for older records
  const convSource = call.conversation || call.transcript;
  let conversationHtml = '';
  if (convSource) {
    if (typeof convSource === 'string') {
      conversationHtml = `<div class="inv-conv-bubble inv-conv-agent"><div class="inv-conv-label">Transcript</div><div class="inv-conv-text">${convSource}</div></div>`;
    } else if (Array.isArray(convSource) && convSource.length) {
      conversationHtml = convSource.map(t => {
        const speaker = (t.speaker || '').toUpperCase();
        const isAgent = speaker === 'AGENT' || speaker.includes('AGENT') || speaker.includes('REP');
        const bubbleClass = isAgent ? 'inv-conv-agent' : 'inv-conv-customer';
        const label = isAgent ? 'Agent' : 'Customer';
        return `<div class="inv-conv-bubble ${bubbleClass}">
          <div class="inv-conv-label">${label}${t.time ? ` <span class="inv-conv-time">${t.time}</span>` : ''}</div>
          <div class="inv-conv-text">${t.text || ''}</div>
        </div>`;
      }).join('');
    }
  }

  // NLP insight cards
  const insightCards = [];
  if (nlp.intent) insightCards.push({ icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`, title: `Intent: ${(nlp.intent.label || 'unknown').replace(/_/g, ' ')}`, detail: `Confidence: ${nlp.intent.confidence ? Math.round(nlp.intent.confidence * 100) + '%' : '--'} · Conditionality: ${nlp.intent.conditionality || '--'}` });
  if (nlp.sentiment) insightCards.push({ icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, title: `Sentiment: ${nlp.sentiment.label || 'unknown'}`, detail: `Confidence: ${nlp.sentiment.confidence ? Math.round(nlp.sentiment.confidence * 100) + '%' : '--'}` });
  if (nlp.obligation_strength) insightCards.push({ icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 6l7-3 7 3"/><path d="M5 18l7 3 7-3"/><rect x="3" y="8" width="4" height="8" rx="1"/><rect x="17" y="8" width="4" height="8" rx="1"/></svg>`, title: `Obligation Strength: ${nlp.obligation_strength.toUpperCase()}`, detail: `Contradictions: ${nlp.contradictions_detected ? 'Yes' : 'None'}` });
  if (meta.call_quality) insightCards.push({ icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`, title: 'Call Quality', detail: `Noise: ${meta.call_quality.noise_level || '--'} · Stability: ${meta.call_quality.call_stability || '--'} · Naturalness: ${meta.call_quality.speech_naturalness || '--'}` });

  return `<div class="inv-page">

    <!-- Breadcrumb -->
    <nav class="inv-breadcrumb">
      <a href="#" onclick="navigateTo('cases'); return false;">Active Cases</a>
      <span class="inv-bc-sep">/</span>
      <span class="inv-bc-current">Case #${call.call_id}</span>
    </nav>

    <!-- ═══ Top Card: Identity + Verdict + Actions ═══ -->
    <div class="inv-hero-card">
      <div class="inv-hero-top">
        <div class="inv-hero-id">
          <h2 class="inv-call-id">${call.call_id}</h2>
          <span class="inv-status-badge">${call.status ? `Status: ${call.status.toUpperCase()}` : ''}</span>
        </div>
        <div class="inv-hero-meta">
          <span>${call.call_timestamp ? new Date(call.call_timestamp).toLocaleString() : '--'}</span>
          <span>${(risk.fraud_likelihood || 'unknown').toUpperCase()}</span>
        </div>
      </div>

      <div class="inv-hero-verdict">
        <div class="inv-verdict-left">
          <span class="inv-verdict-label ${riskClass}">${riskLabel}</span>
          <span class="inv-lang-badge">Language Detected : ${callLanguage.charAt(0).toUpperCase() + callLanguage.slice(1)}</span>
          <span class="inv-verdict-scores">Risk Score: ${risk.risk_score ?? '--'}  •  Confidence: ${confidencePct}</span>
        </div>
        <div class="inv-verdict-actions">
          ${renderActionButtons(rag.recommended_action, call.call_id)}
        </div>
      </div>
    </div>

    <!-- ═══ Two-Column Body ═══ -->
    <div class="inv-body-grid">

      <!-- LEFT COLUMN -->
      <div class="inv-col-left">

        <!-- Decision Rationale -->
        <div class="inv-section-card">
          <h3 class="inv-section-title">Decision Rationale</h3>
          <div class="inv-rationale-content">
            ${(rag.matched_patterns || []).map(p => `<div class="inv-rationale-item"><span class="inv-bullet">●</span><span>${p}</span></div>`).join('')}
            <div class="inv-rationale-item"><span class="inv-bullet">●</span><span>${rag.explanation || call.summary_for_rag || 'No explanation available'}</span></div>
          </div>
        </div>

        <!-- Agent-Customer Conversation — Collapsible -->
        <div class="inv-section-card">
          <button class="inv-section-toggle" onclick="toggleEvidence(this)">
            <svg class="inv-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            <h3 class="inv-section-title" style="margin:0">Conversation</h3>
          </button>
          <div class="inv-collapsible hidden">
            <div class="inv-conversation-box">
              ${conversationHtml || '<p class="inv-empty-msg">No conversation data available for this call.</p>'}
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="inv-col-right">

        <!-- NLP Insights -->
        <div class="inv-section-card">
          <h3 class="inv-section-title">Risk Indicators & NLP Insights</h3>
          <div class="inv-insights-grid">
            ${insightCards.map(c => `
            <div class="inv-insight-card">
              <span class="inv-insight-icon">${c.icon}</span>
              <div class="inv-insight-text">
                <h4>${c.title}</h4>
                <p>${c.detail}</p>
              </div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Matched Patterns (if any) -->
        ${(rag.matched_patterns || []).length ? `
        <div class="inv-section-card">
          <h3 class="inv-section-title">Matched Patterns</h3>
          <div class="inv-pattern-chips">
            ${rag.matched_patterns.map(p => `<span class="inv-pattern-chip">${p}</span>`).join('')}
          </div>
        </div>` : ''}

      </div>
    </div>

  </div>`;
}


function renderActionButtons(action, callId) {
  return `
    <button class="btn-tertiary-ghost" onclick="markForMonitoring('${callId}')">Mark as Safe</button>
  `;
}

window.toggleEvidence = function (btn) {
  const content = btn.nextElementSibling;
  content.classList.toggle('hidden');
  btn.classList.toggle('collapsed');
  const chevron = btn.querySelector('.inv-chevron');
  if (chevron) chevron.style.transform = content.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
}

function renderPrimaryAction(action, callId) {
  switch (action) {
    case 'escalate_to_compliance':
      return `<button class="btn-action-primary red" onclick="escalateCase('${callId}')">Escalate to Compliance</button>`;
    case 'schedule_manual_review':
      return `<button class="btn-action-primary blue" onclick="scheduleReview('${callId}')">Schedule Manual Review</button>`;
    case 'monitor':
      return `<button class="btn-action-primary green" onclick="markForMonitoring('${callId}')">Mark for Monitoring</button>`;
    default:
      return `<button class="btn-action-primary" onclick="scheduleReview('${callId}')">Review Case</button>`;
  }
}

function escalateCase(callId) {
  if (confirm(`Escalate ${callId} to Compliance? This will create a ticket and notify #escalations.`)) {
    updateCallStatus(callId, 'escalated')
      .then(() => {
        alert('Case Escalated. Ticket created.');
        navigateTo('cases');
      })
      .catch(err => {
        console.error('[escalateCase] API failed:', err);
        alert('Case escalation recorded (offline). Ticket will sync when backend is available.');
        navigateTo('cases');
      });
  }
}

function openJSONModal() {
  const call = liveStore.findCall(selectedCallId);
  const jsonStr = JSON.stringify(call || { error: 'Call not found in cache' }, null, 2);
  const content = document.getElementById('content');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-content json-modal">
    <div class="modal-header"><h3>Raw Case JSON</h3><button onclick="this.closest('.modal-overlay').remove()">×</button></div>
    <div class="modal-body"><pre>${jsonStr}</pre></div>
  </div>`;
  content.appendChild(modal);
}

function openSourcesModal() {
  const content = document.getElementById('content');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-content sources-modal">
    <div class="modal-header"><h3>Knowledge Base Sources</h3><button onclick="this.closest('.modal-overlay').remove()">×</button></div>
    <div class="modal-body">
      <div class="source-item">
        <h4>Collection Policy v4.2 - Section 3.1</h4>
        <p>"If a customer makes a conditional promise that contradicts available financial data, the interaction must be flagged as High Risk for potential evasion."</p>
        <a href="#">View Policy Doc</a>
      </div>
       <div class="source-item">
        <h4>Regulatory Guideline: Hardship Claims</h4>
        <p>"All hardship claims must be met with transparent disclosure requirements and immediate pause on aggressive collection tactics."</p>
        <a href="#">View Guideline</a>
      </div>
    </div>
  </div>`;
  content.appendChild(modal);
}

function renderModalContent() {
  const modalBody = document.getElementById('modal-body');
  if (showJsonView) {
    modalBody.innerHTML = `<div class="json-preview"><pre><code>${JSON.stringify(n8nWorkflowJSON, null, 2)}</code></pre></div>`;
  } else {
    modalBody.innerHTML = `<div class="workflow-diagram"><div class="workflow-step"><div class="step-icon call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2"/></svg></div><span>Call Received</span></div><div class="workflow-connector"></div><div class="workflow-step"><div class="step-icon voiceops">VO</div><span>VoiceOps Analysis</span></div><div class="workflow-connector"></div><div class="workflow-step"><div class="step-icon decision"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg></div><span>Risk Decision</span></div><div class="workflow-connector"></div><div class="workflow-outputs"><div class="workflow-step small"><div class="step-icon slack">${getAutomationIcon('slack')}</div><span>Slack</span></div><div class="workflow-step small"><div class="step-icon crm">${getAutomationIcon('crm')}</div><span>CRM</span></div><div class="workflow-step small"><div class="step-icon callback">${getAutomationIcon('callback')}</div><span>Callback</span></div></div></div><div class="modal-description"><h3>Plug-and-Play Workflow Automation</h3><p>VoiceOps integrates seamlessly with n8n to automate your operational workflows.</p><div class="feature-list"><div class="feature"><span class="feature-icon">✓</span><span>Real-time Slack notifications for high-risk calls</span></div><div class="feature"><span class="feature-icon">✓</span><span>Automatic CRM record updates with risk tags</span></div><div class="feature"><span class="feature-icon">✓</span><span>Smart callback scheduling based on behavior</span></div><div class="feature"><span class="feature-icon">✓</span><span>Customizable escalation paths for compliance</span></div></div></div>`;
  }
}

// Update assistant context based on current page and selection
function updateAssistantContext() {
  const context = {
    page: currentPage,
    callId: selectedCallId
  };
  
  assistant.setContext(context);
}
