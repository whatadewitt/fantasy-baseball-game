export function calculateHitterPoints(stats: {
  hits: number
  runs: number
  rbis: number
  home_runs: number
  stolen_bases: number
}): number {
  return stats.hits + stats.runs + stats.rbis + stats.home_runs + stats.stolen_bases * 2
}

export function inningsPitchedToOuts(ip: number): number {
  return Math.floor(ip) * 3 + Math.round((ip % 1) * 10)
}

export function calculatePitcherPoints(stats: {
  innings_pitched: number
  strikeouts: number
  wins: number
  saves: number
}): number {
  return inningsPitchedToOuts(stats.innings_pitched) + stats.strikeouts + stats.wins * 4 + stats.saves * 5
}

export const HITTER_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH']
export const PITCHER_POSITIONS = ['SP', 'RP']

export function isHitter(position: string): boolean {
  return HITTER_POSITIONS.includes(position)
}

export function isPitcher(position: string): boolean {
  return PITCHER_POSITIONS.includes(position)
}
