const router = require('express').Router();
const { importPlayersFromSheet, importHistoryFromSheet, refreshPlayerData } = require('../services/sheetImport');
const { syncGamedayStats } = require('../services/gamedaySync');
const { getActiveSeason } = require('../utils/seasons');

// POST /api/import/players — import auction player assignments from the Points Table sheet
router.post('/players', async (req, res) => {
  const { sheetUrl, season } = req.body;
  if (!sheetUrl) return res.status(400).json({ error: 'sheetUrl is required' });

  try {
    const seasonId = season || await getActiveSeason();
    const result = await importPlayersFromSheet(sheetUrl, seasonId);
    res.json({ season: seasonId, ...result });
  } catch (err) {
    console.error('POST /api/import/players error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/history — import historical team totals from the Points History sheet
router.post('/history', async (req, res) => {
  const { sheetUrl, season } = req.body;
  if (!sheetUrl) return res.status(400).json({ error: 'sheetUrl is required' });

  try {
    const seasonId = season || await getActiveSeason();
    const result = await importHistoryFromSheet(sheetUrl, seasonId);
    res.json({ season: seasonId, ...result });
  } catch (err) {
    console.error('POST /api/import/history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/refresh-players — re-fetch IPL API and update roles/photo IDs for existing DB players
router.post('/refresh-players', async (req, res) => {
  const { season } = req.body;
  try {
    const seasonId = season || await getActiveSeason();
    if (!seasonId) return res.status(400).json({ error: 'No active season — pass season in body.' });
    const result = await refreshPlayerData(seasonId);
    res.json({ season: seasonId, ...result });
  } catch (err) {
    console.error('POST /api/import/refresh-players error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/gameday-stats — backfill per-match player breakdown from IPL card-stats API
// Pass force: true to clear existing data and re-sync all matches from scratch
router.post('/gameday-stats', async (req, res) => {
  const { season, force } = req.body;
  try {
    const seasonId = season || await getActiveSeason();
    if (!seasonId) return res.status(400).json({ error: 'No active season — pass season in body.' });
    const result = await syncGamedayStats(seasonId, !!force);
    res.json({ season: seasonId, ...result });
  } catch (err) {
    console.error('POST /api/import/gameday-stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
