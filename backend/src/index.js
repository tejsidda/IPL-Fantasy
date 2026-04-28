require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { syncPoints } = require('./services/pointsSync');
const { syncGamedayStats } = require('./services/gamedaySync');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/seasons', require('./routes/seasons'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/players', require('./routes/players'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/import', require('./routes/import'));
app.use('/api/search',   require('./routes/search'));
app.use('/api/fixtures', require('./routes/fixtures'));
app.use('/api/trades',   require('./routes/trades'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Points sync twice daily during IPL season
// 10:00 UTC = 3:30 PM IST  |  14:00 UTC = 7:30 PM IST
cron.schedule('0 10,14 * * *', async () => {
  console.log('[cron] Auto-syncing points...');
  try {
    const result = await syncPoints();
    console.log('[cron] Sync complete:', result);
  } catch (err) {
    console.error('[cron] Sync failed:', err.message);
  }
});

// Gameday stats sync once daily at 19:00 UTC = 12:30 AM IST
// Runs ~1 hour after the latest evening match ends, picks up both day + evening games
cron.schedule('0 19 * * *', async () => {
  console.log('[cron] Auto-syncing gameday stats...');
  try {
    const result = await syncGamedayStats();
    console.log('[cron] Gameday sync complete:', result);
  } catch (err) {
    console.error('[cron] Gameday sync failed:', err.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`IPL Auction backend running on http://localhost:${PORT}`);
});
