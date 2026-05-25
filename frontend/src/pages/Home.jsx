import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'

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

const STRIPE_FULL = 'https://buy.stripe.com/fZucN60BC3SKcLR9eYaR20j'
const STRIPE_PARTIAL = 'https://buy.stripe.com/fZucN6gAA3SK139aj2aR20k'
const STRIPE_CRUISE = 'https://buy.stripe.com/9AQ4k10e1cW96Ri14e'
const HOTEL_URL = 'https://book.passkey.com/go/NUPD2026'

export default function Home() {
  const { days, hours, minutes, seconds } = useCountdown(CONVENTION_DATE)
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-background">
      {/* ─── HERO ─── */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '92vh' }}>
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIndex ? 1 : 0,
              transform: i === heroIndex ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 1.6s ease-in-out, transform 8s ease-out',
              zIndex: 0,
            }}
          />
        ))}

        {/* gradient + grain overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-navy/80 via-navy/65 to-navy/90" />
        <div className="absolute inset-0 z-10 bg-grain opacity-40 mix-blend-overlay" />

        {/* top brand rule */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary via-gold to-primary z-20" />

        <div className="relative z-20 max-w-5xl mx-auto px-5 py-20 sm:py-28 flex flex-col items-center text-center" style={{ minHeight: '92vh' }}>
          <Reveal>
            <div className="flex items-center justify-center gap-5 mb-10">
              <img src="/nup-logo.png" alt="NUP" className="h-14 w-14 object-contain" />
              <div className="w-px h-10 bg-white/20" />
              <img src="/convention-logo.png" alt="Convention" className="h-14 w-14 object-contain" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-[0.18em] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              NUP Diaspora · 2026
            </span>
          </Reveal>

          <Reveal delay={160}>
            <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.05] text-balance mb-5">
              National Unity Platform
              <span className="block text-primary">Diaspora Convention</span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="text-white/80 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
              United for a Free Uganda — a historic gathering of patriots, leaders, and allies dedicated to freedom, justice, and national renewal.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-white/70 text-sm mb-12">
              <span className="flex items-center gap-2"><span className="text-gold">◆</span> August 12–16, 2026</span>
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-2"><span className="text-gold">◆</span> Hilton Los Angeles Airport</span>
            </div>
          </Reveal>

          {/* Countdown */}
          <Reveal delay={360}>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-10">
              {[{ v: days, l: 'Days' }, { v: hours, l: 'Hours' }, { v: minutes, l: 'Minutes' }, { v: seconds, l: 'Seconds' }].map(({ v, l }) => (
                <div key={l} className="bg-white/[0.06] border border-white/15 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[72px] sm:min-w-[88px]">
                  <div className="font-display text-3xl sm:text-5xl font-extrabold tabular text-white leading-none">
                    {String(v).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/60 tracking-[0.18em] mt-2 uppercase">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={420}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={STRIPE_FULL} target="_blank" rel="noreferrer"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 py-3.5 rounded-full text-sm transition shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5">
                Register for Convention
              </a>
              <a href={HOTEL_URL} target="_blank" rel="noreferrer"
                className="bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold px-7 py-3.5 rounded-full text-sm backdrop-blur-sm transition">
                Reserve Hotel Room
              </a>
            </div>
          </Reveal>

          {/* Slide dots */}
          <div className="mt-12 flex gap-2">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setHeroIndex(i)}
                className={`h-1 rounded-full transition-all duration-500 ${i === heroIndex ? 'bg-gold w-8' : 'bg-white/30 w-3 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEME STRIP ─── */}
      <section className="bg-navy text-black border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
          <span className="inline-block bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            2026 Theme
          </span>
          <span className="italic text-black/85 text-sm sm:text-base font-display">
            "Onward to Uganda's Liberation — Through Unity, Strength, and Collective Purpose"
          </span>
        </div>
      </section>

      {/* ─── HIGHLIGHTS ─── */}
      <section className="bg-navy text-black py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HighlightCard icon="◇" title="About the Convention" text="A historic gathering of Ugandan patriots, advocates, and international allies advancing freedom and renewal." />
            <HighlightCard icon="◆" title="Featured Speakers" text="From President Bobi Wine to global democracy advocates and academic leaders." link="/speakers" linkLabel="View Speakers" />
            <HighlightCard icon="◈" title="Convention Program" text="Four days of leadership, advocacy, coalition building, youth empowerment, and celebration." link="/schedule" linkLabel="View Schedule" />
            <HighlightCard icon="◉" title="Boat Cruise" text="Heroes Celebration on Waters — Saturday, Aug 15. Luxury City Cruises vessel from Marina del Rey." link="#boat" linkLabel="Learn More" />
          </div>
        </div>
      </section>

      {/* ─── REGISTRATION ─── */}
      <section className="py-20 px-5 bg-background">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeading kicker="Get your seat" title="Registration" subtitle="Secure your spot at the convention. Payments are processed securely via Stripe." />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Reveal delay={60}>
              <RegCard title="Full Registration" price="$300" sub="One-time payment · best value" link={STRIPE_FULL} label="Pay Full Registration" featured />
            </Reveal>
            <Reveal delay={120}>
              <RegCard title="Partial Payment" price="2 × $150" sub="Pay in two installments" link={STRIPE_PARTIAL} label="Pay in 2 Installments" />
            </Reveal>
            <Reveal delay={180}>
              <RegCard title="Boat Cruise" price="$220" sub="Heroes Celebration · Aug 15" link={STRIPE_CRUISE} label="Buy Cruise Ticket" />
            </Reveal>
          </div>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Registration fees are non-refundable. Swaps accommodated if pre-approved.
          </p>
        </div>
      </section>

      {/* ─── BOAT CRUISE ─── */}
      <section id="boat" className="bg-muted py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden mb-10 h-60 sm:h-80 shadow-elegant">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/boat8.jpg')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/10" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <span className="inline-block bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full mb-4 w-fit uppercase tracking-wider">
                  Signature Experience
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">Heroes Celebration on Waters</h2>
                <p className="text-white/80 text-sm sm:text-base mt-2">Saturday, August 15 · 7:00 PM – 11:00 PM · Marina del Rey</p>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Reveal delay={60}>
              <RegCard title="Full Ticket" price="$220" sub="One-time payment · full cruise access" link={STRIPE_CRUISE} label="Buy Cruise Ticket" featured />
            </Reveal>
            <Reveal delay={120}>
              <RegCard title="Partial Payment" price="2 × $110" sub="Pay in two installments" link="#" label="Pay in 2 Installments" />
            </Reveal>
          </div>

          <p className="text-sm text-muted-foreground mt-6 text-center max-w-2xl mx-auto">
            Join fellow Ugandans aboard a luxury City Cruises vessel. Breathtaking ocean views, live entertainment, music, and dinner.
          </p>
        </div>
      </section>

      {/* ─── VENUE + HOTEL ─── */}
      <section className="py-20 px-5 bg-background">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeading kicker="Where to stay" title="Venue & Accommodation" />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal delay={60}>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lift transition-all hover:-translate-y-1 h-full">
                <div className="h-44 bg-cover bg-center" style={{ backgroundImage: "url('/hotel1.jpg')" }} />
                <div className="p-7">
                  <p className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-2">Venue</p>
                  <h3 className="font-display font-bold text-navy text-xl mb-3">Hilton Los Angeles Airport</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">5711 West Century Boulevard<br />Los Angeles, CA 90045</p>
                  <p className="text-muted-foreground text-sm mt-1">(310) 410-4000</p>
                  <a href="https://www.google.com/maps/search/Hilton+Los+Angeles+Airport+Hotel" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-primary hover:gap-2 transition-all">
                    View on Map <span>→</span>
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="bg-navy text-white rounded-2xl overflow-hidden shadow-elegant h-full">
                <div className="h-44 bg-cover bg-center" style={{ backgroundImage: "url('/hotel2.jpg')" }} />
                <div className="p-7">
                  <p className="text-xs font-semibold text-gold uppercase tracking-[0.18em] mb-2">Group Rate</p>
                  <h3 className="font-display font-bold text-xl mb-4">Reserve Your Room</h3>
                  <p className="font-display text-4xl font-extrabold mb-4">
                    $199 <span className="text-base font-normal text-white/60">/ night</span>
                  </p>
                  <ul className="text-white/75 text-sm space-y-2 mb-6">
                    {['Standard King or 2 Doubles', 'Breakfast included', 'Complimentary WiFi', 'NUP group discount rate', 'Airport shuttle every 30 min'].map(l => (
                      <li key={l} className="flex items-start gap-2"><span className="text-gold mt-0.5">✓</span>{l}</li>
                    ))}
                  </ul>
                  <a href={HOTEL_URL} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-full text-sm transition">
                    Reserve Room <span>→</span>
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── DELEGATES + ALT PAYMENT ─── */}
      <section className="py-20 px-5 bg-muted">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <Reveal>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-3">Travel</p>
            <h2 className="font-display text-2xl font-extrabold text-navy mb-5">International Delegates</h2>
            <ul className="text-foreground/80 text-sm space-y-4">
              {[
                ['✈', 'Closest airport: Los Angeles International (LAX)'],
                ['🚌', 'Complimentary hotel shuttle every 30 minutes'],
                ['📄', 'Register early for visa application processing'],
                ['📋', 'Bring registration acknowledgment to your visa appointment'],
              ].map(([i, t]) => (
                <li key={t} className="flex gap-3"><span className="text-gold">{i}</span><span>{t}</span></li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-3">Alternative payment</p>
            <h2 className="font-display text-2xl font-extrabold text-navy mb-5">Western Union / MoneyGram</h2>
            <div className="bg-card border border-border rounded-2xl p-6 text-sm">
              <p className="font-display font-bold text-navy text-base">Elvis Balikalaba</p>
              <p className="text-muted-foreground">656 Weaver Blvd, Anoka, MN 55303</p>
              <p className="text-muted-foreground">+1 651 208 3354</p>
              <p className="text-primary font-medium mt-1">elvis100b@gmail.com</p>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed border-t border-border pt-4">
                Email <a href="mailto:conventions@diasporanup.org" className="text-primary font-medium">conventions@diasporanup.org</a> after payment to receive your invitation letter.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CONTACT BAR ─── */}
      <section className="bg-background border-t border-border py-6 px-5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <a href="tel:6512786724" className="hover:text-navy font-medium">📞 651 278 6724</a>
          <a href="mailto:conventions@diasporanup.org" className="hover:text-navy font-medium">✉ conventions@diasporanup.org</a>
          <a href="mailto:info@diasporanup.org" className="hover:text-navy font-medium">✉ info@diasporanup.org</a>
        </div>
      </section>

      {/* ─── FOOTER CTA ─── */}
      <section className="relative bg-navy text-white py-20 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-30" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <img src="/nup-logo.png" alt="NUP" className="h-14 w-14 mx-auto mb-6 object-contain" />
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">Join Us in Los Angeles</h2>
          <p className="text-white/70 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Be part of this historic gathering. Register today and help build a New Uganda together.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={STRIPE_FULL} target="_blank" rel="noreferrer"
              className="bg-primary hover:bg-primary/90 font-semibold px-8 py-3.5 rounded-full text-sm shadow-lg shadow-primary/30 transition">
              Register Now →
            </a>
            <a href={HOTEL_URL} target="_blank" rel="noreferrer"
              className="bg-white/10 hover:bg-white/20 border border-white/25 font-semibold px-8 py-3.5 rounded-full text-sm transition">
              Book Hotel →
            </a>
          </div>
          <p className="text-white/40 text-xs mt-10">© 2026 NUP Diaspora · conventions@diasporanup.org</p>
        </div>
      </section>
    </div>
  )
}

function HighlightCard({ icon, title, text, link, linkLabel }) {
  return (
    <div className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl p-6 transition-all hover:-translate-y-1">
      <div className="text-gold text-xl mb-4">{icon}</div>
      <h3 className="font-display font-bold text-white text-base mb-2">{title}</h3>
      <p className="text-white/65 text-sm leading-relaxed mb-4">{text}</p>
      {linkLabel && (
        <Link to={link} className="text-xs font-semibold text-primary uppercase tracking-wider inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          {linkLabel} <span>→</span>
        </Link>
      )}
    </div>
  )
}

function RegCard({ title, price, sub, link, label, featured }) {
  return (
    <div className={`relative rounded-2xl p-7 flex flex-col h-full transition-all hover:-translate-y-1 ${
      featured
        ? 'bg-navy text-white shadow-elegant border border-navy'
        : 'bg-card border border-border shadow-sm hover:shadow-lift'
    }`}>
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <h3 className={`text-xs font-semibold uppercase tracking-[0.18em] mb-4 ${featured ? 'text-gold' : 'text-primary'}`}>{title}</h3>
      <p className={`font-display text-4xl font-extrabold mb-2 ${featured ? 'text-white' : 'text-navy'}`}>{price}</p>
      <p className={`text-sm mb-7 flex-1 ${featured ? 'text-white/60' : 'text-muted-foreground'}`}>{sub}</p>
      <a href={link} target="_blank" rel="noreferrer"
        className={`text-center font-semibold px-5 py-3 rounded-full text-sm transition ${
          featured
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
            : 'bg-navy hover:bg-navy/90 text-white'
        }`}>
        {label}
      </a>
    </div>
  )
}
