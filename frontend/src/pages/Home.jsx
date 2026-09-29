import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const HERO_IMAGES = [
  '/hero-diaspora-main.jpg',
  '/hero-diaspora-1.jpg',
  '/hero-diaspora-4.jpg',
  '/hero-diaspora-2.jpg',
  '/hero-diaspora-6.jpg',
  '/hero-diaspora-3.jpg',
  '/hero-diaspora-5.jpg',
]

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_IMAGES.length)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f7fb]">

      {/* ─── HERO: photo-first, text only at the bottom ─── */}
      <section className="relative overflow-hidden min-h-[min(92vh,920px)] text-white">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            aria-hidden={i !== heroIndex}
            className="absolute inset-0 bg-cover bg-[center_35%]"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIndex ? 1 : 0,
              transition: 'opacity 1.6s ease-in-out',
            }}
          />
        ))}

        {/* Keep the photo readable — only a light bottom fade for the title */}
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#0a1c46]/90 via-[#0a1c46]/45 to-transparent pointer-events-none" />

        <div className="relative z-10 min-h-[min(92vh,920px)] flex flex-col justify-end px-5 sm:px-8 pb-10 sm:pb-14 pt-24">
          <div className="max-w-6xl mx-auto w-full">
            <p className="text-[#1e3a8a] text-xs sm:text-sm font-bold uppercase tracking-[0.22em] mb-3 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              National Unity Platform
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-4 max-w-3xl">
              NUP Diaspora App
            </h1>
            <p className="text-white/85 text-base sm:text-lg max-w-xl mb-7 leading-relaxed">
              Stay connected with the diaspora — community action, chapter drives, and the path to a free Uganda.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                to="/fundraiser"
                className="inline-flex justify-center items-center bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3.5 rounded-md text-sm transition"
              >
                Pledge to the $50k Drive
              </Link>
              <Link
                to="/convention"
                className="inline-flex justify-center items-center border border-white/40 hover:bg-white/10 text-white font-semibold px-7 py-3.5 rounded-md text-sm transition"
              >
                2026 Convention
              </Link>
            </div>

            <div className="flex gap-2" role="tablist" aria-label="Hero photos">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === heroIndex}
                  aria-label={`Show photo ${i + 1}`}
                  onClick={() => setHeroIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === heroIndex ? 'bg-red-500 w-8' : 'bg-white/35 w-3 hover:bg-white/55'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── $50K DRIVE ─── */}
      <section className="px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-red-600 text-xs font-bold uppercase tracking-[0.18em] mb-3">
              CA / West Coast Chapter
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0a1c46] leading-tight mb-4">
              $50,000 Drive
            </h2>
            <p className="text-[#3a465c] text-base leading-relaxed mb-4 max-w-lg">
              Pledge to help our comrades in Uganda — political prisoners and NUP programmes that keep the struggle for freedom alive.
            </p>
            <p className="text-[#6b7589] text-sm leading-relaxed mb-8 max-w-lg">
              Every pledge counts. Submit the form to record your commitment; payment instructions follow through approved chapter channels.
            </p>
            <Link
              to="/fundraiser"
              className="inline-flex bg-red-600 hover:bg-red-700 text-white font-bold px-7 py-3 rounded-md text-sm transition"
            >
              Make a Pledge
            </Link>
          </div>

          <Link to="/fundraiser" className="block group">
            <div className="overflow-hidden rounded-lg shadow-[0_20px_50px_-28px_rgba(10,28,70,0.55)] ring-1 ring-black/5 bg-white">
              <img
                src="/50k-drive.jpg"
                alt="$50,000 Drive flyer for NUP Diaspora CA/West Coast Chapter"
                className="w-full h-auto transition duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── CONVENTION ARCHIVE ─── */}
      <section className="bg-[#0a1c46] text-white px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-red-300 text-xs font-bold uppercase tracking-[0.18em] mb-2">
                Los Angeles · August 2026
              </p>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                The Convention lives on
              </h2>
            </div>
            <Link
              to="/convention"
              className="shrink-0 text-sm font-bold text-white/90 hover:text-white underline underline-offset-4 decoration-red-500"
            >
              Open convention archive →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { src: '/hero-diaspora-1.jpg', label: 'On stage' },
              { src: '/hero-diaspora-4.jpg', label: 'Celebration' },
              { src: '/hero-diaspora-2.jpg', label: 'Together' },
              { src: '/hero-diaspora-6.jpg', label: 'Community' },
            ].map((shot) => (
              <Link
                key={shot.src}
                to="/convention"
                className="relative aspect-[4/5] overflow-hidden rounded-md group"
              >
                <img
                  src={shot.src}
                  alt={shot.label}
                  className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-80" />
                <span className="absolute bottom-3 left-3 text-xs font-semibold tracking-wide text-white/95">
                  {shot.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NAV DESTINATIONS ─── */}
      <section className="px-5 sm:px-8 py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0a1c46] mb-8">
            Explore the app
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <ExploreLink
              to="/executives"
              title="Executives"
              text="Meet the leaders coordinating diaspora chapters and community work."
            />
            <ExploreLink
              to="/speakers"
              title="Speakers"
              text="Voices of freedom and justice from the 2026 Los Angeles gathering."
            />
            <ExploreLink
              to="/my-qr"
              title="My QR Code"
              text="Look up your delegate QR for check-in and convention access."
            />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-black/5 bg-[#f5f7fb] px-5 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-[#5a6578]">
          <p className="font-semibold text-[#0a1c46]">NUP Diaspora App</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="tel:8185713246" className="hover:text-[#0a1c46]">818 571 3246</a>
            <a href="mailto:info@diasporanup.org" className="hover:text-[#0a1c46]">info@diasporanup.org</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ExploreLink({ to, title, text }) {
  return (
    <Link to={to} className="group block border-t-2 border-red-600 pt-5">
      <h3 className="text-lg font-black text-[#0a1c46] mb-2 group-hover:text-red-600 transition">
        {title}
      </h3>
      <p className="text-sm text-[#5a6578] leading-relaxed mb-3">{text}</p>
      <span className="text-xs font-bold text-red-600 tracking-wide">Open →</span>
    </Link>
  )
}
