// Zones Management Page
import { ui } from '../ui.js';

export const zonesPage = {
  async render() {
    const zones = await this.fetchZones();

    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">🗺️ Zone Management</h1>
          <button class="btn btn-primary" onclick="window.createZone()">+ Create Zone</button>
        </div>

        <div class="filters">
          <select id="city-filter" class="form-control">
            <option value="all">All Cities</option>
            <option value="san-francisco">San Francisco</option>
            <option value="oakland">Oakland</option>
            <option value="berkeley">Berkeley</option>
          </select>
          <select id="zone-type-filter" class="form-control">
            <option value="all">All Types</option>
            <option value="micro">Micro (Landmarks)</option>
            <option value="meso">Meso (Neighborhoods)</option>
            <option value="macro">Macro (Districts)</option>
          </select>
          <select id="control-filter" class="form-control">
            <option value="all">All Factions</option>
            <option value="obsidian">Obsidian Order</option>
            <option value="aurora">Aurora Syndicate</option>
            <option value="citadel">Citadel Directorate</option>
            <option value="contested">Contested</option>
          </select>
        </div>

        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>City</th>
                  <th>Type</th>
                  <th>Controlled By</th>
                  <th>Control Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${zones.map(zone => `
                  <tr>
                    <td><strong>${zone.name}</strong></td>
                    <td>${zone.city}</td>
                    <td><span class="badge badge-secondary">${zone.zone_type}</span></td>
                    <td>${this.renderControlFaction(zone.control_faction)}</td>
                    <td>
                      <div style="font-size: 0.75rem;">
                        <div>🖤 ${zone.control_score.obsidian}</div>
                        <div>💙 ${zone.control_score.aurora}</div>
                        <div>🛡️ ${zone.control_score.citadel}</div>
                      </div>
                    </td>
                    <td>${zone.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}</td>
                    <td class="actions">
                      <button class="btn-icon" onclick="window.viewZone('${zone.id}')" title="View">👁️</button>
                      <button class="btn-icon" onclick="window.editZone('${zone.id}')" title="Edit">✏️</button>
                      <button class="btn-icon" onclick="window.deleteZone('${zone.id}')" title="Delete">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderControlFaction(faction) {
    if (!faction) return '<span class="badge badge-warning">Contested</span>';

    const factionColors = {
      'obsidian': '#1a1a1a',
      'aurora': '#00ffff',
      'citadel': '#003d5c'
    };

    return `
      <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${factionColors[faction]};"></span>
        ${faction.charAt(0).toUpperCase() + faction.slice(1)}
      </span>
    `;
  },

  async fetchZones() {
    return [
      {
        id: '1',
        name: 'Ferry Building',
        city: 'San Francisco',
        zone_type: 'micro',
        control_faction: 'aurora',
        control_score: { obsidian: 320, aurora: 890, citadel: 450 },
        is_active: true
      },
      {
        id: '2',
        name: 'Mission District',
        city: 'San Francisco',
        zone_type: 'meso',
        control_faction: 'obsidian',
        control_score: { obsidian: 1200, aurora: 780, citadel: 650 },
        is_active: true
      },
      {
        id: '3',
        name: 'SoMa',
        city: 'San Francisco',
        zone_type: 'meso',
        control_faction: null,
        control_score: { obsidian: 540, aurora: 520, citadel: 510 },
        is_active: true
      },
      {
        id: '4',
        name: 'Golden Gate Park',
        city: 'San Francisco',
        zone_type: 'macro',
        control_faction: 'citadel',
        control_score: { obsidian: 450, aurora: 620, citadel: 1100 },
        is_active: true
      }
    ];
  },

  init() {
    window.createZone = () => ui.showToast('Create zone functionality coming soon', 'warning');
    window.viewZone = (id) => ui.showToast('View zone functionality coming soon', 'warning');
    window.editZone = (id) => ui.showToast('Edit zone functionality coming soon', 'warning');
    window.deleteZone = (id) => {
      if (confirm('Delete this zone?')) {
        ui.showToast('Zone deleted', 'success');
      }
    };
  }
};
