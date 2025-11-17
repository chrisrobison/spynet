// QR Codes Management Page
import { ui } from '../ui.js';

export const qrCodesPage = {
  async render() {
    const qrCodes = await this.fetchQRCodes();

    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">📱 QR Code Management</h1>
          <button class="btn btn-primary" onclick="window.createQRCode()">+ Generate QR Code</button>
        </div>

        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Reward</th>
                  <th>Scans</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${qrCodes.map(qr => `
                  <tr>
                    <td><code>${qr.id.substring(0, 8)}...</code></td>
                    <td><span class="badge badge-secondary">${qr.type}</span></td>
                    <td>${qr.location}</td>
                    <td>${qr.reward_xp} XP</td>
                    <td>${qr.scan_count}</td>
                    <td>${qr.expires_at ? ui.formatDate(qr.expires_at) : 'Never'}</td>
                    <td>${this.renderQRStatus(qr)}</td>
                    <td class="actions">
                      <button class="btn-icon" onclick="window.downloadQR('${qr.id}')" title="Download">⬇️</button>
                      <button class="btn-icon" onclick="window.viewQRStats('${qr.id}')" title="Stats">📊</button>
                      <button class="btn-icon" onclick="window.deleteQR('${qr.id}')" title="Delete">🗑️</button>
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

  renderQRStatus(qr) {
    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      return '<span class="badge badge-danger">Expired</span>';
    }
    if (!qr.is_active) {
      return '<span class="badge badge-secondary">Inactive</span>';
    }
    return '<span class="badge badge-success">Active</span>';
  },

  async fetchQRCodes() {
    return [
      {
        id: 'qr-' + Math.random().toString(36).substring(7),
        type: 'mission',
        location: 'Ferry Building',
        reward_xp: 250,
        scan_count: 34,
        is_active: true,
        expires_at: null
      },
      {
        id: 'qr-' + Math.random().toString(36).substring(7),
        type: 'intel',
        location: 'Dolores Park',
        reward_xp: 150,
        scan_count: 18,
        is_active: true,
        expires_at: new Date(Date.now() + 604800000).toISOString()
      },
      {
        id: 'qr-' + Math.random().toString(36).substring(7),
        type: 'drop',
        location: 'Golden Gate Park',
        reward_xp: 300,
        scan_count: 7,
        is_active: false,
        expires_at: null
      }
    ];
  },

  init() {
    window.createQRCode = () => ui.showToast('Generate QR code functionality coming soon', 'warning');
    window.downloadQR = (id) => ui.showToast('Download QR code functionality coming soon', 'warning');
    window.viewQRStats = (id) => ui.showToast('QR stats functionality coming soon', 'warning');
    window.deleteQR = (id) => {
      if (confirm('Delete this QR code?')) {
        ui.showToast('QR code deleted', 'success');
      }
    };
  }
};
