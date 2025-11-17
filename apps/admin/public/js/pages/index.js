// Page Index
import { overviewPage } from './overview.js';
import { playersPage } from './players.js';
import { factionsPage } from './factions.js';
import { zonesPage } from './zones.js';
import { missionsPage } from './missions.js';
import { qrCodesPage } from './qr-codes.js';
import { settingsPage } from './settings.js';

export const pages = {
  overview: overviewPage,
  players: playersPage,
  factions: factionsPage,
  zones: zonesPage,
  missions: missionsPage,
  'qr-codes': qrCodesPage,
  settings: settingsPage
};
