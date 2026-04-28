const router = require('express').Router();
const iplApi = require('../services/iplApi');

// Simple in-memory cache — fixture list rarely changes mid-day
let cache = null;
let cacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 min

/** Parse a date-time string as IST (UTC+5:30) and return a UTC Date */
function toUTC(str) {
  if (!str) return null;
  let s = String(str).trim();
  // IPL API returns MM/DD/YYYY HH:MM:SS — convert to ISO YYYY-MM-DD
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
  if (mdy) {
    s = `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}T${mdy[4]}`;
  } else {
    s = s.replace(' ', 'T');
  }
  if (!s.includes('+') && !s.toLowerCase().includes('z')) s += '+05:30';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Get the IST calendar date string (YYYY-MM-DD) from a UTC Date */
function toISTDate(utcDate) {
  const ist = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format a UTC Date as a CDT time string (Dallas, UTC-5 in summer) */
function toCDT(utcDate) {
  const cdt = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);
  const h   = cdt.getUTCHours();
  const min = String(cdt.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${min} ${ampm} CDT`;
}

/** Human-friendly date label relative to today (IST) */
function dateLabel(istDate) {
  const nowIST = toISTDate(new Date());
  const parts  = nowIST.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
  const tomorrowIST = toISTDate(tomorrow);
  if (istDate === nowIST)      return 'Today';
  if (istDate === tomorrowIST) return 'Tomorrow';
  // "Apr 30" style
  const [, mm, dd] = istDate.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}`;
}

// GET /api/fixtures/upcoming
// Returns the next batch of unstarted fixtures (handles double-headers).
// A fixture is "upcoming" when: MatchStatus != 2 (not completed) AND IsLive == 0 (not live).
// Groups by IST date and returns the earliest such group.
router.get('/upcoming', async (req, res) => {
  try {
    const now = Date.now();
    let all;
    if (cache && now - cacheAt < TTL) {
      all = cache;
    } else {
      all = await iplApi.getAllFixtures();
      cache = all;
      cacheAt = now;
    }

    // Keep only fixtures that haven't started / aren't live
    const upcoming = (all || []).filter(f => f.MatchStatus != 2 && f.IsLive == 0);

    if (!upcoming.length) {
      return res.json({ hasUpcoming: false, dateLabel: null, nextDate: null, matches: [] });
    }

    // Sort by datetime ascending, group by IST date
    upcoming.sort((a, b) => {
      const da = toUTC(a.MatchdateTime), db = toUTC(b.MatchdateTime);
      if (!da || !db) return 0;
      return da - db;
    });

    // Find the earliest IST date with at least one upcoming match
    const nextDateStr = toISTDate(toUTC(upcoming[0].MatchdateTime) || new Date());
    const dayMatches  = upcoming.filter(f => {
      const d = toUTC(f.MatchdateTime);
      return d && toISTDate(d) === nextDateStr;
    });

    const matches = dayMatches.map(f => {
      const utc = toUTC(f.MatchdateTime);
      return {
        gamedayId:     f.TourGamedayId,
        timeCDT:       utc ? toCDT(utc) : null,
        homeTeamId:    f.HomeTeamId || 0,
        homeTeamShort: (f.HomeTeamShortName || '').toUpperCase(),
        awayTeamId:    f.AwayTeamId || 0,
        awayTeamShort: (f.AwayTeamShortName || '').toUpperCase(),
      };
    });

    res.json({
      hasUpcoming: true,
      dateLabel:   dateLabel(nextDateStr),
      nextDate:    nextDateStr,
      matches,
    });
  } catch (err) {
    console.error('GET /api/fixtures/upcoming error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
