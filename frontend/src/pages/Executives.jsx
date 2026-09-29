const EXECUTIVES = [
  {
    id: 'js',
    name: 'Joel Ssemakula',
    photo: '/executives/joel.jpeg',
    role: 'Overall Coordinator',
    description: 'NUP California and West Coast Chapter Treasurer · 2026 Diaspora Convention Overall Coordinator',
    featured: true,
  },
  {
    id: 'an',
    name: 'Aisha Nakijoba Mulumba',
    photo: '/executives/aisha.jpeg',
    role: 'West Coast Chapter Leader',
    description: 'National Unity Platform Chapter Leader, California and Entire West Coast USA',
  },
  {
    id: 'dd',
    name: 'David Kenneth Daka',
    photo: '/executives/daka.jpeg',
    role: 'Convention Event Chairman',
    description: 'NUP California Deputy Chapter Leader · Diaspora NUP 2026 Convention Event Chairman',
  },
  {
    id: 'ck',
    name: 'Claire Kimbugwe',
    photo: '/executives/claire.jpeg',
    role: 'Head of IT & Communications',
    description: 'NUP California and West Coast Chapter Head of IT and Communications',
  },
  {
    id: 'pn',
    name: 'Phiona Nalubwama',
    photo: '/executives/phiona.jpeg',
    role: 'Convention Event Vice Chair',
    description: 'NUP North Carolina Chapter Leader · 2026 Diaspora Convention Event Vice Chair',
  },
  {
    id: 'ws',
    name: 'William Ssenkumba',
    photo: '/executives/william.jpeg',
    role: 'Organizing Committee Chairman',
    description: '2026 Diaspora Convention Organizing Committee Chairman',
  },
  {
    id: 'dk',
    name: 'Daniel Kawuma',
    photo: '/executives/daniel.jpeg',
    objectPosition: 'object-center',
    role: 'NUP Diaspora Team Leader',
    description: 'NUP Diaspora Team Leader',
  },
]

export default function Executives() {
  const featured = EXECUTIVES.filter(e => e.featured)
  const rest = EXECUTIVES.filter(e => !e.featured)

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-1">NUP Diaspora Convention 2026</p>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Executive Committee</h1>
      <p className="text-gray-500 text-sm mb-10">The leaders organizing the 2026 NUP Diaspora Convention · Los Angeles</p>

      {/* Featured — Overall Coordinator */}
      <div className="flex justify-center mb-10">
        {featured.map(exec => (
          <div key={exec.id} className="bg-gray-900 text-white rounded-2xl shadow-lg overflow-hidden flex flex-col sm:flex-row max-w-2xl w-full">
            <div className="w-full sm:w-1.5 h-1.5 sm:h-auto bg-red-600 shrink-0" />
            <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 flex-1 items-center sm:items-start">
              <div className="shrink-0">
                <img
                  src={exec.photo}
                  alt={exec.name}
                  className="w-28 h-28 rounded-full object-cover object-top border-4 border-white/10"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                />
                <div className="w-28 h-28 rounded-full bg-gray-700 items-center justify-center text-2xl font-bold text-white hidden">
                  {exec.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <span className="text-xs bg-red-600 text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                  Overall Coordinator
                </span>
                <h2 className="text-2xl font-black mt-2 mb-0.5">{exec.name}</h2>
                <p className="text-blue-300/80 text-sm leading-relaxed mt-2">{exec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rest of the committee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(exec => (
          <ExecCard key={exec.id} exec={exec} />
        ))}
      </div>
    </main>
  )
}

function ExecCard({ exec }) {
  const initials = exec.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
      <div className="mb-3 relative">
        <img
          src={exec.photo}
          alt={exec.name}
          className={`w-24 h-24 rounded-full object-cover border-2 border-gray-100 ${exec.objectPosition || 'object-top'}`}
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
        />
        <div
          className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center text-xl font-bold text-gray-500 hidden"
        >
          {initials}
        </div>
      </div>
      <h3 className="font-bold text-gray-800 text-base leading-tight">{exec.name}</h3>
      <p className="text-xs text-red-600 font-semibold mt-1 mb-2">{exec.role}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{exec.description}</p>
    </div>
  )
}
