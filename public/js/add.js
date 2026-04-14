// Escape HTML to prevent XSS when injecting into innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  // Require authentication to add resources
  if (!Auth.requireAuth()) return;

  document.getElementById('add-form').addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
  e.preventDefault();

  const errorBox  = document.getElementById('error-box');
  const submitBtn = document.getElementById('submit-btn');

  // Clear previous errors
  errorBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.classList.add('btn-loading');
  submitBtn.textContent = 'Creating...';

  const resourceFileInput = document.getElementById('resourceFile');
  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('difficulty', document.getElementById('difficulty').value);
  formData.append('link', document.getElementById('link').value);
  formData.append('tags', document.getElementById('tags').value);
  formData.append('rating', document.getElementById('rating').value);

  if (resourceFileInput.files && resourceFileInput.files[0]) {
    formData.append('resourceFile', resourceFileInput.files[0]);
  }

  try {
    const res  = await fetch('/api/resources', {
      method:  'POST',
      headers: Auth.authHeaders(),
      body: formData,
    });
    const json = await res.json();

    if (Auth.handleUnauthorized(res)) return;

    if (json.success) {
      sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Resource created successfully!' }));
      window.location.href = '/';
    } else {
      // Show validation errors
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
    submitBtn.disabled  = false;
    submitBtn.classList.remove('btn-loading');
    submitBtn.textContent = 'Create Resource';
  }
}
