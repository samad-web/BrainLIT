import { PART_COLOR, PART_LABEL } from '../lib/stats.js'

const PART_MEANING = {
  role: 'Tell the AI who to be',
  ask: 'Tell the AI what to do',
  context: 'Tell the AI about your world',
  example: 'Show the AI what great looks like',
}

const STATUS_STYLE = {
  strong: { bg: '#E7F6EC', fg: '#16794A', label: 'Got it!' },
  okay: { bg: '#FCD34D', fg: '#7A5300', label: 'Almost' },
  missing: { bg: '#EFEEEA', fg: '#5E5A52', label: 'Missing' },
}

// One RACE card in its mapped color, with status pill + found + tip.
export default function RaceCard({ part, data }) {
  const color = PART_COLOR[part]
  const status = STATUS_STYLE[data?.status] || STATUS_STYLE.missing
  const letter = part[0].toUpperCase()

  return (
    <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-4">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-pill flex items-center justify-center font-display font-extrabold text-white text-lg shrink-0"
          style={{ background: color }}
        >
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-indigo-ink leading-tight">{PART_LABEL[part]}</div>
          <div className="text-xs font-body text-neutral-500">{PART_MEANING[part]}</div>
        </div>
        <span
          className="rounded-pill px-3 py-1 text-xs font-display font-bold shrink-0"
          style={{ background: status.bg, color: status.fg }}
        >
          {status.label}
        </span>
      </div>

      {data?.found && (
        <p className="mt-3 text-sm font-body text-indigo-ink">
          <span className="font-bold">You did: </span>
          {data.found}
        </p>
      )}
      {data?.tip && (
        <p className="mt-1 text-sm font-body text-neutral-600">
          <span className="font-bold">Try: </span>
          {data.tip}
        </p>
      )}
    </div>
  )
}
