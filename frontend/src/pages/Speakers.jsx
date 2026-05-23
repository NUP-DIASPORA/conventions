import { useQuery } from '@tanstack/react-query'
import { getSpeakers } from '../services/api'

// Fallback speakers shown if DB is empty
const FEATURED_SPEAKERS = [
  {
    id: 'ks', first_name: 'Robert Ssentamu', last_name: 'Kyagulanyi', is_keynote: true,
    title: 'Keynote Speaker', organization: 'President, National Unity Platform (NUP)',
    bio: 'Robert Ssentamu Kyagulanyi, popularly known as Bobi Wine, is a Ugandan political leader, lawyer, human rights advocate, and internationally recognized voice for democratic change in Africa. He serves as President of the National Unity Platform (NUP), Uganda\'s leading opposition movement, and previously represented Kyadondo East in the Parliament of Uganda.',
    photo_url: null,
  },
  {
    id: 'ds', first_name: 'David', last_name: 'Ssejinja', is_keynote: false,
    title: 'Guest Speaker', organization: 'Professor, Utah Valley University; founder, Ssejinja Children\'s Foundation',
    bio: 'Professor David Ssejinja is a respected scholar, civic educator, and advocate for democratic governance with extensive experience in political science, leadership development, and community empowerment.',
    photo_url: null,
  },
  {
    id: 'jp', first_name: 'Jim', last_name: 'Powell', is_keynote: false,
    title: 'Guest Speaker', organization: 'Public policy expert, Utah Valley University',
    bio: 'Professor Jim Powell is a distinguished academic and public policy expert at Utah Valley University, recognized for his work in political systems, governance, and democratic institutions.',
    photo_url: null,
  },
  {
    id: 'ts', first_name: 'Tim', last_name: 'Szczepanski', is_keynote: false,
    title: 'Guest Speaker', organization: 'Interim Executive Director, Associated Students, CSU Northridge',
    bio: 'Professor Tim Szczepanski is an accomplished higher education administrator and leadership development professional with extensive experience in student governance, institutional leadership, and civic engagement.',
    photo_url: null,
  },
  {
    id: 'kl', first_name: 'Katie', last_name: 'Lowe', is_keynote: false,
    title: 'Guest Speaker', organization: 'Educator & leadership development specialist, American Leadership Program',
    bio: 'Senior Lecturer Katie Lowe is a prominent educator and leadership development specialist known for her work in transformational leadership, organizational growth, and civic engagement.',
    photo_url: null,
  },
  {
    id: 'ma', first_name: 'Milton', last_name: 'Allimadi', is_keynote: false,
    title: 'Guest Speaker', organization: 'Founder & Publisher, Black Star News; NUP Diaspora Advisory Member',
    bio: 'Milton Allimadi is an internationally recognized journalist, publisher, author, and political analyst specializing in African governance, democracy, and international affairs.',
    photo_url: null,
  },
  {
    id: 'hl', first_name: 'Hank', last_name: 'Luis', is_keynote: false,
    title: 'Guest Speaker', organization: 'Leadership educator, American Leadership Class',
    bio: 'Professor Hank Luis is an accomplished academic and leadership educator with expertise in transformative education, organizational leadership, and personal development.',
    photo_url: null,
  },
]

export default function Speakers() {
  const { data: dbSpeakers, isLoading } = useQuery({
    queryKey: ['speakers'],
    queryFn: () => getSpeakers().then(r => r.data),
  })

  const speakers = (dbSpeakers && dbSpeakers.length > 0) ? dbSpeakers : FEATURED_SPEAKERS

  const keynotes = speakers.filter(s => s.is_keynote)
  const regular = speakers.filter(s => !s.is_keynote)

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-1">NUP Diaspora Convention 2026</p>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Featured Speakers</h1>
      <p className="text-gray-500 text-sm mb-10">Voices of Freedom and Justice</p>

      {isLoading && <div className="text-gray-400 text-center py-20">Loading speakers...</div>}

      {keynotes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-5">Keynote Speaker</h2>
          <div className="grid grid-cols-1 gap-6">
            {keynotes.map(s => <SpeakerCard key={s.id} speaker={s} keynote />)}
          </div>
        </section>
      )}

      {regular.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Guest Speakers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regular.map(s => <SpeakerCard key={s.id} speaker={s} />)}
          </div>
        </section>
      )}
    </main>
  )
}

function SpeakerCard({ speaker, keynote }) {
  const initials = `${speaker.first_name[0]}${speaker.last_name[0]}`

  if (keynote) {
    return (
      <div className="bg-gray-900 text-white rounded-2xl shadow-lg overflow-hidden flex flex-col sm:flex-row">
        {/* Red left accent bar */}
        <div className="w-full sm:w-1.5 h-1.5 sm:h-auto bg-red-600 shrink-0" />
        <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 flex-1">
          {/* Avatar */}
          <div className="shrink-0">
            {speaker.photo_url
              ? <img src={speaker.photo_url} alt={speaker.first_name} className="w-24 h-24 rounded-full object-cover border-4 border-white/10" />
              : <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-white">{initials}</div>
            }
          </div>
          {/* Content */}
          <div className="flex-1">
            <span className="text-xs bg-red-600 text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Keynote</span>
            <h3 className="text-2xl font-black mt-2 mb-0.5">{speaker.first_name} {speaker.last_name}</h3>
            <p className="text-blue-400/60 text-sm font-medium">{speaker.title}</p>
            <p className="text-blue-400/60 text-xs mt-0.5 mb-4">{speaker.organization}</p>
            {speaker.bio && <p className="text-gray-300 text-sm leading-relaxed">{speaker.bio}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
      <div className="flex items-center gap-4 mb-3">
        {speaker.photo_url
          ? <img src={speaker.photo_url} alt={speaker.first_name} className="w-14 h-14 rounded-full object-cover" />
          : <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">{initials}</div>
        }
        <div>
          <h3 className="font-semibold text-gray-800">{speaker.first_name} {speaker.last_name}</h3>
          <p className="text-xs text-red-600 font-medium">{speaker.title}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-2">{speaker.organization}</p>
      {speaker.bio && <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{speaker.bio}</p>}
    </div>
  )
}
