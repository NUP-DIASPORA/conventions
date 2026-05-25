import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = ({ isActive }) =>
    `relative text-sm font-medium transition-colors ${
      isActive ? 'text-navy' : 'text-muted-foreground hover:text-navy'
    } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-primary after:transition-all ${
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`

  return (
    <nav
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? 'bg-background/85 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-background/60 backdrop-blur border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/nup-logo.png" alt="NUP" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <p className="font-display font-bold text-navy text-[13px] leading-none">NUP Diaspora Convention</p>
            <p className="text-primary text-[11px] font-semibold mt-1 tracking-wide">LOS ANGELES · 2026</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/speakers" className={linkClass}>Speakers</NavLink>
          <NavLink to="/schedule" className={linkClass}>Schedule</NavLink>
          <a
            href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j"
            target="_blank"
            rel="noreferrer"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full transition shadow-sm hover:shadow"
          >
            Register
          </a>
          <NavLink to="/admin" className="text-muted-foreground/60 hover:text-muted-foreground text-xs">
            Admin
          </NavLink>
        </div>

        <button
          aria-label="Toggle menu"
          className="md:hidden text-navy p-2 -mr-2"
          onClick={() => setOpen(!open)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-t border-border px-5 py-4 flex flex-col gap-4 text-sm animate-fade-up">
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/speakers" className={linkClass} onClick={() => setOpen(false)}>Speakers</NavLink>
          <NavLink to="/schedule" className={linkClass} onClick={() => setOpen(false)}>Schedule</NavLink>
          <a
            href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j"
            target="_blank"
            rel="noreferrer"
            className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-full text-center"
          >
            Register Now
          </a>
          <NavLink to="/admin" className="text-muted-foreground/60 text-xs" onClick={() => setOpen(false)}>
            Admin Portal
          </NavLink>
        </div>
      )}
    </nav>
  )
}
