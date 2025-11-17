// Authentication Module
export const auth = {
  currentUser: null,

  async login(username, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    this.currentUser = data.username;
    return data;
  },

  async logout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });

    if (response.ok) {
      this.currentUser = null;
    }
  },

  async checkAuth() {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();

      if (data.authenticated) {
        this.currentUser = data.username;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  getUsername() {
    return this.currentUser;
  }
};
