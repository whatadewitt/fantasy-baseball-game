// Substring matches — these are blocked if they appear anywhere in the text
const BLOCKED_SUBSTRINGS = [
  'asshole', 'bastard', 'blowjob', 'bullshit',
  'cocksucker', 'cunt',
  'dumbass', 'dildo', 'douche',
  'fag', 'fuck', 'fucker', 'fuk', 'fck',
  'goddamn',
  'jackass',
  'motherfucker', 'milf',
  'nazi', 'nigga', 'nigger',
  'penis', 'piss', 'porn', 'prick', 'pussy',
  'rape', 'retard',
  'sht', 'shit', 'slut', 'stfu',
  'twat',
  'vagina', 'viagra',
  'wank', 'whore', 'wtf',
]

// Whole-word matches only — these are common substrings in clean words
// so we only block them when they stand alone
const BLOCKED_WHOLE_WORDS = [
  'ass', 'bitch', 'boob', 'cock', 'crap',
  'damn', 'dick', 'hoe', 'ho', 'horny',
  'hell', 'jerk', 'kill',
  'sex', 'sexy', 'suck', 'tit', 'tits',
]

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase()

  // Normalize leet-speak then strip non-alpha (catches "f u c k", "sh!t", "a$$")
  const normalized = lower
    .replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/0/g, 'o').replace(/7/g, 't')
    .replace(/\$/g, 's').replace(/@/g, 'a').replace(/!/g, 'i')
    .replace(/\+/g, 't').replace(/#/g, 'h')
  const stripped = normalized.replace(/[^a-z]/g, '')

  for (const word of BLOCKED_SUBSTRINGS) {
    if (stripped.includes(word)) return true
  }

  // Split into actual words for whole-word check
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/)

  for (const word of BLOCKED_WHOLE_WORDS) {
    if (words.includes(word)) return true
  }

  return false
}
