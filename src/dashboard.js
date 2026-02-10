// VoiceOps Dashboard Module
// Connects to backend API — no mock data fallbacks

import { getDashboardStats, getRecentActivity, getTopPatterns, getActiveCases, getSystemHealth, liveStore } from './api.js';

export { getDashboardStats as fetchDashboardStats };
export { getRecentActivity as fetchRecentActivity };
export { getTopPatterns as fetchTopPatterns };
export { getActiveCases as fetchActiveCases };
export { getSystemHealth as fetchSystemHealth };

// ─── Render Dashboard ───────────────────────────────────────

export async function renderDashboard() {
  // Fetch all data in parallel from API
  const [statsRaw, activityRaw, patternsRaw, casesRaw, health] = await Promise.all([
    getDashboardStats().catch(() => ({ total_calls: 0, high_risk: 0, avg_risk_score: 0, resolution_rate: 0 })),
    getRecentActivity().catch(() => []),
    getTopPatterns().catch(() => []),
    getActiveCases().catch(() => []),
    getSystemHealth().catch(() => ({ status: 'unknown', uptime: '--', avg_processing_time: '--' }))
  ]);

  // Normalize: APIs may return wrapped objects or plain arrays
  const stats = statsRaw?.stats || statsRaw || { total_calls: 0, high_risk_count: 0, avg_risk_score: 0, resolution_rate: 0 };
  const activity = Array.isArray(activityRaw) ? activityRaw : (activityRaw?.activity || activityRaw?.recent_activity || []);
  const patterns = Array.isArray(patternsRaw) ? patternsRaw : (patternsRaw?.patterns || patternsRaw?.top_patterns || []);
  const cases = Array.isArray(casesRaw) ? casesRaw : (casesRaw?.cases || casesRaw?.active_cases || []);

  // Store fetched cases for other modules
  if (Array.isArray(cases) && cases.length) {
    liveStore.setCalls(cases);
  }

  return `
    <div class="dashboard-page">

      <!-- KPI Stats Row -->
      <div class="dash-stats-row">
        ${renderStatCard('Total Calls', stats.total_calls ?? 0, `${stats.total_calls_today ?? 0} today`, 'blue', `<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>`)}
        ${renderStatCard('High Risk', stats.high_risk_count ?? 0, 'needs attention', 'red', `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`)}
        ${renderStatCard('Avg Risk Score', stats.avg_risk_score ?? 0, 'across all calls', getScoreColor(stats.avg_risk_score), `<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>`)}
        ${renderStatCard('Resolution Rate', (stats.resolution_rate ?? 0) + '%', 'cases resolved', 'green', `<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>`)}
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
            <button class="dash-view-all" onclick="navigateTo('cases')">View All →</button>
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
            ${patterns.length ? patterns.map((p, i) => renderPatternItem(p, i, patterns[0]?.match_count || patterns[0]?.count || 1)).join('') : '<p class="dash-empty-text">No patterns detected yet</p>'}
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
  // Map grounded_assessment to visual type
  const assessment = activity.grounded_assessment || '';
  const riskLevel = assessment === 'high_risk' ? 'high' : (assessment === 'medium_risk' ? 'medium' : 'low');
  const typeIcons = {
    high: '',
    medium: '',
    low: ''
  };
  const icon = typeIcons[riskLevel] || '';
  const timeStr = activity.call_timestamp ? timeAgoShort(new Date(activity.call_timestamp)) : '--';
  const actionLabel = activity.status ? activity.status.replace('_', ' ').toUpperCase() : 'PROCESSED';
  const detail = activity.summary_for_rag || activity.reason || '';

  return `
    <div class="dash-activity-item" style="animation-delay: ${index * 0.06}s">
      <div class="dash-activity-icon ${riskLevel}">${icon}</div>
      <div class="dash-activity-content">
        <span class="dash-activity-action">${actionLabel} — Risk: ${activity.risk_score ?? '--'}</span>
        <span class="dash-activity-detail">${detail.substring(0, 80)}${detail.length > 80 ? '...' : ''}</span>
      </div>
      <div class="dash-activity-time">
        <span class="dash-activity-timestamp">${timeStr}</span>
        <span class="dash-activity-callid" onclick="openCallInvestigation('${activity.call_id}')">${activity.call_id?.substring(0, 24) || ''}</span>
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
  const count = pattern.match_count ?? pattern.count ?? 0;
  const barWidth = maxCount ? Math.max(20, (count / maxCount) * 100) : 20;
  return `
    <div class="dash-pattern-item" style="animation-delay: ${index * 0.06}s">
      <div class="dash-pattern-info">
        <span class="dash-pattern-name">${pattern.pattern || pattern.name || 'Unknown'}</span>
        <span class="dash-pattern-count">${count}×</span>
      </div>
      <div class="dash-pattern-bar-bg">
        <div class="dash-pattern-bar-fill" style="width: ${barWidth}%"></div>
      </div>
    </div>
  `;
}

function renderDashCaseCard(call, index) {
  if (!call) return '';
  // Active-cases API returns flat fields: risk_score, grounded_assessment, etc.
  // Full call API returns nested: input_risk_assessment.risk_score, rag_output.grounded_assessment
  const riskScore = call.risk_score ?? call.input_risk_assessment?.risk_score ?? call.risk_assessment?.risk_score ?? '--';
  const assessment = call.grounded_assessment || call.rag_output?.grounded_assessment || 'low_risk';
  const explanation = call.summary_for_rag || call.rag_output?.explanation || 'No description available';
  const confidence = call.rag_output?.confidence ?? call.risk_assessment?.confidence ?? call.confidence ?? null;
  const matchedPatterns = call.rag_output?.matched_patterns || [];
  
  const riskLevel = assessment === 'high_risk' ? 'high' : (assessment === 'medium_risk' ? 'medium' : 'low');
  const riskLabel = riskLevel === 'high' ? 'HIGH' : riskLevel === 'medium' ? 'MED' : 'LOW';

  return `
    <div class="dash-case-card ${riskLevel}" style="animation-delay: ${index * 0.08}s" onclick="openCallInvestigation('${call.call_id}')">
      <div class="dash-case-top">
        <div class="dash-case-score ${riskLevel}">${riskScore}</div>
        <div class="dash-case-info">
          <span class="dash-case-id">${call.call_id || 'Unknown'}</span>
          <span class="dash-case-pattern">${matchedPatterns[0] || call.recommended_action?.replace(/_/g, ' ') || 'Pattern Detected'}</span>
        </div>
        <span class="dash-case-tag ${riskLevel}">${riskLabel}</span>
      </div>
      <p class="dash-case-desc">${explanation.substring(0, 100)}${explanation.length > 100 ? '...' : ''}</p>
      <div class="dash-case-footer">
        <span>${call.call_timestamp ? timeAgoShort(new Date(call.call_timestamp)) : '--'}</span>
        <span>${confidence ? Math.round(confidence * 100) + '% conf' : (call.fraud_likelihood || '--')}</span>
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
