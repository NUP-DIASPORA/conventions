import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const CONVENTION_DATE = new Date('2026-08-12T00:00:00')

const HERO_IMAGES = [
  '/hotel1.jpg',
  '/hotel2.jpg',
  '/hotel3.jpg',
  '/hotelClaire.jpeg',
  '/boat8.jpg',
]

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
    const id = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─── */}
      <section className="relative text-white text-center overflow-hidden" style={{ minHeight: '92vh' }}>

        {/* Slideshow images */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIndex ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
              zIndex: 0,
            }}
          />
        ))}

        {/* No overlay — show images as-is */}

        {/* Red top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-20" />

        {/* Hero content */}
        <div className="relative z-20 flex flex-col items-center justify-center px-4 py-16" style={{ minHeight: '92vh' }}>

          {/* Logos */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src="/nup-logo.png" alt="NUP" className="h-20 w-20 object-contain drop-shadow-2xl" />
            <div className="w-px h-16 bg-white/25 hidden sm:block" />
            <img src="/convention-logo.png" alt="Convention" className="h-20 w-20 object-contain drop-shadow-2xl" />
          </div>

          {/* Title */}
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300 mb-3"
            style={{ textShadow: '0 0 12px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)' }}>
            National Unity Platform Diaspora
          </p>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-1"
            style={{ textShadow: '0 0 20px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 2px 2px 0px rgba(0,0,0,0.8)' }}>
            NUP Diaspora Convention
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black text-red-500 mb-3"
            style={{ textShadow: '0 0 20px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 2px 2px 0px rgba(0,0,0,0.8)' }}>
            Los Angeles 2026
          </h2>
          <p className="text-lg italic text-white/90 mb-1 font-medium"
            style={{ textShadow: '0 0 12px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)' }}>
            United for a Free Uganda
          </p>

          {/* Date + venue */}
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-8"
            style={{ textShadow: '0 0 10px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)' }}>
            <span>📅</span>
            <span>August 12–16, 2026</span>
            <span className="text-white/30">·</span>
            <span>🏨</span>
            <span>Hilton Los Angeles Airport Hotel</span>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-3 mb-8">
            {[{ v: days, l: 'DAYS' }, { v: hours, l: 'HOURS' }, { v: minutes, l: 'MINUTES' }, { v: seconds, l: 'SECONDS' }].map(({ v, l }, i) => (
              <div key={l} className="flex items-center gap-3">
                {i > 0 && <span className="text-white/40 text-2xl font-light">:</span>}
                <div className="flex flex-col items-center bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[72px]">
                  <span className="text-3xl sm:text-4xl font-black tabular-nums text-white leading-none">
                    {String(v).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-blue-300 tracking-widest mt-1">{l}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <a href="https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-7 py-3 rounded-lg text-sm shadow-xl transition">
              🎟️ Pay for Convention
            </a>
            <a href="https://book.passkey.com/go/NUPD2026" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-[#0a1c46] font-bold px-7 py-3 rounded-lg text-sm shadow-xl transition">
              🏨 Reserve a Hotel
            </a>
            <a href="https://buy.stripe.com/9AQ4k10e1cW96Ri14e" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-[#0a1c46] hover:bg-[#0f2850] border border-white/30 text-white font-bold px-7 py-3 rounded-lg text-sm shadow-xl transition">
              ⛵ Pay for Boat Cruise
            </a>
          </div>

          {/* Slide dots */}
          <div className="flex gap-2">
            {HERO_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setHeroIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'bg-red-500 w-6' : 'bg-white/30 w-3'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEME + INFO GRID ─── */}
      <section className="bg-[#0a1c46] text-white">
        {/* Theme bar */}
        <div className="border-b border-white/10 py-5 px-4 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mr-3">2026 Convention Theme</span>
          <span className="italic text-blue-100 text-sm">
            "Onward to Uganda's Liberation: Through Unity, Strength, and Collective Purpose"
          </span>
        </div>

        {/* 4-column info grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
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
              link="https://buy.stripe.com/bIYaIp1i59JX7Vm6ov" label="Pay in 2 Installments" />
            <RegCard title="Boat Cruise" price="$220" sub="Heroes Celebration · Aug 15"
              link="https://buy.stripe.com/9AQ4k10e1cW96Ri14e" label="Buy Boat Cruise Ticket" />
          </div>
          <p className="text-xs text-gray-400 mt-5 text-center">
            Registration fees are non-refundable. Swaps accommodated if pre-approved.
          </p>
        </div>
      </section>

      {/* ─── BOAT CRUISE ─── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/boat8.jpg')" }}
        />
        <div className="absolute inset-0 bg-[#0a1c46]/85" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1 text-white">
            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mb-4">Boat Cruise Experience</span>
            <h2 className="text-3xl font-black mb-2">Heroes Celebration on Waters</h2>
            <p className="text-blue-200 mb-1 text-sm font-medium">Saturday, August 15 · 7:00 PM – 11:00 PM</p>
            <p className="text-blue-300 text-sm mb-6 leading-relaxed">
              Join fellow Ugandans aboard a luxury City Cruises vessel from Marina del Rey.
              Enjoy breathtaking ocean views, live entertainment, music, dinner, and conversations with NUP leaders and convention guests.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-4xl font-black text-white">$220</span>
              <a href="https://buy.stripe.com/9AQ4k10e1cW96Ri14e" target="_blank" rel="noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm transition shadow-lg">
                Buy Boat Cruise Ticket
              </a>
            </div>
          </div>
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
          <div className="bg-[#0a1c46] rounded-2xl shadow-sm overflow-hidden text-white">
            <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('/hotel2.jpg')" }} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-400 text-lg">🏨</span>
                <h3 className="font-black text-white text-lg">Hotel & Accommodation</h3>
              </div>
              <p className="text-3xl font-black mb-3">$199 <span className="text-base font-normal text-blue-300">/ night</span></p>
              <ul className="text-blue-100 text-sm space-y-1.5 mb-5">
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
      <section className="bg-[#0a1c46] text-white py-14 px-4 text-center">
        <img src="/nup-logo.png" alt="NUP" className="h-16 w-16 mx-auto mb-5 object-contain" />
        <h2 className="text-2xl font-black mb-2">Join Us in Los Angeles</h2>
        <p className="text-blue-200 text-sm mb-7 max-w-md mx-auto">
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
    <div className="p-7 hover:bg-white/5 transition group">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-black text-white text-sm mb-2">{title}</h3>
      <p className="text-blue-200 text-xs leading-relaxed mb-3">{text}</p>
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
        ? 'bg-[#0a1c46] border-[#0a1c46] text-white shadow-xl'
        : 'bg-white border-gray-200 text-gray-800 shadow-sm'
    }`}>
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${primary ? 'text-blue-300' : 'text-gray-400'}`}>{title}</h3>
      <p className={`text-3xl font-black mb-1 ${primary ? 'text-white' : 'text-[#0a1c46]'}`}>{price}</p>
      <p className={`text-xs mb-6 flex-1 ${primary ? 'text-blue-300' : 'text-gray-400'}`}>{sub}</p>
      <a href={link} target="_blank" rel="noreferrer"
        className={`text-center font-bold px-5 py-2.5 rounded-lg text-sm transition ${
          primary
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-[#0a1c46] hover:bg-[#0f2850] text-white'
        }`}>
        {label}
      </a>
    </div>
  )
}
