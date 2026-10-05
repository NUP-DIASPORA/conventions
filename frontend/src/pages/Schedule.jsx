import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSessions } from '../services/api'

const CONFERENCE_DAYS = [
  { label: 'Thu Aug 13', date: '2026-08-13', subtitle: 'Arrival & Training' },
  { label: 'Fri Aug 14', date: '2026-08-14', subtitle: 'Opening Day' },
  { label: 'Sat Aug 15', date: '2026-08-15', subtitle: 'Main Convention' },
  { label: 'Sun Aug 16', date: '2026-08-16', subtitle: 'Closing Day' },
  { label: 'Mon Aug 17', date: '2026-08-17', subtitle: 'Departures' },
]

// Official program from the Organizing Committee Events Manager Draft
const OFFICIAL_PROGRAM = {
  '2026-08-13': [
    { start: '7:00 AM',  end: '11:59 PM', title: 'Convention Operations Open',       description: 'Convention Office: Century AB (2nd Floor) · Registration Desk & Vendor Tables: International Foyer (Lobby Level)', type: 'logistics' },
    { start: '10:00 AM', end: '12:00 PM', title: 'Leadership Meeting',               description: 'Room: Pacific A (Lobby Level)', type: 'meeting' },
    { start: '1:00 PM',  end: '2:00 PM',  title: 'Activism Skills Academy',          description: 'Organizing for Impact — Practical training to strengthen advocacy, community organizing, and civic leadership · Room: Pacific B', type: 'workshop' },
    { start: '2:00 PM',  end: '3:00 PM',  title: 'Digital Organizing & Security Workshop', description: 'Equipping activists and community leaders with tools for effective and secure engagement · Room: Pacific B', type: 'workshop' },
    { start: '3:00 PM',  end: '5:00 PM',  title: 'Community Safety, First Aid & Resilience Training', description: 'Room: Pacific B (Lobby Level)', type: 'workshop' },
    { start: '6:00 PM',  end: '9:00 PM',  title: 'Community Welcome Festival',       description: 'Youth Leadership Retreat, Sports Festival & Community Picnic · Soccer Field: 17015 Balboa Blvd., Encino, CA 91316 · Vans transport delegates from the hotel', type: 'social' },
    { start: '10:00 PM', end: '2:00 AM',  title: 'Evening Cocktail & Networking',    description: 'Room: International A (Lobby Level) · Dance floor · DJ', type: 'social' },
  ],
  '2026-08-14': [
    { start: '7:00 AM',  end: '11:59 PM', title: 'Convention Operations Open',       description: 'Convention Office: Century AB (2nd Floor) · Registration Desk & Vendor Tables: International Foyer (Lobby Level)', type: 'logistics' },
    { start: '6:30 AM',  end: '8:00 AM',  title: 'Breakfast Roundtable with Community Elders', description: 'Intergenerational dialogue focused on mentorship, historical reflection, and leadership wisdom · Designated Overflow Room', type: 'meeting' },
    { start: '8:30 AM',  end: '9:30 AM',  title: 'Ekimeeza: People\'s Open Forum',   description: '"The Future of Uganda\'s Democratic Journey" — A moderated open-mic dialogue for delegates to share perspectives, ideas, and proposals · Room: International B', type: 'plenary' },
    { start: '9:30 AM',  end: '12:30 PM', title: 'Leadership Development Workshop',  description: '"Building Effective Diaspora Leaders for Democratic Change" · Room: International B', type: 'workshop' },
    { start: '12:30 PM', end: '1:30 PM',  title: 'Jum\'ah Prayers',                  description: 'Room: Century CD (2nd Floor)', type: 'prayer' },
    { start: '1:30 PM',  end: '6:00 PM',  title: 'Official Opening Ceremony',        description: 'Policy Forum & Chapter Paper Presentations — Envisioning A New Uganda · Room: International B', type: 'plenary' },
    { start: '6:00 PM',  end: '7:00 PM',  title: 'Dinner Break',                     description: '', type: 'logistics' },
    { start: '7:00 PM',  end: '10:30 PM', title: 'Women\'s Leadership & Resilience Forum', description: '"The Power of Resilience: Women at the Forefront of Uganda\'s Democratic Journey" · Room: International B', type: 'ceremony' },
    { start: '10:00 PM', end: '2:00 AM',  title: 'Convention Networking Reception',   description: 'Room: International A · Dance floor · DJ · Cash Bar', type: 'social' },
  ],
  '2026-08-15': [
    { start: '7:00 AM',  end: '11:59 PM', title: 'Convention Operations Open',       description: 'Convention Office: Century AB (2nd Floor) · Registration Desk & Vendor Tables: International Foyer (Lobby Level)', type: 'logistics' },
    { start: '6:30 AM',  end: '8:00 AM',  title: 'Complimentary Breakfast',          description: 'Designated Overflow Room', type: 'logistics' },
    { start: '8:30 AM',  end: '11:30 AM', title: 'Special Policy Forum',             description: '"Uganda\'s 2026 Elections: Analysis, Accountability and the Road Ahead" · Featured Speaker: Agather Atuhaire · Room: International B (250 delegates)', type: 'talk' },
    { start: '9:00 AM',  end: '12:00 PM', title: 'Youth Leadership & Skills Track',  description: 'Room: Pacific A', type: 'workshop' },
    { start: '11:30 AM', end: '1:00 PM',  title: 'Leadership Strategy Forum',        description: '"The Road Ahead for Democratic Change in Uganda" · High-level dialogue on Uganda\'s political landscape and pathways for democratic change · Room: International B', type: 'talk' },
    { start: '1:00 PM',  end: '2:30 PM',  title: 'Presidential Keynote Address',     description: '"Hope, Courage and the Future of Uganda" · Room: International B', type: 'plenary' },
    { start: '3:00 PM',  end: '4:00 PM',  title: 'Town Hall Forum & Delegate Q&A',   description: 'Direct engagement between delegates, leadership, experts, and invited guests · Room: International B', type: 'plenary' },
    { start: '4:00 PM',  end: '4:30 PM',  title: 'Convention Resolutions Session',   description: 'Adoption of Resolutions · Summary of Recommendations · Closing Remarks', type: 'meeting' },
    { start: '6:30 PM',  end: '11:00 PM', title: 'Heroes Fundraising Gala & Freedom Dinner Cruise', description: 'Departure: Fisherman\'s Village Marina · 13755 Fiji Way, Marina Del Rey, CA 90292', type: 'social' },
    { start: '11:00 PM', end: '2:00 AM',  title: 'Networking After Party',           description: 'Room: International A · Dance floor · DJ', type: 'social' },
  ],
  '2026-08-16': [
    { start: '7:00 AM',  end: '11:59 PM', title: 'Convention Operations Open',       description: 'Convention Office: Century AB (2nd Floor) · Registration Desk & Vendor Tables: International Foyer (Lobby Level)', type: 'logistics' },
    { start: '6:30 AM',  end: '8:00 AM',  title: 'Breakfast',                        description: 'Designated Overflow Room', type: 'logistics' },
    { start: '8:00 AM',  end: '10:00 AM', title: 'Interfaith Prayer & Reflection Service', description: '"Faith, Healing and National Restoration" · Room: Century CD (2nd Floor)', type: 'prayer' },
    { start: '10:00 AM', end: '12:00 PM', title: 'Diaspora Leadership Strategic Planning Meeting', description: 'Room: Pacific A · Boardroom setup (50 delegates)', type: 'meeting' },
    { start: '12:00 PM', end: '4:00 PM',  title: 'NUP Diaspora Annual General Meeting (AGM)', description: 'Room: International B (150 delegates)', type: 'plenary' },
    { start: '5:00 PM',  end: '11:00 PM', title: 'Grand Closing Ceremony & Unity Gala', description: 'International Ballroom (Lobby Level) · Buffet Dinner at 8:00 PM · Cash Bars 8:00 PM – 1:00 AM (350 delegates)', type: 'ceremony' },
  ],
  '2026-08-17': [
    { start: 'Morning',  end: 'All Day',  title: 'Departures & Hospitality Services', description: 'Guest departures · Hospitality support · Convention breakdown · Vendor load-out · Final hotel coordination and closeout', type: 'logistics' },
  ],
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

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-1">NUP Diaspora Convention 2026</p>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Convention Program</h1>
      <p className="text-gray-500 text-sm mb-1">Hilton Los Angeles Airport Hotel · August 13–17, 2026</p>
      <p className="text-xs text-gray-400 italic mb-6">Theme: "Onward to Uganda's Liberation: Through Unity, Strength, and Collective Purpose"</p>

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
