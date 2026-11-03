/**
 * Arkshar Studio - Main Frontend Interactions
 */
document.addEventListener('DOMContentLoaded', function () {
  // 1. Mobile Hamburger Menu Drawer
  var hamburger = document.querySelector('.hamburger-toggle');
  var drawer = document.getElementById('mobile-drawer');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isOpen);
      drawer.classList.toggle('open', !isOpen);
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });

    // Close drawer when clicking a navigation link
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // 2. Hero Phone Slideshow
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

  // 3. Sticky Card-Stack Effect, Complete Disappear & Dynamic Background Colors
  (function initCardStack() {
    var cards = Array.from(document.querySelectorAll('.stack-card'));
    if (!cards.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var backdropLayers = [
      document.querySelector('.backdrop-layer.bg-cat-1'),
      document.querySelector('.backdrop-layer.bg-cat-2'),
      document.querySelector('.backdrop-layer.bg-cat-3'),
      document.querySelector('.backdrop-layer.bg-cat-4')
    ];

    function setBackdrop(activeIdx) {
      backdropLayers.forEach(function (layer, idx) {
        if (!layer) return;
        if (idx === activeIdx) {
          layer.classList.add('active');
        } else {
          layer.classList.remove('active');
        }
      });
    }

    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;

      // 1. DYNAMIC BACKGROUND COLOR SWITCHING
      // "before coming of 2. ODOO-STYLE ERP there should be colour with coming and entrance"
      var card1 = cards[0];
      var card2 = cards[1];
      var card3 = cards[2];
      var card4 = cards[3];

      if (card4 && card4.getBoundingClientRect().top < vh * 0.75) {
        setBackdrop(3); // Category 4: Emerald
      } else if (card3 && card3.getBoundingClientRect().top < vh * 0.75) {
        setBackdrop(2); // Category 3: Magenta
      } else if (card2 && card2.getBoundingClientRect().top < vh * 0.75) {
        setBackdrop(1); // Category 2: Sapphire Blue (switches before Card 2 reaches sticky position)
      } else {
        setBackdrop(0); // Category 1: Purple
      }

      if (reduce || window.innerWidth <= 480) {
        return;
      }

      // 2. COMPLETE DISAPPEARANCE OF PREVIOUS CARDS
      // "and that 2. ODOO-STYLE ERP should maintain some distance and completely should be disappear man"
      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next) {
          card.style.opacity = '1';
          card.style.transform = '';
          card.style.visibility = 'visible';
          card.style.pointerEvents = 'auto';
          return;
        }

        var stickyTop = parseFloat(getComputedStyle(card).top) || 86;
        var nextTop = next.getBoundingClientRect().top;

        // Transition window: as next card moves from (stickyTop + 360px) up to (stickyTop + 20px)
        var fadeStart = stickyTop + 360;
        var fadeEnd = stickyTop + 20;

        if (nextTop >= fadeStart) {
          // Next card is far below: current card is 100% visible
          card.style.opacity = '1';
          card.style.transform = 'scale(1) translateY(0)';
          card.style.visibility = 'visible';
          card.style.pointerEvents = 'auto';
        } else if (nextTop <= fadeEnd) {
          // Next card has docked: current card COMPLETELY DISAPPEARS
          card.style.opacity = '0';
          card.style.transform = 'scale(0.92) translateY(-24px)';
          card.style.visibility = 'hidden';
          card.style.pointerEvents = 'none';
        } else {
          // In transition: smooth fade and subtle lift
          var p = (fadeStart - nextTop) / (fadeStart - fadeEnd);
          p = Math.max(0, Math.min(1, p));
          card.style.opacity = (1 - p).toFixed(3);
          card.style.transform = 'scale(' + (1 - p * 0.08).toFixed(4) + ') translateY(' + (-p * 24).toFixed(1) + 'px)';
          card.style.visibility = 'visible';
          card.style.pointerEvents = (p > 0.8) ? 'none' : 'auto';
        }
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  // 4. Contact Form AJAX Submission with Instant Feedback
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

  // 5. Popular Builds Infinite Marquee (Continuous Loop, Hover/Touch Pause & Sub-Card Filtering)
  (function initPopularBuilds() {
    var cards = document.querySelectorAll('.stack-card');
    if (!cards.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Convert each popular-chips-track into a seamless continuous marquee
    var tracks = document.querySelectorAll('.popular-chips-track');
    tracks.forEach(function (track) {
      var chips = Array.from(track.querySelectorAll('.popular-chip'));
      if (!chips.length) return;

      var inner = document.createElement('div');
      inner.className = 'popular-marquee-inner';

      var group1 = document.createElement('div');
      group1.className = 'popular-marquee-group';
      chips.forEach(function (chip) {
        chip.classList.add('revealed');
        group1.appendChild(chip);
      });

      var group2 = group1.cloneNode(true);
      group2.setAttribute('aria-hidden', 'true');

      inner.appendChild(group1);
      inner.appendChild(group2);
      track.innerHTML = '';
      track.appendChild(inner);

      // Pause on hover
      track.addEventListener('mouseenter', function () {
        track.classList.add('is-paused');
      });
      track.addEventListener('mouseleave', function () {
        if (!track.dataset.filterActive) {
          track.classList.remove('is-paused');
        }
      });

      // Pause on touch
      track.addEventListener('touchstart', function () {
        track.classList.add('is-paused');
      }, { passive: true });
      track.addEventListener('touchend', function () {
        setTimeout(function () {
          if (!track.dataset.filterActive) {
            track.classList.remove('is-paused');
          }
        }, 1200);
      }, { passive: true });
    });

    // Sub-Card Tap Interaction: Highlights matching chips across both marquee groups
    cards.forEach(function (card) {
      var subCards = card.querySelectorAll('.subcard-toggle');
      var track = card.querySelector('.popular-chips-track');

      subCards.forEach(function (subCard) {
        subCard.addEventListener('click', function (e) {
          e.preventDefault();
          var subCode = subCard.getAttribute('data-sub');
          var wasActive = subCard.classList.contains('active');

          subCards.forEach(function (sc) { sc.classList.remove('active'); });
          var allChips = card.querySelectorAll('.popular-chip');

          if (wasActive) {
            allChips.forEach(function (ch) {
              ch.classList.remove('highlighted', 'dimmed');
            });
            if (track) {
              delete track.dataset.filterActive;
              track.classList.remove('is-paused');
            }
          } else {
            subCard.classList.add('active');
            if (track) {
              track.dataset.filterActive = 'true';
              track.classList.add('is-paused'); // pause marquee while inspecting filtered sub-card
            }

            allChips.forEach(function (ch) {
              if (ch.getAttribute('data-sub') === subCode) {
                ch.classList.add('highlighted');
                ch.classList.remove('dimmed');
              } else {
                ch.classList.remove('highlighted');
                ch.classList.add('dimmed');
              }
            });
          }
        });
      });
    });
  })();
});

