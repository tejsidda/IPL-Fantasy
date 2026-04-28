const axios = require('axios');

const BASE = 'https://fantasy.iplt20.com/classic/api/feed';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://fantasy.iplt20.com/',
  'Origin': 'https://fantasy.iplt20.com'
};

// Generates MMDDYYYYHHMMSS timestamp used by IPL Fantasy API versioning params
function generateVersion() {
  const now = new Date();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const YYYY = now.getFullYear();
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  return `${MM}${DD}${YYYY}${HH}${mm}${SS}`;
}

async function getLatestFixture() {
  const liveVersion = generateVersion();
  const url = `${BASE}/tour-fixtures?lang=en&liveVersion=${liveVersion}`;
  const { data } = await axios.get(url, { headers, timeout: 10000 });

  if (!data?.Data?.Value) throw new Error('Invalid fixtures response from IPL API');

  const matches = data.Data.Value;
  matches.sort((a, b) => new Date(b.MatchdateTime) - new Date(a.MatchdateTime));

  // Prefer live match, then most recently completed
  const live = matches.find(m => m.IsLive != 0);
  if (live) return live;

  const completed = matches.find(m => m.MatchStatus == 2);
  if (completed) return completed;

  // Fall back to most recent match regardless of status
  if (matches.length) return matches[0];

  throw new Error('No matches found in IPL fixtures');
}

async function getGamedayPlayers(tourGamedayId) {
  const version = generateVersion();
  const url = `${BASE}/gamedayplayers?lang=en&tourgamedayId=${tourGamedayId}&teamgamedayId=${tourGamedayId}&announcedVersion=${version}`;
  const { data } = await axios.get(url, { headers, timeout: 10000 });

  if (!data?.Data?.Value?.Players) throw new Error('Invalid players response from IPL API');

  return data.Data.Value.Players;
}

async function getAllFixtures() {
  const liveVersion = generateVersion();
  const url = `${BASE}/tour-fixtures?lang=en&liveVersion=${liveVersion}`;
  const { data } = await axios.get(url, { headers, timeout: 15000 });
  if (!data?.Data?.Value) throw new Error('Invalid fixtures response from IPL API');
  return data.Data.Value;
}

module.exports = { getLatestFixture, getGamedayPlayers, getAllFixtures };
