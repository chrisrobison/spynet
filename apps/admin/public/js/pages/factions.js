// Factions Management Page
import { ui } from '../ui.js';

export const factionsPage = {
  async render() {
    const factions = await this.fetchFactions();

    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">⚔️ Faction Management</h1>
        </div>

        <div class="card-grid">
          ${factions.map(faction => `
            <div class="card">
              <div style="text-align: center; margin-bottom: 1rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: ${faction.color_primary}; margin: 0 auto 1rem;"></div>
                <h3>${faction.name}</h3>
                <p style="color: var(--color-text-muted); font-size: 0.875rem;">${faction.description}</p>
              </div>
              <hr style="border: none; border-top: 1px solid var(--color-border); margin: 1rem 0;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700;">${faction.members}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted);">MEMBERS</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700;">${faction.zones}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted);">ZONES</div>
                </div>
              </div>
              <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;" onclick="window.editFaction('${faction.code}')">
                Edit Faction
              </button>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <h2 class="card-title">Faction Stats</h2>
          <table>
            <thead>
              <tr>
                <th>Faction</th>
                <th>Members</th>
                <th>Zones Controlled</th>
                <th>Total XP</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              ${factions.map(faction => `
                <tr>
                  <td>
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${faction.color_primary}; margin-right: 8px;"></span>
                    ${faction.name}
                  </td>
                  <td>${ui.formatNumber(faction.members)}</td>
                  <td>${faction.zones}</td>
                  <td>${ui.formatNumber(faction.totalXP)}</td>
                  <td>${faction.winRate}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async fetchFactions() {
    return [
      {
        code: 'obsidian',
        name: 'The Obsidian Order',
        description: 'Masters of deception and psychological warfare',
        color_primary: '#1a1a1a',
        members: 412,
        zones: 15,
        totalXP: 8234500,
        winRate: 62
      },
      {
        code: 'aurora',
        name: 'The Aurora Syndicate',
        description: 'Tech anarchists exposing global secrets',
        color_primary: '#00ffff',
        members: 445,
        zones: 18,
        totalXP: 8956700,
        winRate: 68
      },
      {
        code: 'citadel',
        name: 'The Citadel Directorate',
        description: 'Military precision and iron discipline',
        color_primary: '#003d5c',
        members: 390,
        zones: 14,
        totalXP: 7892300,
        winRate: 59
      }
    ];
  },

  init() {
    window.editFaction = (code) => {
      ui.showToast('Edit faction functionality coming soon', 'warning');
    };
  }
};
