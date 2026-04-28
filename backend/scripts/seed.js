require('dotenv').config();
const supabase = require('../src/db/supabase');
const { teams } = require('../data/players.json');

const SEASONS = [
  { id: '2025', name: 'IPL 2025', is_active: false, start_date: '2025-03-22' },
  { id: '2026', name: 'IPL 2026', is_active: true,  start_date: '2026-03-22' }
];

async function seed() {
  // 1. Seed seasons
  console.log('Seeding seasons...');
  for (const season of SEASONS) {
    const { error } = await supabase.from('seasons').upsert(season, { onConflict: 'id' });
    if (error) console.error(`  Season ${season.id}:`, error.message);
    else console.log(`  ✓ ${season.name} (active=${season.is_active})`);
  }

  // 2. Seed fantasy teams (static — same across seasons)
  console.log('\nSeeding fantasy teams...');
  for (const team of teams) {
    const { players, ...teamData } = team;
    const { error } = await supabase.from('fantasy_teams').upsert(teamData, { onConflict: 'id' });
    if (error) console.error(`  Team ${team.id}:`, error.message);
    else console.log(`  ✓ ${team.name}`);
  }

  // 3. Seed players for each team (2026 season from players.json)
  console.log('\nSeeding 2026 players...');
  for (const team of teams) {
    const rows = team.players.map(p => ({ ...p, fantasy_team_id: team.id, season: '2026' }));
    const { error } = await supabase.from('players').upsert(rows, { onConflict: 'name,season' });
    if (error) console.error(`  ${team.name} players:`, error.message);
    else console.log(`  ✓ ${team.name} — ${rows.length} players`);
  }

  console.log('\n✓ Seed complete.\n');
  console.log('Next steps:');
  console.log('  1. Import 2025 players:  POST /api/import/players { sheetUrl, season: "2025" }');
  console.log('  2. Import 2025 history:  POST /api/import/history { sheetUrl, season: "2025" }');
  console.log('  3. Sync 2026 points:     POST /api/sync');
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
