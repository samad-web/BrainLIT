import { NavLink, Outlet } from 'react-router-dom'
import { useStudent } from '../context/StudentContext.jsx'
import Logo from './Logo.jsx'

// Kid layout: top brand bar, routed content, bottom nav (Home · Progress · Me),
// and the idling buddy in the corner.
export default function Layout() {
  const { student } = useStudent()

  return (
    <div className="min-h-full flex flex-col bg-cream">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display font-extrabold text-lg bg-brand bg-clip-text text-transparent">
              RACE Coach
            </span>
          </NavLink>
          {student?.firstName && (
            <span className="font-body text-sm text-neutral-500">
              Hi, <span className="font-bold text-indigo-ink">{student.firstName}</span>!
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-neutral-200">
        <div className="mx-auto max-w-2xl grid grid-cols-3">
          <Tab to="/" label="Home" color="#4A90E2" icon={HomeIcon} />
          <Tab to="/progress" label="Progress" color="#22D3EE" icon={ChartIcon} />
          <Tab to="/profile" label="Me" color="#9061D9" icon={StarIcon} />
        </div>
      </nav>
    </div>
  )
}

function Tab({ to, label, color, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className="flex flex-col items-center justify-center gap-0.5 py-2.5"
    >
      {({ isActive }) => (
        <>
          <Icon color={isActive ? color : '#9AA0AB'} />
          <span
            className="font-display text-xs font-bold"
            style={{ color: isActive ? color : '#9AA0AB' }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

const HomeIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
)
const ChartIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)
const StarIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" />
  </svg>
)
