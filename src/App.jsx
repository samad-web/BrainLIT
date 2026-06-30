import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Guard from './components/Guard.jsx'
import Home from './pages/Home.jsx'
import Progress from './pages/Progress.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      {/* Kid screens share the bottom-nav layout and are identity-guarded */}
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Standalone screens (no kid nav, not guarded) */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
