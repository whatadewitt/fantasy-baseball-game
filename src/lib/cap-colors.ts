// Bump this when avatar rendering changes to bust browser/CDN caches
export const AVATAR_VERSION = 3

// Deterministic hash from string
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  }
  return h
}

// Hand-picked palette of visually distinct baseball cap colors
const CAP_PALETTE = [
  { cap: '#1a2744', brim: '#0f1a2e', letter: '#c8cdd5' }, // Navy
  { cap: '#8b1a2b', brim: '#6b1421', letter: '#f0d0a0' }, // Maroon
  { cap: '#1e6b3a', brim: '#155a2e', letter: '#f0e8c0' }, // Forest
  { cap: '#c0392b', brim: '#962d22', letter: '#ffffff' }, // Red
  { cap: '#2d5da1', brim: '#234a80', letter: '#f5e6c8' }, // Royal
  { cap: '#1a1a1e', brim: '#101014', letter: '#d4a542' }, // Black
  { cap: '#d35400', brim: '#a84300', letter: '#1a1a1e' }, // Orange
  { cap: '#5b2c8e', brim: '#472270', letter: '#e8daf0' }, // Purple
]

// Pick a cap color scheme from the curated palette
export function getCapColors(teamId: string, teamName: string) {
  const h = hash(teamId + teamName)
  return CAP_PALETTE[h % CAP_PALETTE.length]
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
