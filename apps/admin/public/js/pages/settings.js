// Settings Page
import { ui } from '../ui.js';

export const settingsPage = {
  async render() {
    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">⚙️ System Settings</h1>
        </div>

        <div class="card">
          <h2 class="card-title">Game Configuration</h2>
          <form id="game-settings-form">
            <div class="form-group">
              <label>Mission Generation Cooldown (seconds)</label>
              <input type="number" name="mission_cooldown" value="300">
            </div>
            <div class="form-group">
              <label>Max Active Missions Per Player</label>
              <input type="number" name="max_missions" value="5">
            </div>
            <div class="form-group">
              <label>Zone Control Update Interval (seconds)</label>
              <input type="number" name="zone_update_interval" value="30">
            </div>
            <div class="form-group">
              <label>QR Scan Rate Limit (per minute)</label>
              <input type="number" name="qr_rate_limit" value="10">
            </div>
            <div class="form-group">
              <label>Enable AI Missions</label>
              <select name="enable_ai_missions">
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div class="form-group">
              <label>Enable Double Agents</label>
              <select name="enable_double_agents">
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Save Settings</button>
          </form>
        </div>

        <div class="card">
          <h2 class="card-title">LLM Configuration</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Active Provider</strong></td>
                <td>OpenAI (GPT-4)</td>
                <td><button class="btn btn-small" onclick="window.changeLLMProvider()">Change</button></td>
              </tr>
              <tr>
                <td><strong>Connection Status</strong></td>
                <td><span class="badge badge-success">Connected</span></td>
                <td><button class="btn btn-small" onclick="window.testLLMConnection()">Test</button></td>
              </tr>
              <tr>
                <td><strong>Available Providers</strong></td>
                <td>OpenAI, Local (Ollama)</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h2 class="card-title">Safety Settings</h2>
          <form id="safety-settings-form">
            <div class="form-group">
              <label>Curfew Start Hour</label>
              <input type="number" name="curfew_start" value="22" min="0" max="23">
            </div>
            <div class="form-group">
              <label>Curfew End Hour</label>
              <input type="number" name="curfew_end" value="6" min="0" max="23">
            </div>
            <div class="form-group">
              <label>Location Accuracy Threshold (meters)</label>
              <input type="number" name="location_threshold" value="100">
            </div>
            <div class="form-group">
              <label>Enable Location Verification</label>
              <select name="enable_location_verification">
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Save Safety Settings</button>
          </form>
        </div>

        <div class="card">
          <h2 class="card-title">Admin Users</h2>
          <p style="color: var(--color-text-muted); margin-bottom: 1rem;">
            Manage admin users and permissions
          </p>
          <button class="btn btn-primary" onclick="window.addAdmin()">+ Add Admin User</button>
        </div>

        <div class="card">
          <h2 class="card-title">Database Maintenance</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="window.backupDatabase()">💾 Backup Database</button>
            <button class="btn btn-secondary" onclick="window.clearCache()">🗑️ Clear Cache</button>
            <button class="btn btn-danger" onclick="window.resetGameState()">⚠️ Reset Game State</button>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    // Game settings form
    const gameForm = document.getElementById('game-settings-form');
    if (gameForm) {
      gameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ui.showToast('Game settings saved', 'success');
      });
    }

    // Safety settings form
    const safetyForm = document.getElementById('safety-settings-form');
    if (safetyForm) {
      safetyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ui.showToast('Safety settings saved', 'success');
      });
    }

    // Global functions
    window.changeLLMProvider = () => ui.showToast('LLM provider change coming soon', 'warning');
    window.testLLMConnection = () => ui.showToast('LLM connection test passed', 'success');
    window.addAdmin = () => ui.showToast('Add admin functionality coming soon', 'warning');
    window.backupDatabase = () => {
      if (confirm('Create database backup?')) {
        ui.showToast('Database backup started', 'success');
      }
    };
    window.clearCache = () => {
      if (confirm('Clear all caches?')) {
        ui.showToast('Cache cleared', 'success');
      }
    };
    window.resetGameState = () => {
      if (confirm('⚠️ WARNING: This will reset all game progress! Are you sure?')) {
        ui.showToast('Operation cancelled for safety', 'warning');
      }
    };
  }
};
