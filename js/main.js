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
  // 6. AI Solutions Demo Cards (Experience GuhaTech AI)
  // ========================================================
  var aiCardsSection = document.getElementById('ai-solutions');
  if (aiCardsSection) {
    var pillButtons = aiCardsSection.querySelectorAll('.ai-glass-pill-btn');

    pillButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panelId = btn.getAttribute('aria-controls');
        var panel = document.getElementById(panelId);
        if (!panel) return;

        var isExpanded = btn.getAttribute('aria-expanded') === 'true';

        // Close other open demo panels in the section
        pillButtons.forEach(function (otherBtn) {
          if (otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherBtn.classList.remove('is-active');
            var otherPanelId = otherBtn.getAttribute('aria-controls');
            var otherPanel = document.getElementById(otherPanelId);
            if (otherPanel) {
              otherPanel.hidden = true;
              otherPanel.setAttribute('hidden', '');
            }
          }
        });

        // Toggle this panel
        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          btn.classList.remove('is-active');
          panel.hidden = true;
          panel.setAttribute('hidden', '');
        } else {
          btn.setAttribute('aria-expanded', 'true');
          btn.classList.add('is-active');
          panel.hidden = false;
          panel.removeAttribute('hidden');
        }
      });
    });

    var resetButtons = aiCardsSection.querySelectorAll('.ai-demo-reset-btn');
    resetButtons.forEach(function (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var card = resetBtn.closest('.ai-showcase-col') || resetBtn.closest('.ai-orb-card');
        if (!card) return;
        var btn = card.querySelector('.ai-glass-pill-btn');
        var panel = card.querySelector('.ai-demo-panel');
        if (panel) {
          panel.hidden = true;
          panel.setAttribute('hidden', '');
        }
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.classList.remove('is-active');
          btn.focus();
        }
      });
    });
  }
});
