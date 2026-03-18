(function () {
  const THEME_KEY = 'drm-theme';

  function getStoredTheme() {
    try {
      const theme = localStorage.getItem(THEME_KEY);
      return theme === 'dark' || theme === 'light' ? theme : null;
    } catch (_) {
      return null;
    }
  }

  function getPreferredTheme() {
    const storedTheme = getStoredTheme();
    if (storedTheme) return storedTheme;

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }
  }

  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {
      // Ignore storage failures in private browsing or restricted modes.
    }
  }

  function updateToggleButton(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const isDark = theme === 'dark';
    toggleBtn.textContent = isDark ? 'Light' : 'Dark';
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    toggleBtn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    setTheme(nextTheme);
    updateToggleButton(nextTheme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const activeTheme = getPreferredTheme();
    applyTheme(activeTheme);
    updateToggleButton(activeTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
  });
})();
