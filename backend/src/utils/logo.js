function getLogo(initials, c1, c2) {
  const id = initials.replace(/[^a-z0-9]/gi, '_');
  const c2f = (c2 && c2 !== c1) ? c2 : shiftHue(c1);

  // Scale text to fit: 2 chars = big, 3 = medium, 4+ = small
  const textSize    = initials.length <= 2 ? 70 : initials.length === 3 ? 54 : 42;
  const tracking    = initials.length <= 2 ? 5  : 2;
  // Underline width proportional to visible text width
  const lineHalf    = initials.length <= 2 ? 30 : initials.length === 3 ? 35 : 42;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="band_${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2f}"/>
    </linearGradient>
    <radialGradient id="shine_${id}" cx="35%" cy="28%" r="68%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
    </radialGradient>
    <radialGradient id="glow_${id}" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Outer gradient band -->
  <circle cx="100" cy="100" r="97" fill="url(#band_${id})"/>
  <!-- Specular highlight overlay -->
  <circle cx="100" cy="100" r="97" fill="url(#shine_${id})"/>
  <!-- Hairline outer ring -->
  <circle cx="100" cy="100" r="96" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.18"/>

  <!-- Dark stage -->
  <circle cx="100" cy="100" r="78" fill="#060C1A"/>
  <!-- Ambient glow from team colour on dark stage -->
  <circle cx="100" cy="100" r="78" fill="url(#glow_${id})"/>
  <!-- Stage border in team colour -->
  <circle cx="100" cy="100" r="78" fill="none" stroke="${c1}" stroke-width="2" stroke-opacity="0.65"/>

  <!-- Initials -->
  <text
    x="100" y="104"
    text-anchor="middle" dominant-baseline="middle"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
    font-size="${textSize}" font-weight="900"
    fill="#ffffff" letter-spacing="${tracking}">${initials}</text>

  <!-- Accent underline in gradient -->
  <line
    x1="${100 - lineHalf}" y1="132"
    x2="${100 + lineHalf}" y2="132"
    stroke="url(#band_${id})" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Shift hue ~30° so single-color teams still get a two-stop gradient
function shiftHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Simple: brighten slightly and tilt toward adjacent hue
  const nr = Math.min(255, r + 30);
  const ng = Math.min(255, g + 10);
  const nb = Math.max(0,   b - 20);
  return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
}

module.exports = { getLogo };
