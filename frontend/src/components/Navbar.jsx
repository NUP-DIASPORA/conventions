import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    isActive
      ? 'text-red-400 font-semibold border-b-2 border-red-400 pb-0.5'
      : 'text-blue-100 hover:text-white transition'

  return (
    <nav className="bg-[#1a3a6b] shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo + name */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/nup-logo.png" alt="NUP Logo" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="text-white font-bold text-sm leading-none">NUP Diaspora Convention</p>
            <p className="text-red-400 text-xs font-semibold">Los Angeles 2026</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-7 text-sm">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/speakers" className={linkClass}>Speakers</NavLink>
          <NavLink to="/schedule" className={linkClass}>Schedule</NavLink>
          <a href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j" target="_blank" rel="noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition">
            Register
          </a>
          <NavLink to="/admin" className="text-blue-300 hover:text-white text-xs transition">Admin</NavLink>
        </div>

        {/* Mobile menu button */}
        <button className="sm:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden bg-[#152f58] px-4 pb-4 flex flex-col gap-3 text-sm">
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/speakers" className={linkClass} onClick={() => setOpen(false)}>Speakers</NavLink>
          <NavLink to="/schedule" className={linkClass} onClick={() => setOpen(false)}>Schedule</NavLink>
          <a href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j" target="_blank" rel="noreferrer"
            className="bg-red-600 text-white font-semibold px-4 py-2 rounded-full text-center">
            Register Now
          </a>
          <NavLink to="/admin" className="text-blue-400 text-xs" onClick={() => setOpen(false)}>Admin Portal</NavLink>
        </div>
      )}
    </nav>
  )
}
