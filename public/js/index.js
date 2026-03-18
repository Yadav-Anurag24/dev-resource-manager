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

  const searchInput = document.getElementById('search');

  // Event listeners
  document.getElementById('filterBtn').addEventListener('click', () => fetchResources({ immediate: true }));
  document.getElementById('clearBtn').addEventListener('click', clearFilters);
  document.getElementById('searchClearBtn').addEventListener('click', clearSearchOnly);
  document.getElementById('category').addEventListener('change', () => fetchResources({ immediate: true }));
  document.getElementById('difficulty').addEventListener('change', () => fetchResources({ immediate: true }));

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchResources({ immediate: true });
    }
  });

  searchInput.addEventListener('input', () => {
    updateSearchClearVisibility();

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      fetchResources({ immediate: true });
    }, 280);
  });

  window.addEventListener('popstate', () => {
    const latestParams = new URLSearchParams(window.location.search);
    document.getElementById('search').value = latestParams.get('search') || '';
    document.getElementById('category').value = latestParams.get('category') || '';
    document.getElementById('difficulty').value = latestParams.get('difficulty') || '';
    updateSearchClearVisibility();
    fetchResources({ syncUrl: false, immediate: true });
  });

  updateSearchClearVisibility();
  fetchResources({ immediate: true });
});

async function fetchResources(options = {}) {
  const { syncUrl = true } = options;
  const requestId = ++activeRequestId;
  const { params, search, category, difficulty } = buildParamsFromFilters();

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

    const activeFilters = [search, category, difficulty].filter(Boolean).length;
    if (json.data.length === 0) {
      setSearchStatus(activeFilters > 0 ? 'No resources matched your current filters.' : 'No resources found yet.');
    } else {
      const suffix = json.data.length === 1 ? 'resource' : 'resources';
      setSearchStatus(`Showing ${json.data.length} ${suffix}.`);
    }
  } catch (err) {
    if (requestId !== activeRequestId) return;
    setSearchStatus('Search failed. Please try again.');
    container.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
  }
}

function renderTable(resources, searchTerm) {
  const container = document.getElementById('resources-container');

  if (resources.length === 0) {
    const message = searchTerm
      ? `No resources matched "${escapeHtml(searchTerm)}".`
      : 'Start building your developer resource library by adding your first resource.';

    container.innerHTML = `
      <div class="empty-state">
        <h2>No resources found</h2>
        <p>${message}</p>
        <a href="/add.html" class="btn btn-primary">+ Add Your First Resource</a>
      </div>`;
    return;
  }

  const rows = resources.map((r) => `
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
          <a href="/edit.html?id=${r._id}" class="btn btn-secondary btn-sm">Edit</a>
          <button onclick="deleteResource('${r._id}')" class="btn btn-danger btn-sm">Delete</button>
        </div>
      </td>
    </tr>`).join('');

  container.innerHTML = `
    <table class="resource-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Difficulty</th>
          <th>Rating</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function clearFilters() {
  clearTimeout(searchDebounceTimer);
  document.getElementById('search').value = '';
  document.getElementById('category').value  = '';
  document.getElementById('difficulty').value = '';
  updateSearchClearVisibility();
  fetchResources({ immediate: true });
}

function clearSearchOnly() {
  clearTimeout(searchDebounceTimer);
  document.getElementById('search').value = '';
  updateSearchClearVisibility();
  fetchResources({ immediate: true });
}

async function deleteResource(id) {
  if (!confirm('Are you sure you want to delete this resource?')) return;

  try {
    const res  = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
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
