function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let currentPage = 1;
const PAGE_LIMIT = 25;

const actionIcons = {
  CREATE: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️',
  LOGIN: '🔑',
  REGISTER: '👤',
  RESTORE: '♻️',
};

const actionColors = {
  CREATE: 'var(--success, #22c55e)',
  UPDATE: 'var(--primary, #3b82f6)',
  DELETE: 'var(--danger, #ef4444)',
  LOGIN: 'var(--warning, #f59e0b)',
  REGISTER: '#8b5cf6',
  RESTORE: '#14b8a6',
};

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    document.getElementById('page-loading').style.display = 'none';
    showError('Access denied. Admin privileges required.');
    return;
  }

  document.getElementById('filterBtn').addEventListener('click', () => { currentPage = 1; fetchLogs(); });
  document.getElementById('clearBtn').addEventListener('click', clearFilters);

  fetchLogs();
});

async function fetchLogs() {
  const container = document.getElementById('audit-container');
  const loadingEl = document.getElementById('page-loading');
  loadingEl.style.display = 'block';
  container.innerHTML = '';

  const action = document.getElementById('action-filter').value;
  const from = document.getElementById('from-date').value;
  const to = document.getElementById('to-date').value;

  const params = new URLSearchParams();
  if (action) params.set('action', action);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('page', currentPage);
  params.set('limit', PAGE_LIMIT);

  try {
    const res = await fetch('/api/audit-log?' + params.toString(), {
      headers: Auth.authHeaders(),
    });

    if (Auth.handleUnauthorized(res)) return;

    const json = await res.json();
    loadingEl.style.display = 'none';

    if (!json.success) throw new Error(json.error || 'Failed to load activity log');

    if (json.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><h2>No activity recorded</h2><p>Actions will appear here as users interact with the app.</p></div>';
      return;
    }

    renderTimeline(json.data);
    renderPagination(json.currentPage, json.totalPages);
  } catch (err) {
    document.getElementById('page-loading').style.display = 'none';
    showError(err.message);
  }
}

function renderTimeline(logs) {
  const container = document.getElementById('audit-container');

  const items = logs.map((log) => {
    const icon = actionIcons[log.action] || '📋';
    const color = actionColors[log.action] || 'var(--text-light)';
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const resourceLink = log.resourceId && log.action !== 'DELETE'
      ? `<a href="/details.html?id=${log.resourceId}">${escapeHtml(log.resourceTitle || 'View resource')}</a>`
      : (log.resourceTitle ? `<span class="muted-text">${escapeHtml(log.resourceTitle)}</span>` : '');

    return `
      <div class="audit-item">
        <div class="audit-icon" style="background: ${color}">${icon}</div>
        <div class="audit-body">
          <div class="audit-header">
            <strong>${escapeHtml(log.username)}</strong>
            <span class="badge badge-${log.action.toLowerCase()}">${log.action}</span>
            <time class="audit-time">${timeStr}</time>
          </div>
          <div class="audit-detail">
            ${resourceLink}
            ${log.details ? `<span class="muted-text"> — ${escapeHtml(log.details)}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `<div class="audit-timeline">${items}</div>`;
}

function renderPagination(page, totalPages) {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  let html = '<div class="pagination">';
  html += `<button ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">← Prev</button>`;
  html += `<span class="page-info">Page ${page} of ${totalPages}</span>`;
  html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>`;
  html += '</div>';
  paginationContainer.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  fetchLogs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFilters() {
  document.getElementById('action-filter').value = '';
  document.getElementById('from-date').value = '';
  document.getElementById('to-date').value = '';
  currentPage = 1;
  fetchLogs();
}

function showError(msg) {
  const errorBox = document.getElementById('error-box');
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}
