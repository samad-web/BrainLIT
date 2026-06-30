import { Navigate } from 'react-router-dom'
import { useStudent } from '../context/StudentContext.jsx'

// Gate the kid screens: no identity → /login.
export default function Guard({ children }) {
  const { identity, loading } = useStudent()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="font-display text-purple-500 text-lg animate-pulse">Loading…</div>
      </div>
    )
  }
  if (!identity?.studentId) return <Navigate to="/login" replace />
  return children
}
