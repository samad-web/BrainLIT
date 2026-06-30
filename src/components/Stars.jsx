// Row of 0–4 stars in spark color.
export default function Stars({ count = 0, max = 4, size = 28 }) {
  return (
    <div className="inline-flex items-center gap-1" aria-label={`${count} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} filled={i < count} size={size} />
      ))}
    </div>
  )
}

function Star({ filled, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z"
        fill={filled ? '#FBBF24' : '#EFEEEA'}
        stroke={filled ? '#F59E0B' : '#DAD7D0'}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
