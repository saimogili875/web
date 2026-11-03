/**
 * Arkshar Studio - AI Assistant Chatbot Widget
 */
(function () {
  var chatBubble = document.getElementById('chatbot-bubble');
  var chatWindow = document.getElementById('chatbot-window');
  var chatCloseBtn = document.getElementById('chat-close-btn');
  var chatForm = document.getElementById('chat-form');
  var chatInput = document.getElementById('chat-input');
  var chatMessages = document.getElementById('chat-messages');
  var unreadDot = document.querySelector('.chat-unread-dot');

  if (!chatBubble || !chatWindow) return;

  var chatHistory = [];

  function toggleChat() {
    var isOpen = chatWindow.classList.contains('open');
    if (!isOpen) {
      chatWindow.classList.add('open');
      if (unreadDot) unreadDot.style.display = 'none';
      if (chatInput) chatInput.focus();
    } else {
      chatWindow.classList.remove('open');
    }
  }

  chatBubble.addEventListener('click', toggleChat);
  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', toggleChat);
  }

  // Close on Escape key
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
      toggleChat();
    }
  });

  function appendMessage(sender, text, whatsappUrl) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'msg ' + (sender === 'user' ? 'msg-user' : 'msg-bot');

    var p = document.createElement('p');
    p.textContent = text;
    msgDiv.appendChild(p);

    if (whatsappUrl) {
      var waBtn = document.createElement('a');
      waBtn.href = whatsappUrl;
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.className = 'chat-wa-handoff';
      waBtn.innerHTML = '<span>💬 Continue on WhatsApp</span>';
      msgDiv.appendChild(waBtn);
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatHistory.push({ sender: sender, text: text });
  }

  function sendChatMessage(text) {
    if (!text || !text.trim()) return;
    var trimmed = text.trim();

    appendMessage('user', trimmed);
    if (chatInput) chatInput.value = '';

    // Show typing state
    var typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-bot typing-indicator';
    typingDiv.innerHTML = '<em>Arkshar AI is typing...</em>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    fetch('/api/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: trimmed,
        history: chatHistory
      })
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (typingDiv.parentNode) {
          typingDiv.parentNode.removeChild(typingDiv);
        }
        if (data && data.reply) {
          appendMessage('bot', data.reply, data.whatsapp_url);
        } else {
          appendMessage(
            'bot',
            'I am here to help you choose the best websites, ERP, or AI agent solutions. Would you like to connect directly on WhatsApp?',
            data.whatsapp_url
          );
        }
      })
      .catch(function () {
        if (typingDiv.parentNode) {
          typingDiv.parentNode.removeChild(typingDiv);
        }
        appendMessage(
          'bot',
          'We build ready-made websites, ERP systems and AI tools. Tap below to chat directly with our team on WhatsApp.'
        );
      });
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sendChatMessage(chatInput.value);
    });
  }

  // Quick Chips
  document.querySelectorAll('.chip-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var query = btn.getAttribute('data-query');
      if (query) {
        sendChatMessage(query);
      }
    });
  });
})();

