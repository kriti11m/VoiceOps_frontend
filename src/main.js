// VoiceOps Main Application - Complete
import './index.css';
import './components.css';
import './pages.css';
import './tables.css';
import './animations.css';
import './chatbot.css';
import { mockCalls, mockTranscript, mockWorkflowLogs, n8nWorkflowJSON } from './data.js';
import VoiceOpsAssistant from './chatbot.js';

// State
let currentPage = 'home';
let selectedCallId = null;
let showJsonView = false;
let processingState = null; // null | { step: 0-4, fileName: string }

// Initialize AI Assistant
const assistant = new VoiceOpsAssistant();

// Make assistant globally available for easier debugging/integration
window.voiceOpsAssistant = assistant;

// Make mock data globally available for assistant
window.mockCalls = mockCalls;
window.mockTranscript = mockTranscript;
window.mockWorkflowLogs = mockWorkflowLogs;

// Navigation items
const navItems = [
  { id: 'home', label: 'Active Risk Cases', icon: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>' },

  { id: 'risk-queue', label: 'Risk Queue', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
  { id: 'workflow-logs', label: 'Workflow Logs', icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
  { id: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', init);

function init() {
  renderSidebar();
  renderHeader();
  renderPage();
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
          <button class="btn-n8n-secondary" id="btn-view-json">View JSON</button>
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

  // n8n buttons
  document.getElementById('header').addEventListener('click', (e) => {
    if (e.target.id === 'btn-open-n8n' || e.target.id === 'btn-view-json') {
      showJsonView = e.target.id === 'btn-view-json';
      renderModalContent();
      document.getElementById('n8n-modal').classList.add('active');
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

  // Content clicks
  document.getElementById('content').addEventListener('click', (e) => {
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
  startProcessing('simulated_call_demo.wav');
};

function startProcessing(fileName) {
  processingState = { step: 0, fileName };
  renderPage();

  const stepDurations = [1200, 1500, 1000, 800];
  let currentStep = 0;

  function advanceStep() {
    currentStep++;
    if (currentStep < 4) {
      processingState = { step: currentStep, fileName };
      renderPage();
      setTimeout(advanceStep, stepDurations[currentStep]);
    } else {
      // Complete - append new case and reset
      const newCall = {
        call_id: `call_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.random().toString(16).substr(2, 6)}`,
        call_timestamp: new Date().toISOString(),
        duration: '0:45', // Simulation duration
        input_risk_assessment: {
          risk_score: 85,
          fraud_likelihood: 'high',
          confidence: 0.88
        },
        rag_output: {
          grounded_assessment: 'high_risk',
          explanation: 'Simulation detected evasive answers regarding identity verification. Matches "Identity Concealment" pattern.',
          recommended_action: 'escalate_to_compliance',
          confidence: 0.92,
          regulatory_flags: ['KYC Verification Needed'],
          matched_patterns: ['Identity Concealment', 'Evasive Response']
        },
        status: 'complete',
        automations: []
      };

      mockCalls.unshift(newCall);
      processingState = null;
      renderPage();
    }
  }

  setTimeout(advanceStep, stepDurations[0]);
}

function setupUploadHandlers() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (!uploadZone || !fileInput) return;

  uploadZone.addEventListener('click', () => fileInput.click());

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
    if (file) startProcessing(file.name);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) startProcessing(file.name);
  });
}

// Page rendering
function renderPage() {
  const content = document.getElementById('content');
  switch (currentPage) {
    case 'home':
      content.innerHTML = renderHomePage();
      setupUploadHandlers();
      break;
    case 'risk-queue':
      content.innerHTML = renderRiskQueuePage();
      break;
    case 'workflow-logs':
      content.innerHTML = renderWorkflowLogsPage();
      break;
    case 'settings':
      content.innerHTML = renderSettingsPage();
      break;
    case 'investigation':
      content.innerHTML = renderInvestigationPage();
      break;
    default:
      content.innerHTML = renderHomePage();
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

// Home Page (Active Risk Cases)
function renderHomePage() {
  const highRiskCount = mockCalls.filter(c => c.rag_output.grounded_assessment === 'high_risk').length;
  return `<div class="home-page">
    ${renderStartAnalysisPanel()}
    ${highRiskCount > 0 ? `<div class="risk-banner"><div class="risk-banner-content"><h2>${highRiskCount} Active High Risk Cases</h2><p>Requires immediate attention</p></div><div class="risk-banner-actions"><button class="btn-primary" onclick="navigateTo('risk-queue')">Review Queue</button></div></div>` : ''}
    <div class="calls-grid">${mockCalls.map((c, i) => renderCallCard(c, i)).join('')}</div>
  </div>`;
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
      <span class="webhook-hint">Calls can also be triggered via <code>n8n webhook</code></span>
    </div>
    <div class="analysis-modes">
      <div class="upload-zone" id="upload-zone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <h3>Drop call recording here or browse file</h3>
        <p>Supported formats: MP3, WAV, M4A</p>
        <input type="file" id="file-input" accept=".mp3,.wav,.m4a" style="display:none">
      </div>
      <div class="simulate-section">
        <button class="btn-simulate" onclick="simulateCall()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>
          Simulate Customer Call
        </button>
        <span class="simulate-desc">Triggers a demo call processing pipeline</span>
      </div>
    </div>
  </div>`;
}

function renderCallCard(call, index = 0) {
  const risk = call.input_risk_assessment;
  const rag = call.rag_output;
  const riskLevel = rag.grounded_assessment === 'high_risk' ? 'high' : (rag.grounded_assessment === 'medium_risk' ? 'medium' : 'low');
  const riskLabel = riskLevel === 'high' ? 'HIGH RISK' : riskLevel === 'medium' ? 'MEDIUM' : 'LOW RISK';

  return `<div class="call-card" data-call-id="${call.call_id}" style="animation-delay: ${index * 0.08}s">
    
    <!-- Risk Accent Strip -->
    <div class="card-risk-strip ${riskLevel}"></div>
    
    <div class="card-body">
      <!-- Top Row: Risk Score + Pattern Title + Status Tag -->
      <div class="card-top-row">
        <div class="card-risk-score ${riskLevel}">
          <span class="card-score-number">${risk.risk_score}</span>
        </div>
        <div class="card-title-area">
          <h3 class="card-pattern-title">${rag.matched_patterns[0] || 'Pattern Detected'}</h3>
          <span class="card-risk-tag ${riskLevel}">${riskLabel}</span>
        </div>
        <button class="card-open-btn" onclick="event.stopPropagation(); openCallInvestigation('${call.call_id}')">
          Open Case
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      
      <!-- Description -->
      <p class="card-description">${rag.explanation.substring(0, 140)}${rag.explanation.length > 140 ? '...' : ''}</p>
      
      <!-- Bottom Row: Meta Info + Pattern Pills -->
      <div class="card-bottom-row">
        <div class="card-meta-items">
          <span class="card-meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            ${timeAgo(new Date(call.call_timestamp))}
          </span>
          <span class="card-meta-divider"></span>
          <span class="card-meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            ${call.call_id}
          </span>
          <span class="card-meta-divider"></span>
          <span class="card-meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            ${Math.round(rag.confidence * 100)}% confidence
          </span>
        </div>
        <div class="card-pattern-pills">
          ${rag.matched_patterns.slice(0, 2).map(p => `<span class="card-pill">${p}</span>`).join('')}
        </div>
      </div>
      
      <!-- Case ID Footer -->
      <div class="card-id-row">
        <span class="card-case-id">${new Date(call.call_timestamp).toLocaleString()}</span>
        <span class="card-duration">${call.duration || ''}</span>
      </div>
    </div>
  </div>`;
}

function renderRiskQueuePage() {
  const highRisk = mockCalls.filter(c => c.rag_output.grounded_assessment === 'high_risk' || c.rag_output.grounded_assessment === 'medium_risk');
  return `<div class="risk-queue-page">
    <h1>Risk Queue</h1>
    <div class="bulk-actions"><span>0 selected</span><button class="btn-secondary" disabled>Escalate Selected</button><button class="btn-secondary" disabled>Assign Team</button><button class="btn-secondary" disabled>Send Reminder</button></div>
    <table class="risk-table">
      <thead><tr><th><input type="checkbox" class="checkbox"></th><th>Case ID</th><th>Risk Score</th><th>RAG Headline</th><th>Matched Patterns</th><th>Action</th></tr></thead>
      <tbody>${highRisk.map((c, i) => {
    const rag = c.rag_output;
    const riskLevel = rag.grounded_assessment === 'high_risk' ? 'high' : 'medium';
    return `<tr style="animation-delay: ${i * 0.05}s">
        <td><input type="checkbox" class="checkbox"></td>
        <td><div><strong>${c.call_id}</strong></div><div style="font-size:12px;color:var(--text-muted)">${timeAgo(new Date(c.call_timestamp))}</div></td>
        <td><span class="table-risk-badge ${riskLevel}">${c.input_risk_assessment.risk_score}</span></td>
        <td style="max-width:250px"><div class="rag-headline-cell"><strong>${riskLevel.toUpperCase().replace('_', ' ')}</strong> — ${rag.explanation.substring(0, 50)}...</div></td>
        <td>${rag.matched_patterns.slice(0, 2).map(p => `<span class="pattern-pill-small">${p}</span>`).join('')}</td>
        <td><button class="table-action-btn" onclick="openCallInvestigation('${c.call_id}')">Review</button></td>
      </tr>`;
  }).join('')}</tbody>
    </table>
  </div>`;
}

// Action Helpers
window.scheduleReview = function (callId) {
  logAction(callId, 'manual_review');
  alert(`Manual Review scheduled for ${callId}`);
}

window.markForMonitoring = function (callId) {
  logAction(callId, 'monitor');
  alert(`${callId} marked for monitoring`);
}

window.logAction = function (callId, type) {
  const log = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    call_id: callId,
    action: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    reason: 'Manual User Action',
    status: 'Success',
    type: type
  };
  mockWorkflowLogs.unshift(log);
  renderPage(); // Refresh logs view if open
}

function renderWorkflowLogsPage() {
  return `<div class="workflow-logs-page">
    <h1>Workflow Logs</h1>
    <div class="logs-feed">${mockWorkflowLogs.map((log, i) => `<div class="log-entry" style="animation-delay: ${i * 0.03}s">
      <div class="log-icon ${log.type || 'crm'}">${getAutomationIcon(log.type || 'crm')}</div>
      <div class="log-content"><h4>${log.action}</h4><p>${log.reason || log.detail}</p></div>
      <div class="log-meta"><div class="log-time">${timeAgo(new Date(log.timestamp))}</div><div class="log-call-id">${log.call_id}</div></div>
    </div>`).join('')}</div>
  </div>`;
}

function renderSettingsPage() {
  return `<div class="settings-page"><h1>Settings</h1><div class="settings-section"><h3>Risk Thresholds</h3><div class="settings-row"><div class="settings-label">High Risk Threshold<span>Score above this triggers immediate alert</span></div><input type="number" value="70" style="width:80px;padding:8px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);"></div><div class="settings-row"><div class="settings-label">Auto-escalate High Risk<span>Automatically escalate calls above threshold</span></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div></div><div class="settings-section"><h3>Notifications</h3><div class="settings-row"><div class="settings-label">Slack Alerts<span>Send high-risk alerts to Slack</span></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div><div class="settings-row"><div class="settings-label">Email Digest<span>Daily summary of risk decisions</span></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div></div></div>`;
}

// Investigation Page (Split View)
// Investigation Page (Phase 4: Compliance Workspace)
function renderInvestigationPage() {
  const call = mockCalls.find(c => c.call_id === selectedCallId);
  if (!call) return renderHomePage();

  const risk = call.input_risk_assessment;
  const rag = call.rag_output;
  const riskClass = rag.grounded_assessment;

  // Reset to full width for workspace mode
  // Note: ideally this would be handled by a class on body or #content, but for now we inject styles

  return `<div class="workspace-mode">
    <div class="workspace-container">
        <!-- 1. Breadcrumb Nav -->
        <div class="breadcrumb-nav">
          <a href="#" onclick="navigateTo('home'); return false;" class="breadcrumb-item">Risk Queue</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">Case #${call.call_id}</span>
        </div>
    </div>

    <!-- 2. Identity Bar (Sticky) -->
    <div class="identity-bar">
      <div class="identity-main">
        <span class="identity-name">${call.call_id}</span>
        <span class="identity-phone">${call.phone_masked || ''}</span>
      </div>
      <div class="identity-meta">
        <div class="meta-item" title="Timestamp">
          <span class="meta-icon">�</span> ${new Date(call.call_timestamp).toLocaleString()}
        </div>
        <div class="meta-item" title="Duration">
          <span class="meta-icon">⏱️</span> ${call.duration || 'N/A'}
        </div>
        <div class="meta-item" title="Fraud Likelihood">
           <span class="meta-icon">�</span> ${call.input_risk_assessment.fraud_likelihood.toUpperCase()}
        </div>
      </div>
    </div>

    <!-- 3. Risk System Header -->
    <div class="risk-system-header">
      <div class="risk-decision-block ${riskClass}">
        <h2>${rag.grounded_assessment === 'high_risk' ? 'HIGH RISK — ESCALATE TO COMPLIANCE' : rag.grounded_assessment.replace('_', ' ').toUpperCase()}</h2>
        <div class="risk-scores-inline">
          <span>Risk Score: ${risk.risk_score}</span>
          <span>•</span>
          <span>Confidence: ${Math.round(rag.confidence * 100)}%</span>
        </div>
      </div>
      
      <div class="action-bar">
         ${renderActionButtons(rag.recommended_action, call.call_id)}
      </div>
    </div>

    <!-- 4. Rationale Section (Flat) -->
    <div class="rationale-section">
      <div class="rationale-header">Decision Rationale</div>
      <ul class="rationale-list">
        <!-- Transforming explanation text to bullets if possible, or using matched patterns + explanation -->
        ${rag.matched_patterns.map(p => `<li class="rationale-item"><span class="rationale-bullet">•</span> Pattern Detected: ${p}</li>`).join('')}
        <li class="rationale-item"><span class="rationale-bullet">•</span> ${rag.explanation}</li>
      </ul>
    </div>

    <!-- 5. Interpretation / Why (Flat Grid) -->
    <div class="workspace-container" style="padding-top:32px">
        <div class="rationale-header">Risk Indicators</div>
        <div class="interpretation-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        ${rag.matched_patterns.map(p => `
        <div class="interpretation-block" style="border:1px solid var(--border-color); box-shadow:none; padding:16px">
            <div class="interpretation-icon" style="width:32px;height:32px;font-size:16px">⚠️</div>
            <div class="interpretation-content">
            <h4 style="font-size:14px">${p}</h4>
            <p style="font-size:12px">detected in transcript</p>
            </div>
        </div>`).join('')}
        </div>
    </div>

    <!-- 6. Evidence (Flat) -->
    <div class="evidence-flat">
      <button class="evidence-toggle" onclick="toggleEvidence(this)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        Evidence (Transcript)
      </button>
      <div class="evidence-content hidden">
        <div class="transcript-panel" style="border:none;padding:0;margin-top:16px;background:transparent">
           ${mockTranscript.map(t => `<div class="transcript-line ${t.highlight || ''}"><span class="time">${t.time}</span><span class="speaker">${t.speaker}:</span><span class="text">${t.text}</span></div>`).join('')}
        </div>
      </div>
    </div>

  </div>`;
}

function renderActionButtons(action, callId) {
  // Strict Hierarchy: Solid > Outline > Ghost
  return `
    <button class="btn-primary-solid" onclick="escalateCase('${callId}')">Escalate to Compliance</button>
    <button class="btn-secondary-outline" onclick="logAction('${callId}', 'callback')">Schedule Callback</button>
    <button class="btn-tertiary-ghost" onclick="markForMonitoring('${callId}')">Mark as Safe</button>
  `;
}

window.toggleEvidence = function (btn) {
  const content = btn.nextElementSibling;
  content.classList.toggle('hidden');
  btn.classList.toggle('collapsed');
  // Rotate icon handling via CSS
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
    // Simulate API call
    const log = {
      id: `log_${Date.now()}`,
      call_id: callId,
      time: 'Just now',
      type: 'escalation',
      action: 'Escalated to Compliance',
      detail: 'Manual escalation trigger',
      status: 'Success'
    };
    mockWorkflowLogs.unshift(log);

    // Show toast (simulated by alert for now or simple overlay)
    alert('Case Escalated. Ticket #Comp-992 created.');
    navigateTo('home');
  }
}

function openJSONModal() {
  const call = mockCalls.find(c => c.call_id === selectedCallId);
  const jsonStr = JSON.stringify(call, null, 2);
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
    modalBody.innerHTML = `<div class="workflow-diagram"><div class="workflow-step"><div class="step-icon call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2"/></svg></div><span>Call Received</span></div><div class="workflow-connector"></div><div class="workflow-step"><div class="step-icon voiceops">VO</div><span>VoiceOps Analysis</span></div><div class="workflow-connector"></div><div class="workflow-step"><div class="step-icon decision"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 515.83 1c0 2-3 3-3 3"/></svg></div><span>Risk Decision</span></div><div class="workflow-connector"></div><div class="workflow-outputs"><div class="workflow-step small"><div class="step-icon slack">${getAutomationIcon('slack')}</div><span>Slack</span></div><div class="workflow-step small"><div class="step-icon crm">${getAutomationIcon('crm')}</div><span>CRM</span></div><div class="workflow-step small"><div class="step-icon callback">${getAutomationIcon('callback')}</div><span>Callback</span></div></div></div><div class="modal-description"><h3>Plug-and-Play Workflow Automation</h3><p>VoiceOps integrates seamlessly with n8n to automate your operational workflows.</p><div class="feature-list"><div class="feature"><span class="feature-icon">✓</span><span>Real-time Slack notifications for high-risk calls</span></div><div class="feature"><span class="feature-icon">✓</span><span>Automatic CRM record updates with risk tags</span></div><div class="feature"><span class="feature-icon">✓</span><span>Smart callback scheduling based on behavior</span></div><div class="feature"><span class="feature-icon">✓</span><span>Customizable escalation paths for compliance</span></div></div></div>`;
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
