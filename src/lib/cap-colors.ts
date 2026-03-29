// Deterministic hash from string
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  }
  return h
}

// Generate unique cap colors from a hash — no fixed palette, infinite variety
export function getCapColors(teamId: string, teamName: string) {
  const h1 = hash(teamId + teamName)
  const h2 = hash(teamName + teamId)

  // Pick a hue and keep saturation/lightness in ranges that look like real caps
  const hue = h1 % 360
  const capSat = 40 + (h2 % 35)       // 40-75% — rich but not neon
  const capLight = 20 + (h1 % 20)      // 20-40% — dark enough to read letter on

  const cap = `hsl(${hue}, ${capSat}%, ${capLight}%)`
  const brim = `hsl(${hue}, ${capSat}%, ${Math.max(capLight - 8, 8)}%)`

  // Letter color: light on dark cap
  const letterHue = (hue + 30 + (h2 % 40)) % 360  // slight hue shift
  const letterLight = 80 + (h2 % 15)               // 80-95%
  const letterSat = 10 + (h2 % 30)                 // 10-40% — mostly neutral/cream
  const letter = `hsl(${letterHue}, ${letterSat}%, ${letterLight}%)`

  return { cap, brim, letter }
}

export function getTeamInitial(teamName: string): string {
  return teamName.trim().charAt(0).toUpperCase()
}

export const CAP_FONTS = [
  { family: "Georgia, serif", weight: "bold", style: "italic", size: 220 },
  { family: "'Arial Black', 'Helvetica Neue', sans-serif", weight: "900", style: "normal", size: 240 },
  { family: "'Brush Script MT', 'Segoe Script', cursive", weight: "normal", style: "normal", size: 260 },
  { family: "'Courier New', monospace", weight: "bold", style: "normal", size: 210 },
  { family: "'Trebuchet MS', 'Gill Sans', sans-serif", weight: "bold", style: "italic", size: 230 },
  { family: "'Times New Roman', 'Palatino', serif", weight: "bold", style: "normal", size: 230 },
  { family: "'Impact', 'Haettenschweiler', sans-serif", weight: "normal", style: "normal", size: 240 },
  { family: "'Lucida Console', 'Monaco', monospace", weight: "bold", style: "normal", size: 190 },
]

export function getCapFont(teamId: string, teamName: string) {
  const h = hash(teamId + 'font' + teamName)
  return CAP_FONTS[h % CAP_FONTS.length]
}
