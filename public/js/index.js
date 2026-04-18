// Shared helper to safely escape HTML and prevent XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let searchDebounceTimer;
let activeRequestId = 0;

// Pagination & sorting state
let currentPage = 1;
let currentSortBy = 'createdAt';
let currentSortOrder = 'desc';
const PAGE_LIMIT = 10;

// Bookmark state
let userBookmarks = new Set();
let showBookmarksOnly = false;

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, query) {
  const safeText = escapeHtml(text);
  if (!query) return safeText;

  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'ig');
  return safeText.replace(regex, '<mark class="search-hit">$1</mark>');
}

function setSearchStatus(message) {
  const statusEl = document.getElementById('search-status');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function syncUrlParams(params) {
  const query = params.toString();
  const nextUrl = query ? `/?${query}` : '/';
  window.history.replaceState({}, '', nextUrl);
}

function buildParamsFromFilters() {
  const search = document.getElementById('search').value.trim();
  const category = document.getElementById('category').value;
  const difficulty = document.getElementById('difficulty').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (difficulty) params.append('difficulty', difficulty);
  if (currentPage > 1) params.append('page', currentPage);
  if (currentSortBy !== 'createdAt') params.append('sortBy', currentSortBy);
  if (currentSortOrder !== 'desc') params.append('sortOrder', currentSortOrder);

  return { params, search, category, difficulty };
}

function updateSearchClearVisibility() {
  const searchValue = document.getElementById('search').value.trim();
  const clearBtn = document.getElementById('searchClearBtn');

  if (searchValue) {
    clearBtn.classList.add('visible');
  } else {
    clearBtn.classList.remove('visible');
  }
}

// Render a 1–5 star rating with SVG icons
function renderStars(rating, showNumeric = false) {
  const filled = '<svg class="star-icon star-filled" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const empty  = '<svg class="star-icon star-empty"  viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  let html = '<span class="star-group">';
  for (let i = 1; i <= 5; i++) html += i <= rating ? filled : empty;
  if (showNumeric) html += `<span class="star-numeric">${rating}/5</span>`;
  html += '</span>';
  return html;
}

function renderSourceBadges(resource) {
  const sourceBadges = [];

  if (resource.filePath) {
    sourceBadges.push('<span class="source-badge source-file">File</span>');
  }

  if (resource.link) {
    sourceBadges.push('<span class="source-badge source-link">Link</span>');
  }

  if (sourceBadges.length === 0) {
    sourceBadges.push('<span class="source-badge source-missing">No Source</span>');
  }

  return `<div class="source-badges">${sourceBadges.join('')}</div>`;
}

// Restore filter values from URL query params, then fetch
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  document.getElementById('search').value = params.get('search') || '';
  document.getElementById('category').value  = params.get('category')   || '';
  document.getElementById('difficulty').value = params.get('difficulty') || '';
  currentPage = parseInt(params.get('page'), 10) || 1;
  currentSortBy = params.get('sortBy') || 'createdAt';
  currentSortOrder = params.get('sortOrder') || 'desc';

  const searchInput = document.getElementById('search');

  // Event listeners
  document.getElementById('resetBtn').addEventListener('click', clearFilters);
  document.getElementById('searchClearBtn').addEventListener('click', clearSearchOnly);
  document.getElementById('category').addEventListener('change', () => { currentPage = 1; fetchResources({ immediate: true }); });
  document.getElementById('difficulty').addEventListener('change', () => { currentPage = 1; fetchResources({ immediate: true }); });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      currentPage = 1;
      fetchResources({ immediate: true });
    }
  });

  searchInput.addEventListener('input', () => {
    updateSearchClearVisibility();

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage = 1;
      fetchResources({ immediate: true });
    }, 280);
  });

  window.addEventListener('popstate', () => {
    const latestParams = new URLSearchParams(window.location.search);
    document.getElementById('search').value = latestParams.get('search') || '';
    document.getElementById('category').value = latestParams.get('category') || '';
    document.getElementById('difficulty').value = latestParams.get('difficulty') || '';
    currentPage = parseInt(latestParams.get('page'), 10) || 1;
    currentSortBy = latestParams.get('sortBy') || 'createdAt';
    currentSortOrder = latestParams.get('sortOrder') || 'desc';
    updateSearchClearVisibility();
    fetchResources({ syncUrl: false, immediate: true });
  });

  updateSearchClearVisibility();
  initHeroBanner();
  fetchResources({ immediate: true });

  // Hide "Add Resource" button in page header if not logged in
  const addBtn = document.querySelector('.page-header .btn-primary');
  if (addBtn && !Auth.isLoggedIn()) {
    addBtn.style.display = 'none';
  }

  // Bookmark filter setup (only for logged-in users)
  if (Auth.isLoggedIn()) {
    loadUserBookmarks();
    const bookmarkBtn = document.getElementById('bookmarkToggleBtn');
    if (bookmarkBtn) {
      bookmarkBtn.style.display = '';
      bookmarkBtn.addEventListener('click', toggleBookmarkFilter);
    }
  }

  // Export setup (only for logged-in users)
  setupExport();
});

async function fetchResources(options = {}) {
  const { syncUrl = true } = options;
  const requestId = ++activeRequestId;
  const { params, search, category, difficulty } = buildParamsFromFilters();

  // Add pagination & sorting to API call
  params.set('page', currentPage);
  params.set('limit', PAGE_LIMIT);
  params.set('sortBy', currentSortBy);
  params.set('sortOrder', currentSortOrder);

  if (syncUrl) {
    syncUrlParams(params);
  }

  // Update filter chips + badge
  updateFilterChips();

  const container = document.getElementById('resources-container');
  container.innerHTML = renderSkeletonRows(PAGE_LIMIT);
  setSearchStatus(search ? `Searching for "${search}"...` : 'Loading resources...');

  try {
    const res  = await fetch('/api/resources?' + params.toString());
    const json = await res.json();

    if (requestId !== activeRequestId) return;
    if (!json.success) throw new Error(json.error || 'Failed to load resources');

    renderTable(json.data, search);
    renderPagination(json.currentPage, json.totalPages, json.totalResources);
    updateHeroStats(json.totalResources);

    const activeFilters = [search, category, difficulty].filter(Boolean).length;
    if (json.data.length === 0) {
      setSearchStatus(activeFilters > 0 ? 'No resources matched your current filters.' : 'No resources found yet.');
    } else {
      const start = (json.currentPage - 1) * PAGE_LIMIT + 1;
      const end = start + json.data.length - 1;
      setSearchStatus(`Showing ${start}–${end} of ${json.totalResources} resources.`);
    }
  } catch (err) {
    if (requestId !== activeRequestId) return;
    setSearchStatus('Search failed. Please try again.');
    container.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
  }
}

function sortByColumn(field) {
  if (currentSortBy === field) {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortBy = field;
    currentSortOrder = field === 'title' ? 'asc' : 'desc';
  }
  currentPage = 1;
  fetchResources({ immediate: true });
}

function renderTable(resources, searchTerm) {
  const container = document.getElementById('resources-container');
  const currentUser = Auth.getUser();

  if (resources.length === 0) {
    const message = searchTerm
      ? `No resources matched "${escapeHtml(searchTerm)}".`
      : 'Start building your developer resource library by adding your first resource.';

    container.innerHTML = `
      <div class="empty-state">
        <h2>No resources found</h2>
        <p>${message}</p>
        ${currentUser ? '<a href="/add.html" class="btn btn-primary">+ Add Your First Resource</a>' : '<a href="/login.html" class="btn btn-primary">Login to Add Resources</a>'}
      </div>`;
    return;
  }

  function sortClass(field) {
    if (currentSortBy !== field) return 'sortable';
    return 'sortable ' + (currentSortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
  }

  const rows = resources.map((r) => {
    const ownerId = r.owner && r.owner._id ? r.owner._id : (r.owner || '');
    const canModify = currentUser && (currentUser.id === ownerId || currentUser.role === 'admin');
    const isBookmarked = userBookmarks.has(r._id);
    const bookmarkBtn = currentUser
      ? `<button class="bookmark-btn${isBookmarked ? ' bookmarked' : ''}" onclick="toggleBookmark('${r._id}')" title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">${isBookmarked ? '★' : '☆'}</button>`
      : '';

    return `
    <tr>
      <td>
        ${bookmarkBtn}
        <a href="/details.html?id=${r._id}">${highlightMatch(r.title, searchTerm)}</a>
        ${renderSourceBadges(r)}
      </td>
      <td><span class="badge badge-${r.category.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(r.category)}</span></td>
      <td><span class="badge badge-${r.difficulty.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(r.difficulty)}</span></td>
      <td><span class="rating">${renderStars(r.rating)}</span></td>
      <td>${new Date(r.createdAt).toLocaleDateString()}</td>
      <td>
        <div class="actions">
          <a href="/details.html?id=${r._id}" class="btn btn-primary btn-sm">View</a>
          ${canModify ? `<a href="/edit.html?id=${r._id}" class="btn btn-secondary btn-sm">Edit</a>` : ''}
          ${canModify ? `<button onclick="deleteResource('${r._id}')" class="btn btn-danger btn-sm">Delete</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="table-wrap">
    <table class="resource-table">
      <thead>
        <tr>
          <th class="${sortClass('title')}" onclick="sortByColumn('title')">Title</th>
          <th class="${sortClass('category')}" onclick="sortByColumn('category')">Category</th>
          <th class="${sortClass('difficulty')}" onclick="sortByColumn('difficulty')">Difficulty</th>
          <th class="${sortClass('rating')}" onclick="sortByColumn('rating')">Rating</th>
          <th class="${sortClass('createdAt')}" onclick="sortByColumn('createdAt')">Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

function renderPagination(page, totalPages, totalResources) {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '<div class="pagination">';

  // Previous button
  html += `<button ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">← Prev</button>`;

  // Page numbers with ellipsis
  const pages = buildPageNumbers(page, totalPages);
  pages.forEach((p) => {
    if (p === '...') {
      html += '<span class="page-info">…</span>';
    } else {
      html += `<button class="${p === page ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    }
  });

  // Next button
  html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>`;

  html += '</div>';
  paginationContainer.innerHTML = html;
}

function buildPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

function goToPage(page) {
  currentPage = page;
  fetchResources({ immediate: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFilters() {
  clearTimeout(searchDebounceTimer);
  document.getElementById('search').value = '';
  document.getElementById('category').value  = '';
  document.getElementById('difficulty').value = '';
  currentPage = 1;
  currentSortBy = 'createdAt';
  currentSortOrder = 'desc';
  updateSearchClearVisibility();
  updateFilterChips();
  fetchResources({ immediate: true });
}

function clearSearchOnly() {
  clearTimeout(searchDebounceTimer);
  document.getElementById('search').value = '';
  currentPage = 1;
  updateSearchClearVisibility();
  fetchResources({ immediate: true });
}

async function deleteResource(id) {
  const ok = await confirmModal('Delete this resource?', 'This action cannot be undone. The resource will be permanently removed.');
  if (!ok) return;

  try {
    const res  = await fetch(`/api/resources/${id}`, {
      method: 'DELETE',
      headers: Auth.authHeaders(),
    });

    if (Auth.handleUnauthorized(res)) return;

    const json = await res.json();

    if (json.success) {
      Toast.success('Resource deleted successfully!');
      userBookmarks.delete(id);
      fetchResources(); // Refresh the list
    } else {
      Toast.error(json.error || 'Failed to delete resource');
    }
  } catch {
    Toast.error('Network error. Please try again.');
  }
}

// ─── Bookmark Functions ────────────────────────────────────────

async function loadUserBookmarks() {
  try {
    const res = await fetch('/api/resources/bookmarks', { headers: Auth.authHeaders() });
    if (Auth.handleUnauthorized(res)) return;
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      userBookmarks = new Set(json.data.map((r) => r._id));
    }
  } catch {
    // Silently fail — bookmarks are non-critical
  }
}

async function toggleBookmark(id) {
  if (!Auth.isLoggedIn()) {
    Toast.warning('Please log in to bookmark resources.');
    return;
  }

  try {
    const res = await fetch(`/api/resources/${id}/bookmark`, {
      method: 'POST',
      headers: Auth.authHeaders(),
    });

    if (Auth.handleUnauthorized(res)) return;
    const json = await res.json();

    if (json.success) {
      if (json.bookmarked) {
        userBookmarks.add(id);
        Toast.success('Bookmark added!');
      } else {
        userBookmarks.delete(id);
        Toast.info('Bookmark removed.');
      }

      // Re-render: if in bookmarks-only mode and we removed one, re-fetch
      if (showBookmarksOnly && !json.bookmarked) {
        fetchBookmarkedResources();
      } else {
        // Just update the button states without full re-fetch
        updateBookmarkButtons();
      }
    } else {
      Toast.error(json.error || 'Failed to toggle bookmark');
    }
  } catch {
    Toast.error('Network error. Please try again.');
  }
}

function updateBookmarkButtons() {
  document.querySelectorAll('.bookmark-btn').forEach((btn) => {
    const onclick = btn.getAttribute('onclick');
    const match = onclick && onclick.match(/toggleBookmark\('([^']+)'\)/);
    if (match) {
      const id = match[1];
      const isBookmarked = userBookmarks.has(id);
      btn.classList.toggle('bookmarked', isBookmarked);
      btn.textContent = isBookmarked ? '★' : '☆';
      btn.title = isBookmarked ? 'Remove bookmark' : 'Add bookmark';
    }
  });
}

function toggleBookmarkFilter() {
  showBookmarksOnly = !showBookmarksOnly;
  const btn = document.getElementById('bookmarkToggleBtn');
  if (showBookmarksOnly) {
    btn.classList.add('active');
    fetchBookmarkedResources();
  } else {
    btn.classList.remove('active');
    currentPage = 1;
    fetchResources({ immediate: true });
  }
}

async function fetchBookmarkedResources() {
  const container = document.getElementById('resources-container');
  const paginationContainer = document.getElementById('pagination-container');
  container.innerHTML = '<p class="loading">Loading bookmarks...</p>';
  if (paginationContainer) paginationContainer.innerHTML = '';
  setSearchStatus('Loading your bookmarked resources...');

  try {
    const res = await fetch('/api/resources/bookmarks', { headers: Auth.authHeaders() });
    if (Auth.handleUnauthorized(res)) return;
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Failed to load bookmarks');

    const search = document.getElementById('search').value.trim();
    renderTable(json.data, search);

    if (json.data.length === 0) {
      setSearchStatus('You have no bookmarked resources yet.');
    } else {
      setSearchStatus(`Showing ${json.data.length} bookmarked resource${json.data.length !== 1 ? 's' : ''}.`);
    }
  } catch (err) {
    setSearchStatus('Failed to load bookmarks.');
    container.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
  }
}

// ─── Export Functions ────────────────────────────────────────

function setupExport() {
  if (!Auth.isLoggedIn()) return;

  const exportBar = document.getElementById('export-bar');
  if (exportBar) exportBar.style.display = '';

  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      var isOpen = exportMenu.classList.toggle('show');
      if (isOpen) {
        var rect = exportBtn.getBoundingClientRect();
        exportMenu.style.left = (rect.right + 8) + 'px';
        exportMenu.style.top = rect.top + 'px';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.sidebar-export-wrap')) {
        exportMenu.classList.remove('show');
      }
    });
  }
}

async function exportResources(format) {
  const exportMenu = document.getElementById('exportMenu');
  if (exportMenu) exportMenu.classList.remove('show');

  const { params } = buildParamsFromFilters();
  params.set('format', format);
  // Remove pagination params — export all matching resources
  params.delete('page');
  params.delete('limit');
  params.delete('sortBy');
  params.delete('sortOrder');

  try {
    const res = await fetch('/api/resources/export?' + params.toString(), {
      headers: Auth.authHeaders(),
    });

    if (Auth.handleUnauthorized(res)) return;

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Export failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resources_export.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    Toast.success(`Resources exported as ${format.toUpperCase()} successfully!`);
  } catch (err) {
    Toast.error(err.message || 'Export failed. Please try again.');
  }
}

// ─── Skeleton Loading ───────────────────────────────────────

function renderSkeletonRows(count) {
  let html = '<div class="skeleton-table">';
  html += '<div class="skeleton-header"><span class="skeleton-cell w-40"></span><span class="skeleton-cell w-15"></span><span class="skeleton-cell w-15"></span><span class="skeleton-cell w-10"></span><span class="skeleton-cell w-20"></span></div>';
  for (let i = 0; i < count; i++) {
    html += `<div class="skeleton-row">
      <span class="skeleton-cell w-40"></span>
      <span class="skeleton-cell w-15"></span>
      <span class="skeleton-cell w-15"></span>
      <span class="skeleton-cell w-10"></span>
      <span class="skeleton-cell w-20"></span>
    </div>`;
  }
  html += '</div>';
  return html;
}

// ─── Keyboard Shortcuts ─────────────────────────────────────

document.addEventListener('keydown', (e) => {
  // Ctrl+K or Cmd+K → focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchEl = document.getElementById('search');
    if (searchEl) searchEl.focus();
  }
});

// ─── Filter Bar Toggle & Chips (P4) ────────────────────────

function initFilterBar() {
  const filterBar = document.getElementById('filter-bar');
  const filterHeader = document.getElementById('filter-header');
  if (!filterBar || !filterHeader) return;

  filterHeader.addEventListener('click', () => {
    filterBar.classList.toggle('filter-open');
  });
}

function updateFilterChips() {
  const chipsContainer = document.getElementById('filter-chips');
  if (!chipsContainer) return;

  const search = document.getElementById('search').value.trim();
  const category = document.getElementById('category').value;
  const difficulty = document.getElementById('difficulty').value;

  let chips = '';
  let count = 0;

  if (search) {
    count++;
    chips += `<span class="filter-chip">Search: "${escapeHtml(search)}" <button class="filter-chip-remove" onclick="removeFilterChip('search')" title="Remove">&times;</button></span>`;
  }
  if (category) {
    count++;
    chips += `<span class="filter-chip">${escapeHtml(category)} <button class="filter-chip-remove" onclick="removeFilterChip('category')" title="Remove">&times;</button></span>`;
  }
  if (difficulty) {
    count++;
    chips += `<span class="filter-chip">${escapeHtml(difficulty)} <button class="filter-chip-remove" onclick="removeFilterChip('difficulty')" title="Remove">&times;</button></span>`;
  }

  chipsContainer.innerHTML = chips;
  chipsContainer.classList.toggle('has-chips', count > 0);

  // Update badge
  const badge = document.getElementById('filter-count-badge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }
}

function removeFilterChip(type) {
  if (type === 'search') {
    document.getElementById('search').value = '';
    updateSearchClearVisibility();
  } else if (type === 'category') {
    document.getElementById('category').value = '';
  } else if (type === 'difficulty') {
    document.getElementById('difficulty').value = '';
  }
  currentPage = 1;
  fetchResources({ immediate: true });
}

// Init filter bar toggle on load
document.addEventListener('DOMContentLoaded', initFilterBar);

// ─── Hero Banner (P6) ──────────────────────────────────────

let heroStatsPopulated = false;

function initHeroBanner() {
  const user = Auth.getUser();
  const titleEl = document.getElementById('hero-title');
  const subtitleEl = document.getElementById('hero-subtitle');
  const ctaEl = document.getElementById('hero-cta');

  if (user) {
    titleEl.textContent = `Welcome back, ${user.username}!`;
    subtitleEl.textContent = 'Your curated developer resources at a glance.';
    ctaEl.innerHTML = '';
  } else {
    titleEl.textContent = 'Developer Resource Manager';
    subtitleEl.textContent = 'Curate, organize and share the best developer resources in one place.';
    ctaEl.innerHTML = '<a href="/register.html" class="btn">Get Started Free</a>';
  }
}

function updateHeroStats(totalResources) {
  if (heroStatsPopulated) return;
  heroStatsPopulated = true;
  const statsEl = document.getElementById('hero-stats');
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="hero-stat"><span class="hero-stat-value">${totalResources}</span><span class="hero-stat-label">Resources</span></div>
    <div class="hero-stat"><span class="hero-stat-value">5</span><span class="hero-stat-label">Categories</span></div>
    <div class="hero-stat"><span class="hero-stat-value">3</span><span class="hero-stat-label">Difficulty Levels</span></div>`;
}
