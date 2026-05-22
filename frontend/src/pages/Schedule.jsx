import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSessions } from '../services/api'

const CONFERENCE_DAYS = [
  { label: 'Thu Aug 13', date: '2026-08-13', subtitle: 'Arrival & Leadership' },
  { label: 'Fri Aug 14', date: '2026-08-14', subtitle: 'Engaging the World' },
  { label: 'Sat Aug 15', date: '2026-08-15', subtitle: 'Building Bridges' },
  { label: 'Sun Aug 16', date: '2026-08-16', subtitle: 'Closing Day' },
]

// Hardcoded program from the official schedule (supplements any DB sessions)
const OFFICIAL_PROGRAM = {
  '2026-08-13': [
    { start: '8:00 AM', end: '2:00 PM',  title: 'Arrival of Delegates',           description: 'Offsite meetings for Ugandan delegates', type: 'logistics' },
    { start: '12:00 PM', end: '1:00 PM', title: 'Convention Leadership Meetings', description: 'NUP Leadership and Convention organizing committee meeting', type: 'meeting' },
    { start: '2:00 PM', end: '6:00 PM',  title: 'Empowering Leadership Training', description: 'Leadership training session', type: 'workshop' },
    { start: '7:00 PM', end: '11:00 PM', title: "Patriot's Day Cup",              description: 'Soccer game: Chicago Cranes vs. NUP Diaspora, followed by Picnic/BBQ', type: 'social' },
  ],
  '2026-08-14': [
    { start: '8:00 AM', end: '11:00 PM', title: 'Delegate Registration',          description: 'Registration Desk, 2nd floor', type: 'logistics' },
    { start: '8:00 AM', end: '12:00 PM', title: 'March for Democracy',            description: 'Rally for Democracy Demonstration/Protest', type: 'advocacy' },
    { start: '10:00 AM', end: '12:00 PM',title: 'United Forces for Change',       description: 'Leaders Meeting', type: 'meeting' },
    { start: '12:30 PM', end: '1:30 PM', title: 'Muslim Prayer Session',          description: '', type: 'prayer' },
    { start: '1:30 PM', end: '6:00 PM',  title: 'Opening Ceremony',              description: 'Envisioning A New Uganda — Presentation of Papers', type: 'plenary' },
    { start: '7:00 PM', end: '10:30 PM', title: "Celebrating Women's Excellence", description: "Celebrating Women's Excellence and Achievements", type: 'ceremony' },
    { start: '10:30 PM', end: '1:00 AM', title: 'Meet and Greet Cocktail',        description: 'Fostering Connections', type: 'social' },
  ],
  '2026-08-15': [
    { start: '8:00 AM', end: '5:00 PM',  title: 'Delegate Registration',          description: '', type: 'logistics' },
    { start: '8:30 AM', end: '9:30 AM',  title: 'General Session',               description: 'Welcome remarks and introduction of the theme', type: 'plenary' },
    { start: '9:30 AM', end: '12:00 PM', title: 'Distinguished Speakers',         description: 'Presentation by Panelists', type: 'talk' },
    { start: '10:00 AM', end: '12:00 PM',title: 'Youth Session',                  description: 'Empowering the Youth', type: 'workshop' },
    { start: '1:00 PM', end: '3:30 PM',  title: 'Ugandan Delegates',             description: 'Our Collective Vision — Presentation by Ugandan Delegates', type: 'talk' },
    { start: '4:00 PM', end: '4:30 PM',  title: 'Departure for Boat Cruise',     description: 'Buses depart from the Hotel', type: 'logistics' },
    { start: '7:00 PM', end: '11:00 PM', title: 'Boat Cruise — Heroes Celebration on Waters', description: 'Dinner and Entertainment aboard a luxury City Cruises vessel from Marina del Rey', type: 'social' },
  ],
  '2026-08-16': [],
}

const TYPE_STYLES = {
  plenary:   'bg-blue-100 text-blue-700',
  talk:      'bg-indigo-50 text-indigo-600',
  workshop:  'bg-green-100 text-green-700',
  meeting:   'bg-yellow-50 text-yellow-700',
  social:    'bg-pink-50 text-pink-600',
  ceremony:  'bg-purple-50 text-purple-600',
  logistics: 'bg-gray-100 text-gray-500',
  advocacy:  'bg-red-50 text-red-600',
  prayer:    'bg-amber-50 text-amber-700',
}

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(CONFERENCE_DAYS[0].date)

  const { data: dbSessions = [] } = useQuery({
    queryKey: ['sessions', selectedDate],
    queryFn: () => getSessions({ session_date: selectedDate }).then(r => r.data),
  })

  const officialSessions = OFFICIAL_PROGRAM[selectedDate] || []
  const selectedDay = CONFERENCE_DAYS.find(d => d.date === selectedDate)

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-1">NUP Diaspora Convention 2026</p>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Convention Program</h1>
      <p className="text-gray-500 text-sm mb-6">Hilton Los Angeles Airport Hotel · August 12–16, 2026</p>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {CONFERENCE_DAYS.map(day => (
          <button
            key={day.date}
            onClick={() => setSelectedDate(day.date)}
            className={`flex flex-col items-center px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              selectedDate === day.date
                ? 'bg-blue-700 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <span>{day.label}</span>
            <span className={`text-xs ${selectedDate === day.date ? 'text-blue-200' : 'text-gray-400'}`}>{day.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Official program sessions */}
      {officialSessions.length === 0 && dbSessions.length === 0 && (
        <p className="text-gray-400 text-center py-12">Program details coming soon.</p>
      )}

      <div className="space-y-3">
        {officialSessions.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className="text-right shrink-0 w-24">
              <p className="text-xs font-semibold text-blue-700">{s.start}</p>
              <p className="text-xs text-gray-400">{s.end}</p>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">{s.title}</h3>
              {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full shrink-0 font-medium ${TYPE_STYLES[s.type] || 'bg-gray-100 text-gray-500'}`}>
              {s.type}
            </span>
          </div>
        ))}

        {/* Any admin-added DB sessions for this day */}
        {dbSessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 flex items-start gap-4">
            <div className="text-right shrink-0 w-24">
              <p className="text-xs font-semibold text-blue-700">{session.start_time.slice(0, 5)}</p>
              <p className="text-xs text-gray-400">{session.end_time.slice(0, 5)}</p>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">{session.title}</h3>
              {session.speaker && (
                <p className="text-xs text-blue-600 mt-0.5">{session.speaker.first_name} {session.speaker.last_name}</p>
              )}
              {session.description && <p className="text-sm text-gray-500 mt-0.5">{session.description}</p>}
              {session.location && <p className="text-xs text-gray-400 mt-1">📍 {session.location}</p>}
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">{session.session_type}</span>
          </div>
        ))}
      </div>

      {/* Program PDF */}
      <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="text-4xl">📄</div>
        <div>
          <h3 className="font-semibold text-gray-800">Download the Full Program</h3>
          <p className="text-sm text-gray-500">Get the official Convention 2026 program (PDF)</p>
        </div>
        <a href="https://diasporanup.org/convention-2026-program.pdf" target="_blank" rel="noreferrer"
          className="sm:ml-auto bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition whitespace-nowrap">
          Download PDF
        </a>
      </div>
    </main>
  )
}
