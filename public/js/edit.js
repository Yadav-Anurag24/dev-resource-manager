// Read the resource ID from the URL query string: /edit.html?id=<id>
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

document.addEventListener('DOMContentLoaded', () => {
  // Require authentication to edit resources
  if (!Auth.requireAuth()) return;

  if (!resourceId) {
    showError('No resource ID in URL. Go back and try again.');
    return;
  }
  loadResource();
  document.getElementById('edit-form').addEventListener('submit', handleSubmit);
});

// ---------- Load existing resource data into the form ----------
async function loadResource() {
  try {
    const res  = await fetch(`/api/resources/${resourceId}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Resource not found');

    const r = json.data;

    // Hide loading, show form
    document.getElementById('page-loading').style.display = 'none';
    document.getElementById('edit-form').style.display    = 'block';

    // Populate fields
    document.getElementById('title').value       = r.title;
    document.getElementById('description').value = r.description;
    document.getElementById('category').value    = r.category;
    document.getElementById('difficulty').value  = r.difficulty;
    document.getElementById('link').value        = r.link;
    document.getElementById('tags').value        = r.tags ? r.tags.join(', ') : '';
    document.getElementById('rating').value      = r.rating;
    document.getElementById('existingFilePath').value = r.filePath || '';

    const fileInfo = document.getElementById('current-file-info');
    if (r.filePath) {
      fileInfo.innerHTML = `Current file: <a href="${r.filePath}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.fileName || 'Download attachment')}</a>`;
      fileInfo.style.display = 'block';
    } else {
      fileInfo.style.display = 'none';
    }

    // Update cancel link to go back to this resource's detail page
    document.getElementById('cancel-link').href = `/details.html?id=${r._id}`;
    document.title = `Edit: ${r.title} – DRM`;

  } catch (err) {
    showError(err.message);
  }
}

// ---------- Submit updated data ----------
async function handleSubmit(e) {
  e.preventDefault();

  const errorBox  = document.getElementById('error-box');
  const submitBtn = document.getElementById('submit-btn');

  errorBox.style.display  = 'none';
  submitBtn.disabled      = true;
  submitBtn.textContent   = 'Updating...';

  const resourceFileInput = document.getElementById('resourceFile');
  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('difficulty', document.getElementById('difficulty').value);
  formData.append('link', document.getElementById('link').value);
  formData.append('tags', document.getElementById('tags').value);
  formData.append('rating', document.getElementById('rating').value);
  formData.append('existingFilePath', document.getElementById('existingFilePath').value);

  if (resourceFileInput.files && resourceFileInput.files[0]) {
    formData.append('resourceFile', resourceFileInput.files[0]);
  }

  try {
    // Native fetch supports PUT — no method-override needed
    const res  = await fetch(`/api/resources/${resourceId}`, {
      method:  'PUT',
      headers: Auth.authHeaders(),
      body: formData,
    });
    const json = await res.json();

    if (Auth.handleUnauthorized(res)) return;

    if (json.success) {
      window.location.href = `/details.html?id=${resourceId}`;
    } else {
      const errors = json.errors || [json.error || 'Something went wrong'];
      errorBox.innerHTML =
        '<strong>Please fix the following errors:</strong><ul>' +
        errors.map((err) => `<li>${escapeHtml(err)}</li>`).join('') +
        '</ul>';
      errorBox.style.display = 'block';
    }
  } catch {
    errorBox.textContent = 'Network error. Please check your connection and try again.';
    errorBox.style.display = 'block';
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Update Resource';
  }
}

function showError(msg) {
  document.getElementById('page-loading').style.display = 'none';
  const errorBox = document.getElementById('error-box');
  errorBox.textContent   = msg;
  errorBox.style.display = 'block';
}
