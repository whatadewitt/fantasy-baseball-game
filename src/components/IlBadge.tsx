interface Props {
  days: number
  className?: string
}

export default function IlBadge({ days, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 align-middle text-[10px] font-semibold uppercase tracking-wide text-crimson ${className}`}
      title={`On the ${days}-day injured list`}
      aria-label={`Injured list, ${days} day`}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-crimson text-white leading-none"
      >
        <svg viewBox="0 0 10 10" className="w-2 h-2" fill="currentColor">
          <rect x="4" y="1" width="2" height="8" rx="0.5" />
          <rect x="1" y="4" width="8" height="2" rx="0.5" />
        </svg>
      </span>
      IL-{days}
    </span>
  )
}
