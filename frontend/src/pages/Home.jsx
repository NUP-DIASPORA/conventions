import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const CONVENTION_DATE = new Date('2026-08-12T00:00:00')

const HERO_IMAGES = ['/hotel1.jpg', '/hotel2.jpg', '/hotel3.jpg', '/boat8.jpg']

function calcTimeLeft(target) {
  const diff = target - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function useCountdown(target) {
  const [t, setT] = useState(calcTimeLeft(target))
  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}

export default function Home() {
  const { days, hours, minutes, seconds } = useCountdown(CONVENTION_DATE)
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_IMAGES.length)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─── */}
      <section className="relative text-white text-center overflow-hidden min-h-[min(88vh,880px)]">

        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            aria-hidden={i !== heroIndex}
            className="absolute inset-0 bg-cover bg-center scale-[1.03]"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIndex ? 1 : 0,
              transition: 'opacity 1.4s ease-in-out',
              zIndex: 0,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/50 to-black/75 z-10" />

        <div className="relative z-20 flex flex-col items-center justify-center px-4 py-16 sm:py-20 min-h-[min(88vh,880px)] max-w-3xl mx-auto">

          <div className="flex items-center justify-center gap-5 mb-6">
            <img src="/nup-logo.png" alt="NUP" className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-md" />
            <div className="w-px h-10 bg-white/25 hidden sm:block" aria-hidden />
            <img src="/convention-logo.png" alt="NUP Diaspora Convention" className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-md" />
          </div>

          <p className="text-red-400 text-xs sm:text-sm font-bold uppercase tracking-[0.18em] mb-4">
            NUP Diaspora Convention · Los Angeles 2026
          </p>

          <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-black leading-[1.08] mb-3">
            <span className="text-white">National Unity Platform</span>
            <span className="block text-red-500 mt-0.5">Diaspora</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/95 font-medium mb-5">
            United for a Free Uganda
          </p>

          <p className="text-sm sm:text-base text-white mb-8">
            <span className="font-semibold">August 12–16, 2026</span>
            <span className="mx-2 text-white/40" aria-hidden>·</span>
            <span>Hilton Los Angeles Airport Hotel</span>
          </p>

          <div
            className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md mb-8"
            role="timer"
            aria-live="polite"
            aria-label={`${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds until the convention`}
          >
            {[{ v: days, l: 'Days' }, { v: hours, l: 'Hours' }, { v: minutes, l: 'Min' }, { v: seconds, l: 'Sec' }].map(({ v, l }) => (
              <div
                key={l}
                className="flex flex-col items-center rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-2 py-2.5 sm:px-3 sm:py-3"
              >
                <span className="text-2xl sm:text-4xl font-black tabular-nums leading-none">
                  {String(v).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/75 uppercase tracking-wider mt-1">{l}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full sm:w-auto mb-8">
            <a
              href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-lg text-sm transition shadow-lg shadow-black/25"
            >
              Register Now
            </a>
            <a
              href="https://book.passkey.com/go/NUPD2026"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/35 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition"
            >
              Reserve Hotel
            </a>
            <a
              href="https://buy.stripe.com/9AQ4k10e1cW96Ri14e"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/35 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition"
            >
              Boat Cruise Tickets
            </a>
          </div>

          <div className="flex gap-2" role="tablist" aria-label="Hero background images">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === heroIndex}
                aria-label={`Show image ${i + 1} of ${HERO_IMAGES.length}`}
                onClick={() => setHeroIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                  i === heroIndex ? 'bg-red-500 w-6' : 'bg-white/30 w-3 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEME + INFO GRID ─── */}
      <section className="bg-gray-900 text-white">
        {/* Theme bar */}
        <div className="border-b border-white/10 py-5 px-4 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mr-3">2026 Convention Theme</span>
          <span className="italic text-blue-100 text-sm">
            "Onward to Uganda's Liberation: Through Unity, Strength, and Collective Purpose"
          </span>
        </div>

        {/* 4-column info grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/10">
          <InfoCell
            icon="🎯"
            title="About the Convention"
            text="A historic gathering of Ugandan patriots, democracy advocates, youth leaders, and international allies dedicated to advancing freedom, justice, and national renewal."
            link="/"
          />
          <InfoCell
            icon="🎤"
            title="Featured Speakers"
            text="Voices of Freedom and Justice — from President Bobi Wine to global democracy advocates and academic leaders."
            link="/speakers"
            linkLabel="View Speakers"
          />
          <InfoCell
            icon="📅"
            title="Convention Program"
            text="4 days of leadership, advocacy, coalition building, youth empowerment, and celebration — August 13–16, 2026."
            link="/schedule"
            linkLabel="View Schedule"
          />
          <InfoCell
            icon="⛵"
            title="Boat Cruise"
            text="Heroes Celebration on Waters — Saturday Aug 15, 7–11 PM. Luxury City Cruises vessel from Marina del Rey."
            link="/"
          />
        </div>
      </section>

      {/* ─── REGISTRATION FEES ─── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-black text-[#0a1c46]">Registration Fees</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <RegCard title="Full Registration" price="$300" sub="One-time payment"
              link="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j" label="Pay Full Registration" primary />
            <RegCard title="Partial Payment" price="2 × $150" sub="Pay in two installments"
              link="https://buy.stripe.com/fZucN6gAA3SK139aj2aR20k" label="Pay in 2 Installments" />
            <RegCard title="Boat Cruise" price="$220" sub="Heroes Celebration · Aug 15"
              link="https://buy.stripe.com/9AQ4k10e1cW96Ri14e" label="Buy Boat Cruise Ticket" />
          </div>
          <p className="text-xs text-gray-400 mt-5 text-center">
            Registration fees are non-refundable. Swaps accommodated if pre-approved.
          </p>
        </div>
      </section>

      {/* ─── BOAT CRUISE ─── */}
      <section className="bg-white py-14 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Photo header */}
          <div className="relative rounded-2xl overflow-hidden mb-10 h-52 sm:h-64">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/boat8.jpg')" }} />
            <div className="absolute inset-0 bg-gray-900/65" />
            <div className="relative z-10 h-full flex flex-col justify-end px-8 pb-7">
              <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mb-3 w-fit">Boat Cruise Experience</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Heroes Celebration on Waters</h2>
              <p className="text-blue-400/60 text-sm mt-1">Saturday, August 15 · 7:00 PM – 11:00 PM · Marina del Rey</p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full ticket */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Full Ticket</h3>
              <p className="text-3xl font-black text-gray-900 mb-1">$220</p>
              <p className="text-xs text-gray-400 mb-6 flex-1">One-time payment · Full access to the cruise</p>
              <a href="https://buy.stripe.com/9AQ4k10e1cW96Ri14e" target="_blank" rel="noreferrer"
                className="text-center bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition">
                Buy Boat Cruise Ticket
              </a>
            </div>

            {/* Installment */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Partial Payment</h3>
              <p className="text-3xl font-black text-gray-900 mb-1">2 × $110</p>
              <p className="text-xs text-gray-400 mb-6 flex-1">Pay in two installments</p>
              <a href="#" target="_blank" rel="noreferrer"
                className="text-center bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition">
                Pay in 2 Installments
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-5 text-center">
            Join fellow Ugandans aboard a luxury City Cruises vessel. Breathtaking ocean views, live entertainment, music, and dinner.
          </p>
        </div>
      </section>

      {/* ─── VENUE + HOTEL ─── */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Venue */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('/hotel1.jpg')" }} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-600 text-lg">📍</span>
                <h3 className="font-black text-[#0a1c46] text-lg">Venue</h3>
              </div>
              <p className="font-bold text-gray-800 mb-1">Hilton Los Angeles Airport Hotel</p>
              <p className="text-gray-500 text-sm">5711 West Century Boulevard<br />Los Angeles, CA 90045</p>
              <p className="text-gray-400 text-sm mt-1">(310) 410-4000</p>
              <a href="https://www.google.com/maps/search/Hilton+Los+Angeles+Airport+Hotel"
                target="_blank" rel="noreferrer"
                className="inline-block mt-4 text-sm font-bold text-red-600 hover:text-red-700">
                View on Map →
              </a>
            </div>
          </div>

          {/* Hotel */}
          <div className="bg-gray-900 rounded-2xl shadow-sm overflow-hidden text-white">
            <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('/hotel2.jpg')" }} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-400 text-lg">🏨</span>
                <h3 className="font-black text-white text-lg">Hotel & Accommodation</h3>
              </div>
              <p className="text-3xl font-black mb-3">$199 <span className="text-base font-normal text-blue-400/60">/ night</span></p>
              <ul className="text-blue-400/60 text-sm space-y-1.5 mb-5">
                <li>✓ Standard King or 2 Doubles</li>
                <li>✓ Breakfast included</li>
                <li>✓ Complimentary WiFi</li>
                <li>✓ NUP group discount rate</li>
                <li>✓ Airport shuttle every 30 min</li>
              </ul>
              <a href="https://book.passkey.com/go/NUPD2026" target="_blank" rel="noreferrer"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition">
                Reserve Room →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERNATIONAL DELEGATES ─── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 bg-red-600 rounded-full" />
              <h2 className="text-xl font-black text-[#0a1c46]">International Delegates</h2>
            </div>
            <ul className="text-gray-600 text-sm space-y-3">
              <li className="flex gap-3"><span>✈️</span><span>Closest Airport: Los Angeles International (LAX)</span></li>
              <li className="flex gap-3"><span>🚌</span><span>Complimentary hotel shuttle every 30 minutes</span></li>
              <li className="flex gap-3"><span>📄</span><span>Register early for visa application processing</span></li>
              <li className="flex gap-3"><span>📋</span><span>Bring registration acknowledgment to your visa appointment</span></li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 bg-[#0a1c46] rounded-full" />
              <h2 className="text-xl font-black text-[#0a1c46]">Alternative Payment</h2>
            </div>
            <p className="text-gray-500 text-xs mb-3">For those unable to pay online — Western Union or MoneyGram:</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700">
              <p className="font-black text-[#0a1c46]">Elvis Balikalaba</p>
              <p className="text-gray-600">656 Weaver Blvd, Anoka, MN 55303</p>
              <p className="text-gray-600">+1 651 208 3354</p>
              <p className="text-blue-700 font-medium">elvis100b@gmail.com</p>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Email conventions@diasporanup.org after payment to receive your invitation letter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT BAR ─── */}
      <section className="bg-gray-100 border-t border-gray-200 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-2">📞 <a href="tel:6512786724" className="hover:text-[#0a1c46] font-medium">651 278 6724</a></span>
          <span className="flex items-center gap-2">✉️ <a href="mailto:conventions@diasporanup.org" className="hover:text-[#0a1c46] font-medium">conventions@diasporanup.org</a></span>
          <span className="flex items-center gap-2">✉️ <a href="mailto:info@diasporanup.org" className="hover:text-[#0a1c46] font-medium">info@diasporanup.org</a></span>
        </div>
      </section>

      {/* ─── FOOTER CTA ─── */}
      <section className="bg-gray-900 text-white py-14 px-4 text-center">
        <img src="/nup-logo.png" alt="NUP" className="h-16 w-16 mx-auto mb-5 object-contain" />
        <h2 className="text-2xl font-black mb-2">Join Us in Los Angeles</h2>
        <p className="text-blue-400/60 text-sm mb-7 max-w-md mx-auto">
          Be part of this historic gathering. Register today and help build a New Uganda together.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j" target="_blank" rel="noreferrer"
            className="bg-red-600 hover:bg-red-700 font-bold px-8 py-3 rounded-lg text-sm shadow transition">
            Register Now →
          </a>
          <a href="https://book.passkey.com/go/NUPD2026" target="_blank" rel="noreferrer"
            className="bg-white/10 hover:bg-white/20 border border-white/20 font-bold px-8 py-3 rounded-lg text-sm transition">
            Book Hotel →
          </a>
        </div>
        <p className="text-blue-400/60 text-xs mt-10">© 2026 NUP Diaspora · conventions@diasporanup.org</p>
      </section>

    </div>
  )
}

function InfoCell({ icon, title, text, link, linkLabel }) {
  return (
    <div className="p-4 sm:p-7 hover:bg-white/5 transition group">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-black text-white text-sm mb-2">{title}</h3>
      <p className="text-blue-400/60 text-xs leading-relaxed mb-3">{text}</p>
      {linkLabel && (
        <Link to={link} className="text-xs text-red-400 font-bold group-hover:text-red-300 transition">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function RegCard({ title, price, sub, link, label, primary }) {
  return (
    <div className={`rounded-2xl border p-6 flex flex-col ${
      primary
        ? 'bg-gray-900 border-gray-900 text-white shadow-xl'
        : 'bg-white border-gray-200 text-gray-800 shadow-sm'
    }`}>
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${primary ? 'text-blue-400/60' : 'text-gray-400'}`}>{title}</h3>
      <p className={`text-3xl font-black mb-1 ${primary ? 'text-white' : 'text-gray-900'}`}>{price}</p>
      <p className={`text-xs mb-6 flex-1 ${primary ? 'text-blue-400/60' : 'text-gray-400'}`}>{sub}</p>
      <a href={link} target="_blank" rel="noreferrer"
        className={`text-center font-bold px-5 py-2.5 rounded-lg text-sm transition ${
          primary
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-800 hover:bg-gray-900 text-white'
        }`}>
        {label}
      </a>
    </div>
  )
}
