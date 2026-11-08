/**
 * Arkshar Studio — Honest Prototype Catalog Controller
 * Loads /data/prototypes.json, handles filtering, sorting, URL synchronization,
 * skeleton placeholders, and accessible quick-view popups. Zero dependencies.
 */

(function () {
  let allPrototypes = [];
  let currentTypeFilter = "all";
  let currentIndustryFilter = "all";
  let currentSearchQuery = "";
  let currentSort = "newest";

  document.addEventListener("DOMContentLoaded", initCatalog);

  async function initCatalog() {
    const gridContainer = document.getElementById("catalog-grid");
    if (!gridContainer) return;

    // Show 6 skeleton cards while loading
    showSkeletonCards(gridContainer, 6);

    try {
      const res = await fetch("data/prototypes.json");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      allPrototypes = await res.json();

      readUrlFilters();
      setupIndustryDropdown(allPrototypes);
      setupEventListeners();
      applyFilters();

      // Check hash route (e.g. #namma-kirana or #proto-namma-kirana)
      checkCatalogHash();
      window.addEventListener("hashchange", checkCatalogHash);
    } catch (err) {
      console.error("Failed to load catalog data:", err);
      gridContainer.innerHTML = `
        <div class="catalog-empty" style="grid-column: 1 / -1;">
          <h3>Unable to load catalog prototypes</h3>
          <p style="color: #888888;">Please ensure you are viewing this via a local server (e.g. <code>python3 -m http.server 3000</code>).</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  function showSkeletonCards(container, count = 6) {
    let markup = "";
    for (let i = 0; i < count; i++) {
      markup += `
        <div class="skeleton-card" aria-hidden="true">
          <div class="skeleton-media"></div>
          <div class="skeleton-body">
            <div class="skeleton-line" style="width: 35%; height: 14px;"></div>
            <div class="skeleton-line" style="width: 70%; height: 20px;"></div>
            <div class="skeleton-line" style="width: 90%; height: 14px;"></div>
            <div class="skeleton-line" style="width: 80%; height: 14px;"></div>
            <div class="skeleton-line" style="width: 100%; height: 38px; margin-top: auto;"></div>
          </div>
        </div>
      `;
    }
    container.innerHTML = markup;
  }

  function readUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("type")) currentTypeFilter = params.get("type");
    if (params.has("industry")) currentIndustryFilter = params.get("industry");
    if (params.has("q")) currentSearchQuery = params.get("q").toLowerCase();
    if (params.has("sort")) currentSort = params.get("sort");

    // Sync input values
    const searchInput = document.getElementById("catalog-search");
    if (searchInput && currentSearchQuery) {
      searchInput.value = currentSearchQuery;
    }

    const sortSelect = document.getElementById("catalog-sort");
    if (sortSelect && currentSort) {
      sortSelect.value = currentSort;
    }

    const pills = document.querySelectorAll(".filter-pill[data-type]");
    pills.forEach((p) => {
      if (p.dataset.type.toLowerCase() === currentTypeFilter.toLowerCase()) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });
  }

  function syncFiltersToUrl() {
    const params = new URLSearchParams();
    if (currentTypeFilter !== "all") params.set("type", currentTypeFilter);
    if (currentIndustryFilter !== "all") params.set("industry", currentIndustryFilter);
    if (currentSearchQuery) params.set("q", currentSearchQuery);
    if (currentSort !== "newest") params.set("sort", currentSort);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }

  function setupIndustryDropdown(prototypes) {
    const select = document.getElementById("industry-filter");
    if (!select) return;

    const industries = Array.from(new Set(prototypes.map((p) => p.industry).filter(Boolean))).sort();
    select.innerHTML = '<option value="all">All Industries</option>';
    industries.forEach((ind) => {
      const opt = document.createElement("option");
      opt.value = ind;
      opt.textContent = ind;
      if (ind.toLowerCase() === currentIndustryFilter.toLowerCase()) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  function setupEventListeners() {
    // Search Input
    const searchInput = document.getElementById("catalog-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        syncFiltersToUrl();
        applyFilters();
      });
    }

    // Type Pills
    const pills = document.querySelectorAll(".filter-pill[data-type]");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        currentTypeFilter = pill.dataset.type || "all";
        syncFiltersToUrl();
        applyFilters();
      });
    });

    // Industry Dropdown
    const indSelect = document.getElementById("industry-filter");
    if (indSelect) {
      indSelect.addEventListener("change", (e) => {
        currentIndustryFilter = e.target.value;
        syncFiltersToUrl();
        applyFilters();
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById("catalog-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        syncFiltersToUrl();
        applyFilters();
      });
    }

    // Reset Filters Button
    const resetBtn = document.getElementById("btn-reset-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetAllFilters);
    }
  }

  function resetAllFilters() {
    currentTypeFilter = "all";
    currentIndustryFilter = "all";
    currentSearchQuery = "";
    currentSort = "newest";

    const searchInput = document.getElementById("catalog-search");
    if (searchInput) searchInput.value = "";

    const indSelect = document.getElementById("industry-filter");
    if (indSelect) indSelect.value = "all";

    const sortSelect = document.getElementById("catalog-sort");
    if (sortSelect) sortSelect.value = "newest";

    document.querySelectorAll(".filter-pill[data-type]").forEach((p) => {
      if (p.dataset.type === "all") p.classList.add("active");
      else p.classList.remove("active");
    });

    syncFiltersToUrl();
    applyFilters();
  }

  function applyFilters() {
    let filtered = allPrototypes.filter((proto) => {
      // Type matching
      const matchType =
        currentTypeFilter === "all" || (proto.type && proto.type.toLowerCase() === currentTypeFilter.toLowerCase());

      // Industry matching
      const matchIndustry =
        currentIndustryFilter === "all" ||
        (proto.industry && proto.industry.toLowerCase() === currentIndustryFilter.toLowerCase());

      // Search matching (Name, Industry, Description, Type)
      const q = currentSearchQuery;
      const matchSearch =
        !q ||
        (proto.name && proto.name.toLowerCase().includes(q)) ||
        (proto.industry && proto.industry.toLowerCase().includes(q)) ||
        (proto.description && proto.description.toLowerCase().includes(q)) ||
        (proto.type && proto.type.toLowerCase().includes(q));

      return matchType && matchIndustry && matchSearch;
    });

    // Sorting
    if (currentSort === "newest") {
      filtered.sort((a, b) => ((b.date || "") > (a.date || "") ? 1 : -1));
    } else if (currentSort === "oldest") {
      filtered.sort((a, b) => ((a.date || "") > (b.date || "") ? 1 : -1));
    } else if (currentSort === "alphabetical") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderFilteredPrototypes(filtered);
    updateStatusBar(filtered.length, allPrototypes.length);
  }

  function updateStatusBar(shownCount, totalCount) {
    const countEl = document.getElementById("catalog-count-text");
    if (countEl) {
      const allSample = allPrototypes.length > 0 && allPrototypes.every((p) => p.sample === true);
      const baseNoun = allSample ? "sample concepts" : "prototypes";
      if (shownCount === totalCount) {
        countEl.textContent = `Showing all ${totalCount} ${baseNoun}`;
      } else {
        countEl.textContent = `Showing ${shownCount} of ${totalCount} ${baseNoun}`;
      }
    }

    const resetBtn = document.getElementById("btn-reset-filters");
    if (resetBtn) {
      const isFiltered =
        currentTypeFilter !== "all" ||
        currentIndustryFilter !== "all" ||
        currentSearchQuery !== "" ||
        currentSort !== "newest";
      resetBtn.style.display = isFiltered ? "inline-block" : "none";
    }
  }

  function renderFilteredPrototypes(items) {
    const container = document.getElementById("catalog-grid");
    if (!container) return;

    if (items.length === 0) {
      const waSuggestLink = window.waLink
        ? window.waLink(
            `Hi GuhaTech! I searched your catalog for "${
              currentSearchQuery || currentIndustryFilter
            }" but could not find a prototype. Can you build one for my business?`
          )
        : "#";
      const waDisabledClass = waSuggestLink === "#" ? " wa-disabled" : "";

      container.innerHTML = `
        <div class="catalog-empty" style="grid-column: 1 / -1;">
          <h3 style="margin-bottom: 0.5rem; color: #FFFFFF;">Not found? Tell us your business.</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; max-width: 500px; margin-left: auto; margin-right: auto;">
            We build one new prototype every working day. Tell us what your shop, clinic, restaurant or college needs and we can make it next.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <a href="${waSuggestLink}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp${waDisabledClass}">
              <svg width="18" height="18" aria-hidden="true"><use href="#i-whatsapp"></use></svg>
              Tell us on WhatsApp
            </a>
            <button type="button" class="btn btn-secondary" id="btn-empty-clear">Clear all filters</button>
          </div>
        </div>
      `;
      const emptyClear = document.getElementById("btn-empty-clear");
      if (emptyClear) {
        emptyClear.addEventListener("click", resetAllFilters);
      }
      return;
    }

    container.innerHTML = items
      .map((item) => {
        const hasDate = Boolean(item.date && item.date.trim());
        const isNew = hasDate ? isWithinDays(item.date, 7) : false;
        const realStatus =
          item.status === "live-demo" && (!item.demoUrl || !item.demoUrl.startsWith("https://"))
            ? "screenshot-only"
            : item.status || "screenshot-only";
        const statusLabel = formatStatus(realStatus);
        const hasRealDemo = item.demoUrl && item.demoUrl.startsWith("https://");
        const hasRealReel =
          item.reelUrl &&
          item.reelUrl.trim() !== "" &&
          item.reelUrl.startsWith("https://") &&
          !item.reelUrl.includes("/#");

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
                ${hasDate ? `<span style="font-size: 0.75rem; color: #888888;">${escapeHtml(item.date)}</span>` : ""}
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
      })
      .join("");

    // Attach quick view click listeners
    container.querySelectorAll(".btn-quick-view").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = btn.dataset.slug;
        const found = allPrototypes.find((p) => p.slug === slug);
        if (found && typeof window.openQuickViewModal === "function") {
          window.openQuickViewModal(found, btn);
          window.location.hash = `proto-${found.slug}`;
        }
      });
    });
  }

  function checkCatalogHash() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const slug = hash.replace(/^#(proto-)?/, "");
    if (!slug) return;
    const found = allPrototypes.find((p) => p.slug === slug || p.id === slug);
    if (found && typeof window.openQuickViewModal === "function") {
      window.openQuickViewModal(found);
    }
  }

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
})();
