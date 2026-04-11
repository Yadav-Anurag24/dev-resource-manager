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
    const navList = document.querySelector('.navbar-nav');
    if (!navList) return;

    // Remove any existing auth links (to avoid duplicates on re-render)
    navList.querySelectorAll('.auth-nav-item').forEach(el => el.remove());

    // Show/hide "Add Resource" nav link based on auth state
    const addResourceNav = document.getElementById('nav-add-resource');
    if (addResourceNav) {
      addResourceNav.style.display = isLoggedIn() ? '' : 'none';
    }

    const user = getUser();
    const themeToggleLi = navList.querySelector('li:has(#theme-toggle)') || navList.lastElementChild;

    if (user && getToken()) {
      // Logged in: show username + logout
      const userLi = document.createElement('li');
      userLi.className = 'auth-nav-item';
      userLi.innerHTML = `<span class="nav-user-badge" title="${escapeHtmlAttr(user.email)}">
        <span class="nav-user-avatar">${escapeHtmlAttr(user.username.charAt(0).toUpperCase())}</span>
        ${escapeHtmlAttr(user.username)}${user.role === 'admin' ? ' <span class="badge badge-admin">Admin</span>' : ''}
      </span>`;
      navList.insertBefore(userLi, themeToggleLi);

      const logoutLi = document.createElement('li');
      logoutLi.className = 'auth-nav-item';
      logoutLi.innerHTML = `<a href="#" id="logout-btn" class="nav-logout-link">Logout</a>`;
      navList.insertBefore(logoutLi, themeToggleLi);

      logoutLi.querySelector('#logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    } else {
      // Not logged in: show login + register
      const loginLi = document.createElement('li');
      loginLi.className = 'auth-nav-item';
      loginLi.innerHTML = '<a href="/login.html">Login</a>';
      navList.insertBefore(loginLi, themeToggleLi);

      const registerLi = document.createElement('li');
      registerLi.className = 'auth-nav-item';
      registerLi.innerHTML = '<a href="/register.html">Register</a>';
      navList.insertBefore(registerLi, themeToggleLi);
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
