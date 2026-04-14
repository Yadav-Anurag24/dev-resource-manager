// ============================
// Toast Notification System
// ============================
// Pure CSS + JS toast notifications. Include this script on every page.
// Usage:  Toast.success('Resource created!');
//         Toast.error('Something went wrong');
//         Toast.warning('Are you sure?');
//         Toast.info('Tip: you can search by tags');

const Toast = (function () {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  const icons = {
    success: '&#10003;',
    error: '&#10007;',
    warning: '&#9888;',
    info: '&#8505;',
  };

  function show(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon">' + (icons[type] || '') + '</span>' +
      '<span class="toast-msg">' + escapeHtml(message) + '</span>' +
      '<button class="toast-close" aria-label="Close">&times;</button>';

    // Close on click
    toast.querySelector('.toast-close').addEventListener('click', function () {
      dismiss(toast);
    });

    getContainer().appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(function () {
      toast.classList.add('toast-visible');
    });

    // Auto dismiss
    var timer = setTimeout(function () {
      dismiss(toast);
    }, duration);

    // Pause timer on hover
    toast.addEventListener('mouseenter', function () {
      clearTimeout(timer);
    });
    toast.addEventListener('mouseleave', function () {
      timer = setTimeout(function () {
        dismiss(toast);
      }, 2000);
    });
  }

  function dismiss(toast) {
    if (toast.classList.contains('toast-exiting')) return;
    toast.classList.add('toast-exiting');
    toast.addEventListener('animationend', function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Check for flash messages from redirects
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var flash = sessionStorage.getItem('toast');
      if (flash) {
        sessionStorage.removeItem('toast');
        var data = JSON.parse(flash);
        if (data && data.message) {
          show(data.message, data.type || 'info');
        }
      }
    } catch (e) {
      // Ignore malformed flash data
    }
  });

  return {
    success: function (msg, duration) { show(msg, 'success', duration); },
    error:   function (msg, duration) { show(msg, 'error', duration); },
    warning: function (msg, duration) { show(msg, 'warning', duration); },
    info:    function (msg, duration) { show(msg, 'info', duration); },
    show:    show,
  };
})();
