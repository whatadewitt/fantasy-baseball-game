interface Props {
  days: number
  className?: string
}

// Cross-in-circle marker that overlays a player avatar.
// The caller must wrap the avatar in a `relative` container.
export function IlMark({ days, className = '' }: Props) {
  return (
    <span
      role="img"
      aria-label={`Injured list, ${days} day`}
      title={`On the ${days}-day injured list`}
      className={`absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-crimson text-white ring-2 ring-surface shadow-sm ${className}`}
    >
      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="currentColor" aria-hidden="true">
        <rect x="4" y="1" width="2" height="8" rx="0.5" />
        <rect x="1" y="4" width="8" height="2" rx="0.5" />
      </svg>
    </span>
  )
}

// Text label "IL10" / "IL15" / "IL60" rendered inline next to a player name.
export function IlLabel({ days, className = '' }: Props) {
  return (
    <span
      aria-label={`Injured list, ${days} day`}
      className={`inline-flex items-center align-middle text-[10px] font-semibold uppercase tracking-wide text-crimson ${className}`}
    >
      IL{days}
    </span>
  )
}
