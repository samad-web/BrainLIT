import { useState } from 'react'

// Uses /public/logo.png when present, otherwise a brand-mark SVG fallback so the
// app always looks finished. Drop the Brainlit PNG at public/logo.png.
export default function Logo({ size = 40, withWordmark = false, className = '' }) {
  const [imgOk, setImgOk] = useState(true)

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {imgOk ? (
        <img
          src="/logo.png"
          alt="Brainlit"
          width={size}
          height={size}
          style={{ height: size, width: 'auto' }}
          className="object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        <FallbackMark size={size} />
      )}
      {withWordmark && !imgOk && (
        <span
          className="font-display font-extrabold bg-brand bg-clip-text text-transparent"
          style={{ fontSize: size * 0.7 }}
        >
          Brainlit
        </span>
      )}
    </span>
  )
}

function FallbackMark({ size }) {
  // Brand-mark approximation of the Brainlit logo: a brain split into a blue
  // left hemisphere and purple right hemisphere, a yellow spark, spark rays,
  // and a lightbulb base. Used only until public/logo.png is present.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {/* spark rays */}
      <g stroke="#FBBF24" strokeWidth="2.4" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="9" />
        <line x1="18" y1="7" x2="21" y2="12" />
        <line x1="46" y1="7" x2="43" y2="12" />
        <line x1="9" y1="17" x2="14" y2="20" />
        <line x1="55" y1="17" x2="50" y2="20" />
      </g>
      {/* left hemisphere (blue) */}
      <path d="M31 13c-3-2-7-2-10 0-5 2-8 7-7 12-3 2-4 6-2 9 1 4 5 6 9 6h10V13z" fill="#6BA7E8" />
      {/* right hemisphere (purple) */}
      <path d="M33 13c3-2 7-2 10 0 5 2 8 7 7 12 3 2 4 6 2 9-1 4-5 6-9 6H33V13z" fill="#A37EDD" />
      {/* central spark */}
      <circle cx="32" cy="30" r="4.2" fill="#FBBF24" />
      {/* bulb base */}
      <rect x="26" y="46" width="12" height="3" rx="1.5" fill="#2E3A8C" />
      <rect x="27" y="51" width="10" height="3" rx="1.5" fill="#2E3A8C" />
      <rect x="29" y="56" width="6" height="3" rx="1.5" fill="#2E3A8C" />
    </svg>
  )
}
