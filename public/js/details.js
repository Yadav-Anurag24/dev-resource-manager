// Read the resource ID from URL: /details.html?id=<id>
const resourceId = new URLSearchParams(window.location.search).get('id');

// Escape HTML to prevent XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Return a safe href — only allow http/https URLs
function safeHref(url) {
  const clean = String(url).trim();
  return /^https?:\/\//i.test(clean) ? clean : '#';
}

function renderStars(rating, showNumeric = false) {
  const filled = '<svg class="star-icon star-filled" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const empty  = '<svg class="star-icon star-empty"  viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  let html = '<span class="star-group">';
  for (let i = 1; i <= 5; i++) html += i <= rating ? filled : empty;
  if (showNumeric) html += `<span class="star-numeric">${rating}/5</span>`;
  html += '</span>';
  return html;
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown size';

  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;

  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!resourceId) {
    showError('No resource ID in URL. Go back and try again.');
    return;
  }
  loadResource();
});

async function loadResource() {
  try {
    const res  = await fetch(`/api/resources/${resourceId}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Resource not found');
    renderDetails(json.data);
    loadBookmarkState();
  } catch (err) {
    showError(err.message);
  }
}

function renderDetails(r) {
  document.getElementById('page-loading').style.display = 'none';
  document.title = `${r.title} – DRM`;

  // Breadcrumb
  const breadcrumbEl = document.getElementById('breadcrumb');
  if (breadcrumbEl) {
    breadcrumbEl.innerHTML = `<a href="/">Resources</a><span class="breadcrumb-sep">›</span><span class="breadcrumb-current">${escapeHtml(r.title)}</span>`;
  }

  // Tags
  const tagsHtml = r.tags && r.tags.length > 0
    ? r.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    : '<span style="color:var(--text-light)">No tags</span>';

  // Updated date row (only if different from created)
  const updatedHtml =
    r.updatedAt && new Date(r.updatedAt).getTime() !== new Date(r.createdAt).getTime()
      ? `<div class="detail-field">
           <strong>Last Updated</strong>
           <p>${new Date(r.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
         </div>`
      : '';

  const linkHtml = r.link
    ? `<div class="detail-field">
         <strong>Resource Link</strong>
         <p>
           <a href="${safeHref(r.link)}" target="_blank" rel="noopener noreferrer">
             ${escapeHtml(r.link)}
           </a>
         </p>
       </div>`
    : `<div class="detail-field">
         <strong>Resource Link</strong>
         <p class="muted-text">No external link provided.</p>
       </div>`;

  const attachmentHtml = r.filePath
    ? `<div class="detail-field">
         <strong>Uploaded File</strong>
         <p>
           <a href="${r.filePath}" target="_blank" rel="noopener noreferrer" download>
             ${escapeHtml(r.fileName || 'Download attachment')}
           </a>
         </p>
         <p class="muted-text">${escapeHtml(r.fileMimeType || 'Unknown file type')} • ${formatFileSize(r.fileSize)}</p>
       </div>`
    : `<div class="detail-field">
         <strong>Uploaded File</strong>
         <p class="muted-text">No file uploaded.</p>
       </div>`;

  // Ownership check: show Edit/Delete only for resource owner or admin
  const currentUser = Auth.getUser();
  const ownerId = r.owner && r.owner._id ? r.owner._id : (r.owner || '');
  const canModify = currentUser && (currentUser.id === ownerId || currentUser.role === 'admin');

  const ownerHtml = r.owner && r.owner.username
    ? `<div class="detail-field">
         <strong>Added By</strong>
         <p>${escapeHtml(r.owner.username)}${r.owner.role === 'admin' ? ' <span class="badge badge-admin">Admin</span>' : ''}</p>
       </div>`
    : '';

  const editBtn = canModify
    ? `<a href="/edit.html?id=${r._id}" class="btn btn-primary">Edit</a>`
    : '';
  const deleteBtn = canModify
    ? `<button onclick="deleteResource('${r._id}')" class="btn btn-danger">Delete</button>`
    : '';

  // Bookmark button (only for logged-in users)
  const bookmarkBtnHtml = currentUser
    ? `<button id="detail-bookmark-btn" class="bookmark-btn" onclick="toggleBookmark('${r._id}')" title="Toggle bookmark">☆</button>`
    : '';

  const content = document.getElementById('detail-content');
  content.style.display = 'block';
  content.innerHTML = `
    <div class="detail-header-row">
      <h1>${escapeHtml(r.title)}</h1>
      ${bookmarkBtnHtml}
    </div>

    <div class="detail-meta">
      <span class="badge badge-${r.category.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(r.category)}</span>
      <span class="badge badge-${r.difficulty.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(r.difficulty)}</span>
      <span class="rating">${renderStars(r.rating, true)}</span>
    </div>

    <div class="detail-field">
      <strong>Description</strong>
      <p class="detail-description">${escapeHtml(r.description)}</p>
    </div>

    ${linkHtml}

    ${attachmentHtml}

    <div class="detail-field">
      <strong>Tags</strong>
      <div class="detail-tags">${tagsHtml}</div>
    </div>

    ${ownerHtml}

    <div class="detail-field">
      <strong>Created</strong>
      <p>${new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    ${updatedHtml}

    <div class="detail-actions">
      ${editBtn}
      ${deleteBtn}
      <a href="/" class="btn btn-secondary">Back to List</a>
    </div>`;
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
      sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Resource deleted successfully!' }));
      window.location.href = '/';
    } else {
      Toast.error(json.error || 'Failed to delete resource');
    }
  } catch {
    Toast.error('Network error. Please try again.');
  }
}

function showError(msg) {
  document.getElementById('page-loading').style.display = 'none';
  const errorBox = document.getElementById('error-box');
  errorBox.textContent   = msg;
  errorBox.style.display = 'block';
}

// ─── Bookmark Functions ────────────────────────────────────────

async function loadBookmarkState() {
  if (!Auth.isLoggedIn() || !resourceId) return;
  try {
    const res = await fetch('/api/resources/bookmarks', { headers: Auth.authHeaders() });
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const isBookmarked = json.data.some((r) => r._id === resourceId);
      const btn = document.getElementById('detail-bookmark-btn');
      if (btn) {
        btn.classList.toggle('bookmarked', isBookmarked);
        btn.textContent = isBookmarked ? '★' : '☆';
        btn.title = isBookmarked ? 'Remove bookmark' : 'Add bookmark';
      }
    }
  } catch {
    // Non-critical — ignore
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
      const btn = document.getElementById('detail-bookmark-btn');
      if (btn) {
        btn.classList.toggle('bookmarked', json.bookmarked);
        btn.textContent = json.bookmarked ? '★' : '☆';
        btn.title = json.bookmarked ? 'Remove bookmark' : 'Add bookmark';
      }
      if (json.bookmarked) {
        Toast.success('Bookmark added!');
      } else {
        Toast.info('Bookmark removed.');
      }
    } else {
      Toast.error(json.error || 'Failed to toggle bookmark');
    }
  } catch {
    Toast.error('Network error. Please try again.');
  }
}
