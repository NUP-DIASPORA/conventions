import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    isActive
      ? 'text-red-500 font-bold text-lg border-b-2 border-red-500 pb-0.5'
      : 'text-gray-800 hover:text-red-500 transition font-bold text-lg'

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">

        {/* Logo + name */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src="/nup-logo.png" alt="NUP Logo" className="h-11 w-11 object-contain" />
          <div className="leading-tight">
            <p className="text-gray-900 font-bold text-lg leading-none">NUP Diaspora App</p>
            <p className="text-red-500 text-sm font-semibold mt-0.5">National Unity Platform</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7 flex-wrap justify-end">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/executives" className={linkClass}>Executives</NavLink>
          <NavLink to="/fundraiser" className={linkClass}>$50k Drive</NavLink>
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>
        </div>

        {/* Mobile / tablet menu button */}
        <button className="md:hidden text-gray-800 text-2xl font-bold leading-none" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-5 flex flex-col gap-4">
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/executives" className={linkClass} onClick={() => setOpen(false)}>Executives</NavLink>
          <NavLink to="/fundraiser" className={linkClass} onClick={() => setOpen(false)}>$50k Drive</NavLink>
          <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>Admin</NavLink>
        </div>
      )}
    </nav>
  )
}
