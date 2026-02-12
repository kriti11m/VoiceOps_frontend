// VoiceOps AI Assistant Chatbot Module

import { API_BASE_URL } from './api.js';

export class VoiceOpsAssistant {
  constructor() {
    this.conversations = new Map(); // Store conversations by page/context
    this.currentContext = null;
    this.isProcessing = false;
    this.messageHistory = [];
  }

  // Initialize the assistant panel
  init() {
    this.renderAssistantPanel();
    this.setupEventListeners();
    this.setWelcomeMessage();
  }

  // Set the current context (page, selected call, etc.)
  setContext(context) {
    this.currentContext = context;
    
    // Update conversation based on context
    if (context.page === 'investigation' && context.callId) {
      this.setInvestigationContext(context.callId);
    } else if (context.page === 'dashboard' || context.page === 'cases' || context.page === 'home') {
      this.setDashboardContext();
    } else if (context.page === 'risk-queue') {
      this.setQueueContext();
    }
  }

  // Render the assistant panel
  renderAssistantPanel() {
    const assistantPanel = document.getElementById('assistant-panel');
    if (!assistantPanel) return;

    assistantPanel.innerHTML = `
      <div class="assistant-header">
        <div class="assistant-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          VoiceOps Assistant
        </div>
        <div class="assistant-subtitle">AI-powered case analysis and guidance</div>
      </div>
      
      <div class="chat-area" id="chat-area">
        <div class="assistant-empty" id="assistant-empty">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
          </svg>
          <p>How can I help you today?</p>
          <div class="suggestion-chips" id="suggestion-chips"></div>
        </div>
        
        <div class="chat-messages" id="chat-messages"></div>
      </div>
      
      <div class="input-area">
        <div class="input-container">
          <textarea 
            class="chat-input" 
            id="chat-input" 
            placeholder=“Ask about risks, compliance, or cases…”
            rows="1"
          ></textarea>
          <button class="send-btn" id="send-btn" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13"/>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // Setup event listeners
  setupEventListeners() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    if (chatInput && sendBtn) {
      // Send message on Enter (but not Shift+Enter)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      chatInput.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      });

      // Send button click
      sendBtn.addEventListener('click', () => this.sendMessage());

      // Suggestion chips
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip-btn')) {
          this.sendPredefinedMessage(e.target.textContent);
        }
      });
    }
  }

  // Set welcome message and suggestions
  setWelcomeMessage() {
    this.updateSuggestions(this.getContextualSuggestions());
  }

  // Get contextual suggestions based on current page/context
  getContextualSuggestions() {
    if (!this.currentContext) {
      return [
        "Show me today's high-risk cases",
        "Explain fraud detection patterns",
        "What are common compliance flags?",
        "How does the RAG system work?"
      ];
    }

    switch (this.currentContext.page) {
      case 'investigation':
        return [
          "Explain this risk assessment",
          "What patterns were detected?",
          "Recommend next actions",
          "Show similar cases"
        ];
      case 'home':
        return [
          "summarize last 5 calls",
          "",
         
        ];
      case 'risk-queue':
        return [
          "Prioritize high-risk cases",
          "Bulk action recommendations",
          "Compliance review checklist",
          "Export queue summary"
        ];
      default:
        return [
          "Help with risk analysis",
          "Compliance guidelines",
          "Pattern recognition tips",
          "Workflow automation"
        ];
    }
  }

  // Update suggestion chips
  updateSuggestions(suggestions) {
    const chipsContainer = document.getElementById('suggestion-chips');
    if (!chipsContainer) return;

    chipsContainer.innerHTML = suggestions.map(suggestion => 
      `<button class="chip-btn">${suggestion}</button>`
    ).join('');
  }

  // Send a message
  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || this.isProcessing) return;

    // Clear input and hide empty state
    input.value = '';
    input.style.height = 'auto';
    this.hideEmptyState();

    // Add user message
    this.addMessage('user', message);

    // Show typing indicator
    this.isProcessing = true;
    this.showTypingIndicator();

    try {
      // Call AI backend API (falls back to local responses if API is unreachable)
      const response = await this.processMessage(message);
      
      // Remove typing indicator and add AI response
      this.hideTypingIndicator();
      this.addMessage('ai', response);
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('ai', {
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // Send a predefined message
  sendPredefinedMessage(message) {
    const input = document.getElementById('chat-input');
    input.value = message;
    this.sendMessage();
  }

  // Process the message and generate AI response
  async processMessage(message) {
    try {
      const response = await this.callAPI(message);
      return response;
    } catch (error) {
      console.error('API call failed, using fallback:', error);
      return this.getFallbackResponse(message);
    }
  }

  // Call the real backend API
  async callAPI(message) {
    const payload = {
      question: message
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Format the API response for our chat UI
    return this.formatAPIResponse(data);
  }

  // Format the API response into our chat display structure
  formatAPIResponse(data) {
    // If the API returns a simple string answer
    if (typeof data === 'string') {
      return data;
    }

    // If the API returns an object with an "answer" or "response" field
    const answerText = data.answer || data.response || data.message || data.text || data.output || '';

    if (!answerText) {
      // Return the full object as a formatted string if no known key
      return JSON.stringify(data, null, 2);
    }

    // Return as a structured response block for clean rendering
    return {
      type: 'api-response',
      content: answerText,
      // Include sources if the API returns them
      ...(data.sources && {
        sections: [{
          title: '📚 Sources',
          items: Array.isArray(data.sources)
            ? data.sources.map(s => typeof s === 'string' ? s : (s.title || s.name || JSON.stringify(s)))
            : [String(data.sources)]
        }]
      }),
      // Include follow-up if provided
      ...(data.follow_up && { recommendation: data.follow_up })
    };
  }

  // Fallback responses when API is unreachable
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Context-aware responses based on current page and message content
    if (this.currentContext?.page === 'investigation' && this.currentContext?.callId) {
      return this.getInvestigationResponse(message, this.currentContext.callId);
    }

    // General responses
    if (lowerMessage.includes('risk') || lowerMessage.includes('score')) {
      return {
        type: 'analysis',
        content: 'I can help you understand risk assessments in VoiceOps.',
        sections: [
          {
            title: '🎯 Risk Score Components',
            items: [
              'Behavioral pattern analysis (40%)',
              'Historical interaction data (25%)',
              'Voice biometric matching (20%)',
              'Compliance flag triggers (15%)'
            ]
          },
          {
            title: '📊 Score Interpretation',
            items: [
              'High Risk (70+): Immediate escalation required',
              'Medium Risk (40-69): Manual review recommended',
              'Low Risk (<40): Standard monitoring'
            ]
          }
        ],
        recommendation: 'Would you like me to analyze a specific case or explain any particular risk pattern?'
      };
    }

    if (lowerMessage.includes('pattern') || lowerMessage.includes('detection')) {
      return {
        type: 'patterns',
        content: 'Here are the key fraud patterns VoiceOps detects:',
        sections: [
          {
            title: '🚨 High-Risk Patterns',
            items: [
              'Conditional promises with contradictions',
              'Identity concealment attempts',
              'Aggressive dispute escalation',
              'Evasive response to verification'
            ]
          },
          {
            title: '⚠️ Medium-Risk Patterns',
            items: [
              'Financial hardship claims',
              'Partial payment offers',
              'Policy deviation requests',
              'Inconsistent information'
            ]
          }
        ],
        recommendation: 'These patterns are continuously learned from your data. Want to see how they apply to current cases?'
      };
    }

    if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation')) {
      return {
        type: 'compliance',
        content: 'VoiceOps helps maintain compliance across multiple frameworks:',
        sections: [
          {
            title: '📋 Regulatory Coverage',
            items: [
              'UDAAP (Unfair, Deceptive practices)',
              'TCPA (Telephone Consumer Protection)',
              'FDCPA (Fair Debt Collection)',
              'CCPA/GDPR (Privacy regulations)'
            ]
          },
          {
            title: '🛡️ Automated Safeguards',
            items: [
              'Real-time flag detection',
              'Automatic escalation triggers',
              'Audit trail generation',
              'Policy adherence monitoring'
            ]
          }
        ],
        recommendation: 'Need help with specific compliance requirements or want to review flagged cases?'
      };
    }

    if (lowerMessage.includes('workflow') || lowerMessage.includes('automation')) {
      return {
        type: 'automation',
        content: 'VoiceOps integrates with your existing workflow through n8n:',
        sections: [
          {
            title: '🔗 Available Integrations',
            items: [
              'Slack notifications for high-risk cases',
              'CRM record updates with risk tags',
              'Automated callback scheduling',
              'Compliance ticket creation'
            ]
          },
          {
            title: '⚡ Trigger Conditions',
            items: [
              'Risk score thresholds',
              'Pattern detection events',
              'Manual escalation requests',
              'Compliance flag activation'
            ]
          }
        ],
        recommendation: 'Want to configure new automations or review current workflow performance?'
      };
    }

    // Default response
    return {
      type: 'general',
      content: 'I\'m here to help you with VoiceOps risk analysis and compliance management.',
      sections: [
        {
          title: '💡 I can assist with',
          items: [
            'Risk assessment interpretation',
            'Fraud pattern explanation',
            'Compliance guideline review',
            'Workflow automation setup',
            'Case investigation guidance'
          ]
        }
      ],
      recommendation: 'What specific aspect of your risk management process would you like to explore?'
    };
  }

  // Get investigation-specific response
  getInvestigationResponse(message, callId) {
    const call = window.liveCalls?.find(c => c.call_id === callId);
    if (!call) {
      return {
        type: 'error',
        content: 'I couldn\'t find the details for this case. Please make sure the case is still active.'
      };
    }

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('assessment')) {
      const rag = call.rag_output || {};
      const risk = call.risk_assessment || call.input_risk_assessment || {};
      return {
        type: 'case-analysis',
        content: `Analysis for Case ${callId}:`,
        sections: [
          {
            title: '🎯 Risk Decision',
            items: [
              `Assessment: ${(rag.grounded_assessment || call.grounded_assessment || 'unknown').replace(/_/g, ' ').toUpperCase()}`,
              `Confidence: ${rag.confidence ? Math.round(rag.confidence * 100) + '%' : (risk.confidence ? Math.round(risk.confidence * 100) + '%' : '--')}`,
              `Risk Score: ${risk.risk_score ?? call.risk_score ?? '--'}/100`
            ]
          },
          {
            title: '🔍 Detected Patterns',
            items: (rag.matched_patterns || []).length ? rag.matched_patterns.map(pattern => `• ${pattern}`) : ['• No specific patterns recorded']
          }
        ],
        recommendation: rag.explanation || call.summary_for_rag || 'No detailed explanation available.'
      };
    }

    if (lowerMessage.includes('action') || lowerMessage.includes('recommend')) {
      const rag = call.rag_output || {};
      const action = rag.recommended_action || call.recommended_action || '';
      return {
        type: 'action-guidance',
        content: `Recommended action for this case:`,
        sections: [
          {
            title: '📋 Next Steps',
            items: this.getActionSteps(action)
          },
          {
            title: '⚖️ Compliance Considerations',
            items: (rag.regulatory_flags || []).length > 0 
              ? rag.regulatory_flags.map(flag => `• ${flag}`)
              : ['• No specific compliance flags detected']
          }
        ],
        recommendation: 'Would you like me to help you execute any of these actions or explain the reasoning?'
      };
    }

    // Default case response
    const rag = call.rag_output || {};
    return {
      type: 'case-overview',
      content: `Case ${callId} Overview:`,
      sections: [
        {
          title: '📊 Quick Facts',
          items: [
            `Call ID: ${call.call_id}`,
            `Risk Level: ${(rag.grounded_assessment || call.grounded_assessment || 'unknown').replace(/_/g, ' ')}`,
            `Status: ${call.status || 'N/A'}`,
            `Timestamp: ${call.call_timestamp ? new Date(call.call_timestamp).toLocaleString() : 'N/A'}`
          ]
        }
      ],
      recommendation: 'Ask me to explain the risk assessment, recommend actions, or analyze specific patterns.'
    };
  }

  // Get action steps based on recommended action
  getActionSteps(action) {
    const actionMap = {
      'escalate_to_compliance': [
        'Create compliance ticket immediately',
        'Document all risk indicators',
        'Pause collection activities',
        'Notify compliance team via Slack'
      ],
      'schedule_manual_review': [
        'Assign to senior analyst',
        'Set review deadline (24-48 hours)',
        'Gather additional documentation',
        'Schedule customer callback if needed'
      ],
      'monitor': [
        'Add to monitoring queue',
        'Set follow-up reminders',
        'Continue standard collection process',
        'Track behavioral changes'
      ]
    };

    return actionMap[action] || [
      'Review case details thoroughly',
      'Consult with team lead if uncertain',
      'Document decision rationale',
      'Follow standard procedures'
    ];
  }

  // Add a message to the chat
  addMessage(sender, content) {
    const messagesContainer = this.getMessagesContainer();
    const messageElement = this.createMessageElement(sender, content);
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    // Store in message history
    this.messageHistory.push({ sender, content, timestamp: new Date().toISOString() });
  }

  // Create message element
  createMessageElement(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    if (sender === 'user') {
      messageDiv.textContent = content;
    } else {
      messageDiv.innerHTML = this.formatAIResponse(content);
    }
    
    return messageDiv;
  }

  // Format AI response based on type
  formatAIResponse(response) {
    if (typeof response === 'string') {
      // Convert markdown-like formatting to HTML
      return `<div class="ai-response-block"><p>${this.renderMarkdown(response)}</p></div>`;
    }

    if (response.type === 'error') {
      return `<div class="ai-error">${response.content}</div>`;
    }

    let html = `<div class="ai-response-block">`;
    
    if (response.content) {
      // For API responses, the content may be longer text — render with markdown support
      if (response.type === 'api-response') {
        html += `<div class="ai-api-content">${this.renderMarkdown(response.content)}</div>`;
      } else {
        html += `<p>${response.content}</p>`;
      }
    }

    if (response.sections) {
      response.sections.forEach(section => {
        html += `
          <div class="ai-section-title">
            ${section.title}
          </div>
          <ul class="ai-list">
            ${section.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        `;
      });
    }

    if (response.recommendation) {
      html += `<div class="ai-recommendation">${response.recommendation}</div>`;
    }

    html += `</div>`;
    return html;
  }

  // Simple markdown-to-HTML renderer for API responses
  renderMarkdown(text) {
    if (!text) return '';
    return text
      // Code blocks (```...```)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Bullet lists (lines starting with - or *)
      .replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      // Numbered lists
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      // Headers
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Line breaks (double newline → paragraph break)
      .replace(/\n\n/g, '</p><p>')
      // Single newlines → <br>
      .replace(/\n/g, '<br>');
  }

  // Show typing indicator
  showTypingIndicator() {
    const messagesContainer = this.getMessagesContainer();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  // Hide typing indicator
  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Get or create messages container
  getMessagesContainer() {
    let container = document.getElementById('chat-messages');
    if (!container) {
      container = document.createElement('div');
      container.id = 'chat-messages';
      container.className = 'chat-messages';
      
      const chatArea = document.getElementById('chat-area');
      if (chatArea) {
        chatArea.appendChild(container);
      }
    }
    return container;
  }

  // Hide empty state
  hideEmptyState() {
    const emptyState = document.getElementById('assistant-empty');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  // Scroll to bottom of chat
  scrollToBottom() {
    const chatArea = document.getElementById('chat-area');
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }

  // Set context for investigation page
  setInvestigationContext(callId) {
    this.currentContext = { page: 'investigation', callId };
    this.updateSuggestions(this.getContextualSuggestions());
  }

  // Set context for dashboard
  setDashboardContext() {
    this.currentContext = { page: 'home' };
    this.updateSuggestions(this.getContextualSuggestions());
  }

  // Set context for queue page
  setQueueContext() {
    this.currentContext = { page: 'risk-queue' };
    this.updateSuggestions(this.getContextualSuggestions());
  }

  // Clear conversation
  clearConversation() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    const emptyState = document.getElementById('assistant-empty');
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    
    this.messageHistory = [];
  }

  // Get conversation summary (for context persistence)
  getConversationSummary() {
    return {
      context: this.currentContext,
      messageCount: this.messageHistory.length,
      lastMessage: this.messageHistory[this.messageHistory.length - 1]
    };
  }
}

// Export for use in main.js
export default VoiceOpsAssistant;
