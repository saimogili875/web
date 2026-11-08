/**
 * GuhaTech Studio - Main Frontend Interactions
 */

// ========================================================
// 1. MARQUEE CONFIGURATION (EDITABLE FROM ONE CONFIG)
// ========================================================
const MARQUEE_CONFIG = {
  speed: 0.6,        // pixels moved per 1px of page scroll. Higher = faster, 0.2 = slow, 1.2 = fast
  wordGap: 40,       // px of space between one word and the next
  fontSize: 15,      // px
  fontWeight: 700,
  rowBackground: "#FFFFFF",   // the scrolling strip itself is WHITE
  rows: {
    "card-1": { color: "#7928CA", words: [ // Customized Websites and Apps
      "3D / interactive hero (the wow first impression)",
      "WhatsApp button",
      "Chatbot (instant contact)",
      "Online payment / booking CTA",
      "Trust: secure payments, reviews, support",
      "Admin dashboard, billing, analytics" ]},
    "card-2": { color: "#1D4ED8", words: [ // Odoo-style ERP
      "Sales and CRM", "Accounting", "Inventory and Purchase", "POS",
      "Operations", "Delivery and multi-vendor", "Industry ERPs" ]},
    "card-3": { color: "#BE185D", words: [ // AI Marketing and Business Analysis
      "Business analysis", "Content and social", "SEO and local SEO",
      "Lead generation", "Lead follow-up", "AI calling agent", "Reporting" ]},
    "card-4": { color: "#047857", words: [ // Domain AI Agents
      "Exam agents", "Institution agent", "HR agent", "Finance agent",
      "Healthcare agent", "Support agent", "Specialized calling agent" ]}
  }
};

// SVG Icon Mapping for each word (reuses existing SVG sprites)
const WORD_ICONS = {
  "3D / interactive hero (the wow first impression)": "i-layers",
  "WhatsApp button": "i-whatsapp",
  "Chatbot (instant contact)": "i-bot",
  "Online payment / booking CTA": "i-card",
  "Trust: secure payments, reviews, support": "i-wallet",
  "Admin dashboard, billing, analytics": "i-calc",
  "Sales and CRM": "i-users",
  "Accounting": "i-calc",
  "Inventory and Purchase": "i-box",
  "POS": "i-card",
  "Operations": "i-flow",
  "Delivery and multi-vendor": "i-truck",
  "Industry ERPs": "i-factory",
  "Business analysis": "i-chart",
  "Content and social": "i-mega",
  "SEO and local SEO": "i-search",
  "Lead generation": "i-target",
  "Lead follow-up": "i-send",
  "AI calling agent": "i-phone",
  "Reporting": "i-trend",
  "Exam agents": "i-grad",
  "Institution agent": "i-school",
  "HR agent": "i-users",
  "Finance agent": "i-wallet",
  "Healthcare agent": "i-pulse",
  "Support agent": "i-headset",
  "Specialized calling agent": "i-phone"
};

document.addEventListener('DOMContentLoaded', function () {
  // ========================================================
  // 1. Mobile Hamburger Menu Drawer
  // ========================================================
  var hamburger = document.querySelector('.hamburger-toggle');
  var drawer = document.getElementById('mobile-drawer');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isOpen);
      drawer.classList.toggle('open', !isOpen);
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });

    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ========================================================
  // 2. Hero Phone Slideshow
  // ========================================================
  var slides = Array.from(document.querySelectorAll('.phone .slide'));
  var slideIndex = 0;
  var nextBtn = document.querySelector('.arrow.next');
  var prevBtn = document.querySelector('.arrow.prev');

  function showSlide(n) {
    if (!slides.length) return;
    slides[slideIndex].classList.remove('on');
    slideIndex = (n + slides.length) % slides.length;
    slides[slideIndex].classList.add('on');
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      showSlide(slideIndex + 1);
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      showSlide(slideIndex - 1);
    });
  }
  if (slides.length > 1) {
    setInterval(function () {
      showSlide(slideIndex + 1);
    }, 4500);
  }

  // ========================================================
  // 3. Build Scrolling Rows from MARQUEE_CONFIG
  // ========================================================
  var marqueeRows = [];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildMarqueeRows() {
    var cardIds = ['card-1', 'card-2', 'card-3', 'card-4'];
    cardIds.forEach(function (cardId, index) {
      var rowData = MARQUEE_CONFIG.rows[cardId];
      if (!rowData) return;

      var card = document.getElementById(cardId);
      if (!card) return;

      var track = card.querySelector('.popular-chips-track');
      if (!track) return;

      var wrap = card.querySelector('.popular-builds-wrap');
      if (wrap) {
        wrap.style.backgroundColor = MARQUEE_CONFIG.rowBackground;
      }

      track.innerHTML = '';

      var inner = document.createElement('div');
      inner.className = 'marquee-inner';

      // Helper to create a group of words
      function createGroup(isAriaHidden) {
        var group = document.createElement('div');
        group.className = 'marquee-group';
        group.style.gap = MARQUEE_CONFIG.wordGap + 'px';
        group.style.paddingRight = MARQUEE_CONFIG.wordGap + 'px';
        if (isAriaHidden) {
          group.setAttribute('aria-hidden', 'true');
        }

        rowData.words.forEach(function (word) {
          var wordEl = document.createElement('span');
          wordEl.className = 'marquee-word';
          wordEl.style.color = rowData.color;
          wordEl.style.fontSize = MARQUEE_CONFIG.fontSize + 'px';
          wordEl.style.fontWeight = MARQUEE_CONFIG.fontWeight;
          wordEl.style.textTransform = 'uppercase';

          var iconId = WORD_ICONS[word] || 'i-globe';
          wordEl.innerHTML =
            '<svg class="marquee-word-icon" aria-hidden="true" style="color:' +
            rowData.color +
            '; width: 16px; height: 16px;"><use href="#' +
            iconId +
            '"></use></svg><span>' +
            word.toUpperCase() +
            '</span>';

          group.appendChild(wordEl);
        });
        return group;
      }

      // Append 4 identical groups for a seamless infinite loop
      var firstGroup = createGroup(false);
      inner.appendChild(firstGroup);
      for (var g = 0; g < 3; g++) {
        inner.appendChild(createGroup(true));
      }

      track.appendChild(inner);

      var isPaused = false;
      var lastOffset = 0;

      track.addEventListener('mouseenter', function () { isPaused = true; });
      track.addEventListener('mouseleave', function () { isPaused = false; });
      track.addEventListener('touchstart', function () { isPaused = true; }, { passive: true });
      track.addEventListener('touchend', function () { isPaused = false; }, { passive: true });

      marqueeRows.push({
        cardId: cardId,
        index: index, // 0=odd(Card 1), 1=even(Card 2), 2=odd(Card 3), 3=even(Card 4)
        track: track,
        inner: inner,
        firstGroup: firstGroup,
        isPaused: function () { return isPaused; },
        getLastOffset: function () { return lastOffset; },
        setLastOffset: function (x) { lastOffset = x; }
      });
    });
  }

  buildMarqueeRows();

  // ========================================================
  // 4. Scroll Handler: Move Rows, Change BG & Card 2 Exit
  // ========================================================
  var faqSection = document.getElementById('faqs') || document.querySelector('.faq-section');
  var card1 = document.getElementById('card-1');
  var card2 = document.getElementById('card-2');
  var card3 = document.getElementById('card-3');
  var card4 = document.getElementById('card-4');

  var currentBg = '';
  var ticking = false;

  function onScrollFrame() {
    ticking = false;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var vh = window.innerHeight;

    // 1. SCROLLING ROWS MOVE WITH PAGE SCROLL
    if (!reduceMotion && marqueeRows.length) {
      marqueeRows.forEach(function (row) {
        if (row.isPaused()) return;

        var groupWidth = row.firstGroup.offsetWidth || 1;
        var move = scrollY * MARQUEE_CONFIG.speed;
        var offset = 0;

        if (row.index % 2 === 0) {
          // Odd cards (Card 1, Card 3): move LEFT
          offset = -(move % groupWidth);
        } else {
          // Even cards (Card 2, Card 4): move RIGHT
          offset = (move % groupWidth) - groupWidth;
        }

        row.setLastOffset(offset);
        row.inner.style.transform = 'translate3d(' + offset.toFixed(2) + 'px, 0, 0)';
      });
    }

    // 2. PAGE BACKGROUND: WHITE BAND FROM AI SHOWCASE TO RESULTS, DARK FOR HERO & FAQS/FOOTER
    var whiteBand = document.querySelector('.white-band-section');
    if (whiteBand) {
      var targetBg = '#000000';
      var wbRect = whiteBand.getBoundingClientRect();
      if (wbRect.top < vh * 0.7 && wbRect.bottom > vh * 0.3) {
        targetBg = '#FFFFFF'; // White band from AI solutions through Engineered for Growth
      } else {
        targetBg = '#000000'; // Pure black canvas for hero, FAQs, footer
      }

      if (currentBg !== targetBg) {
        currentBg = targetBg;
        document.body.style.backgroundColor = targetBg;
      }
    }

    // 3. CARD 2 (ODOO-STYLE ERP) EXIT ON SCROLL PAST
    // After scrolling past Card 2, it must disappear completely (fade opacity to 0, scale 0.92, visibility hidden)
    // and return when scrolling back up.
    if (card2 && card3) {
      var card3Top = card3.getBoundingClientRect().top;
      var fadeStart = 450;
      var fadeEnd = 160;

      if (card3Top >= fadeStart) {
        // Card 3 is still below: Card 2 is fully visible
        card2.style.opacity = '1';
        card2.style.transform = 'scale(1)';
        card2.style.visibility = 'visible';
        card2.style.pointerEvents = 'auto';
      } else if (card3Top <= fadeEnd) {
        // Scrolled past Card 2: completely disappeared
        card2.style.opacity = '0';
        card2.style.transform = 'scale(0.92)';
        card2.style.visibility = 'hidden';
        card2.style.pointerEvents = 'none';
      } else {
        // Transition window
        var p = (fadeStart - card3Top) / (fadeStart - fadeEnd);
        p = Math.max(0, Math.min(1, p));
        card2.style.opacity = (1 - p).toFixed(3);
        card2.style.transform = 'scale(' + (1 - p * 0.08).toFixed(4) + ')';
        card2.style.visibility = 'visible';
        card2.style.pointerEvents = (p > 0.8) ? 'none' : 'auto';
      }
    }
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  requestTick();

  // ========================================================
  // 5. Contact Form AJAX Submission
  // ========================================================
  var contactForm = document.getElementById('contact-form');
  var formFeedback = document.getElementById('form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      var formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (resObj) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;

          if (resObj.ok && resObj.data.status === 'success') {
            formFeedback.className = 'form-feedback success';
            formFeedback.innerHTML =
              resObj.data.message +
              (resObj.data.whatsapp_url
                ? '<br><a href="' +
                  resObj.data.whatsapp_url +
                  '" target="_blank" rel="noopener noreferrer" style="color: #fff; text-decoration: underline; font-weight: 800; display: inline-block; margin-top: 8px;">👉 Tap here to open WhatsApp with your pre-filled quote</a>'
                : '');
            contactForm.reset();
          } else {
            formFeedback.className = 'form-feedback error';
            formFeedback.textContent =
              resObj.data.message || 'Something went wrong. Please call or WhatsApp us directly.';
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          formFeedback.className = 'form-feedback error';
          formFeedback.textContent =
            'Network issue. Please contact us directly via phone or WhatsApp.';
        });
    });
  }

  // ========================================================
  // 6. AI Solutions Showcase & Sarvam.ai-Style Voice Agent
  // ========================================================
  var aiCardsSection = document.getElementById('ai-solutions');
  if (aiCardsSection) {
    var voiceStartBtn = document.getElementById('voice-agent-start-btn');
    var voicePanel = document.getElementById('ai-demo-voice');
    var voiceResetBtn = document.getElementById('voice-demo-reset');
    var voiceStatusDot = document.getElementById('voice-status-dot');
    var voiceStatusText = document.getElementById('voice-status-text');
    var voiceStateIndicator = document.getElementById('voice-state-indicator');
    var voiceTranscriptBox = document.getElementById('voice-transcript-box');
    var voiceWave = document.getElementById('voice-wave');
    var voiceMicToggle = document.getElementById('voice-mic-toggle');
    var voiceMicToggleLabel = document.getElementById('voice-mic-toggle-label');
    var voicePortalLink = document.getElementById('voice-portal-link');
    var voiceCopyPortalBtn = document.getElementById('voice-copy-portal');
    var voiceOrbWrap = document.getElementById('voice-agent-orb-wrap');
    var voiceBtnLabel = document.getElementById('voice-btn-label');

    // Voice State variables
    var isActiveCall = false;
    var isListening = false;
    var isThinking = false;
    var isSpeaking = false;
    var recognition = null;
    var synth = window.speechSynthesis || null;
    var conversationHistory = [];
    var currentOrderDraft = {};

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

    // Helper: Best Natural Speech Voice (English / Indian English / Hindi accent)
    function getBestVoice() {
      if (!synth || !synth.getVoices) return null;
      var voices = synth.getVoices();
      if (!voices || voices.length === 0) return null;
      var v = voices.find(function(item) { return item.lang === 'en-IN' || item.lang.startsWith('en-IN'); })
           || voices.find(function(item) { return item.lang === 'hi-IN'; })
           || voices.find(function(item) { return item.lang.startsWith('en') && (item.name.includes('Natural') || item.name.includes('Google') || item.name.includes('Samantha') || item.name.includes('Karen') || item.name.includes('Victoria')); })
           || voices.find(function(item) { return item.lang.startsWith('en'); })
           || voices[0];
      return v;
    }

    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = getBestVoice;
    }

    function setVoiceState(state) {
      if (!voiceStatusText || !voiceStateIndicator) return;

      if (voiceOrbWrap) {
        voiceOrbWrap.classList.remove('is-speaking', 'is-listening', 'is-thinking');
      }

      if (state === 'speaking') {
        isSpeaking = true;
        isListening = false;
        isThinking = false;
        voiceStatusText.textContent = "Speaking • Agent Aria";
        voiceStateIndicator.textContent = "Speaking";
        voiceStateIndicator.className = "voice-state-pill state-speaking";
        if (voiceStatusDot) voiceStatusDot.className = "ai-demo-dot dot-speaking";
        if (voiceWave) voiceWave.classList.add('is-active');
        if (voiceOrbWrap) voiceOrbWrap.classList.add('is-speaking');
        if (voiceMicToggleLabel) voiceMicToggleLabel.textContent = "Tap to Interrupt";
      } else if (state === 'listening') {
        isSpeaking = false;
        isListening = true;
        isThinking = false;
        voiceStatusText.textContent = "Listening... (Speak now)";
        voiceStateIndicator.textContent = "Listening";
        voiceStateIndicator.className = "voice-state-pill state-listening";
        if (voiceStatusDot) voiceStatusDot.className = "ai-demo-dot dot-listening";
        if (voiceWave) voiceWave.classList.remove('is-active');
        if (voiceOrbWrap) voiceOrbWrap.classList.add('is-listening');
        if (voiceMicToggleLabel) voiceMicToggleLabel.textContent = "Listening...";
      } else if (state === 'thinking') {
        isSpeaking = false;
        isListening = false;
        isThinking = true;
        voiceStatusText.textContent = "Thinking...";
        voiceStateIndicator.textContent = "Thinking";
        voiceStateIndicator.className = "voice-state-pill state-thinking";
        if (voiceStatusDot) voiceStatusDot.className = "ai-demo-dot dot-thinking";
        if (voiceWave) voiceWave.classList.remove('is-active');
        if (voiceOrbWrap) voiceOrbWrap.classList.add('is-thinking');
        if (voiceMicToggleLabel) voiceMicToggleLabel.textContent = "Processing...";
      } else {
        isSpeaking = false;
        isListening = false;
        isThinking = false;
        voiceStatusText.textContent = "Ready • Tap Start Speaking";
        voiceStateIndicator.textContent = "Idle";
        voiceStateIndicator.className = "voice-state-pill state-idle";
        if (voiceStatusDot) voiceStatusDot.className = "ai-demo-dot";
        if (voiceWave) voiceWave.classList.remove('is-active');
        if (voiceMicToggleLabel) voiceMicToggleLabel.textContent = "Tap to Speak";
      }
    }

    function appendBubble(role, text) {
      if (!voiceTranscriptBox) return;
      var bubble = document.createElement('div');
      bubble.className = 'ai-bubble ' + (role === 'user' ? 'user' : 'agent');

      var speaker = document.createElement('span');
      speaker.className = 'ai-speaker';
      speaker.textContent = role === 'user' ? 'You (Customer)' : 'AI Agent (Aria)';

      var msg = document.createElement('p');
      msg.textContent = text;

      bubble.appendChild(speaker);
      bubble.appendChild(msg);
      voiceTranscriptBox.appendChild(bubble);
      voiceTranscriptBox.scrollTop = voiceTranscriptBox.scrollHeight;
    }

    function speakText(text, callback) {
      if (!synth) {
        setVoiceState('listening');
        if (callback) callback();
        return;
      }

      synth.cancel();

      var utterance = new SpeechSynthesisUtterance(text);
      var selectedVoice = getBestVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = function() {
        setVoiceState('speaking');
      };

      utterance.onend = function() {
        if (isActiveCall) {
          setVoiceState('listening');
          if (callback) callback();
        } else {
          setVoiceState('idle');
        }
      };

      utterance.onerror = function() {
        if (isActiveCall) {
          setVoiceState('listening');
          if (callback) callback();
        } else {
          setVoiceState('idle');
        }
      };

      synth.speak(utterance);
    }

    function initRecognition() {
      if (!SpeechRecognition) return null;
      var rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = function() {
        setVoiceState('listening');
      };

      rec.onresult = function(event) {
        if (!event.results || !event.results[0]) return;
        var spokenText = event.results[0][0].transcript.trim();
        if (spokenText) {
          handleUserUtterance(spokenText);
        }
      };

      rec.onerror = function() {
        if (isActiveCall && !isSpeaking && !isThinking) {
          setVoiceState('listening');
        }
      };

      rec.onend = function() {
        if (isActiveCall && !isSpeaking && !isThinking) {
          setTimeout(function() {
            if (isActiveCall && !isSpeaking && !isThinking) {
              startListening();
            }
          }, 400);
        }
      };

      return rec;
    }

    function startListening() {
      if (!isActiveCall || isSpeaking || isThinking) return;

      if (!recognition) {
        recognition = initRecognition();
      }

      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          // Already running
        }
      } else {
        setVoiceState('listening');
      }
    }

    function stopListening() {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    }

    function interruptAgent() {
      if (synth && synth.speaking) {
        synth.cancel();
      }
      setVoiceState('listening');
      startListening();
    }

    function updatePortalUrl(url) {
      if (!voicePortalLink) return;
      var fullUrl = url;
      if (url.startsWith('/')) {
        fullUrl = window.location.origin + url;
      }
      voicePortalLink.href = url;
      var displayUrl = fullUrl.replace(/^https?:\/\//, '');
      voicePortalLink.textContent = displayUrl;
    }

    function handleUserUtterance(userText) {
      stopListening();
      appendBubble('user', userText);
      conversationHistory.push({ role: 'user', content: userText });
      setVoiceState('thinking');

      fetch('/api/voice-agent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          message: userText,
          history: conversationHistory,
          order_draft: currentOrderDraft
        })
      })
      .then(function(res) {
        if (!res.ok) {
          throw new Error('Server returned status ' + res.status);
        }
        return res.json();
      })
      .then(function(data) {
        if (data.order_draft) {
          currentOrderDraft = data.order_draft;
        }

        if (data.portal_url) {
          updatePortalUrl(data.portal_url);
        }

        var botReply = data.reply || "Got it! Which color would you like: Midnight, Starlight, Space Gray, or Silver?";
        appendBubble('agent', botReply);
        conversationHistory.push({ role: 'assistant', content: botReply });

        speakText(botReply, function() {
          startListening();
        });
      })
      .catch(function() {
        var fallbackMsg = "Got that! Would you prefer Midnight, Starlight, Space Gray, or Silver?";
        appendBubble('agent', fallbackMsg);
        conversationHistory.push({ role: 'assistant', content: fallbackMsg });
        speakText(fallbackMsg, function() {
          startListening();
        });
      });
    }

    // Attach quick reply chips for fallback text testing
    function addQuickReplyChips() {
      var existingChips = voicePanel.querySelector('.voice-quick-chips');
      if (existingChips) return;

      var chipsWrap = document.createElement('div');
      chipsWrap.className = 'voice-quick-chips';

      var chips = [
        '13-inch M3',
        '15-inch M3',
        'Midnight',
        '512GB SSD',
        'Rahul Sharma',
        '9876543210',
        'Banjara Hills, Hyderabad'
      ];

      chips.forEach(function(chipText) {
        var chipBtn = document.createElement('button');
        chipBtn.type = 'button';
        chipBtn.className = 'voice-chip-btn';
        chipBtn.textContent = chipText;
        chipBtn.addEventListener('click', function() {
          if (!isActiveCall) {
            startVoiceCall();
            setTimeout(function() {
              handleUserUtterance(chipText);
            }, 600);
          } else {
            interruptAgent();
            handleUserUtterance(chipText);
          }
        });
        chipsWrap.appendChild(chipBtn);
      });

      if (voiceTranscriptBox) {
        voiceTranscriptBox.after(chipsWrap);
      }
    }

    function startVoiceCall() {
      isActiveCall = true;
      if (voiceStartBtn) {
        voiceStartBtn.setAttribute('aria-expanded', 'true');
        voiceStartBtn.classList.add('is-active');
      }
      if (voiceBtnLabel) {
        voiceBtnLabel.textContent = "Call in Progress...";
      }
      if (voicePanel) {
        voicePanel.hidden = false;
        voicePanel.removeAttribute('hidden');
      }

      var initialGreeting = "Hello! I am GuhaTech's customer voice agent. Which MacBook Air would you like to order: 13-inch M2, 13-inch M3, or 15-inch M3?";

      if (voiceTranscriptBox) {
        voiceTranscriptBox.innerHTML = '';
      }
      appendBubble('agent', initialGreeting);
      conversationHistory = [{ role: 'assistant', content: initialGreeting }];
      currentOrderDraft = {};

      addQuickReplyChips();

      speakText(initialGreeting, function() {
        startListening();
      });
    }

    function endVoiceCall() {
      isActiveCall = false;
      if (synth) synth.cancel();
      stopListening();
      setVoiceState('idle');

      if (voiceStartBtn) {
        voiceStartBtn.setAttribute('aria-expanded', 'false');
        voiceStartBtn.classList.remove('is-active');
      }
      if (voiceBtnLabel) {
        voiceBtnLabel.textContent = "Start Speaking";
      }
      if (voicePanel) {
        voicePanel.hidden = true;
        voicePanel.setAttribute('hidden', '');
      }
    }

    if (voiceStartBtn) {
      voiceStartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (isActiveCall) {
          endVoiceCall();
        } else {
          startVoiceCall();
        }
      });
    }

    if (voiceResetBtn) {
      voiceResetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        endVoiceCall();
      });
    }

    if (voiceMicToggle) {
      voiceMicToggle.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isActiveCall) {
          startVoiceCall();
          return;
        }
        if (isSpeaking) {
          interruptAgent();
        } else if (isListening) {
          stopListening();
          setVoiceState('idle');
        } else {
          setVoiceState('listening');
          startListening();
        }
      });
    }

    if (voiceCopyPortalBtn && voicePortalLink) {
      voiceCopyPortalBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var copyTarget = voicePortalLink.href || voicePortalLink.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyTarget).then(function() {
            var copyTextSpan = voiceCopyPortalBtn.querySelector('.copy-text');
            if (copyTextSpan) {
              var original = copyTextSpan.textContent;
              copyTextSpan.textContent = "Copied!";
              setTimeout(function() { copyTextSpan.textContent = original; }, 2000);
            }
          });
        }
      });
    }
  }
});
