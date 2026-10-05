import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    isActive
      ? 'text-red-500 font-semibold border-b-2 border-red-500 pb-0.5'
      : 'text-gray-700 hover:text-red-500 transition'

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo + name */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/nup-logo.png" alt="NUP Logo" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="text-gray-900 font-bold text-sm leading-none">NUP Diaspora App</p>
            <p className="text-red-500 text-xs font-semibold">National Unity Platform</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm flex-wrap justify-end">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/executives" className={linkClass}>Executives</NavLink>
          <NavLink to="/fundraiser" className={linkClass}>$50k Drive</NavLink>
          <NavLink to="/admin" className="text-gray-400 hover:text-gray-600 text-xs transition">Admin</NavLink>
        </div>

        {/* Mobile / tablet menu button */}
        <button className="md:hidden text-gray-700" onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 flex flex-col gap-3 text-sm">
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/executives" className={linkClass} onClick={() => setOpen(false)}>Executives</NavLink>
          <NavLink to="/fundraiser" className={linkClass} onClick={() => setOpen(false)}>$50k Drive</NavLink>
          <NavLink to="/admin" className="text-gray-400 text-xs" onClick={() => setOpen(false)}>Admin</NavLink>
        </div>
      )}
    </nav>
  )
}
