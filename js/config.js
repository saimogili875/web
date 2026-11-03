/**
 * Arkshar Studio — Central Configuration
 * Edit these settings before launching.
 */

// TODO: Replace with your real WhatsApp number with country code (e.g. "919876543210")
const WHATSAPP_NUMBER = "91XXXXXXXXXX";

// Display text for phone number
const PHONE_DISPLAY = "+91 XXXXX XXXXX";

// Primary studio email
const EMAIL = "hello@arkshar.com";

// TODO: Replace with your real Instagram profile URL
const INSTAGRAM_URL = "https://instagram.com/#";

// Canonical site URL
const SITE_URL = "https://arkshar.com";

// Studio base city
const CITY = "Hyderabad, India";

/**
 * Builds a direct WhatsApp chat link with an optional pre-filled message.
 * @param {string} message - Message text to pre-fill in WhatsApp
 * @returns {string} - WhatsApp wa.me URL
 */
function waLink(message = "") {
  const cleanNumber = (CONFIG.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (!message) {
    return `https://wa.me/${cleanNumber}`;
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

const CONFIG = {
  WHATSAPP_NUMBER,
  PHONE_DISPLAY,
  EMAIL,
  INSTAGRAM_URL,
  SITE_URL,
  CITY,
  waLink
};

// Check if WhatsApp number is still a placeholder (dev warning in console only)
if (WHATSAPP_NUMBER.includes("X") || WHATSAPP_NUMBER === "91XXXXXXXXXX") {
  console.warn(
    "%c[Arkshar Dev Warning]%c WhatsApp number is currently set to placeholder '" +
      WHATSAPP_NUMBER +
      "'. Update WHATSAPP_NUMBER in js/config.js before production.",
    "color: #F59E0B; font-weight: bold;",
    "color: inherit;"
  );
}

// Hydrate DOM elements that rely on config
function applyConfigToDOM() {
  // Update WhatsApp links
  document.querySelectorAll("[data-wa-message]").forEach((el) => {
    const msg = el.getAttribute("data-wa-message") || "";
    el.setAttribute("href", waLink(msg));
  });

  // Update plain WhatsApp links with no custom message
  document.querySelectorAll("[data-config='whatsapp-link']").forEach((el) => {
    el.setAttribute("href", waLink("Hi Arkshar! I would like to discuss a project."));
  });

  // Update phone display text and tel: links
  document.querySelectorAll("[data-config='phone-display'], [data-config-phone]").forEach((el) => {
    el.textContent = CONFIG.PHONE_DISPLAY;
  });
  document.querySelectorAll("[data-config='phone-call']").forEach((el) => {
    el.setAttribute("href", `tel:${CONFIG.WHATSAPP_NUMBER}`);
  });

  // Update email text & mailto:
  document.querySelectorAll("[data-config='email'], [data-config-email]").forEach((el) => {
    if (el.tagName === "A") {
      el.setAttribute("href", `mailto:${CONFIG.EMAIL}`);
    }
    el.textContent = CONFIG.EMAIL;
  });

  // Update Instagram links
  document.querySelectorAll("[data-config='instagram'], [data-config-instagram]").forEach((el) => {
    if (el.tagName === "A") {
      el.setAttribute("href", CONFIG.INSTAGRAM_URL);
    }
  });

  // Update City
  document.querySelectorAll("[data-config='city'], [data-config-city]").forEach((el) => {
    el.textContent = CONFIG.CITY;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyConfigToDOM);
} else {
  applyConfigToDOM();
}

// Expose globally
window.CONFIG = CONFIG;
window.ARKSHAR_CONFIG = CONFIG;
window.waLink = waLink;
