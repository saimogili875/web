/**
 * Arkshar Studio — Catalog Dynamic Filter & Search Controller
 * Loads /data/prototypes.json, handles Type & Industry filtering, search query,
 * and renders interactive cards. Zero dependencies.
 */

(function () {
  let allPrototypes = [];
  let currentTypeFilter = 'all';
  let currentIndustryFilter = 'all';
  let currentSearchQuery = '';

  document.addEventListener('DOMContentLoaded', initCatalog);

  async function initCatalog() {
    const gridContainer = document.getElementById('catalog-grid');
    if (!gridContainer) return;

    try {
      showLoadingState(gridContainer);
      const res = await fetch('data/prototypes.json');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      allPrototypes = await res.json();

      setupIndustryDropdown(allPrototypes);
      setupEventListeners();
      applyFilters();
    } catch (err) {
      console.error('Failed to load catalog data:', err);
      gridContainer.innerHTML = `
        <div class="catalog-empty" style="grid-column: 1 / -1;">
          <h3>Unable to load catalog prototypes</h3>
          <p>Please ensure you are viewing this via a local server (e.g. <code>python3 -m http.server</code>).</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  function showLoadingState(container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #E2E8F0; border-top-color: #F59E0B; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #64748B; font-weight: 600;">Loading prototypes...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  }

  function setupIndustryDropdown(prototypes) {
    const select = document.getElementById('industry-filter');
    if (!select) return;

    // Collect unique industries
    const industries = Array.from(new Set(prototypes.map(p => p.industry).filter(Boolean))).sort();

    // Preserve existing 'All Industries' option and append others
    select.innerHTML = '<option value="all">All Industries</option>';
    industries.forEach(ind => {
      const opt = document.createElement('option');
      opt.value = ind;
      opt.textContent = ind;
      select.appendChild(opt);
    });
  }

  function setupEventListeners() {
    // Search Input
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        applyFilters();
      });
    }

    // Type Pills
    const pills = document.querySelectorAll('.filter-pill[data-type]');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentTypeFilter = pill.dataset.type || 'all';
        applyFilters();
      });
    });

    // Industry Dropdown
    const indSelect = document.getElementById('industry-filter');
    if (indSelect) {
      indSelect.addEventListener('change', (e) => {
        currentIndustryFilter = e.target.value;
        applyFilters();
      });
    }

    // Reset Filter Button
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentTypeFilter = 'all';
        currentIndustryFilter = 'all';
        currentSearchQuery = '';

        if (searchInput) searchInput.value = '';
        if (indSelect) indSelect.value = 'all';
        pills.forEach(p => {
          if (p.dataset.type === 'all') p.classList.add('active');
          else p.classList.remove('active');
        });

        applyFilters();
      });
    }
  }

  function applyFilters() {
    const filtered = allPrototypes.filter(proto => {
      // Type matching
      const matchType = (currentTypeFilter === 'all') || 
        (proto.type && proto.type.toLowerCase() === currentTypeFilter.toLowerCase());

      // Industry matching
      const matchIndustry = (currentIndustryFilter === 'all') || 
        (proto.industry && proto.industry.toLowerCase() === currentIndustryFilter.toLowerCase());

      // Search matching (Name, Industry, Description)
      const q = currentSearchQuery;
      const matchSearch = !q || 
        (proto.name && proto.name.toLowerCase().includes(q)) ||
        (proto.industry && proto.industry.toLowerCase().includes(q)) ||
        (proto.description && proto.description.toLowerCase().includes(q)) ||
        (proto.type && proto.type.toLowerCase().includes(q));

      return matchType && matchIndustry && matchSearch;
    });

    renderFilteredPrototypes(filtered);
    updateStatusBar(filtered.length, allPrototypes.length);
  }

  function updateStatusBar(shownCount, totalCount) {
    const countEl = document.getElementById('catalog-count-text');
    if (countEl) {
      if (shownCount === totalCount) {
        countEl.textContent = `Showing all ${totalCount} daily prototypes`;
      } else {
        countEl.textContent = `Showing ${shownCount} of ${totalCount} prototypes`;
      }
    }

    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      const isFiltered = currentTypeFilter !== 'all' || currentIndustryFilter !== 'all' || currentSearchQuery !== '';
      resetBtn.style.display = isFiltered ? 'inline-block' : 'none';
    }
  }

  function renderFilteredPrototypes(items) {
    const container = document.getElementById('catalog-grid');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="catalog-empty" style="grid-column: 1 / -1;">
          <h3>No matching prototypes found</h3>
          <p>Try searching with another keyword or resetting the industry/type filters.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-empty-reset">Clear all filters</button>
        </div>
      `;
      const emptyReset = document.getElementById('btn-empty-reset');
      if (emptyReset) {
        emptyReset.addEventListener('click', () => {
          const resetBtn = document.getElementById('btn-reset-filters');
          if (resetBtn) resetBtn.click();
        });
      }
      return;
    }

    container.innerHTML = items.map(proto => renderPrototypeCard(proto)).join('');

    // Attach card actions (Demo and Reel)
    attachCardActionHandlers(container);
  }

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
        if (typeof window.openDemoModal === 'function') {
          window.openDemoModal(name, type, image);
        } else {
          // Fallback modal open
          openModalDirect(name, type, image);
        }
      });
    });
  }

  function openModalDirect(name, type, image) {
    const modal = document.getElementById('demo-modal');
    if (!modal) return;
    const titleEl = modal.querySelector('#modal-proto-title');
    const typeEl = modal.querySelector('#modal-proto-type');
    const imgEl = modal.querySelector('#modal-proto-img');
    const waLinkEl = modal.querySelector('#modal-wa-link');

    if (titleEl) titleEl.textContent = name;
    if (typeEl) typeEl.textContent = type;
    if (imgEl && image) {
      imgEl.src = image;
      imgEl.alt = `${name} prototype view`;
    }
    if (waLinkEl) {
      const encoded = encodeURIComponent(`Hi Arkshar! I saw your "${name}" prototype and would like to build something similar for my business.`);
      waLinkEl.href = `https://wa.me/91XXXXXXXXXX?text=${encoded}`;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();

