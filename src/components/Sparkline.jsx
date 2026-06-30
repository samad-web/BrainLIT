// Tiny SVG sparkline / bar chart. Used in Progress and the admin table.
export default function Sparkline({ values = [], width = 220, height = 56, color = '#FBBF24', max = 4, mode = 'bar' }) {
  if (!values.length) {
    return <div className="text-sm text-neutral-400 font-body">No data yet</div>
  }
  const pad = 4
  const w = width - pad * 2
  const h = height - pad * 2
  const n = values.length
  const x = (i) => pad + (n === 1 ? w / 2 : (i / (n - 1)) * w)
  const y = (v) => pad + h - (Math.max(0, Math.min(max, v)) / max) * h

  if (mode === 'line') {
    const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
    return (
      <svg width={width} height={height} role="img" aria-label="score trend">
        <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={color} />
        ))}
      </svg>
    )
  }

  // bar mode
  const bw = Math.max(6, (w / n) * 0.6)
  return (
    <svg width={width} height={height} role="img" aria-label="score trend">
      {values.map((v, i) => {
        const bx = pad + (n === 1 ? w / 2 - bw / 2 : (i / Math.max(1, n - 1)) * (w - bw))
        const by = y(v)
        return (
          <rect key={i} x={bx} y={by} width={bw} height={pad + h - by} rx="3" fill={color} opacity={0.45 + 0.55 * (v / max)} />
        )
      })}
    </svg>
  )
}
