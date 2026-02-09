// VoiceOps Static Config — only non-API data lives here

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
