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

// Render a 1–5 star rating string
function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? '★' : '☆';
  }
  return stars;
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
  document.getElementById('filterBtn').addEventListener('click', () => { currentPage = 1; fetchResources({ immediate: true }); });
  document.getElementById('clearBtn').addEventListener('click', clearFilters);
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
  fetchResources({ immediate: true });

  // Hide "Add Resource" button in page header if not logged in
  const addBtn = document.querySelector('.page-header .btn-primary');
  if (addBtn && !Auth.isLoggedIn()) {
    addBtn.style.display = 'none';
  }
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

  const container = document.getElementById('resources-container');
  container.innerHTML = '<p class="loading">Loading resources...</p>';
  setSearchStatus(search ? `Searching for "${search}"...` : 'Loading resources...');

  try {
    const res  = await fetch('/api/resources?' + params.toString());
    const json = await res.json();

    if (requestId !== activeRequestId) return;
    if (!json.success) throw new Error(json.error || 'Failed to load resources');

    renderTable(json.data, search);
    renderPagination(json.currentPage, json.totalPages, json.totalResources);

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

    return `
    <tr>
      <td>
        <a href="/details.html?id=${r._id}">${highlightMatch(r.title, searchTerm)}</a>
        ${renderSourceBadges(r)}
      </td>
      <td><span class="badge badge-${r.category.toLowerCase()}">${escapeHtml(r.category)}</span></td>
      <td><span class="badge badge-${r.difficulty.toLowerCase()}">${escapeHtml(r.difficulty)}</span></td>
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
    </table>`;
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
  if (!confirm('Are you sure you want to delete this resource?')) return;

  try {
    const res  = await fetch(`/api/resources/${id}`, {
      method: 'DELETE',
      headers: Auth.authHeaders(),
    });

    if (Auth.handleUnauthorized(res)) return;

    const json = await res.json();

    if (json.success) {
      fetchResources(); // Refresh the list
    } else {
      alert('Error: ' + (json.error || 'Failed to delete'));
    }
  } catch {
    alert('Network error. Please try again.');
  }
}
