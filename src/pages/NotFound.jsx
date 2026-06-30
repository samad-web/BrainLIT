import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center text-center px-6">
      <Logo size={72} />
      <h1 className="mt-4 font-display font-extrabold text-3xl text-indigo-ink">Oops, lost in space! 🚀</h1>
      <p className="mt-2 font-body text-neutral-600">We couldn't find that page.</p>
      <Link to="/" className="mt-6 bg-brand text-white rounded-pill shadow-glow font-display font-bold px-6 py-3">
        Go Home
      </Link>
    </div>
  )
}
