/** Outline logos from documents.iplt20.com — keyed by IPL team abbreviation */
export const IPL_LOGOS: Record<string, string> = {
  CSK:  'https://documents.iplt20.com/ipl/CSK/logos/Logooutline/CSKoutline.png',
  DC:   'https://documents.iplt20.com/ipl/DC/Logos/LogoOutline/DCoutline.png',
  GT:   'https://documents.iplt20.com/ipl/GT/Logos/Logooutline/GToutline.png',
  KKR:  'https://documents.iplt20.com/ipl/KKR/Logos/Logooutline/KKRoutline.png',
  LSG:  'https://documents.iplt20.com/ipl/LSG/Logos/Logooutline/LSGoutline.png',
  MI:   'https://documents.iplt20.com/ipl/MI/Logos/Logooutline/MIoutline.png',
  PBKS: 'https://documents.iplt20.com/ipl/PBKS/Logos/Logooutline/PBKSoutline.png',
  RR:   'https://documents.iplt20.com/ipl/RR/Logos/Logooutline/RRoutline.png',
  RCB:  'https://documents.iplt20.com/ipl/RCB/Logos/Logooutline/RCBoutline.png',
  SRH:  'https://documents.iplt20.com/ipl/SRH/Logos/Logooutline/SRHoutline.png',
};

/** Map full IPL team names (as stored in DB) to their abbreviation */
const NAME_TO_SHORT: Record<string, string> = {
  'Chennai Super Kings':         'CSK',
  'Delhi Capitals':              'DC',
  'Gujarat Titans':              'GT',
  'Kolkata Knight Riders':       'KKR',
  'Lucknow Super Giants':        'LSG',
  'Mumbai Indians':              'MI',
  'Punjab Kings':                'PBKS',
  'Rajasthan Royals':            'RR',
  'Royal Challengers Bengaluru': 'RCB',
  'Royal Challengers Bangalore': 'RCB',
  'Sunrisers Hyderabad':         'SRH',
};

/** Get the outline logo URL from a team abbreviation or full name */
export function getIplLogo(teamNameOrShort: string): string | null {
  if (!teamNameOrShort) return null;
  const upper = teamNameOrShort.trim().toUpperCase();
  if (IPL_LOGOS[upper]) return IPL_LOGOS[upper];
  const short = NAME_TO_SHORT[teamNameOrShort.trim()];
  return short ? IPL_LOGOS[short] : null;
}

/** Get the abbreviation from a full name or abbreviation */
export function getIplShort(teamNameOrShort: string): string {
  if (!teamNameOrShort) return '';
  const upper = teamNameOrShort.trim().toUpperCase();
  if (IPL_LOGOS[upper]) return upper;
  return NAME_TO_SHORT[teamNameOrShort.trim()] ?? teamNameOrShort.trim();
}
