// ─── Profile Page Logic ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;

  loadProfile();

  document.getElementById('username-form').addEventListener('submit', handleUsernameUpdate);
  document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
});

async function loadProfile() {
  try {
    const res = await fetch('/api/auth/profile', { headers: Auth.authHeaders() });
    if (Auth.handleUnauthorized(res)) return;
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Failed to load profile');

    const d = json.data;

    // Avatar initials
    const initials = d.username
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    document.getElementById('profile-avatar').textContent = initials;

    document.getElementById('profile-name').textContent = d.username;
    document.getElementById('profile-email').textContent = d.email;

    const roleEl = document.getElementById('profile-role');
    roleEl.textContent = d.role === 'admin' ? 'Admin' : 'User';
    roleEl.className = 'profile-role badge-' + d.role;

    document.getElementById('stat-resources').textContent = d.resourceCount;
    document.getElementById('stat-bookmarks').textContent = d.bookmarkCount;

    const joinDate = new Date(d.joinDate);
    document.getElementById('stat-joined').textContent = joinDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    // Pre-fill username field
    document.getElementById('new-username').value = d.username;
  } catch (err) {
    Toast.error(err.message || 'Failed to load profile');
  }
}

async function handleUsernameUpdate(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const username = document.getElementById('new-username').value.trim();

  if (!username || username.length < 2) {
    Toast.warning('Username must be at least 2 characters.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...Auth.authHeaders() },
      body: JSON.stringify({ username }),
    });

    if (Auth.handleUnauthorized(res)) return;
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Failed to update username');

    // Update local storage so the navbar reflects the change
    const currentUser = Auth.getUser();
    Auth.saveAuth(Auth.getToken(), { ...currentUser, username: json.data.username });
    Auth.updateNavbar();

    document.getElementById('profile-name').textContent = json.data.username;

    // Update avatar initials
    const initials = json.data.username
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    document.getElementById('profile-avatar').textContent = initials;

    Toast.success('Username updated successfully!');
  } catch (err) {
    Toast.error(err.message || 'Failed to update username');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Username';
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    Toast.warning('All password fields are required.');
    return;
  }

  if (newPassword.length < 6) {
    Toast.warning('New password must be at least 6 characters.');
    return;
  }

  if (newPassword !== confirmPassword) {
    Toast.warning('New passwords do not match.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Changing...';

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...Auth.authHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (Auth.handleUnauthorized(res)) return;
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Failed to change password');

    Toast.success('Password changed successfully!');
    document.getElementById('password-form').reset();
  } catch (err) {
    Toast.error(err.message || 'Failed to change password');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Change Password';
  }
}
