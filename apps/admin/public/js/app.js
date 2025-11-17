// Main Application
import { auth } from './auth.js';
import { router } from './router.js';
import { ui } from './ui.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    // Check authentication status
    const isAuthenticated = await auth.checkAuth();

    if (isAuthenticated) {
      this.showDashboard();
    } else {
      this.showLogin();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.handleLogout();
      });
    }

    // Navigation links
    document.addEventListener('click', (e) => {
      if (e.target.matches('.nav-link')) {
        e.preventDefault();
        const page = e.target.dataset.page;
        router.navigate(page);

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
        });
        e.target.classList.add('active');
      }
    });
  }

  async handleLogin(e) {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    try {
      ui.showLoading();
      const result = await auth.login(username, password);

      if (result.success) {
        this.showDashboard();
        router.navigate('overview');
      }
    } catch (error) {
      errorEl.textContent = error.message || 'Login failed';
    } finally {
      ui.hideLoading();
    }
  }

  async handleLogout() {
    try {
      await auth.logout();
      this.showLogin();
    } catch (error) {
      ui.showToast('Logout failed', 'error');
    }
  }

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');

    // Set username
    const username = auth.getUsername();
    document.getElementById('admin-username').textContent = username;

    // Load initial page
    router.navigate('overview');
  }
}

// Start the application
new App();
