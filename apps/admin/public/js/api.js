// API Client Module
export const api = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // Players
  async getPlayers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/players?${params}`);
  },

  async getPlayer(id) {
    return this.request(`/players/${id}`);
  },

  async updatePlayer(id, data) {
    return this.request(`/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async suspendPlayer(id) {
    return this.request(`/players/${id}/suspend`, {
      method: 'POST'
    });
  },

  async banPlayer(id) {
    return this.request(`/players/${id}/ban`, {
      method: 'POST'
    });
  },

  // Factions
  async getFactions() {
    return this.request('/factions');
  },

  async updateFaction(id, data) {
    return this.request(`/factions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Zones
  async getZones(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/zones?${params}`);
  },

  async getZone(id) {
    return this.request(`/zones/${id}`);
  },

  async createZone(data) {
    return this.request('/zones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateZone(id, data) {
    return this.request(`/zones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteZone(id) {
    return this.request(`/zones/${id}`, {
      method: 'DELETE'
    });
  },

  // Missions
  async getMissions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/missions?${params}`);
  },

  async getMission(id) {
    return this.request(`/missions/${id}`);
  },

  async createMission(data) {
    return this.request('/missions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteMission(id) {
    return this.request(`/missions/${id}`, {
      method: 'DELETE'
    });
  },

  // QR Codes
  async getQRCodes(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/qr-codes?${params}`);
  },

  async createQRCode(data) {
    return this.request('/qr-codes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteQRCode(id) {
    return this.request(`/qr-codes/${id}`, {
      method: 'DELETE'
    });
  },

  // Stats
  async getStats() {
    return this.request('/stats');
  }
};
