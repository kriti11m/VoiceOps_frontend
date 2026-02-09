// Mock data for VoiceOps Dashboard - Phase 2 (RAG Grounding)

export const mockCalls = [
  {
    call_id: 'call_2026_02_09_09e6c2',
    call_timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    customer_id: 'CUST-8492',
    customer_name: 'Rajesh S.',
    phone_masked: '+91-XXXX-4321', // PII Masked
    duration: '4:32',
    input_risk_assessment: {
      risk_score: 78,
      fraud_likelihood: 'high',
      confidence: 0.81
    },
    rag_output: {
      grounded_assessment: 'high_risk',
      explanation: 'The customer made a conditional promise to pay ("I will pay as soon as I receive the salary") which contradicts their earlier claim of having funds available. This aligns with the "Conditional Promise with Contradiction" pattern often associated with payment avoidance.',
      recommended_action: 'escalate_to_compliance',
      confidence: 0.81,
      regulatory_flags: [],
      matched_patterns: ['Conditional Promise with Contradiction', 'Evasive Response Pattern']
    },
    status: 'complete', // pipeline status
    automations: [] // To track executed actions
  },
  {
    call_id: 'call_2026_02_09_09e6b8',
    call_timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    customer_id: 'CUST-3921',
    customer_name: 'Priya P.',
    phone_masked: '+91-XXXX-2109',
    duration: '2:18',
    input_risk_assessment: {
      risk_score: 57,
      fraud_likelihood: 'medium',
      confidence: 0.71
    },
    rag_output: {
      grounded_assessment: 'medium_risk',
      explanation: 'Customer reported unexpected job loss. While this represents a financial risk, the communication was transparent and matched the "Hardship Claim" pattern. No deception indicators found.',
      recommended_action: 'schedule_manual_review',
      confidence: 0.75,
      regulatory_flags: ['Hardship verification required'],
      matched_patterns: ['Financial Hardship Claim', 'Transparent Disclosure']
    },
    status: 'complete',
    automations: []
  },
  {
    call_id: 'call_2026_02_09_09e6a4',
    call_timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    customer_id: 'CUST-1102',
    customer_name: 'Amit K.',
    phone_masked: '+91-XXXX-0987',
    duration: '1:45',
    input_risk_assessment: {
      risk_score: 12,
      fraud_likelihood: 'low',
      confidence: 0.94
    },
    rag_output: {
      grounded_assessment: 'low_risk',
      explanation: 'Customer immediately confirmed payment details and provided a valid transaction reference. Behavior matches "Positive Confirmation" pattern.',
      recommended_action: 'monitor',
      confidence: 0.96,
      regulatory_flags: [],
      matched_patterns: ['Positive Confirmation', 'Commitment Honored']
    },
    status: 'complete',
    automations: [
      { type: 'crm', label: 'CRM Updated', status: 'executed', timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString() }
    ]
  },
  {
    call_id: 'call_2026_02_09_09e5f1',
    call_timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    customer_id: 'CUST-5593',
    customer_name: 'Rahul Sharma',
    phone_masked: '+91-XXXX-9876',
    duration: '5:47',
    input_risk_assessment: {
      risk_score: 88,
      fraud_likelihood: 'high',
      confidence: 0.89
    },
    loan_id: "LN20391",
    previous_calls_count: 2,
    voice_match_confidence: 0.87,
    rag_output: {
      grounded_assessment: 'high_risk',
      explanation: 'Customer used aggressive language and threatened legal action when asked for payment. This matches the "Dispute Escalation with Aggression" pattern.',
      recommended_action: 'escalate_to_compliance',
      confidence: 0.88,
      regulatory_flags: ['Potential UDAAP trigger', 'Legal threat'],
      matched_patterns: ['Legal Threat', 'Aggressive Dispute']
    },
    status: 'complete',
    automations: [
      { type: 'escalation', label: 'Compliance Ticket Created', status: 'executed', timestamp: new Date(Date.now() - 1000 * 60 * 118).toISOString() }
    ]
  },
  {
    call_id: 'call_2026_02_09_09e4d0',
    call_timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    customer_id: 'CUST-7721',
    customer_name: 'Vikram S.',
    phone_masked: '+91-XXXX-8765',
    duration: '3:22',
    input_risk_assessment: {
      risk_score: 45,
      fraud_likelihood: 'medium',
      confidence: 0.67
    },
    rag_output: {
      grounded_assessment: 'medium_risk',
      explanation: 'Customer offered partial payment which deviates from the standard agreement. Requires manager approval per policy interaction guidelines.',
      recommended_action: 'schedule_manual_review',
      confidence: 0.72,
      regulatory_flags: [],
      matched_patterns: ['Partial Payment Offer', 'Policy Deviation']
    },
    status: 'complete',
    automations: []
  }
];

export const mockTranscript = [
  { time: '0:00', speaker: 'Agent', text: 'Good afternoon, this is VoiceOps Collections. Am I speaking with Mr. Rajesh?' },
  { time: '0:05', speaker: 'Customer', text: 'Yes, this is Rajesh.' },
  { time: '0:08', speaker: 'Agent', text: 'Sir, I\'m calling regarding your outstanding balance. Our records show the payment was due on January 28th.' },
  { time: '0:18', speaker: 'Customer', text: 'Yes, I know about this. Actually, there has been some delay in my salary this month.', highlight: 'risk', entity: 'salary delay' },
  { time: '0:28', speaker: 'Agent', text: 'I understand. Can you confirm when you expect to make this payment?' },
  { time: '0:35', speaker: 'Customer', text: 'My company said the salary will be credited by the 15th of this month.' },
  { time: '0:45', speaker: 'Agent', text: 'Sir, we see a similar delay recorded last week. Can you explain?' },
  { time: '0:55', speaker: 'Customer', text: 'Yes, that\'s true. But I promise I will pay as soon as I receive the salary.', highlight: 'risk', entity: 'conditional promise' },
  { time: '1:08', speaker: 'Agent', text: 'I understand. However, based on the history, we need a firm commitment.' },
  { time: '1:20', speaker: 'Customer', text: 'You have my word. I will pay.', highlight: 'risk', entity: 'evasive' }
];

export const mockWorkflowLogs = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    call_id: 'call_2026_02_09_09e5f1',
    action: 'Escalated to Compliance',
    status: 'Success',
    reason: 'Legal threat detected',
    actor: 'System (Auto)'
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    call_id: 'call_2026_02_09_09e6a4',
    action: 'CRM Updated',
    status: 'Success',
    reason: 'Payment confirmed',
    actor: 'System (Auto)'
  }
];

export const n8nWorkflowJSON = {
  name: "VoiceOps Risk Automation",
  nodes: [
    { name: "VoiceOps Webhook", type: "n8n-nodes-base.webhook", parameters: { path: "voiceops-cases", method: "POST" } },
    { name: "RAG Analysis", type: "n8n-nodes-base.httpRequest", parameters: { url: "https://api.internal/rag/analyze", method: "POST" } },
    { name: "Risk Router", type: "n8n-nodes-base.switch", parameters: { rules: [{ output: 0, value: "high_risk" }, { output: 1, value: "medium_risk" }] } },
    { name: "Compliance Ticket", type: "n8n-nodes-base.jira", parameters: { operation: "create", project: "COMPLIANCE" } },
    { name: "Slack Alert", type: "n8n-nodes-base.slack", parameters: { channel: "#risk-alerts", message: "🚨 New High Risk Case" } }
  ],
  connections: {
    "VoiceOps Webhook": { main: [[{ node: "RAG Analysis" }]] },
    "RAG Analysis": { main: [[{ node: "Risk Router" }]] },
    "Risk Router": { main: [[{ node: "Compliance Ticket" }, { node: "Slack Alert" }], []] }
  }
};
