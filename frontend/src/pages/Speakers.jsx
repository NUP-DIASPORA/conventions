import { useQuery } from '@tanstack/react-query'
import { getSpeakers } from '../services/api'
import Reveal from '../components/Reveal'

const FEATURED_SPEAKERS = [
  { id: 'ks', first_name: 'Robert Ssentamu', last_name: 'Kyagulanyi', is_keynote: true,
    title: 'Keynote Speaker', organization: 'President, National Unity Platform (NUP)',
    bio: "Robert Ssentamu Kyagulanyi, popularly known as Bobi Wine, is a Ugandan political leader, lawyer, human rights advocate, and internationally recognized voice for democratic change in Africa. He serves as President of the National Unity Platform (NUP), Uganda's leading opposition movement, and previously represented Kyadondo East in the Parliament of Uganda.",
    photo_url: null },
  { id: 'ds', first_name: 'David', last_name: 'Ssejinja', is_keynote: false,
    title: 'Guest Speaker', organization: "Professor, Utah Valley University; founder, Ssejinja Children's Foundation",
    bio: 'Professor David Ssejinja is a respected scholar, civic educator, and advocate for democratic governance with extensive experience in political science, leadership development, and community empowerment.', photo_url: null },
  { id: 'jp', first_name: 'Jim', last_name: 'Powell', is_keynote: false,
    title: 'Guest Speaker', organization: 'Public policy expert, Utah Valley University',
    bio: 'Professor Jim Powell is a distinguished academic and public policy expert at Utah Valley University, recognized for his work in political systems, governance, and democratic institutions.', photo_url: null },
  { id: 'ts', first_name: 'Tim', last_name: 'Szczepanski', is_keynote: false,
    title: 'Guest Speaker', organization: 'Interim Executive Director, Associated Students, CSU Northridge',
    bio: 'Professor Tim Szczepanski is an accomplished higher education administrator and leadership development professional with extensive experience in student governance, institutional leadership, and civic engagement.', photo_url: null },
  { id: 'kl', first_name: 'Katie', last_name: 'Lowe', is_keynote: false,
    title: 'Guest Speaker', organization: 'Educator & leadership development specialist, American Leadership Program',
    bio: 'Senior Lecturer Katie Lowe is a prominent educator and leadership development specialist known for her work in transformational leadership, organizational growth, and civic engagement.', photo_url: null },
  { id: 'ma', first_name: 'Milton', last_name: 'Allimadi', is_keynote: false,
    title: 'Guest Speaker', organization: 'Founder & Publisher, Black Star News; NUP Diaspora Advisory Member',
    bio: 'Milton Allimadi is an internationally recognized journalist, publisher, author, and political analyst specializing in African governance, democracy, and international affairs.', photo_url: null },
  { id: 'hl', first_name: 'Hank', last_name: 'Luis', is_keynote: false,
    title: 'Guest Speaker', organization: 'Leadership educator, American Leadership Class',
    bio: 'Professor Hank Luis is an accomplished academic and leadership educator with expertise in transformative education, organizational leadership, and personal development.', photo_url: null },
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
    <main className="bg-background">
      {/* Header band */}
      <section className="bg-navy text-white py-16 sm:py-20 px-5 border-b border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold text-gold uppercase tracking-[0.2em] mb-4">NUP Diaspora Convention 2026</p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-4">Featured Speakers</h1>
          <p className="text-white/70 max-w-xl mx-auto">Voices of freedom and justice — leaders, scholars, and advocates driving the conversation forward.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-16">
        {isLoading && <div className="text-muted-foreground text-center py-20">Loading speakers…</div>}

        {keynotes.length > 0 && (
          <section className="mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-5">Keynote</p>
            <div className="grid grid-cols-1 gap-6">
              {keynotes.map(s => <Reveal key={s.id}><SpeakerCard speaker={s} keynote /></Reveal>)}
            </div>
          </section>
        )}

        {regular.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-5">Guest Speakers</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regular.map((s, i) => (
                <Reveal key={s.id} delay={i * 60}>
                  <SpeakerCard speaker={s} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function SpeakerCard({ speaker, keynote }) {
  const initials = `${speaker.first_name[0]}${speaker.last_name[0]}`

  if (keynote) {
    return (
      <div className="relative bg-navy text-white rounded-2xl overflow-hidden shadow-elegant">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-gold to-primary" />
        <div className="flex flex-col sm:flex-row gap-7 p-8 sm:p-10">
          <div className="shrink-0">
            {speaker.photo_url
              ? <img src={speaker.photo_url} alt={speaker.first_name} className="w-28 h-28 rounded-full object-cover ring-4 ring-gold/30" />
              : <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-navy ring-4 ring-gold/30 flex items-center justify-center font-display text-3xl font-bold">{initials}</div>}
          </div>
          <div className="flex-1">
            <span className="inline-block text-[10px] bg-gold text-navy px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Keynote</span>
            <h3 className="font-display text-3xl font-extrabold mt-3 mb-1">{speaker.first_name} {speaker.last_name}</h3>
            <p className="text-gold text-sm font-semibold">{speaker.title}</p>
            <p className="text-white/60 text-sm mt-1 mb-4">{speaker.organization}</p>
            {speaker.bio && <p className="text-white/80 text-sm leading-relaxed">{speaker.bio}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col h-full hover:shadow-lift hover:-translate-y-1 transition-all">
      <div className="flex items-center gap-4 mb-4">
        {speaker.photo_url
          ? <img src={speaker.photo_url} alt={speaker.first_name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" />
          : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy to-primary text-white flex items-center justify-center font-display text-base font-bold shrink-0">{initials}</div>}
        <div className="min-w-0">
          <h3 className="font-display font-bold text-navy">{speaker.first_name} {speaker.last_name}</h3>
          <p className="text-xs text-primary font-semibold uppercase tracking-wide mt-0.5">{speaker.title}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{speaker.organization}</p>
      {speaker.bio && <p className="text-sm text-foreground/70 leading-relaxed line-clamp-4">{speaker.bio}</p>}
    </div>
  )
}
