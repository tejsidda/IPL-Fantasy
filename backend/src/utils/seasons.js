const supabase = require('../db/supabase');

let cache = { id: null, at: 0 };

async function getActiveSeason() {
  if (cache.id && Date.now() - cache.at < 300_000) return cache.id;

  const { data, error } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  cache = { id: data.id, at: Date.now() };
  return data.id;
}

function clearSeasonCache() {
  cache = { id: null, at: 0 };
}

module.exports = { getActiveSeason, clearSeasonCache };
