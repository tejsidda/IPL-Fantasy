require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { syncPoints } = require('./services/pointsSync');
const { syncGamedayStats } = require('./services/gamedaySync');

const app = express();
app.use(cors({
  origin: [
    'https://ipl-fantasy-neu.vercel.app',
    /\.vercel\.app$/,
    'http://localhost:3000',
  ]
}));
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

// Points sync every hour during match hours
// 09:00–20:00 UTC = 2:30 PM–1:30 AM IST, covers both afternoon + evening matches incl. late finishes
cron.schedule('0 9-20 * * *', async () => {
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`IPL Auction backend running on port ${PORT}`);
});
