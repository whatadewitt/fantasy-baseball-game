// Deterministic hash from string
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  }
  return h
}

// Convert HSL (h: 0-360, s: 0-100, l: 0-100) to hex color string
function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100
  const ln = l / 100
  const a = sn * Math.min(ln, 1 - ln)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Generate unique cap colors from a hash — no fixed palette, infinite variety
export function getCapColors(teamId: string, teamName: string) {
  const h1 = hash(teamId + teamName)
  const h2 = hash(teamName + teamId)

  // Pick a hue and keep saturation/lightness in ranges that look like real caps
  const hue = h1 % 360
  const capSat = 40 + (h2 % 35)       // 40-75% — rich but not neon
  const capLight = 20 + (h1 % 20)      // 20-40% — dark enough to read letter on

  const cap = hslToHex(hue, capSat, capLight)
  const brim = hslToHex(hue, capSat, Math.max(capLight - 8, 8))

  // Letter color: light on dark cap
  const letterHue = (hue + 30 + (h2 % 40)) % 360  // slight hue shift
  const letterLight = 80 + (h2 % 15)               // 80-95%
  const letterSat = 10 + (h2 % 30)                 // 10-40% — mostly neutral/cream
  const letter = hslToHex(letterHue, letterSat, letterLight)

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
