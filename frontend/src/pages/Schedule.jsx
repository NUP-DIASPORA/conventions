import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSessions } from '../services/api'
import Reveal from '../components/Reveal'

const CONFERENCE_DAYS = [
  { label: 'Thu · Aug 13', date: '2026-08-13', subtitle: 'Arrival & Leadership' },
  { label: 'Fri · Aug 14', date: '2026-08-14', subtitle: 'Engaging the World' },
  { label: 'Sat · Aug 15', date: '2026-08-15', subtitle: 'Building Bridges' },
  { label: 'Sun · Aug 16', date: '2026-08-16', subtitle: 'Closing Day' },
]

const OFFICIAL_PROGRAM = {
  '2026-08-13': [
    { start: '8:00 AM',  end: '2:00 PM',  title: 'Arrival of Delegates',           description: 'Offsite meetings for Ugandan delegates', type: 'logistics' },
    { start: '12:00 PM', end: '1:00 PM',  title: 'Convention Leadership Meetings', description: 'NUP Leadership and organizing committee meeting', type: 'meeting' },
    { start: '2:00 PM',  end: '6:00 PM',  title: 'Empowering Leadership Training', description: 'Leadership training session', type: 'workshop' },
    { start: '7:00 PM',  end: '11:00 PM', title: "Patriot's Day Cup",              description: 'Soccer game: Chicago Cranes vs. NUP Diaspora, followed by Picnic/BBQ', type: 'social' },
  ],
  '2026-08-14': [
    { start: '8:00 AM',  end: '11:00 PM', title: 'Delegate Registration',          description: 'Registration Desk, 2nd floor', type: 'logistics' },
    { start: '8:00 AM',  end: '12:00 PM', title: 'March for Democracy',            description: 'Rally for Democracy Demonstration/Protest', type: 'advocacy' },
    { start: '10:00 AM', end: '12:00 PM', title: 'United Forces for Change',       description: 'Leaders Meeting', type: 'meeting' },
    { start: '12:30 PM', end: '1:30 PM',  title: 'Muslim Prayer Session',          description: '', type: 'prayer' },
    { start: '1:30 PM',  end: '6:00 PM',  title: 'Opening Ceremony',               description: 'Envisioning A New Uganda — Presentation of Papers', type: 'plenary' },
    { start: '7:00 PM',  end: '10:30 PM', title: "Celebrating Women's Excellence", description: "Celebrating Women's Excellence and Achievements", type: 'ceremony' },
    { start: '10:30 PM', end: '1:00 AM',  title: 'Meet and Greet Cocktail',        description: 'Fostering Connections', type: 'social' },
  ],
  '2026-08-15': [
    { start: '8:00 AM',  end: '5:00 PM',  title: 'Delegate Registration',          description: '', type: 'logistics' },
    { start: '8:30 AM',  end: '9:30 AM',  title: 'General Session',                description: 'Welcome remarks and introduction of the theme', type: 'plenary' },
    { start: '9:30 AM',  end: '12:00 PM', title: 'Distinguished Speakers',         description: 'Presentation by Panelists', type: 'talk' },
    { start: '10:00 AM', end: '12:00 PM', title: 'Youth Session',                  description: 'Empowering the Youth', type: 'workshop' },
    { start: '1:00 PM',  end: '3:30 PM',  title: 'Ugandan Delegates',              description: 'Our Collective Vision — Presentation by Ugandan Delegates', type: 'talk' },
    { start: '4:00 PM',  end: '4:30 PM',  title: 'Departure for Boat Cruise',      description: 'Buses depart from the Hotel', type: 'logistics' },
    { start: '7:00 PM',  end: '11:00 PM', title: 'Boat Cruise — Heroes Celebration on Waters', description: 'Dinner and Entertainment aboard a luxury City Cruises vessel from Marina del Rey', type: 'social' },
  ],
  '2026-08-16': [],
}

const TYPE_STYLES = {
  plenary:   'bg-primary/10 text-primary',
  talk:      'bg-navy/10 text-navy',
  workshop:  'bg-emerald-500/10 text-emerald-700',
  meeting:   'bg-gold/15 text-amber-800',
  social:    'bg-pink-500/10 text-pink-700',
  ceremony:  'bg-purple-500/10 text-purple-700',
  logistics: 'bg-muted text-muted-foreground',
  advocacy:  'bg-primary/10 text-primary',
  prayer:    'bg-amber-500/10 text-amber-700',
}

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(CONFERENCE_DAYS[0].date)

  const { data: dbSessions = [] } = useQuery({
    queryKey: ['sessions', selectedDate],
    queryFn: () => getSessions({ session_date: selectedDate }).then(r => r.data),
  })

  const officialSessions = OFFICIAL_PROGRAM[selectedDate] || []

  return (
    <main className="bg-background">
      {/* Header */}
      <section className="bg-navy text-white py-16 sm:py-20 px-5 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-gold uppercase tracking-[0.2em] mb-4">NUP Diaspora Convention 2026</p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-3">Convention Program</h1>
          <p className="text-white/70">Hilton Los Angeles Airport · August 12–16, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-12">
        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 -mx-2 px-2">
          {CONFERENCE_DAYS.map(day => {
            const active = selectedDate === day.date
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`flex flex-col items-start px-5 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-navy text-white shadow-elegant'
                    : 'bg-card text-muted-foreground border border-border hover:border-navy/30 hover:text-navy'
                }`}
              >
                <span className="font-display font-bold">{day.label}</span>
                <span className={`text-xs mt-0.5 ${active ? 'text-gold' : 'text-muted-foreground'}`}>{day.subtitle}</span>
              </button>
            )
          })}
        </div>

        {officialSessions.length === 0 && dbSessions.length === 0 && (
          <p className="text-muted-foreground text-center py-20">Program details coming soon.</p>
        )}

        {/* Timeline */}
        <div className="relative">
          {(officialSessions.length > 0 || dbSessions.length > 0) && (
            <div className="absolute left-[88px] top-2 bottom-2 w-px bg-border hidden sm:block" />
          )}

          <div className="space-y-4">
            {officialSessions.map((s, i) => (
              <Reveal key={i} delay={i * 40}>
                <TimelineRow session={s} />
              </Reveal>
            ))}

            {dbSessions.map(session => (
              <Reveal key={session.id}>
                <TimelineRow
                  session={{
                    start: session.start_time.slice(0, 5),
                    end: session.end_time.slice(0, 5),
                    title: session.title,
                    description: [
                      session.speaker ? `${session.speaker.first_name} ${session.speaker.last_name}` : null,
                      session.description,
                      session.location ? `📍 ${session.location}` : null,
                    ].filter(Boolean).join(' · '),
                    type: session.session_type,
                  }}
                />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Program PDF */}
        <Reveal>
          <div className="mt-14 bg-navy text-white rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-elegant">
            <div className="text-3xl text-gold">📄</div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg">Download the full program</h3>
              <p className="text-sm text-white/70">Get the official Convention 2026 program (PDF)</p>
            </div>
            <a href="https://diasporanup.org/convention-2026-program.pdf" target="_blank" rel="noreferrer"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full transition whitespace-nowrap">
              Download PDF
            </a>
          </div>
        </Reveal>
      </div>
    </main>
  )
}

function TimelineRow({ session: s }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 flex items-start gap-5 hover:shadow-lift hover:-translate-y-0.5 transition-all">
      <div className="text-right shrink-0 w-20 sm:w-[72px] relative">
        <p className="text-xs font-bold text-navy tabular">{s.start}</p>
        <p className="text-[11px] text-muted-foreground tabular">{s.end}</p>
        <span className="hidden sm:block absolute -right-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
      </div>
      <div className="flex-1 min-w-0 sm:pl-6">
        <h3 className="font-display font-bold text-navy">{s.title}</h3>
        {s.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.description}</p>}
      </div>
      {s.type && (
        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 font-semibold ${TYPE_STYLES[s.type] || 'bg-muted text-muted-foreground'}`}>
          {s.type}
        </span>
      )}
    </div>
  )
}
