// UI Utilities
export const ui = {
  showLoading() {
    document.getElementById('loading').classList.remove('hidden');
  },

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  },

  formatNumber(num) {
    return num.toLocaleString();
  },

  createModal(title, content) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close on click outside or close button
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.matches('.modal-close')) {
        overlay.remove();
      }
    });

    return overlay;
  }
};
