// VoiceOps API Service — Centralized data fetching from backend
// All pages use this module instead of mock data

const API_BASE_URL = 'https://afb1-2409-40f4-40d7-a60c-74de-7968-e0be-e422.ngrok-free.app';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

// ─── Generic Fetch Wrapper ──────────────────────────────────

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: API_HEADERS,
      ...options
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, err.message);
    throw err;
  }
}

// ─── Dashboard APIs ─────────────────────────────────────────

export async function getDashboardStats() {
  return apiFetch('/api/v1/dashboard/stats');
}

export async function getRecentActivity({ limit = 5 } = {}) {
  return apiFetch(`/api/v1/dashboard/recent-activity?limit=${limit}`);
}

export async function getTopPatterns({ limit = 10 } = {}) {
  return apiFetch(`/api/v1/dashboard/top-patterns?limit=${limit}`);
}

export async function getActiveCases({ limit = 3 } = {}) {
  return apiFetch(`/api/v1/dashboard/active-cases?limit=${limit}`);
}

export async function getSystemHealth() {
  return apiFetch('/api/v1/dashboard/health');
}

// ─── Calls APIs ─────────────────────────────────────────────

export async function getCalls({ page = 1, limit = 20, sort = 'recent', status, risk } = {}) {
  let endpoint = `/api/v1/calls?page=${page}&limit=${limit}&sort=${sort}`;
  if (status) endpoint += `&status=${encodeURIComponent(status)}`;
  if (risk) endpoint += `&risk=${encodeURIComponent(risk)}`;
  return apiFetch(endpoint);
}

export async function getCallById(callId) {
  return apiFetch(`/api/v1/call/${encodeURIComponent(callId)}`);
}

export async function updateCallStatus(callId, status) {
  return apiFetch(`/api/v1/call/${encodeURIComponent(callId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// ─── Chat API ───────────────────────────────────────────────

export async function sendChatMessage(question) {
  return apiFetch('/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({ question })
  });
}

// ─── Analyze Call API ───────────────────────────────────────
// Separate ngrok URL; sends audio file as multipart/form-data

const ANALYZE_CALL_URL = 'https://be35-2409-40f4-3-ffec-dd21-5c50-cb7e-c5f5.ngrok-free.app/analyze-call';

export async function analyzeCall(audioFile) {
  const formData = new FormData();
  formData.append('audio_file', audioFile);

  try {
    const res = await fetch(ANALYZE_CALL_URL, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true'
        // Do NOT set Content-Type — browser sets it with the correct multipart boundary
      },
      body: formData
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    return await res.json();
  } catch (err) {
    console.error('[API] POST /analyze-call failed:', err.message);
    throw err;
  }
}

// ─── Knowledge Base APIs ────────────────────────────────────

export async function seedKnowledge(payload) {
  return apiFetch('/api/v1/knowledge/seed', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getKnowledgeStatus() {
  return apiFetch('/api/v1/knowledge/status');
}

// ─── Live Data Store ────────────────────────────────────────
// Pages load data into this store so the chatbot & other modules can reference it

export const liveStore = {
  calls: [],
  workflowLogs: [],
  stats: null,

  setCalls(calls) {
    this.calls = calls;
    window.liveCalls = calls; // expose for chatbot
  },

  setLogs(logs) {
    this.workflowLogs = logs;
    window.liveLogs = logs;
  },

  setStats(stats) {
    this.stats = stats;
    window.liveStats = stats;
  },

  findCall(callId) {
    return this.calls.find(c => c.call_id === callId);
  }
};

export { API_BASE_URL };
