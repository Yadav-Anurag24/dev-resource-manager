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

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) stars += i <= rating ? '★' : '☆';
  return stars;
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
  } catch (err) {
    showError(err.message);
  }
}

function renderDetails(r) {
  document.getElementById('page-loading').style.display = 'none';
  document.title = `${r.title} – DRM`;

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

  const content = document.getElementById('detail-content');
  content.style.display = 'block';
  content.innerHTML = `
    <h1>${escapeHtml(r.title)}</h1>

    <div class="detail-meta">
      <span class="badge badge-${r.category.toLowerCase()}">${escapeHtml(r.category)}</span>
      <span class="badge badge-${r.difficulty.toLowerCase()}">${escapeHtml(r.difficulty)}</span>
      <span class="rating">${renderStars(r.rating)} (${r.rating}/5)</span>
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

    <div class="detail-field">
      <strong>Created</strong>
      <p>${new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    ${updatedHtml}

    <div class="detail-actions">
      <a href="/edit.html?id=${r._id}" class="btn btn-primary">Edit</a>
      <button onclick="deleteResource('${r._id}')" class="btn btn-danger">Delete</button>
      <a href="/" class="btn btn-secondary">Back to List</a>
    </div>`;
}

async function deleteResource(id) {
  if (!confirm('Are you sure you want to delete this resource?')) return;

  try {
    const res  = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
    const json = await res.json();

    if (json.success) {
      window.location.href = '/';
    } else {
      alert('Error: ' + (json.error || 'Failed to delete'));
    }
  } catch {
    alert('Network error. Please try again.');
  }
}

function showError(msg) {
  document.getElementById('page-loading').style.display = 'none';
  const errorBox = document.getElementById('error-box');
  errorBox.textContent   = msg;
  errorBox.style.display = 'block';
}
