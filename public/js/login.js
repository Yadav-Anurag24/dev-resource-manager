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
  // If already logged in, redirect to home
  if (Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  document.getElementById('login-form').addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();

  const errorBox  = document.getElementById('error-box');
  const submitBtn = document.getElementById('submit-btn');

  errorBox.style.display = 'none';

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Client-side validation
  const clientErrors = [];
  if (!email) clientErrors.push('Email is required');
  if (!password) clientErrors.push('Password is required');

  if (clientErrors.length > 0) {
    errorBox.innerHTML =
      '<strong>Please fix the following:</strong><ul>' +
      clientErrors.map(err => `<li>${escapeHtml(err)}</li>`).join('') +
      '</ul>';
    errorBox.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (json.success && json.token) {
      Auth.saveAuth(json.token, json.user);
      sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Welcome back, ' + (json.user.username || '') + '!' }));
      window.location.href = '/';
    } else {
      const errors = json.errors || [json.error || 'Login failed'];
      errorBox.innerHTML =
        '<strong>Login failed:</strong><ul>' +
        errors.map(err => `<li>${escapeHtml(err)}</li>`).join('') +
        '</ul>';
      errorBox.style.display = 'block';
    }
  } catch {
    errorBox.textContent = 'Network error. Please check your connection and try again.';
    errorBox.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}
