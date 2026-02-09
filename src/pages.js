// VoiceOps Pages - Part 2
import { mockCalls, mockTranscript, mockWorkflowLogs, n8nWorkflowJSON } from './data.js';

// Render Home Page
export function renderHomePage() {
    const highRiskCount = mockCalls.filter(c => c.riskLevel === 'high').length;
    const pendingEscalations = mockCalls.filter(c => c.riskLevel === 'high' && c.automations.some(a => a.status === 'pending')).length;

    return `
    <div class="home-page">
      ${highRiskCount > 0 ? `
      <div class="risk-banner">
        <div class="risk-banner-content">
          <h2>${highRiskCount * 6} High Risk Calls Detected</h2>
          <p>${pendingEscalations + 3} escalations pending • Avg decision time 3.2s</p>
        </div>
        <div class="risk-banner-actions">
          <button class="btn-primary" onclick="navigateTo('risk-queue')">Review Queue</button>
          <button class="btn-secondary">Mute Alerts</button>
        </div>
      </div>
      ` : ''}
      
      <div class="calls-grid">
        ${mockCalls.map(call => renderCallCard(call)).join('')}
      </div>
    </div>
  `;
}

// Render Call Card
export function renderCallCard(call) {
    const pipelineSteps = [
        { label: 'Transcribing', status: 'complete' },
        { label: 'Understanding', status: call.status === 'processing' ? 'active' : 'complete' },
        { label: 'History Check', status: call.status === 'processing' ? 'pending' : 'complete' },
        { label: 'Decision', status: call.status === 'processing' ? 'pending' : 'complete' }
    ];

    return `
    <div class="call-card" data-call-id="${call.id}">
      <div class="call-card-header">
        <div class="risk-badge ${call.riskLevel}">
          <span class="score">${call.riskScore}</span>
          <span class="label">${call.riskLevel} risk</span>
        </div>
        <div class="call-info">
          <h3>${call.customer}</h3>
          <div class="call-meta">
            <span>${call.id}</span>
            <span>Duration: ${call.duration}</span>
            <span>${timeAgo(call.timestamp)}</span>
          </div>
        </div>
        <div class="call-decision">
          <p>"${call.decision}"</p>
        </div>
      </div>
      
      <div class="processing-pipeline">
        ${pipelineSteps.map((step, i) => `
          <div class="pipeline-step ${step.status}">
            <span class="step-dot"></span>
            <span>${step.label}</span>
          </div>
          ${i < pipelineSteps.length - 1 ? `<div class="pipeline-connector ${step.status === 'complete' ? 'active' : ''}"></div>` : ''}
        `).join('')}
      </div>
      
      <div class="ai-explanation" id="explanation-${call.id}">
        <div class="ai-explanation-header" onclick="toggleExplanation('${call.id}')">
          <span>AI Explanation</span>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="ai-explanation-content">
          <ul class="explanation-list">
            ${call.explanation.map(e => `<li>${e}</li>`).join('')}
          </ul>
          <div class="confidence-meter">
            <span>Confidence:</span>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${call.confidence}%"></div>
            </div>
            <span>${call.confidence}%</span>
          </div>
        </div>
      </div>
      
      <div class="automation-preview">
        ${call.automations.map((auto, i) => `
          <div class="automation-step ${auto.status}">
            <div class="auto-icon">${getAutomationIcon(auto.type)}</div>
            <span>${auto.label}</span>
          </div>
          ${i < call.automations.length - 1 ? '<div class="automation-connector"></div>' : ''}
        `).join('')}
      </div>
    </div>
  `;
}

// Render Risk Queue Page
export function renderRiskQueuePage() {
    const highRiskCalls = mockCalls.filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium');

    return `
    <div class="risk-queue-page">
      <h1>Risk Queue</h1>
      
      <div class="bulk-actions">
        <span>0 selected</span>
        <button class="btn-secondary" disabled>Escalate Selected</button>
        <button class="btn-secondary" disabled>Assign Team</button>
        <button class="btn-secondary" disabled>Send Reminder</button>
      </div>
      
      <table class="risk-table">
        <thead>
          <tr>
            <th><input type="checkbox" class="checkbox" id="select-all"></th>
            <th>Customer</th>
            <th>Risk Score</th>
            <th>Reason</th>
            <th>Last Behaviour</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${highRiskCalls.map(call => `
            <tr data-call-id="${call.id}">
              <td><input type="checkbox" class="checkbox row-checkbox"></td>
              <td>
                <div><strong>${call.customer}</strong></div>
                <div style="font-size: 12px; color: var(--text-muted)">${call.id}</div>
              </td>
              <td>
                <span class="table-risk-badge ${call.riskLevel}">
                  ${call.riskScore}
                </span>
              </td>
              <td style="max-width: 200px">${call.decision}</td>
              <td>${call.explanation[0]}</td>
              <td>
                <button class="table-action-btn" onclick="openCallInvestigation('${call.id}')">Review</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Render Workflow Logs Page
export function renderWorkflowLogsPage() {
    return `
    <div class="workflow-logs-page">
      <h1>Workflow Logs</h1>
      
      <div class="logs-feed">
        ${mockWorkflowLogs.map(log => `
          <div class="log-entry" data-call-id="${log.callId}">
            <div class="log-icon ${log.type}">
              ${getAutomationIcon(log.type)}
            </div>
            <div class="log-content">
              <h4>${log.action}</h4>
              <p>${log.detail}</p>
            </div>
            <div class="log-meta">
              <div class="log-time">${log.time}</div>
              <div class="log-call-id">${log.callId}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render Settings Page
export function renderSettingsPage() {
    return `
    <div class="settings-page">
      <h1>Settings</h1>
      
      <div class="settings-section">
        <h3>Risk Thresholds</h3>
        <div class="settings-row">
          <div class="settings-label">
            High Risk Threshold
            <span>Score above this triggers immediate alert</span>
          </div>
          <input type="number" value="70" style="width: 80px; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
        </div>
        <div class="settings-row">
          <div class="settings-label">
            Auto-escalate High Risk
            <span>Automatically escalate calls above threshold</span>
          </div>
          <label class="toggle">
            <input type="checkbox" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Notifications</h3>
        <div class="settings-row">
          <div class="settings-label">
            Slack Alerts
            <span>Send high-risk alerts to Slack</span>
          </div>
          <label class="toggle">
            <input type="checkbox" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-label">
            Email Digest
            <span>Daily summary of risk decisions</span>
          </div>
          <label class="toggle">
            <input type="checkbox">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Automation</h3>
        <div class="settings-row">
          <div class="settings-label">
            n8n Webhook URL
            <span>Endpoint for workflow triggers</span>
          </div>
          <input type="text" value="https://n8n.example.com/webhook/voiceops" style="width: 300px; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-family: var(--font-mono); font-size: 12px;">
        </div>
      </div>
    </div>
  `;
}

// Utility functions
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

function getAutomationIcon(type) {
    const icons = {
        slack: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/></svg>',
        crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        callback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>',
        escalation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'
    };
    return icons[type] || icons.crm;
}
