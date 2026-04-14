// ─── Shared Confirm Modal ──────────────────────────────────
// Replaces window.confirm() with a styled modal.
// Usage:  const ok = await confirmModal('Delete this resource?', 'This action cannot be undone.');

(function () {
  // Inject modal HTML once
  const modalHtml = `
    <div class="confirm-overlay" id="confirm-modal" style="display:none;">
      <div class="confirm-box">
        <p class="confirm-title" id="confirm-title"></p>
        <p class="confirm-message" id="confirm-message"></p>
        <div class="confirm-actions">
          <button class="btn btn-secondary btn-sm" id="confirm-cancel">Cancel</button>
          <button class="btn btn-danger btn-sm" id="confirm-ok">Confirm</button>
        </div>
      </div>
    </div>`;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('confirm-modal');
        if (modal && modal.style.display !== 'none') {
          modal.style.display = 'none';
          if (window._confirmReject) window._confirmReject();
        }
      }
    });
  });

  window.confirmModal = function (title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      document.getElementById('confirm-title').textContent = title || 'Are you sure?';
      document.getElementById('confirm-message').textContent = message || '';
      modal.style.display = 'flex';

      window._confirmReject = () => resolve(false);

      const onOk = () => { cleanup(); modal.style.display = 'none'; resolve(true); };
      const onCancel = () => { cleanup(); modal.style.display = 'none'; resolve(false); };

      function cleanup() {
        document.getElementById('confirm-ok').removeEventListener('click', onOk);
        document.getElementById('confirm-cancel').removeEventListener('click', onCancel);
      }

      document.getElementById('confirm-ok').addEventListener('click', onOk);
      document.getElementById('confirm-cancel').addEventListener('click', onCancel);
    });
  };
})();
