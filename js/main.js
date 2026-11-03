/**
 * Arkshar Studio — Core JavaScript
 * Handles navigation, click tracking, dynamic prototype rendering,
 * accessible modal previews, and honest WhatsApp contact dispatch.
 */

/* --------------------------------------------------------------------------
   1. CLICK TRACKER / ANALYTICS HOOK
   -------------------------------------------------------------------------- */
// Pluggable analytics tracker.
// TODO: When ready, replace console.debug with Plausible or your Django analytics POST endpoint.
window.track = function (eventName, data = {}) {
  console.debug("[Arkshar Analytics Event]", eventName, data);
};

document.addEventListener("DOMContentLoaded", () => {
  initAnalyticsListeners();
  initMobileNav();
  initHeaderScroll();
  initHomeTodayAndGrid();
  initContactForm();
  initModals();
  initAccessibleKeyboardButtons();
});

function initAnalyticsListeners() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a, button");
    if (!target) return;

    const href = target.getAttribute("href") || "";
    if (href.includes("wa.me") || target.classList.contains("btn-whatsapp") || target.classList.contains("mobile-sticky-whatsapp")) {
      window.track("whatsapp_click", {
        href,
        text: target.textContent.trim(),
        location: window.location.pathname
      });
    } else if (href.startsWith("tel:") || target.classList.contains("mobile-sticky-call")) {
      window.track("phone_call_click", {
        href,
        location: window.location.pathname
      });
    }
  });
}

/* --------------------------------------------------------------------------
   2. MOBILE NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector(".mobile-toggle");
  const drawer = document.querySelector(".mobile-drawer");
  if (!toggleBtn || !drawer) return;

  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : toggleBtn.getAttribute("aria-expanded") !== "true";
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  toggleBtn.addEventListener("click", () => toggleMenu());

  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) toggleMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });

  drawer.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });
}

/* --------------------------------------------------------------------------
   3. STICKY HEADER SCROLL SHADOW
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 20) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    },
    { passive: true }
  );
}

/* --------------------------------------------------------------------------
   4. HOME PAGE: RENDER TODAY'S PROTOTYPE & TOP 6 GRID
   -------------------------------------------------------------------------- */
async function initHomeTodayAndGrid() {
  const todayContainer = document.getElementById("today-prototype-container");
  const gridContainer = document.getElementById("home-prototypes-grid");
  const counterEl = document.getElementById("prototypes-built-count");

  if (!todayContainer && !gridContainer) return;

  try {
    const res = await fetch("data/prototypes.json");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const prototypes = await res.json();

    // 1. Compute and show real prototype count (or "sample concepts" when sample: true)
    const totalCount = prototypes.length;
    const allSample = totalCount > 0 && prototypes.every((p) => p.sample === true);
    const countLabel = allSample
      ? `${totalCount} sample concepts`
      : `${totalCount} prototypes built`;

    if (counterEl) {
      counterEl.textContent = countLabel;
    }
    document.querySelectorAll("[data-count='prototypes']").forEach((el) => {
      el.textContent = countLabel;
    });

    // 2. Pick "Today's prototype" if valid date exists; otherwise show newest item under "Latest sample"
    const todayStr = new Date().toISOString().split("T")[0];
    const validDated = prototypes.filter((p) => p.date && p.date.trim() !== "" && p.date <= todayStr);
    validDated.sort((a, b) => (b.date > a.date ? 1 : -1));

    let todayItem = null;
    let isToday = false;

    if (validDated.length > 0) {
      todayItem = validDated[0];
      isToday = true;
    } else {
      // If date is empty, do not choose a "Today's prototype"
      // Show newest item under title "Latest sample" instead
      todayItem = prototypes[0];
      isToday = false;
    }

    // Render Today / Latest Sample Strip
    if (todayContainer && todayItem) {
      renderTodayStrip(todayContainer, todayItem, isToday);
    }

    // 3. Render top 6 prototypes in grid
    if (gridContainer) {
      const top6 = prototypes.slice(0, 6);
      gridContainer.innerHTML = top6.map((p) => renderCardMarkup(p)).join("");
      attachCardActionHandlers(gridContainer, prototypes);
    }
  } catch (err) {
    console.error("Failed to load home prototypes:", err);
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: #fff; border-radius: 12px; border: 1px solid #E2E8F0;">
          <p style="color: #64748B;">Could not load prototypes. Please view the <a href="catalog.html" style="color: #F59E0B; font-weight: bold; text-decoration: underline;">full catalog</a>.</p>
        </div>
      `;
    }
  }
}

function renderTodayStrip(container, item, isToday = false) {
  const hasDate = Boolean(item.date && item.date.trim());
  const isNew = hasDate ? isWithinDays(item.date, 7) : false;
  const realStatus =
    item.status === "live-demo" && (!item.demoUrl || !item.demoUrl.startsWith("https://"))
      ? "screenshot-only"
      : item.status || "screenshot-only";
  const statusLabel = formatStatus(realStatus);
  const hasRealDemo = item.demoUrl && item.demoUrl.startsWith("https://");
  const hasRealReel = item.reelUrl && item.reelUrl.trim() !== "" && item.reelUrl.startsWith("https://") && !item.reelUrl.includes("/#");

  const titlePrefix = isToday ? "Today's Prototype" : "Latest sample";
  const dateSuffix = isToday && hasDate ? ` • ${escapeHtml(item.date)}` : "";

  const demoButtonMarkup = hasRealDemo
    ? `<a href="${escapeHtml(item.demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg">View Live Demo</a>`
    : `<button type="button" class="btn btn-primary btn-lg btn-quick-view" data-slug="${escapeHtml(item.slug)}">Quick View Sample</button>`;

  const reelButtonMarkup = hasRealReel
    ? `<a href="${escapeHtml(item.reelUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-lg" style="color: #fff; border-color: #CBD5E1;">Watch Reel</a>`
    : ``;

  const waAskLink = window.waLink
    ? window.waLink(`Hi Arkshar! I saw your sample "${item.name}" and want to ask about it.`)
    : "#";
  const waDisabledClass = waAskLink === "#" ? " wa-disabled" : "";

  container.innerHTML = `
    <div class="latest-strip">
      <div class="latest-strip-layout">
        <!-- Left: Information -->
        <div class="latest-strip-info">
          <div class="latest-strip-tag">
            <span class="eyebrow-dot" style="background: #FCD34D;" aria-hidden="true"></span>
            ${escapeHtml(titlePrefix)}${dateSuffix}
          </div>
          <h2>${escapeHtml(item.name)}</h2>
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap;">
            <span class="status-badge ${escapeHtml(realStatus)}">${escapeHtml(statusLabel)}</span>
            ${item.sample ? `<span class="sample-notice-tag">Sample concept, not a real client</span>` : ""}
            ${isNew ? `<span class="badge-new">New</span>` : ""}
          </div>
          <p>${escapeHtml(item.description)}</p>
          <div class="latest-strip-actions">
            ${demoButtonMarkup}
            ${reelButtonMarkup}
            <a href="${waAskLink}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-lg${waDisabledClass}">
              <svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"></use></svg>
              Ask on WhatsApp
            </a>
          </div>
        </div>

        <!-- Right: Screen Preview Box -->
        <div>
          <div class="reel-preview-card btn-quick-view" data-slug="${escapeHtml(item.slug)}" role="button" tabindex="0" aria-label="Open quick view for ${escapeHtml(item.name)}">
            <div class="reel-aspect">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} preview mockup" width="600" height="380">
              <div class="reel-overlay-play" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach quick view click to today's preview card
  container.querySelectorAll(".btn-quick-view").forEach((btn) => {
    btn.addEventListener("click", () => {
      openQuickViewModal(item, btn);
    });
  });
}

function renderCardMarkup(item) {
  const hasDate = Boolean(item.date && item.date.trim());
  const isNew = hasDate ? isWithinDays(item.date, 7) : false;
  const realStatus =
    item.status === "live-demo" && (!item.demoUrl || !item.demoUrl.startsWith("https://"))
      ? "screenshot-only"
      : item.status || "screenshot-only";
  const statusLabel = formatStatus(realStatus);
  const hasRealDemo = item.demoUrl && item.demoUrl.startsWith("https://");
  const hasRealReel = item.reelUrl && item.reelUrl.trim() !== "" && item.reelUrl.startsWith("https://") && !item.reelUrl.includes("/#");

  return `
    <article class="prototype-card" data-slug="${escapeHtml(item.slug)}">
      <div class="prototype-media">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} screen preview" loading="lazy" width="600" height="380">
        <div class="proto-top-badge">
          <span class="status-badge ${escapeHtml(realStatus)}">${escapeHtml(statusLabel)}</span>
          ${isNew ? `<span class="badge-new">New</span>` : ""}
        </div>
      </div>
      <div class="prototype-body">
        <div class="prototype-header-meta">
          <span class="prototype-industry">${escapeHtml(item.industry)}</span>
          ${hasDate ? `<span style="font-size: 0.75rem; color: #94A3B8;">${escapeHtml(item.date)}</span>` : ""}
        </div>
        <h3 class="prototype-title">${escapeHtml(item.name)}</h3>
        <p class="prototype-desc">${escapeHtml(item.description)}</p>
        
        ${item.sample ? `<div class="prototype-sample-footer"><span class="sample-notice-tag">Sample concept, not a real client</span></div>` : ""}

        <div class="prototype-actions">
          <button type="button" class="btn btn-secondary btn-sm btn-quick-view" data-slug="${escapeHtml(item.slug)}" style="flex: 1;" aria-label="Quick view of ${escapeHtml(item.name)}">
            Quick View
          </button>
          ${
            hasRealDemo
              ? `<a href="${escapeHtml(item.demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex: 1;">Live Demo</a>`
              : ""
          }
          ${
            hasRealReel
              ? `<a href="${escapeHtml(item.reelUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" aria-label="Watch Instagram reel">Reel</a>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function attachCardActionHandlers(container, list) {
  container.querySelectorAll(".btn-quick-view").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.slug;
      const found = list.find((p) => p.slug === slug);
      if (found) {
        openQuickViewModal(found, btn);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. QUICK-VIEW POPUP MODAL (WITH ACCESSIBLE FOCUS TRAP)
   -------------------------------------------------------------------------- */
let lastFocusedElement = null;

function initModals() {
  const overlay = document.getElementById("demo-modal");
  if (!overlay) return;

  const closeBtn = overlay.querySelector(".modal-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeQuickViewModal);
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeQuickViewModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      closeQuickViewModal();
    }
  });

  // Check URL hash route for direct modal view (e.g. catalog.html#proto-namma-kirana)
  checkHashRoute();
  window.addEventListener("hashchange", checkHashRoute);
}

function checkHashRoute() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const slug = hash.replace(/^#(proto-)?/, "");
  if (!slug) return;

  fetch("data/prototypes.json")
    .then((r) => r.json())
    .then((prototypes) => {
      const match = prototypes.find((p) => p.slug === slug || p.id === slug);
      if (match) {
        openQuickViewModal(match);
      }
    })
    .catch((e) => console.debug("Hash route lookup:", e));
}

function openQuickViewModal(item, triggerEl = null) {
  const modal = document.getElementById("demo-modal");
  if (!modal) return;

  lastFocusedElement = triggerEl || document.activeElement;

  const titleEl = modal.querySelector("#modal-proto-title");
  const typeEl = modal.querySelector("#modal-proto-type");
  const imgEl = modal.querySelector("#modal-proto-img");
  const descEl = modal.querySelector("#modal-proto-desc");
  const waBtnEl = modal.querySelector("#modal-wa-link");
  const statusEl = modal.querySelector("#modal-proto-status");
  const sampleNoteEl = modal.querySelector("#modal-proto-sample");
  const demoDirectEl = modal.querySelector("#modal-direct-demo");

  if (titleEl) titleEl.textContent = item.name;
  if (typeEl) typeEl.textContent = `${item.type} • ${item.industry}`;
  if (descEl) descEl.textContent = item.description;

  if (statusEl) {
    statusEl.className = `status-badge ${item.status || "live-demo"}`;
    statusEl.textContent = formatStatus(item.status);
  }

  if (sampleNoteEl) {
    sampleNoteEl.style.display = item.sample ? "inline-block" : "none";
  }

  if (imgEl) {
    imgEl.src = item.image;
    imgEl.alt = `${item.name} screen preview`;
  }

  // Pre-filled WhatsApp link with prototype name
  if (waBtnEl) {
    const msg = `Hi Arkshar! I am looking at your prototype "${item.name}" (${item.industry}). Can we build something similar for my business?`;
    const linkUrl = window.waLink ? window.waLink(msg, waBtnEl) : "#";
    waBtnEl.href = linkUrl;
    if (linkUrl === "#") {
      waBtnEl.classList.add("wa-disabled");
    } else {
      waBtnEl.classList.remove("wa-disabled");
    }
  }

  // External live demo button
  if (demoDirectEl) {
    if (item.demoUrl && !item.demoUrl.startsWith("#")) {
      demoDirectEl.href = item.demoUrl;
      demoDirectEl.style.display = "inline-flex";
    } else {
      demoDirectEl.style.display = "none";
    }
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Focus trap
  const closeBtn = modal.querySelector(".modal-close-btn");
  if (closeBtn) closeBtn.focus();
}

function closeQuickViewModal() {
  const modal = document.getElementById("demo-modal");
  if (!modal || !modal.classList.contains("open")) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  // Return focus to opening element
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

// Make accessible to catalog.js
window.openQuickViewModal = openQuickViewModal;
window.closeQuickViewModal = closeQuickViewModal;

/* --------------------------------------------------------------------------
   6. HONEST CONTACT FORM (DISPATCH TO WHATSAPP)
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("quote-form");
  if (!form) return;

  // Auto-select plan from URL query ?plan=
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get("plan");
  const businessParam = urlParams.get("business") || urlParams.get("solution");

  const nameInput = document.getElementById("contact-name");
  const phoneInput = document.getElementById("contact-phone");
  const businessSelect = document.getElementById("contact-business-type");
  const messageInput = document.getElementById("contact-message");
  const noticeBox = document.getElementById("form-success-alert");
  const submitBtn = form.querySelector("button[type='submit']");

  if (businessSelect && businessParam) {
    for (let opt of businessSelect.options) {
      if (opt.value.toLowerCase().includes(businessParam.toLowerCase())) {
        opt.selected = true;
        break;
      }
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;

    // Validate Name
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      setFieldError(nameInput, "Please enter your name.");
      isValid = false;
    } else {
      clearFieldError(nameInput);
    }

    // Validate Phone (10-digit Indian pattern or international)
    const phoneVal = phoneInput.value.replace(/[\s\-\(\)]/g, "");
    const phonePattern = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!phonePattern.test(phoneVal)) {
      setFieldError(phoneInput, "Please enter a valid 10-digit mobile number.");
      isValid = false;
    } else {
      clearFieldError(phoneInput);
    }

    // Validate Business Type
    if (!businessSelect.value) {
      setFieldError(businessSelect, "Please select what you are building.");
      isValid = false;
    } else {
      clearFieldError(businessSelect);
    }

    // Validate Message
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      setFieldError(messageInput, "Please write a short note about your needs (min 10 characters).");
      isValid = false;
    } else {
      clearFieldError(messageInput);
    }

    if (!isValid) return;

    window.track("quote_form_submit", {
      business: businessSelect.value,
      plan: planParam || "general"
    });

    /* ------------------------------------------------------------------------
       DJANGO INTEGRATION NOTE:
       When the Django backend is plugged in, replace the client WhatsApp
       dispatch below with a standard fetch() or form POST to:
       fetch('/api/quotes/', { method: 'POST', body: new FormData(form) })
       ------------------------------------------------------------------------ */

    // Build pre-filled WhatsApp message
    const lines = [
      `Hi Arkshar! I would like to request a quote.`,
      `Name: ${nameInput.value.trim()}`,
      `Phone: ${phoneInput.value.trim()}`,
      `Business: ${businessSelect.value}`,
      planParam ? `Plan: ${planParam}` : null,
      `Details: ${messageInput.value.trim()}`
    ].filter(Boolean);

    const fullMessage = lines.join("\n");
    const targetUrl = window.waLink ? window.waLink(fullMessage) : "#";
    const isWaReady = targetUrl !== "#";

    // Display honest feedback box
    if (noticeBox) {
      noticeBox.className = "form-dispatch-notice show";
      noticeBox.innerHTML = `
        <h4 style="color: #065F46; margin-bottom: 0.35rem;">✓ Ready to send via WhatsApp</h4>
        <p style="color: #047857; margin-bottom: 1rem; font-size: 0.95rem;">
          ${
            isWaReady
              ? "Opening WhatsApp. Please press <strong>Send</strong> there to finish."
              : "Your quote request message is prepared. Click <strong>Copy my message</strong> below to send it to us."
          }
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm${!isWaReady ? " wa-disabled" : ""}">
            ${isWaReady ? "Open WhatsApp Again" : "WhatsApp"}
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-quote-msg">
            Copy my message
          </button>
        </div>
        <div id="copy-quote-feedback" style="font-size: 0.8rem; color: #047857; margin-top: 0.5rem; display: none;">
          Copied to clipboard! You can paste it into WhatsApp directly.
        </div>
      `;

      // Copy message button handler
      const copyBtn = document.getElementById("btn-copy-quote-msg");
      const copyFeedback = document.getElementById("copy-quote-feedback");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard
            .writeText(fullMessage)
            .then(() => {
              if (copyFeedback) copyFeedback.style.display = "block";
            })
            .catch(() => {
              alert("Message:\n\n" + fullMessage);
            });
        });
      }

      noticeBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Launch WhatsApp only if live URL is configured
    if (isWaReady) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  });

  [nameInput, phoneInput, businessSelect, messageInput].forEach((field) => {
    if (!field) return;
    field.addEventListener("input", () => clearFieldError(field));
  });
}

function setFieldError(field, msg) {
  field.classList.add("error");
  let errEl = field.parentElement.querySelector(".form-error-msg");
  if (!errEl) {
    errEl = document.createElement("div");
    errEl.className = "form-error-msg";
    field.parentElement.appendChild(errEl);
  }
  errEl.textContent = msg;
}

function clearFieldError(field) {
  field.classList.remove("error");
  const errEl = field.parentElement.querySelector(".form-error-msg");
  if (errEl) {
    errEl.textContent = "";
  }
}

/* --------------------------------------------------------------------------
   7. ACCESSIBLE KEYBOARD HANDLERS FOR BUTTON-LIKE ELEMENTS
   -------------------------------------------------------------------------- */
function initAccessibleKeyboardButtons() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target;
      if (target && target.getAttribute("role") === "button" && target.tagName !== "BUTTON") {
        e.preventDefault();
        target.click();
      }
    }
  });
}

/* --------------------------------------------------------------------------
   UTILITIES
   -------------------------------------------------------------------------- */
function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diffTime = now - d;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

function formatStatus(status) {
  switch (status) {
    case "live-demo":
      return "Live demo";
    case "screenshot-only":
      return "Screenshot only";
    case "in-build":
      return "In build";
    default:
      return "Live demo";
  }
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global click prevention on disabled WhatsApp links
document.addEventListener("click", (e) => {
  const waDisabled = e.target.closest(".wa-disabled");
  if (waDisabled) {
    e.preventDefault();
    console.warn(
      "[Arkshar] WhatsApp link clicked but WHATSAPP_NUMBER in js/config.js is still a placeholder. Set a live phone number before production."
    );
  }
});
