// Overview/Dashboard Page
import { api } from '../api.js';
import { ui } from '../ui.js';

export const overviewPage = {
  async render() {
    // Fetch stats (these endpoints don't exist yet, will return mock data for now)
    const stats = await this.fetchStats();

    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">📊 Dashboard Overview</h1>
          <button class="btn btn-primary" onclick="location.reload()">🔄 Refresh</button>
        </div>

        <div class="card-grid">
          <div class="stat-card">
            <div class="stat-value">${ui.formatNumber(stats.totalPlayers)}</div>
            <div class="stat-label">Total Players</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${ui.formatNumber(stats.activePlayers)}</div>
            <div class="stat-label">Active Players (24h)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${ui.formatNumber(stats.totalMissions)}</div>
            <div class="stat-label">Active Missions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${ui.formatNumber(stats.totalZones)}</div>
            <div class="stat-label">Controlled Zones</div>
          </div>
        </div>

        <div class="card">
          <h2 class="card-title">Faction Status</h2>
          <div class="faction-stats">
            <table>
              <thead>
                <tr>
                  <th>Faction</th>
                  <th>Members</th>
                  <th>Zones Controlled</th>
                  <th>Active Missions</th>
                </tr>
              </thead>
              <tbody>
                ${stats.factions.map(faction => `
                  <tr>
                    <td>
                      <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${faction.color}; margin-right: 8px;"></span>
                      ${faction.name}
                    </td>
                    <td>${ui.formatNumber(faction.members)}</td>
                    <td>${ui.formatNumber(faction.zones)}</td>
                    <td>${ui.formatNumber(faction.missions)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h2 class="card-title">Recent Activity</h2>
          <div class="activity-feed">
            ${stats.recentActivity.map(activity => `
              <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--color-border);">
                <div style="font-weight: 500;">${activity.message}</div>
                <div style="font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                  ${ui.formatDate(activity.timestamp)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <h2 class="card-title">System Status</h2>
          <table>
            <tbody>
              <tr>
                <td>API Server</td>
                <td><span class="badge badge-success">Operational</span></td>
              </tr>
              <tr>
                <td>Database</td>
                <td><span class="badge badge-success">Operational</span></td>
              </tr>
              <tr>
                <td>LLM Orchestrator</td>
                <td><span class="badge badge-${stats.llmStatus === 'connected' ? 'success' : 'warning'}">${stats.llmStatus}</span></td>
              </tr>
              <tr>
                <td>Redis Cache</td>
                <td><span class="badge badge-success">Operational</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async fetchStats() {
    // TODO: Replace with real API calls
    // For now, return mock data
    return {
      totalPlayers: 1247,
      activePlayers: 324,
      totalMissions: 89,
      totalZones: 42,
      factions: [
        { name: 'The Obsidian Order', color: '#1a1a1a', members: 412, zones: 15, missions: 28 },
        { name: 'The Aurora Syndicate', color: '#00ffff', members: 445, zones: 18, missions: 31 },
        { name: 'The Citadel Directorate', color: '#003d5c', members: 390, zones: 14, missions: 30 }
      ],
      recentActivity: [
        { message: 'New player registered: Agent_Phoenix', timestamp: new Date(Date.now() - 300000).toISOString() },
        { message: 'Zone captured: Mission District (Aurora Syndicate)', timestamp: new Date(Date.now() - 600000).toISOString() },
        { message: 'Mission completed: Operation Midnight Oracle', timestamp: new Date(Date.now() - 900000).toISOString() },
        { message: 'Player reported: Suspicious activity in SoMa', timestamp: new Date(Date.now() - 1200000).toISOString() },
        { message: 'System: Daily backup completed', timestamp: new Date(Date.now() - 1800000).toISOString() }
      ],
      llmStatus: 'connected'
    };
  },

  init() {
    // Page-specific initialization if needed
  }
};
