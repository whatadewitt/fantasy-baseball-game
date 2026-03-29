'use client'

import { useState } from 'react'

const COLORS = [
  { cap: '#1a2744', brim: '#0f1a2e', letter: '#c8cdd5', name: 'Navy' },
  { cap: '#8b1a2b', brim: '#6b1421', letter: '#f0d0a0', name: 'Maroon' },
  { cap: '#1e6b3a', brim: '#155a2e', letter: '#f0e8c0', name: 'Forest' },
  { cap: '#c0392b', brim: '#962d22', letter: '#ffffff', name: 'Red' },
  { cap: '#2d5da1', brim: '#234a80', letter: '#f5e6c8', name: 'Royal' },
  { cap: '#1a1a1e', brim: '#101014', letter: '#d4a542', name: 'Black' },
  { cap: '#d35400', brim: '#a84300', letter: '#1a1a1e', name: 'Orange' },
  { cap: '#5b2c8e', brim: '#472270', letter: '#e8daf0', name: 'Purple' },
]

function CapA({ cap, brim, letter, initial, size = 128 }: { cap: string; brim: string; letter: string; initial: string; size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      {/* Cap dome */}
      <path d="M26 68 C26 34, 44 18, 64 16 C84 18, 102 34, 102 68 L26 68Z" fill={cap} />
      {/* Front panel */}
      <path d="M42 68 C42 42, 52 28, 64 26 C76 28, 86 42, 86 68 L42 68Z" fill={cap} opacity="0.85" />
      {/* Seams */}
      <line x1="64" y1="16" x2="64" y2="68" stroke={letter} strokeWidth="0.5" opacity="0.15" />
      <line x1="44" y1="22" x2="34" y2="68" stroke={letter} strokeWidth="0.5" opacity="0.1" />
      <line x1="84" y1="22" x2="94" y2="68" stroke={letter} strokeWidth="0.5" opacity="0.1" />
      {/* Button */}
      <circle cx="64" cy="17" r="3" fill={brim} />
      {/* Brim */}
      <ellipse cx="64" cy="70" rx="48" ry="12" fill={brim} />
      <ellipse cx="64" cy="69" rx="46" ry="10" fill={brim} />
      <path d="M18 70 Q64 84, 110 70 Q64 80, 18 70Z" fill={brim} opacity="0.7" />
      {/* Letter */}
      <text x="64" y="58" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontWeight="bold" fontStyle="italic" fontSize="32" fill={letter} letterSpacing="-1">{initial}</text>
      {/* Shine */}
      <ellipse cx="52" cy="36" rx="14" ry="18" fill="white" opacity="0.06" transform="rotate(-15 52 36)" />
    </svg>
  )
}

function CapB({ cap, brim, letter, initial, size = 128 }: { cap: string; brim: string; letter: string; initial: string; size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      {/* Cap dome - rounder, more modern */}
      <path d="M24 72 C24 30, 46 12, 64 10 C82 12, 104 30, 104 72 Z" fill={cap} />
      {/* Panel lines */}
      <path d="M64 10 L64 72" stroke={letter} strokeWidth="0.6" opacity="0.12" />
      <path d="M46 14 C40 30, 32 50, 30 72" stroke={letter} strokeWidth="0.4" opacity="0.08" />
      <path d="M82 14 C88 30, 96 50, 98 72" stroke={letter} strokeWidth="0.4" opacity="0.08" />
      {/* Button */}
      <circle cx="64" cy="11" r="3.5" fill={brim} />
      {/* Flat brim - modern style */}
      <path d="M14 72 L114 72 L108 82 L20 82 Z" fill={brim} />
      <path d="M20 82 L108 82 L106 84 L22 84 Z" fill={brim} opacity="0.6" />
      {/* Brim edge */}
      <line x1="14" y1="72" x2="114" y2="72" stroke={brim} strokeWidth="1.5" opacity="0.4" />
      {/* Letter - block style */}
      <text x="64" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="'Arial Black', 'Helvetica Neue', sans-serif" fontWeight="900" fontSize="36" fill={letter}>{initial}</text>
      {/* Shine */}
      <path d="M44 20 C48 18, 56 16, 64 16 C58 18, 50 24, 44 34 Z" fill="white" opacity="0.08" />
    </svg>
  )
}

function CapC({ cap, brim, letter, initial, size = 128 }: { cap: string; brim: string; letter: string; initial: string; size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      {/* Cap dome - 3/4 view */}
      <path d="M30 70 C28 36, 42 16, 58 12 C74 10, 96 24, 100 70 Z" fill={cap} />
      {/* Front panel - offset for 3/4 view */}
      <path d="M40 70 C40 40, 48 22, 58 18 C68 16, 82 28, 84 70 Z" fill={cap} opacity="0.9" />
      {/* Seam */}
      <path d="M58 12 C56 30, 56 50, 58 70" stroke={letter} strokeWidth="0.5" opacity="0.12" />
      {/* Button */}
      <circle cx="60" cy="13" r="3" fill={brim} />
      {/* Curved brim */}
      <path d="M16 70 C20 68, 40 66, 64 70 C88 74, 108 78, 116 76 L112 84 C104 86, 84 82, 64 78 C44 74, 24 76, 18 78 Z" fill={brim} />
      {/* Brim highlight */}
      <path d="M20 72 C40 68, 60 70, 80 74 C70 72, 50 70, 30 72 Z" fill="white" opacity="0.06" />
      {/* Letter - slightly offset */}
      <text x="60" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontWeight="bold" fontStyle="italic" fontSize="30" fill={letter}>{initial}</text>
      {/* Shine */}
      <ellipse cx="48" cy="34" rx="10" ry="16" fill="white" opacity="0.07" transform="rotate(-20 48 34)" />
    </svg>
  )
}

function JerseyA({ cap, letter, initial, size = 128 }: { cap: string; brim?: string; letter: string; initial: string; size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      {/* Body */}
      <path d="M34 40 L34 118 L94 118 L94 40 C94 36, 88 28, 64 24 C40 28, 34 36, 34 40 Z" fill={cap} />
      {/* Collar / neckline */}
      <path d="M48 28 C52 34, 58 36, 64 36 C70 36, 76 34, 80 28 C76 26, 70 24, 64 24 C58 24, 52 26, 48 28 Z" fill={cap} />
      <path d="M48 28 C52 34, 58 36, 64 36 C70 36, 76 34, 80 28" stroke={letter} strokeWidth="1.5" fill="none" opacity="0.3" />
      {/* Sleeves */}
      <path d="M34 40 L14 56 L22 66 L34 54 Z" fill={cap} />
      <path d="M94 40 L114 56 L106 66 L94 54 Z" fill={cap} />
      {/* Sleeve cuffs */}
      <path d="M14 56 L22 66 L20 68 L12 58 Z" fill={letter} opacity="0.2" />
      <path d="M114 56 L106 66 L108 68 L116 58 Z" fill={letter} opacity="0.2" />
      {/* Pinstripe */}
      {[44, 54, 64, 74, 84].map(x => (
        <line key={x} x1={x} y1="36" x2={x} y2="118" stroke={letter} strokeWidth="0.4" opacity="0.08" />
      ))}
      {/* Button line */}
      <line x1="64" y1="36" x2="64" y2="118" stroke={letter} strokeWidth="0.8" opacity="0.12" />
      {[46, 56, 66, 76, 86, 96, 106].map(y => (
        <circle key={y} cx="64" cy={y} r="1" fill={letter} opacity="0.15" />
      ))}
      {/* Letter */}
      <text x="64" y="78" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontWeight="bold" fontStyle="italic" fontSize="44" fill={letter} opacity="0.9">{initial}</text>
    </svg>
  )
}

function JerseyB({ cap, letter, initial, size = 128 }: { cap: string; brim?: string; letter: string; initial: string; size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      {/* Body */}
      <path d="M36 42 L36 116 L92 116 L92 42 C92 36, 84 26, 64 22 C44 26, 36 36, 36 42 Z" fill={cap} />
      {/* V-neck */}
      <path d="M50 26 L64 44 L78 26 C74 24, 68 22, 64 22 C60 22, 54 24, 50 26 Z" fill="white" opacity="0.12" />
      <path d="M50 26 L64 44 L78 26" stroke={letter} strokeWidth="1" fill="none" opacity="0.4" />
      {/* Sleeves - raglan style */}
      <path d="M36 42 L12 54 L18 68 L36 56 Z" fill={letter} opacity="0.2" />
      <path d="M92 42 L116 54 L110 68 L92 56 Z" fill={letter} opacity="0.2" />
      {/* Yoke / chest stripe */}
      <rect x="36" y="48" width="56" height="4" fill={letter} opacity="0.15" />
      <rect x="36" y="54" width="56" height="1.5" fill={letter} opacity="0.1" />
      {/* Number circle background */}
      <circle cx="64" cy="82" r="22" fill={letter} opacity="0.08" />
      {/* Letter */}
      <text x="64" y="84" textAnchor="middle" dominantBaseline="central" fontFamily="'Arial Black', sans-serif" fontWeight="900" fontSize="38" fill={letter}>{initial}</text>
    </svg>
  )
}

function JerseyC({ cap, brim, letter, initial, size = 128 }: { cap: string; brim: string; letter: string; initial: string; size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      {/* Body */}
      <path d="M36 38 L36 118 L92 118 L92 38 C92 32, 82 22, 64 18 C46 22, 36 32, 36 38 Z" fill={cap} />
      {/* Crew neck */}
      <ellipse cx="64" cy="26" rx="14" ry="6" fill={cap} />
      <ellipse cx="64" cy="26" rx="14" ry="6" stroke={letter} strokeWidth="1" fill="none" opacity="0.25" />
      {/* Shoulders / yoke */}
      <path d="M36 38 L10 50 L18 64 L36 52 Z" fill={cap} />
      <path d="M92 38 L118 50 L110 64 L92 52 Z" fill={cap} />
      {/* Shoulder stripe */}
      <path d="M36 38 L10 50 L12 54 L36 42 Z" fill={brim} />
      <path d="M92 38 L118 50 L116 54 L92 42 Z" fill={brim} />
      {/* Chest band */}
      <rect x="36" y="56" width="56" height="6" fill={brim} />
      {/* Bottom hem */}
      <rect x="36" y="114" width="56" height="4" fill={brim} />
      {/* Script letter - larger, classic */}
      <text x="64" y="84" textAnchor="middle" dominantBaseline="central" fontFamily="'Brush Script MT', 'Segoe Script', cursive" fontWeight="normal" fontSize="52" fill={letter}>{initial}</text>
      {/* Subtle shine */}
      <path d="M44 34 C50 30, 58 28, 64 28 C56 32, 48 40, 44 50 Z" fill="white" opacity="0.05" />
    </svg>
  )
}

const FONTS = [
  { family: "Georgia, serif", weight: "bold", style: "italic", size: 220, label: "Italic Serif" },
  { family: "'Arial Black', 'Helvetica Neue', sans-serif", weight: "900", style: "normal", size: 240, label: "Block" },
  { family: "'Brush Script MT', 'Segoe Script', cursive", weight: "normal", style: "normal", size: 260, label: "Script" },
  { family: "'Courier New', monospace", weight: "bold", style: "normal", size: 210, label: "Slab" },
  { family: "'Trebuchet MS', 'Gill Sans', sans-serif", weight: "bold", style: "italic", size: 230, label: "Sport Italic" },
  { family: "'Times New Roman', 'Palatino', serif", weight: "bold", style: "normal", size: 230, label: "Classic Serif" },
  { family: "'Impact', 'Haettenschweiler', sans-serif", weight: "normal", style: "normal", size: 240, label: "Impact" },
  { family: "'Lucida Console', 'Monaco', monospace", weight: "bold", style: "normal", size: 190, label: "Console" },
]

function CapSVG({ cap, brim, letter, initial, fontIdx, size = 128 }: { cap: string; brim: string; letter: string; initial: string; fontIdx: number; size?: number }) {
  const font = FONTS[fontIdx % FONTS.length]
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size}>
      {/* Brim */}
      <path d="M878.56 766.24C872 737.36 852.08 694.88 832 648c0 0-124.88-40-320-40s-320 40-320 40c-20.08 46.88-40 89.36-46.56 118.24a40 40 0 0 0 46.56 48.48 1572 1572 0 0 1 320-34.72 1572 1572 0 0 1 320 34.72 40 40 0 0 0 46.56-48.48z" fill={brim} />
      {/* Crown */}
      <path d="M512 256c-192 0-360 152-320 392 0 0 124.88-40 320-40s320 40 320 40c40-240-128-392-320-392z" fill={cap} />
      {/* Front panel */}
      <path d="M313.52 622.32a1383.28 1383.28 0 0 1 396.96 0C725.36 397.2 625.52 256 512 256S298.64 397.2 313.52 622.32z" fill={cap} opacity="0.85" />
      {/* Top band */}
      <path d="M560 240v19.36a344.56 344.56 0 0 0-96 0V240a32 32 0 0 1 32-32h32a32 32 0 0 1 32 32z" fill={brim} />
      {/* Shine */}
      <path d="M400 340 C430 300, 490 270, 512 268 C480 280, 440 320, 420 380 Z" fill="white" opacity="0.06" />
      {/* Team letter */}
      <text x="512" y="490" textAnchor="middle" dominantBaseline="central"
        fontFamily={font.family} fontWeight={font.weight} fontStyle={font.style}
        fontSize={font.size} fill={letter} opacity="0.95">{initial}</text>
    </svg>
  )
}

const STYLES = [
  ...FONTS.map((f, i) => ({
    id: `cap-font-${i}`,
    label: `Cap — ${f.label}`,
    Component: (props: { cap: string; brim: string; letter: string; initial: string; size?: number }) =>
      <CapSVG {...props} fontIdx={i} />,
  })),
  { id: 'cap-a', label: 'Cap A — Classic Front', Component: CapA },
  { id: 'cap-b', label: 'Cap B — Flat Brim', Component: CapB },
  { id: 'cap-c', label: 'Cap C — 3/4 View', Component: CapC },
  { id: 'jersey-a', label: 'Jersey A — Pinstripe', Component: JerseyA },
  { id: 'jersey-b', label: 'Jersey B — Modern', Component: JerseyB },
  { id: 'jersey-c', label: 'Jersey C — Classic Script', Component: JerseyC },
]

export default function AvatarWorkshop() {
  const [initial, setInitial] = useState('S')

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy tracking-tight mb-2">Avatar Workshop</h1>
        <p className="text-ink-secondary mb-8">Pick your favorite style. Each one generates unique colors per team.</p>

        <div className="mb-10">
          <label className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-2 block">Preview Letter</label>
          <input
            type="text"
            maxLength={1}
            value={initial}
            onChange={e => setInitial(e.target.value.toUpperCase() || 'S')}
            className="w-16 border-b-2 border-navy/15 bg-transparent px-0 py-2 text-2xl text-center text-ink font-bold focus:border-crimson focus:outline-none"
          />
        </div>

        <div className="space-y-16">
          {STYLES.map(({ id, label, Component }) => (
            <section key={id}>
              <h2 className="font-display text-xl font-semibold text-navy mb-6">{label}</h2>
              <div className="flex flex-wrap gap-4">
                {COLORS.map(c => (
                  <div key={c.name} className="text-center">
                    <div className="bg-surface rounded-xl p-4 mb-2">
                      <Component cap={c.cap} brim={c.brim} letter={c.letter} initial={initial} size={96} />
                    </div>
                    <p className="text-xs text-ink-muted">{c.name}</p>
                  </div>
                ))}
              </div>
              {/* Small size preview */}
              <div className="mt-4 flex items-center gap-3">
                <p className="text-xs text-ink-muted uppercase tracking-widest">At standings size:</p>
                {COLORS.slice(0, 4).map(c => (
                  <Component key={c.name} cap={c.cap} brim={c.brim} letter={c.letter} initial={initial} size={28} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
