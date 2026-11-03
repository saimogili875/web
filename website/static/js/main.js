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

  // 3. Sticky Card-Stack Effect
  (function initCardStack() {
    var cards = Array.from(document.querySelectorAll('.stack-card'));
    if (!cards.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isVerySmallScreen = window.innerWidth <= 480;
    var ticking = false;

    function measure() {
      // Turn off card stack sticky effect on very small screens to prevent lag
      if (window.innerWidth <= 480) {
        cards.forEach(function (c) {
          c.classList.add('no-stick');
          c.style.transform = '';
          c.style.setProperty('--dim', '0');
        });
        return;
      }

      cards.forEach(function (c) {
        c.classList.remove('no-stick');
        var top = parseFloat(getComputedStyle(c).top) || 0;
        // If card height is taller than viewport room, disable sticky
        if (c.offsetHeight > window.innerHeight - top - 20) {
          c.classList.add('no-stick');
        }
      });
      update();
    }

    function update() {
      ticking = false;
      if (reduce || window.innerWidth <= 480) return;

      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next || card.classList.contains('no-stick')) {
          card.style.transform = '';
          card.style.setProperty('--dim', '0');
          return;
        }

        var stickyTop = parseFloat(getComputedStyle(card).top) || 0;
        var nextTop = next.getBoundingClientRect().top;
        var p = 1 - (nextTop - stickyTop) / card.offsetHeight;
        p = Math.max(0, Math.min(1, p));

        card.style.transform = 'scale(' + (1 - p * 0.06).toFixed(4) + ')';
        card.style.setProperty('--dim', (p * 0.45).toFixed(3));
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    measure();
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
});
