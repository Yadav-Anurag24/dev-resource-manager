// ============================
// Shared Auth Utility (auth.js)
// ============================
// Provides token management, user info, and auth-aware navbar rendering.
// Include this script BEFORE page-specific JS on every page.

const Auth = (function () {
  const TOKEN_KEY = 'drm-token';
  const USER_KEY = 'drm-user';

  // --- Token Management ---

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (_) {
      return null;
    }
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveAuth(token, user) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_) {
      // Ignore storage failures
    }
  }

  function clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_) {
      // Ignore
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
  }

  // --- Auth Headers for fetch ---

  function authHeaders() {
    const token = getToken();
    if (!token) return {};
    return { 'Authorization': 'Bearer ' + token };
  }

  // --- Logout ---

  function logout() {
    clearAuth();
    window.location.href = '/login.html';
  }

  // --- Handle 401 responses globally ---

  function handleUnauthorized(res) {
    if (res.status === 401) {
      clearAuth();
      window.location.href = '/login.html';
      return true;
    }
    return false;
  }

  // --- Require auth (redirect if not logged in) ---

  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  // --- Update Navbar for auth state ---

  function updateNavbar() {
    var authArea = document.getElementById('topbar-auth-area');
    if (!authArea) return;

    // Clear existing auth content
    authArea.innerHTML = '';

    // Show/hide "Add Resource" sidebar link based on auth state
    var addResourceNav = document.getElementById('nav-add-resource');
    if (addResourceNav) {
      addResourceNav.style.display = isLoggedIn() ? '' : 'none';
    }

    var user = getUser();

    if (user && getToken()) {
      // Logged in: show avatar dropdown
      authArea.innerHTML =
        '<div class="user-dropdown-wrap">' +
          '<button class="user-avatar-btn" id="user-avatar-btn" type="button" title="' + escapeHtmlAttr(user.username) + '">' +
            escapeHtmlAttr(user.username.charAt(0).toUpperCase()) +
          '</button>' +
          '<div class="user-dropdown" id="user-dropdown">' +
            '<div class="user-dropdown-header">' +
              '<span class="user-dropdown-name">' + escapeHtmlAttr(user.username) + '</span>' +
              '<span class="user-dropdown-email">' + escapeHtmlAttr(user.email) + '</span>' +
              (user.role === 'admin' ? '<span class="user-dropdown-badge">Admin</span>' : '') +
            '</div>' +
            '<div class="user-dropdown-body">' +
              '<a href="/profile.html" class="user-dropdown-item">Profile</a>' +
              '<a href="/" class="user-dropdown-item">My Resources</a>' +
              '<a href="/dashboard.html" class="user-dropdown-item">Dashboard</a>' +
              '<a href="#" class="user-dropdown-item logout-item" id="dropdown-logout-btn">Logout</a>' +
            '</div>' +
          '</div>' +
        '</div>';

      var logoutBtn = document.getElementById('dropdown-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          logout();
        });
      }
    } else {
      // Not logged in: show login + register buttons
      authArea.innerHTML =
        '<div class="topbar-auth-links">' +
          '<a href="/login.html" class="btn btn-sm btn-primary">Login</a>' +
          '<a href="/register.html" class="btn btn-sm btn-secondary">Register</a>' +
        '</div>';
    }
  }

  function escapeHtmlAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Auto-update navbar on DOM ready
  document.addEventListener('DOMContentLoaded', updateNavbar);

  // Public API
  return {
    getToken,
    getUser,
    saveAuth,
    clearAuth,
    isLoggedIn,
    isAdmin,
    authHeaders,
    logout,
    handleUnauthorized,
    requireAuth,
    updateNavbar,
  };
})();
