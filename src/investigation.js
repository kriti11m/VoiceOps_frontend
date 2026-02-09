// VoiceOps Investigation Page
import { mockCalls, mockTranscript, n8nWorkflowJSON } from './data.js';

// Render Investigation Page
export function renderInvestigationPage(callId) {
    const call = mockCalls.find(c => c.id === callId) || mockCalls[0];

    // Generate waveform bars
    const waveformBars = Array(80).fill(0).map(() => {
        const height = Math.random() * 50 + 10;
        return `<div class="waveform-bar" style="height: ${height}px"></div>`;
    }).join('');

    return `
    <div class="investigation-view">
      <button class="back-btn" onclick="navigateTo('home')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Calls
      </button>
      
      <!-- Waveform Player -->
      <div class="waveform-player">
        <div class="waveform-header">
          <div>
            <h3>${call.customer} — ${call.id}</h3>
            <span style="color: var(--text-muted); font-size: 13px;">Duration: ${call.duration}</span>
          </div>
          <div class="waveform-controls">
            <button class="play-btn" id="play-btn">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            </button>
            <span class="time-display">0:00 / ${call.duration}</span>
          </div>
        </div>
        <div class="waveform-visualization">
          <div class="waveform-bars">${waveformBars}</div>
          <div class="waveform-marker risk" style="left: 15%" data-label="Salary delay mentioned"></div>
          <div class="waveform-marker entity" style="left: 35%" data-label="₹45,000 mentioned"></div>
          <div class="waveform-marker risk" style="left: 55%" data-label="Repeated pattern"></div>
          <div class="waveform-marker pattern" style="left: 75%" data-label="Promise detected"></div>
        </div>
      </div>
      
      <!-- Transcript Panel -->
      <div class="transcript-panel">
        <div class="panel-header">Transcript</div>
        <div class="transcript-content">
          ${mockTranscript.map(line => `
            <div class="transcript-line" data-time="${line.time}">
              <span class="timestamp">${line.time}</span>
              <span class="speaker">${line.speaker}:</span>
              <span>${formatTranscriptText(line.text, line.highlight)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- AI Reasoning Panel -->
      <div class="reasoning-panel">
        <div class="panel-header">AI Reasoning</div>
        <div class="reasoning-content">
          <div class="reasoning-section">
            <h4>Risk Score</h4>
            <div class="risk-score-large ${call.riskLevel}">
              <span class="score">${call.riskScore}</span>
              <div>
                <span class="label">${call.riskLevel} Risk</span>
                <p style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Confidence: ${call.confidence}%</p>
              </div>
            </div>
          </div>
          
          <div class="reasoning-section">
            <h4>Intent Analysis</h4>
            <p>Customer is seeking extension on payment obligation while providing explanation for delay. Pattern suggests preparatory framing for potential default.</p>
          </div>
          
          <div class="reasoning-section">
            <h4>Sentiment</h4>
            <p>Initially cooperative with gradual shift to defensive posture when historical patterns mentioned. Stress indicators detected at 2:14 mark.</p>
          </div>
          
          <div class="reasoning-section">
            <h4>Behavior Analysis</h4>
            <ul class="explanation-list">
              ${call.explanation.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>
          
          <div class="reasoning-section">
            <h4>Historical Evidence</h4>
            <ul class="evidence-list">
              <li>Previous call: promised payment in 7 days — not completed <span class="evidence-date">Feb 2, 2026</span></li>
              <li>Prior call: salary delay mentioned, requested 14-day extension <span class="evidence-date">Jan 22, 2026</span></li>
              <li>Payment history: 2 of last 5 commitments honored (40%) <span class="evidence-date">Last 90 days</span></li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Action Center -->
      <div class="action-center">
        <h3 style="margin-bottom: 16px;">Action Center</h3>
        <div class="action-buttons">
          <button class="btn-danger">Escalate</button>
          <button class="btn-primary">Schedule Callback</button>
          <button class="btn-secondary">Mark Safe</button>
        </div>
        <div class="action-automation">
          <h4>Automation that will run:</h4>
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
      </div>
    </div>
  `;
}

// Format transcript text with highlights
function formatTranscriptText(text, highlight) {
    if (!highlight) return text;

    const highlightWords = {
        risk: ['salary', 'delay', 'promise', 'word', 'third time', 'cash flow'],
        entity: ['₹45,000', '15th', 'January 28', 'February 16']
    };

    let formatted = text;
    highlightWords[highlight]?.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        formatted = formatted.replace(regex, `<span class="highlight-${highlight}">$1</span>`);
    });

    return formatted;
}

// Get automation icon
function getAutomationIcon(type) {
    const icons = {
        slack: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/></svg>',
        crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        callback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>',
        escalation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'
    };
    return icons[type] || icons.crm;
}

// Render n8n Modal Content
export function renderN8nModalContent(showJson = false) {
    if (showJson) {
        return `
      <div class="json-preview">
        <pre><code>${JSON.stringify(n8nWorkflowJSON, null, 2)}</code></pre>
      </div>
    `;
    }

    return `
    <div class="workflow-diagram">
      <div class="workflow-step">
        <div class="step-icon call">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2"/></svg>
        </div>
        <span>Call Received</span>
      </div>
      <div class="workflow-connector"></div>
      <div class="workflow-step">
        <div class="step-icon voiceops">VO</div>
        <span>VoiceOps Analysis</span>
      </div>
      <div class="workflow-connector"></div>
      <div class="workflow-step">
        <div class="step-icon decision">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/></svg>
        </div>
        <span>Risk Decision</span>
      </div>
      <div class="workflow-connector"></div>
      <div class="workflow-outputs">
        <div class="workflow-step small">
          <div class="step-icon slack"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523"/></svg></div>
          <span>Slack</span>
        </div>
        <div class="workflow-step small">
          <div class="step-icon crm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/></svg></div>
          <span>CRM</span>
        </div>
        <div class="workflow-step small">
          <div class="step-icon callback"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg></div>
          <span>Callback</span>
        </div>
      </div>
    </div>
    <div class="modal-description">
      <h3>Plug-and-Play Workflow Automation</h3>
      <p>VoiceOps integrates seamlessly with n8n to automate your operational workflows.</p>
      <div class="feature-list">
        <div class="feature"><span class="feature-icon">✓</span><span>Real-time Slack notifications for high-risk calls</span></div>
        <div class="feature"><span class="feature-icon">✓</span><span>Automatic CRM record updates with risk tags</span></div>
        <div class="feature"><span class="feature-icon">✓</span><span>Smart callback scheduling based on behavior</span></div>
        <div class="feature"><span class="feature-icon">✓</span><span>Customizable escalation paths for compliance</span></div>
      </div>
    </div>
  `;
}
