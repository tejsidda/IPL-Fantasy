const router = require('express').Router();
const { syncPoints } = require('../services/pointsSync');

// POST /api/sync — manually trigger a points refresh from IPL Fantasy API
router.post('/', async (req, res) => {
  try {
    const result = await syncPoints();
    res.json(result);
  } catch (err) {
    console.error('POST /api/sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
