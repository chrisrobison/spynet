// Missions Management Page
import { ui } from '../ui.js';

export const missionsPage = {
  async render() {
    const missions = await this.fetchMissions();

    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">🎯 Mission Management</h1>
          <button class="btn btn-primary" onclick="window.createMission()">+ Create Mission</button>
        </div>

        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Zone</th>
                  <th>Issuer</th>
                  <th>Assignments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${missions.map(mission => `
                  <tr>
                    <td><strong>${mission.title}</strong></td>
                    <td><span class="badge badge-secondary">${mission.kind}</span></td>
                    <td>${'⭐'.repeat(mission.difficulty)}</td>
                    <td>${mission.zone || 'Any'}</td>
                    <td>${mission.issuer}</td>
                    <td>${mission.current_assignments}/${mission.max_assignments}</td>
                    <td>${this.renderMissionStatus(mission)}</td>
                    <td class="actions">
                      <button class="btn-icon" onclick="window.viewMission('${mission.id}')">👁️</button>
                      <button class="btn-icon" onclick="window.deleteMission('${mission.id}')">🗑️</button>
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

  renderMissionStatus(mission) {
    if (mission.expires_at && new Date(mission.expires_at) < new Date()) {
      return '<span class="badge badge-danger">Expired</span>';
    }
    if (mission.current_assignments >= mission.max_assignments) {
      return '<span class="badge badge-warning">Full</span>';
    }
    return '<span class="badge badge-success">Active</span>';
  },

  async fetchMissions() {
    return [
      {
        id: '1',
        title: 'Operation Midnight Oracle',
        kind: 'qr_scan',
        difficulty: 3,
        zone: 'Mission District',
        issuer: 'ai',
        current_assignments: 2,
        max_assignments: 5,
        expires_at: new Date(Date.now() + 86400000).toISOString()
      },
      {
        id: '2',
        title: 'Surveillance Protocol Alpha',
        kind: 'surveillance',
        difficulty: 4,
        zone: 'SoMa',
        issuer: 'system',
        current_assignments: 1,
        max_assignments: 3,
        expires_at: new Date(Date.now() + 172800000).toISOString()
      },
      {
        id: '3',
        title: 'Cipher Challenge Delta',
        kind: 'cipher',
        difficulty: 5,
        zone: null,
        issuer: 'ai',
        current_assignments: 8,
        max_assignments: 10,
        expires_at: new Date(Date.now() + 259200000).toISOString()
      }
    ];
  },

  init() {
    window.createMission = () => ui.showToast('Create mission functionality coming soon', 'warning');
    window.viewMission = (id) => ui.showToast('View mission functionality coming soon', 'warning');
    window.deleteMission = (id) => {
      if (confirm('Delete this mission?')) {
        ui.showToast('Mission deleted', 'success');
      }
    };
  }
};
