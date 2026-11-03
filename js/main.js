/**
 * Arkshar Studio — Core JavaScript
 * Handles mobile navigation, modal interactions, home page prototype loading,
 * and contact form validation. Zero dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeaderScroll();
  initHomePrototypes();
  initContactForm();
  initModals();
});

/* --------------------------------------------------------------------------
   1. MOBILE NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (!toggleBtn || !drawer) return;

  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : toggleBtn.getAttribute('aria-expanded') !== 'true';
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    drawer.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  toggleBtn.addEventListener('click', () => toggleMenu());

  // Close when clicking outside drawer content
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) {
      toggleMenu(false);
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });

  // Close when clicking on mobile navigation link
  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });
}

/* --------------------------------------------------------------------------
   2. STICKY HEADER SCROLL EFFECT
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   3. HOME PAGE: RENDER LATEST 6 PROTOTYPES & STRIP
   -------------------------------------------------------------------------- */
async function initHomePrototypes() {
  const gridContainer = document.getElementById('home-prototypes-grid');
  if (!gridContainer) return;

  try {
    const res = await fetch('data/prototypes.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const prototypes = await res.json();

    // Render the top 6 prototypes
    const top6 = prototypes.slice(0, 6);
    gridContainer.innerHTML = top6.map(proto => renderPrototypeCard(proto)).join('');

    // Attach interactive demo handlers
    attachCardActionHandlers(gridContainer);
  } catch (err) {
    console.error('Failed to load home prototypes:', err);
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: #fff; border-radius: 12px; border: 1px solid #E2E8F0;">
        <p style="color: #64748B;">Could not load prototypes at this moment. Please check the <a href="catalog.html" style="color: #F59E0B; font-weight: bold; text-decoration: underline;">full catalog</a>.</p>
      </div>
    `;
  }
}

/* --------------------------------------------------------------------------
   PROTOTYPE CARD TEMPLATE
   -------------------------------------------------------------------------- */
function renderPrototypeCard(item) {
  return `
    <article class="prototype-card" data-id="${escapeHtml(item.id)}">
      <div class="prototype-media">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} prototype screen preview" loading="lazy" width="600" height="380">
        <span class="proto-tag-day">${escapeHtml(item.day || 'Daily Prototype')}</span>
        <span class="proto-tag-type">${escapeHtml(item.type)}</span>
      </div>
      <div class="prototype-body">
        <div class="prototype-industry">${escapeHtml(item.industry)}</div>
        <h3 class="prototype-title">${escapeHtml(item.name)}</h3>
        <p class="prototype-desc">${escapeHtml(item.description)}</p>
        <div class="prototype-actions">
          <button type="button" class="btn btn-primary btn-sm btn-action-demo" data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}" data-image="${escapeHtml(item.image)}" data-type="${escapeHtml(item.type)}" aria-label="View demo of ${escapeHtml(item.name)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Demo
          </button>
          <a href="${escapeHtml(item.reelUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-reel btn-sm" aria-label="Watch Instagram reel for ${escapeHtml(item.name)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Reel
          </a>
        </div>
      </div>
    </article>
  `;
}

function attachCardActionHandlers(container) {
  container.querySelectorAll('.btn-action-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const type = btn.dataset.type;
      const image = btn.dataset.image;
      openDemoModal(name, type, image);
    });
  });
}

/* --------------------------------------------------------------------------
   4. DEMO & REEL PREVIEW MODALS
   -------------------------------------------------------------------------- */
function initModals() {
  const overlay = document.getElementById('demo-modal');
  if (!overlay) return;

  const closeBtn = overlay.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDemoModal);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDemoModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeDemoModal();
    }
  });

  // Latest reel play button trigger
  const playReelBtn = document.getElementById('play-strip-reel-btn');
  if (playReelBtn) {
    playReelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openReelNoticeModal();
    });
  }

  // Strip demo button trigger
  const stripDemoBtn = document.getElementById('strip-demo-btn');
  if (stripDemoBtn) {
    stripDemoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDemoModal('Namma Kirana Quick Mart', 'E-commerce', 'assets/prototypes/kirana.svg');
    });
  }
}

function openDemoModal(name, type, imageSrc) {
  const modal = document.getElementById('demo-modal');
  if (!modal) return;

  const titleEl = modal.querySelector('#modal-proto-title');
  const typeEl = modal.querySelector('#modal-proto-type');
  const imgEl = modal.querySelector('#modal-proto-img');
  const waLinkEl = modal.querySelector('#modal-wa-link');

  if (titleEl) titleEl.textContent = name;
  if (typeEl) typeEl.textContent = type;
  if (imgEl && imageSrc) {
    imgEl.src = imageSrc;
    imgEl.alt = `${name} prototype live view`;
  }

  if (waLinkEl) {
    const encoded = encodeURIComponent(`Hi Arkshar! I saw your "${name}" prototype and would like to build something similar for my business.`);
    waLinkEl.href = `https://wa.me/91XXXXXXXXXX?text=${encoded}`;
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openReelNoticeModal() {
  openDemoModal(
    'Daily Reel Preview: Namma Kirana Mart',
    'Day 48 Prototype',
    'assets/prototypes/kirana.svg'
  );
}

/* --------------------------------------------------------------------------
   5. CONTACT & QUOTE FORM VALIDATION
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;

  const nameInput = document.getElementById('contact-name');
  const phoneInput = document.getElementById('contact-phone');
  const businessTypeSelect = document.getElementById('contact-business-type');
  const messageInput = document.getElementById('contact-message');
  const successAlert = document.getElementById('form-success-alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    // Validate Name
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      setFieldError(nameInput, 'Please enter your name.');
      isValid = false;
    } else {
      clearFieldError(nameInput);
    }

    // Validate Phone (10 digits Indian format or international)
    const phoneVal = phoneInput.value.replace(/[\s\-\(\)]/g, '');
    const phonePattern = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!phonePattern.test(phoneVal)) {
      setFieldError(phoneInput, 'Please enter a valid 10-digit mobile number (e.g. 9876543210).');
      isValid = false;
    } else {
      clearFieldError(phoneInput);
    }

    // Validate Business Type
    if (!businessTypeSelect.value) {
      setFieldError(businessTypeSelect, 'Please select what you want to build.');
      isValid = false;
    } else {
      clearFieldError(businessTypeSelect);
    }

    // Validate Message
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      setFieldError(messageInput, 'Please tell us briefly about your business needs (min 10 characters).');
      isValid = false;
    } else {
      clearFieldError(messageInput);
    }

    if (!isValid) return;

    // Simulating frontend success
    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparing quote request...';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Send Quote Request
      `;

      if (successAlert) {
        successAlert.classList.add('show');
        successAlert.innerHTML = `
          <h4 style="font-size: 1.1rem; color: #065F46; margin-bottom: 0.35rem;">✓ Quote Request Received!</h4>
          <p style="font-size: 0.95rem; color: #047857; margin-bottom: 0.85rem;">Thank you <strong>${escapeHtml(nameInput.value.trim())}</strong>. We typically respond within 2-4 working hours on WhatsApp.</p>
          <a href="https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(`Hi Arkshar, I just submitted a quote request for ${businessTypeSelect.value} (${nameInput.value.trim()}, ${phoneInput.value.trim()}).`)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="display: inline-flex;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.03C9.36 7.03 9.08 7.09 8.84 7.35C8.6 7.61 7.92 8.25 7.92 9.55C7.92 10.85 8.87 12.11 9 12.28C9.13 12.45 10.84 15.09 13.46 16.22C14.08 16.49 14.57 16.65 14.95 16.77C15.57 16.97 16.14 16.94 16.58 16.88C17.08 16.8 18.11 16.25 18.32 15.65C18.54 15.06 18.54 14.55 18.47 14.44C18.41 14.33 18.24 14.27 17.98 14.14C17.72 14.01 16.45 13.38 16.21 13.29C15.98 13.2 15.81 13.16 15.64 13.42C15.47 13.68 14.99 14.25 14.84 14.42C14.7 14.59 14.55 14.61 14.29 14.48C14.04 14.35 13.21 14.08 12.22 13.2C11.45 12.51 10.93 11.66 10.78 11.4C10.63 11.15 10.76 11.01 10.89 10.88C11.01 10.76 11.15 10.58 11.28 10.43C11.41 10.28 11.45 10.17 11.54 10C11.62 9.83 11.58 9.68 11.52 9.55C11.45 9.42 10.95 8.19 10.73 7.68C10.53 7.18 10.32 7.25 10.16 7.24C10.01 7.23 9.84 7.23 9.67 7.23L9.53 7.03Z\"/></svg>
            Continue instantly on WhatsApp
          </a>
        `;
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      form.reset();
    }, 600);
  });

  // Real-time error clearance on input
  [nameInput, phoneInput, businessTypeSelect, messageInput].forEach(field => {
    if (!field) return;
    field.addEventListener('input', () => clearFieldError(field));
  });
}

function setFieldError(field, msg) {
  field.classList.add('error');
  let errEl = field.parentElement.querySelector('.form-error-msg');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'form-error-msg';
    field.parentElement.appendChild(errEl);
  }
  errEl.textContent = msg;
}

function clearFieldError(field) {
  field.classList.remove('error');
  const errEl = field.parentElement.querySelector('.form-error-msg');
  if (errEl) {
    errEl.textContent = '';
  }
}

/* --------------------------------------------------------------------------
   UTILITY: HTML ESCAPE
   -------------------------------------------------------------------------- */
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

