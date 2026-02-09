// VoiceOps Dashboard Module
// Connects to backend API with graceful fallback to mock data

const API_BASE_URL = 'https://afb1-2409-40f4-40d7-a60c-74de-7968-e0be-e422.ngrok-free.app';

// ─── API Layer ──────────────────────────────────────────────

async function fetchAPI(endpoint) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Dashboard] API ${endpoint} unavailable, using mock data`, err.message);
    return null;
  }
}

export async function fetchDashboardStats() {
  const data = await fetchAPI('/dashboard/stats');
  if (data) return data;

  // Fallback: compute from mockCalls
  const calls = window.mockCalls || [];
  const high = calls.filter(c => c.rag_output.grounded_assessment === 'high_risk').length;
  const medium = calls.filter(c => c.rag_output.grounded_assessment === 'medium_risk').length;
  const low = calls.filter(c => c.rag_output.grounded_assessment === 'low_risk').length;
  const avgScore = calls.length ? Math.round(calls.reduce((s, c) => s + c.input_risk_assessment.risk_score, 0) / calls.length) : 0;
  const resolved = calls.filter(c => c.automations && c.automations.length > 0).length;
  const resolutionRate = calls.length ? Math.round((resolved / calls.length) * 100) : 0;

  return {
    total_calls: calls.length,
    high_risk: high,
    medium_risk: medium,
    low_risk: low,
    avg_risk_score: avgScore,
    resolution_rate: resolutionRate
  };
}

export async function fetchRecentActivity() {
  const data = await fetchAPI('/dashboard/recent-activity');
  if (data) return data;

  // Fallback
  const logs = window.mockWorkflowLogs || [];
  return logs.slice(0, 5).map(log => ({
    id: log.id,
    call_id: log.call_id,
    action: log.action,
    reason: log.reason || log.detail || '',
    timestamp: log.timestamp,
    type: log.type || 'crm',
    status: log.status
  }));
}

export async function fetchTopPatterns() {
  const data = await fetchAPI('/dashboard/top-patterns');
  if (data) return data;

  // Fallback: aggregate from mockCalls
  const calls = window.mockCalls || [];
  const patternMap = {};
  calls.forEach(c => {
    (c.rag_output.matched_patterns || []).forEach(p => {
      patternMap[p] = (patternMap[p] || 0) + 1;
    });
  });

  return Object.entries(patternMap)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function fetchActiveCases() {
  const data = await fetchAPI('/dashboard/active-cases');
  if (data) return data;

  // Fallback: top 3 highest risk
  const calls = window.mockCalls || [];
  return [...calls]
    .sort((a, b) => b.input_risk_assessment.risk_score - a.input_risk_assessment.risk_score)
    .slice(0, 3);
}

export async function fetchSystemHealth() {
  const data = await fetchAPI('/dashboard/health');
  if (data) return data;

  // Fallback
  return {
    status: 'operational',
    pipeline: 'healthy',
    uptime: '99.8%',
    last_call_processed: window.mockCalls?.[0]?.call_timestamp || new Date().toISOString(),
    avg_processing_time: '2.3s'
  };
}

// ─── Render Dashboard ───────────────────────────────────────

export async function renderDashboard() {
  // Show skeleton immediately
  const skeleton = renderSkeleton();

  // Fetch all data in parallel
  const [stats, activity, patterns, cases, health] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentActivity(),
    fetchTopPatterns(),
    fetchActiveCases(),
    fetchSystemHealth()
  ]);

  return `
    <div class="dashboard-page">
      
      <!-- System Health Bar -->
      <div class="dash-health-bar">
        <div class="dash-health-status ${health.status === 'operational' ? 'online' : 'degraded'}">
          <span class="dash-health-dot"></span>
          <span>All Systems ${health.status === 'operational' ? 'Operational' : 'Degraded'}</span>
        </div>
        <div class="dash-health-meta">
          <span class="dash-health-item">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            Uptime ${health.uptime || '99.8%'}
          </span>
          <span class="dash-health-item">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            Avg Processing ${health.avg_processing_time || '2.3s'}
          </span>
        </div>
      </div>

      <!-- KPI Stats Row -->
      <div class="dash-stats-row">
        ${renderStatCard('Total Calls', stats.total_calls, 'today', 'blue', `<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>`)}
        ${renderStatCard('High Risk', stats.high_risk, 'needs attention', 'red', `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`)}
        ${renderStatCard('Avg Risk Score', stats.avg_risk_score, 'across all calls', getScoreColor(stats.avg_risk_score), `<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>`)}
        ${renderStatCard('Resolution Rate', stats.resolution_rate + '%', 'cases resolved', 'green', `<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>`)}
      </div>

      <!-- Main Grid: Activity + Patterns -->
      <div class="dash-main-grid">
        
        <!-- Recent Activity Timeline -->
        <div class="dash-panel dash-activity-panel">
          <div class="dash-panel-header">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
              Recent Activity
            </h3>
            <button class="dash-view-all" onclick="navigateTo('workflow-logs')">View All →</button>
          </div>
          <div class="dash-activity-list">
            ${activity.length ? activity.map((a, i) => renderActivityItem(a, i)).join('') : renderEmptyActivity()}
          </div>
        </div>

        <!-- Top Patterns -->
        <div class="dash-panel dash-patterns-panel">
          <div class="dash-panel-header">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Top Patterns Detected
            </h3>
          </div>
          <div class="dash-patterns-list">
            ${patterns.length ? patterns.map((p, i) => renderPatternItem(p, i, patterns[0].count)).join('') : '<p class="dash-empty-text">No patterns detected yet</p>'}
          </div>
        </div>
      </div>

      <!-- Active High-Risk Cases -->
      <div class="dash-panel dash-cases-panel">
        <div class="dash-panel-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            Active High-Priority Cases
          </h3>
          <button class="dash-view-all" onclick="navigateTo('cases')">View All Cases →</button>
        </div>
        <div class="dash-cases-grid">
          ${cases.map((c, i) => renderDashCaseCard(c, i)).join('')}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dash-quick-actions">
        <button class="dash-action-btn primary" onclick="navigateTo('cases')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Start New Analysis
        </button>
        <button class="dash-action-btn secondary" onclick="navigateTo('risk-queue')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          Risk Queue
        </button>
        <button class="dash-action-btn secondary" onclick="navigateTo('workflow-logs')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          Workflow Logs
        </button>
      </div>

    </div>
  `;
}

// ─── Sub-renderers ──────────────────────────────────────────

function getScoreColor(score) {
  if (score >= 70) return 'red';
  if (score >= 40) return 'yellow';
  return 'green';
}

function renderStatCard(label, value, subtitle, color, iconSvg) {
  return `
    <div class="dash-stat-card dash-stat-${color}">
      <div class="dash-stat-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
      </div>
      <div class="dash-stat-content">
        <span class="dash-stat-value" data-target="${typeof value === 'number' ? value : ''}">${value}</span>
        <span class="dash-stat-label">${label}</span>
        <span class="dash-stat-subtitle">${subtitle}</span>
      </div>
    </div>
  `;
}

function renderActivityItem(activity, index) {
  const typeIcons = {
    escalation: '🚨',
    crm: '📋',
    callback: '📞',
    slack: '💬',
    manual_review: '👁️',
    monitor: '📡'
  };
  const icon = typeIcons[activity.type] || '📋';
  const timeStr = timeAgoShort(new Date(activity.timestamp));

  return `
    <div class="dash-activity-item" style="animation-delay: ${index * 0.06}s">
      <div class="dash-activity-icon ${activity.type || ''}">${icon}</div>
      <div class="dash-activity-content">
        <span class="dash-activity-action">${activity.action}</span>
        <span class="dash-activity-detail">${activity.reason || activity.call_id}</span>
      </div>
      <div class="dash-activity-time">
        <span class="dash-activity-timestamp">${timeStr}</span>
        <span class="dash-activity-callid" onclick="openCallInvestigation('${activity.call_id}')">${activity.call_id?.substring(0, 20) || ''}</span>
      </div>
    </div>
  `;
}

function renderEmptyActivity() {
  return `<div class="dash-empty-state">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <p>No recent activity</p>
  </div>`;
}

function renderPatternItem(pattern, index, maxCount) {
  const barWidth = maxCount ? Math.max(20, (pattern.count / maxCount) * 100) : 20;
  return `
    <div class="dash-pattern-item" style="animation-delay: ${index * 0.06}s">
      <div class="dash-pattern-info">
        <span class="dash-pattern-name">${pattern.pattern}</span>
        <span class="dash-pattern-count">${pattern.count}×</span>
      </div>
      <div class="dash-pattern-bar-bg">
        <div class="dash-pattern-bar-fill" style="width: ${barWidth}%"></div>
      </div>
    </div>
  `;
}

function renderDashCaseCard(call, index) {
  const risk = call.input_risk_assessment;
  const rag = call.rag_output;
  const riskLevel = rag.grounded_assessment === 'high_risk' ? 'high' : (rag.grounded_assessment === 'medium_risk' ? 'medium' : 'low');
  const riskLabel = riskLevel === 'high' ? 'HIGH' : riskLevel === 'medium' ? 'MED' : 'LOW';

  return `
    <div class="dash-case-card ${riskLevel}" style="animation-delay: ${index * 0.08}s" onclick="openCallInvestigation('${call.call_id}')">
      <div class="dash-case-top">
        <div class="dash-case-score ${riskLevel}">${risk.risk_score}</div>
        <div class="dash-case-info">
          <span class="dash-case-id">${call.call_id}</span>
          <span class="dash-case-pattern">${rag.matched_patterns?.[0] || 'Pattern Detected'}</span>
        </div>
        <span class="dash-case-tag ${riskLevel}">${riskLabel}</span>
      </div>
      <p class="dash-case-desc">${rag.explanation?.substring(0, 100)}${rag.explanation?.length > 100 ? '...' : ''}</p>
      <div class="dash-case-footer">
        <span>${timeAgoShort(new Date(call.call_timestamp))}</span>
        <span>${Math.round(rag.confidence * 100)}% conf</span>
      </div>
    </div>
  `;
}

function renderSkeleton() {
  return `<div class="dashboard-page">
    <div class="dash-stats-row">
      ${Array(4).fill('<div class="dash-stat-card skeleton"><div class="skeleton-shine"></div></div>').join('')}
    </div>
  </div>`;
}

function timeAgoShort(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
