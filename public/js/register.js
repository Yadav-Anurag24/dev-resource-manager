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

  document.getElementById('register-form').addEventListener('submit', handleRegister);
});

async function handleRegister(e) {
  e.preventDefault();

  const errorBox  = document.getElementById('error-box');
  const submitBtn = document.getElementById('submit-btn');

  errorBox.style.display = 'none';

  const username        = document.getElementById('username').value.trim();
  const email           = document.getElementById('email').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Client-side validation
  const clientErrors = [];
  if (!username) clientErrors.push('Username is required');
  if (!email) clientErrors.push('Email is required');
  if (password.length < 6) clientErrors.push('Password must be at least 6 characters');
  if (password !== confirmPassword) clientErrors.push('Passwords do not match');

  if (clientErrors.length > 0) {
    errorBox.innerHTML =
      '<strong>Please fix the following:</strong><ul>' +
      clientErrors.map(err => `<li>${escapeHtml(err)}</li>`).join('') +
      '</ul>';
    errorBox.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const json = await res.json();

    if (json.success && json.token) {
      Auth.saveAuth(json.token, json.user);
      window.location.href = '/';
    } else {
      const errors = json.errors || [json.error || 'Registration failed'];
      errorBox.innerHTML =
        '<strong>Registration failed:</strong><ul>' +
        errors.map(err => `<li>${escapeHtml(err)}</li>`).join('') +
        '</ul>';
      errorBox.style.display = 'block';
    }
  } catch {
    errorBox.textContent = 'Network error. Please check your connection and try again.';
    errorBox.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Register';
  }
}
