/**
 * Nandha Kumar's Personal Portfolio AI Assistant - Next-Gen Client Controller
 */

(function () {
  'use strict';

  // --- Configuration & Endpoints ---
  const CONFIG = {
    storageKey: 'nandha_portfolio_chat_session_v2',
    phpEndpoint: 'api/chat.php',
    netlifyEndpoint: '/.netlify/functions/chat',
    promptCards: [
      {
        icon: '💼',
        title: 'Current Role',
        desc: 'Working at Evolv Clothing',
        prompt: 'Where is Nandha working now?'
      },
      {
        icon: '⚡',
        title: 'Tech Stack',
        desc: 'React, React Native, PHP & MySQL',
        prompt: 'What technologies does he specialize in?'
      },
      {
        icon: '🚀',
        title: 'Featured Projects',
        desc: 'NammaQR, SquareNow & apps',
        prompt: 'What projects has he worked on?'
      },
      {
        icon: '🤝',
        title: 'Hire / Freelance',
        desc: 'BuildNexDev client services',
        prompt: 'Is he available for freelance work?'
      }
    ]
  };

  let activeApiEndpoint = CONFIG.phpEndpoint;
  let chatHistory = [];
  let isSending = false;

  // --- DOM Elements ---
  const launcherBtn = document.getElementById('ai-chat-launcher');
  const chatWindow = document.getElementById('ai-chat-window');
  const closeBtn = document.getElementById('ai-chat-close');
  const clearBtn = document.getElementById('ai-chat-clear');
  const messagesContainer = document.getElementById('ai-chat-messages');
  const chatForm = document.getElementById('ai-chat-form');
  const chatInput = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-chat-send');

  if (!launcherBtn || !chatWindow || !messagesContainer || !chatForm || !chatInput || !sendBtn) {
    console.warn('Portfolio AI Chatbot: Required DOM elements missing.');
    return;
  }

  // --- Markdown Parser ---
  function parseMarkdown(text) {
    if (!text) return '';

    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Links: [label](url)
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (match, label, url) {
      const isInternal = url.startsWith('#');
      const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `<a href="${url}"${target}>${label}</a>`;
    });

    // Bold: **text**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Split into paragraphs / lists
    const lines = escaped.split('\n');
    let html = '';
    let inList = false;
    let inNumberedList = false;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (/^[\*\-]\s+(.+)/.test(trimmed)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const item = trimmed.replace(/^[\*\-]\s+/, '');
        html += `<li>${item}</li>`;
        return;
      } else if (inList) {
        html += '</ul>';
        inList = false;
      }

      if (/^\d+\.\s+(.+)/.test(trimmed)) {
        if (!inNumberedList) {
          html += '<ol>';
          inNumberedList = true;
        }
        const item = trimmed.replace(/^\d+\.\s+/, '');
        html += `<li>${item}</li>`;
        return;
      } else if (inNumberedList) {
        html += '</ol>';
        inNumberedList = false;
      }

      if (trimmed === '') return;

      html += `<p>${trimmed}</p>`;
    });

    if (inList) html += '</ul>';
    if (inNumberedList) html += '</ol>';

    return html;
  }

  // --- Scroll to Bottom ---
  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  // --- Session Storage ---
  function saveHistory() {
    try {
      sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save chat history to sessionStorage', e);
    }
  }

  function loadHistory() {
    try {
      const saved = sessionStorage.getItem(CONFIG.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          chatHistory = parsed;
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to parse chat history from sessionStorage', e);
    }
    return false;
  }

  // --- Render Welcome Hero & Cards ---
  function appendWelcomeHero() {
    const heroEl = document.createElement('div');
    heroEl.className = 'ai-welcome-hero';
    heroEl.id = 'ai-welcome-hero';
    heroEl.innerHTML = `
      <div class="ai-welcome-top">
        <img src="Assets/profile.jpg" alt="Nandha Kumar" class="ai-welcome-avatar">
        <div>
          <div class="ai-welcome-title">Hi, I'm Nandha's AI Assistant</div>
          <div class="ai-welcome-subtitle">Ask me anything about his experience, projects & skills</div>
        </div>
      </div>
      <div class="ai-welcome-body">
        I can answer questions about Nandha's role at <strong>Evolv Clothing</strong>, past work at <strong>Dhanalakshmi Srinivasan Chit Funds</strong> &amp; <strong>Kapiital Kapslock</strong>, <strong>React/React Native</strong> apps, or his freelance brand <strong>BuildNexDev</strong>.
      </div>
      <div class="ai-cards-grid">
        ${CONFIG.promptCards.map((card, idx) => `
          <button type="button" class="ai-prompt-card" data-prompt="${card.prompt}" tabindex="0">
            <span class="ai-card-icon">${card.icon}</span>
            <span class="ai-card-title">${card.title}</span>
            <span class="ai-card-desc">${card.desc}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Attach click listeners to cards
    heroEl.querySelectorAll('.ai-prompt-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) handleSendMessage(prompt);
      });
    });

    messagesContainer.appendChild(heroEl);
    scrollToBottom();
  }

  // --- Render Messages UI ---
  function renderAllMessages() {
    messagesContainer.innerHTML = '';

    if (chatHistory.length === 0) {
      appendWelcomeHero();
      return;
    }

    chatHistory.forEach(msg => {
      if (msg.role === 'user') {
        appendUserMessageUI(msg.content, false);
      } else {
        appendBotMessageUI(msg.content, msg.cta, false);
      }
    });

    scrollToBottom();
  }

  function appendUserMessageUI(text, shouldScroll = true) {
    const rowEl = document.createElement('div');
    rowEl.className = 'ai-row ai-row-user';
    rowEl.innerHTML = `<div class="ai-bubble">${parseMarkdown(text)}</div>`;
    messagesContainer.appendChild(rowEl);
    if (shouldScroll) scrollToBottom();
  }

  function appendBotMessageUI(markdownText, cta = null, shouldScroll = true) {
    const rowEl = document.createElement('div');
    rowEl.className = 'ai-row ai-row-bot';

    let ctaHTML = '';
    if (cta && cta.label && cta.href) {
      const isInternal = cta.href.startsWith('#');
      const iconHTML = cta.icon ? `<i class="${cta.icon}"></i>` : '';
      ctaHTML = `
        <div class="ai-cta-card">
          <span class="ai-cta-label">${cta.type === 'contact' ? 'Discuss your project directly:' : 'Explore related section:'}</span>
          <a href="${cta.href}" class="ai-cta-btn" ${isInternal ? '' : 'target="_blank" rel="noopener noreferrer"'}>
            ${iconHTML} ${cta.label}
          </a>
        </div>
      `;
    }

    rowEl.innerHTML = `
      <div class="ai-bot-icon" aria-hidden="true"><i class="fa-solid fa-sparkles"></i></div>
      <div class="ai-bubble">
        ${parseMarkdown(markdownText)}
        ${ctaHTML}
      </div>
    `;

    // Internal navigation on link click
    rowEl.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', () => {
        const targetId = anchor.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          if (window.innerWidth <= 600) closeChat();
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    messagesContainer.appendChild(rowEl);
    if (shouldScroll) scrollToBottom();
  }

  // --- Typing Wave Indicator ---
  function showTypingIndicator() {
    const typingRow = document.createElement('div');
    typingRow.className = 'ai-row ai-row-bot';
    typingRow.id = 'ai-typing-row';
    typingRow.innerHTML = `
      <div class="ai-bot-icon" aria-hidden="true"><i class="fa-solid fa-sparkles"></i></div>
      <div class="ai-bubble ai-typing-wrap">
        <span class="ai-typing-bar"></span>
        <span class="ai-typing-bar"></span>
        <span class="ai-typing-bar"></span>
      </div>
    `;
    messagesContainer.appendChild(typingRow);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById('ai-typing-row');
    if (indicator) indicator.remove();
  }

  // --- Send Message Flow ---
  async function handleSendMessage(messageText) {
    const text = (messageText || chatInput.value || '').trim();
    if (!text || isSending) return;

    // Reset input
    chatInput.value = '';
    sendBtn.disabled = true;
    chatInput.style.height = 'auto';

    // Append to UI & History
    appendUserMessageUI(text);
    chatHistory.push({ role: 'user', content: text });
    saveHistory();

    // Show Typing
    isSending = true;
    showTypingIndicator();

    try {
      let response = null;
      let data = null;

      try {
        response = await fetch(activeApiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(-6)
          })
        });

        if (response.ok) {
          data = await response.json();
        } else if (activeApiEndpoint === CONFIG.phpEndpoint) {
          activeApiEndpoint = CONFIG.netlifyEndpoint;
          response = await fetch(activeApiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              history: chatHistory.slice(-6)
            })
          });
          if (response.ok) data = await response.json();
        }
      } catch (fetchErr) {
        if (activeApiEndpoint === CONFIG.phpEndpoint) {
          try {
            activeApiEndpoint = CONFIG.netlifyEndpoint;
            response = await fetch(activeApiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: text,
                history: chatHistory.slice(-6)
              })
            });
            if (response.ok) data = await response.json();
          } catch (secondaryErr) {
            console.error('All chat endpoints failed', secondaryErr);
          }
        }
      }

      hideTypingIndicator();

      if (data && (data.response || data.text)) {
        const replyText = data.response || data.text;
        const cta = data.cta || null;

        appendBotMessageUI(replyText, cta);
        chatHistory.push({ role: 'assistant', content: replyText, cta: cta });
        saveHistory();
      } else {
        const errorFallback = "I'm having trouble connecting to the server. Please feel free to reach out to Nandha directly at **nandhakumarsv2002@gmail.com** or through the Contact section below.";
        appendBotMessageUI(errorFallback, {
          type: 'contact',
          label: 'Contact Nandha Directly',
          href: '#contact',
          icon: 'fa-solid fa-envelope'
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      hideTypingIndicator();
      appendBotMessageUI("A network issue occurred. Please check your connection or contact Nandha directly via the Contact section.", {
        type: 'contact',
        label: 'Open Contact Form',
        href: '#contact',
        icon: 'fa-solid fa-paper-plane'
      });
    } finally {
      isSending = false;
      sendBtn.disabled = !chatInput.value.trim();
      chatInput.focus();
    }
  }

  // --- Open / Close / Toggle Chat ---
  function openChat() {
    chatWindow.classList.add('open');
    launcherBtn.classList.add('active');
    launcherBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => {
      chatInput.focus();
      scrollToBottom();
    }, 150);
  }

  function closeChat() {
    chatWindow.classList.remove('open');
    launcherBtn.classList.remove('active');
    launcherBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleChat() {
    if (chatWindow.classList.contains('open')) {
      closeChat();
    } else {
      openChat();
    }
  }

  function clearChat() {
    chatHistory = [];
    try {
      sessionStorage.removeItem(CONFIG.storageKey);
    } catch (e) {}
    renderAllMessages();
    chatInput.value = '';
    sendBtn.disabled = true;
    chatInput.focus();
  }

  // --- Event Listeners ---
  launcherBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', clearChat);

  // Auto-resize input
  chatInput.addEventListener('input', () => {
    sendBtn.disabled = !chatInput.value.trim();
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
  });

  // Enter to send
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        handleSendMessage();
      }
    }
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!sendBtn.disabled) {
      handleSendMessage();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
      closeChat();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!chatWindow.contains(e.target) && !launcherBtn.contains(e.target) && chatWindow.classList.contains('open')) {
      if (!e.target.closest('a[href^="#"]')) {
        closeChat();
      }
    }
  });

  // --- Initialize ---
  loadHistory();
  renderAllMessages();

})();
