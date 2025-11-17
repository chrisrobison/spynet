// Players Management Page
import { api } from '../api.js';
import { ui } from '../ui.js';

export const playersPage = {
  players: [],
  currentFilter: 'all',
  searchQuery: '',

  async render() {
    this.players = await this.fetchPlayers();

    return `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">👥 Player Management</h1>
        </div>

        <div class="filters">
          <div class="search-box">
            <input
              type="text"
              id="player-search"
              placeholder="Search players by handle, email..."
              value="${this.searchQuery}"
            >
          </div>
          <select id="status-filter" class="form-control">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <select id="faction-filter" class="form-control">
            <option value="all">All Factions</option>
            <option value="obsidian">Obsidian Order</option>
            <option value="aurora">Aurora Syndicate</option>
            <option value="citadel">Citadel Directorate</option>
            <option value="none">Independent</option>
          </select>
        </div>

        <div class="card">
          <div class="table-container">
            <table id="players-table">
              <thead>
                <tr>
                  <th>Handle</th>
                  <th>Faction</th>
                  <th>Rank</th>
                  <th>XP</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderPlayers()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderPlayers() {
    const filtered = this.filterPlayers();

    if (filtered.length === 0) {
      return '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No players found</td></tr>';
    }

    return filtered.map(player => `
      <tr>
        <td>
          <strong>${player.handle}</strong>
          ${player.is_double_agent ? '<span style="color: var(--color-warning); margin-left: 0.5rem;" title="Double Agent">🕵️</span>' : ''}
        </td>
        <td>${this.renderFaction(player.faction)}</td>
        <td>${player.rank}</td>
        <td>${ui.formatNumber(player.xp)}</td>
        <td>${this.renderStatus(player.status)}</td>
        <td>${ui.formatDate(player.created_at)}</td>
        <td class="actions">
          <button class="btn-icon" onclick="window.viewPlayer('${player.id}')" title="View">👁️</button>
          <button class="btn-icon" onclick="window.editPlayer('${player.id}')" title="Edit">✏️</button>
          <button class="btn-icon" onclick="window.suspendPlayer('${player.id}')" title="Suspend">⛔</button>
        </td>
      </tr>
    `).join('');
  },

  renderFaction(faction) {
    if (!faction) return '<span class="badge badge-secondary">Independent</span>';

    const factionColors = {
      'obsidian': '#1a1a1a',
      'aurora': '#00ffff',
      'citadel': '#003d5c'
    };

    const color = factionColors[faction] || '#666';
    return `
      <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
        ${faction.charAt(0).toUpperCase() + faction.slice(1)}
      </span>
    `;
  },

  renderStatus(status) {
    const statusMap = {
      active: 'success',
      suspended: 'warning',
      banned: 'danger'
    };

    return `<span class="badge badge-${statusMap[status] || 'secondary'}">${status}</span>`;
  },

  filterPlayers() {
    return this.players.filter(player => {
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        if (!player.handle.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (this.currentFilter !== 'all' && player.status !== this.currentFilter) {
        return false;
      }

      return true;
    });
  },

  async fetchPlayers() {
    // TODO: Replace with real API call
    // Mock data for now
    return [
      {
        id: '1',
        handle: 'Agent_Phoenix',
        faction: 'aurora',
        rank: 15,
        xp: 12450,
        status: 'active',
        is_double_agent: false,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: '2',
        handle: 'Shadow_Walker',
        faction: 'obsidian',
        rank: 22,
        xp: 18900,
        status: 'active',
        is_double_agent: true,
        created_at: new Date(Date.now() - 86400000 * 60).toISOString()
      },
      {
        id: '3',
        handle: 'Commander_Steel',
        faction: 'citadel',
        rank: 28,
        xp: 25600,
        status: 'active',
        is_double_agent: false,
        created_at: new Date(Date.now() - 86400000 * 90).toISOString()
      },
      {
        id: '4',
        handle: 'Ghost_Ops',
        faction: null,
        rank: 8,
        xp: 4200,
        status: 'suspended',
        is_double_agent: false,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString()
      },
      {
        id: '5',
        handle: 'CyberNinja',
        faction: 'aurora',
        rank: 19,
        xp: 16700,
        status: 'active',
        is_double_agent: false,
        created_at: new Date(Date.now() - 86400000 * 45).toISOString()
      }
    ];
  },

  init() {
    // Search functionality
    const searchInput = document.getElementById('player-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.updateTable();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.updateTable();
      });
    }

    // Global functions for actions
    window.viewPlayer = (id) => this.viewPlayer(id);
    window.editPlayer = (id) => this.editPlayer(id);
    window.suspendPlayer = (id) => this.suspendPlayer(id);
  },

  updateTable() {
    const tbody = document.querySelector('#players-table tbody');
    if (tbody) {
      tbody.innerHTML = this.renderPlayers();
    }
  },

  viewPlayer(id) {
    const player = this.players.find(p => p.id === id);
    if (!player) return;

    const content = `
      <div class="form-group">
        <label>Player ID</label>
        <p>${player.id}</p>
      </div>
      <div class="form-group">
        <label>Handle</label>
        <p>${player.handle}</p>
      </div>
      <div class="form-group">
        <label>Faction</label>
        <p>${player.faction || 'Independent'}</p>
      </div>
      <div class="form-group">
        <label>Rank / XP</label>
        <p>Rank ${player.rank} (${ui.formatNumber(player.xp)} XP)</p>
      </div>
      <div class="form-group">
        <label>Status</label>
        <p>${player.status}</p>
      </div>
      <div class="form-group">
        <label>Double Agent</label>
        <p>${player.is_double_agent ? 'Yes' : 'No'}</p>
      </div>
      <div class="form-group">
        <label>Joined</label>
        <p>${ui.formatDate(player.created_at)}</p>
      </div>
    `;

    ui.createModal(`Player: ${player.handle}`, content);
  },

  editPlayer(id) {
    ui.showToast('Edit player functionality coming soon', 'warning');
  },

  async suspendPlayer(id) {
    const player = this.players.find(p => p.id === id);
    if (!player) return;

    if (confirm(`Suspend player ${player.handle}?`)) {
      ui.showToast(`Player ${player.handle} suspended`, 'success');
      player.status = 'suspended';
      this.updateTable();
    }
  }
};
