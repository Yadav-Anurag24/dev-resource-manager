(function () {
  var SIDEBAR_KEY = 'drm-sidebar';

  function isDesktop() {
    return window.innerWidth > 768;
  }

  function getStoredState() {
    try {
      return localStorage.getItem(SIDEBAR_KEY);
    } catch (_) {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(SIDEBAR_KEY, state);
    } catch (_) {}
  }

  function initSidebar() {
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    var toggleBtn = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggleBtn) return;

    // Transfer early FOUC class to body
    if (document.documentElement.classList.contains('sidebar-will-collapse')) {
      document.body.classList.add('sidebar-collapsed');
      document.documentElement.classList.remove('sidebar-will-collapse');
    } else if (isDesktop() && getStoredState() === 'collapsed') {
      document.body.classList.add('sidebar-collapsed');
    }

    // Set active sidebar link based on current page
    var path = window.location.pathname;
    var links = sidebar.querySelectorAll('.sidebar-link');
    links.forEach(function (link) {
      var page = link.getAttribute('data-page');
      var isActive =
        (page === 'resources' && (path === '/' || path === '/index.html')) ||
        (page === 'add' && path === '/add.html') ||
        (page === 'dashboard' && path === '/dashboard.html');
      if (isActive) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle button
    toggleBtn.addEventListener('click', function () {
      if (isDesktop()) {
        document.body.classList.toggle('sidebar-collapsed');
        saveState(document.body.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded');
      } else {
        sidebar.classList.toggle('sidebar-mobile-open');
        if (backdrop) backdrop.classList.toggle('active');
      }
    });

    // Backdrop click closes mobile sidebar
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('sidebar-mobile-open');
        backdrop.classList.remove('active');
      });
    }

    // Close mobile sidebar on nav link click
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        if (!isDesktop()) {
          sidebar.classList.remove('sidebar-mobile-open');
          if (backdrop) backdrop.classList.remove('active');
        }
      });
    });

    // Avatar dropdown
    initAvatarDropdown();

    // Handle resize
    window.addEventListener('resize', function () {
      if (isDesktop()) {
        sidebar.classList.remove('sidebar-mobile-open');
        if (backdrop) backdrop.classList.remove('active');
      }
    });
  }

  function initAvatarDropdown() {
    var avatarBtn = document.getElementById('user-avatar-btn');
    var dropdown = document.getElementById('user-dropdown');
    if (!avatarBtn || !dropdown) return;

    avatarBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
      avatarBtn.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.user-dropdown-wrap')) {
        if (dropdown) dropdown.classList.remove('open');
        if (avatarBtn) avatarBtn.classList.remove('active');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initSidebar);
})();
