// Router Module
import { pages } from './pages/index.js';

export const router = {
  currentPage: null,

  navigate(pageName) {
    const page = pages[pageName];

    if (!page) {
      console.error(`Page not found: ${pageName}`);
      return;
    }

    this.currentPage = pageName;
    this.renderPage(page);
  },

  async renderPage(page) {
    const container = document.getElementById('content-container');
    container.innerHTML = '<div class="spinner"></div>';

    try {
      const content = await page.render();
      container.innerHTML = content;

      // Call page init if it exists
      if (page.init) {
        page.init();
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      container.innerHTML = `
        <div class="card">
          <h2>Error</h2>
          <p>Failed to load page: ${error.message}</p>
        </div>
      `;
    }
  }
};
