const PLEDGE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSetenbxNa04E4uwoaWh85BaKXRoWgDaTnOrbS5kbjlNMxdemg/viewform'

const PILLARS = [
  {
    title: 'Upcoming activities',
    body: 'A range of virtual and in-person activities for members across the CA/West Coast Chapter.',
  },
  {
    title: 'Member coordination',
    body: 'Strengthening communication and coordination among CA/West Coast Chapter members.',
  },
  {
    title: 'Community engagement',
    body: 'Creating opportunities for dialogue, collaboration and community initiatives that support a more connected diaspora.',
  },
]

export default function Fundraiser() {
  return (
    <main className="bg-white">
      <section className="bg-[#0d1a3a] text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">
            NUP Diaspora · CA/West Coast Chapter
          </p>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-3">
            <span className="text-white">$50,000</span>{' '}
            <span className="text-red-500">Drive</span>
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto mb-2">
            Pledge to help our comrades in Uganda — political prisoners and programmes that keep the struggle for freedom alive.
          </p>
          <p className="text-sm text-white/60 mb-8">
            Fiscal Year 2026/2027 community engagement program
          </p>
          <a
            href={PLEDGE_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-full transition text-sm sm:text-base"
          >
            Make a Pledge
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-1">
              Why this drive matters
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Standing with political prisoners
            </h2>
            <div className="space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
              <p>
                Every pledge, regardless of the amount, helps fund support for comrades facing
                political imprisonment and strengthens NUP programmes that defend democracy,
                human rights, and a free Uganda.
              </p>
              <p>
                Submitting the pledge form records your commitment. Payment instructions will
                be provided separately through approved channels from the organizing team.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-6 py-6 text-center">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-2">
                Fundraising goal
              </p>
              <p className="text-5xl sm:text-6xl font-black text-red-600 leading-none mb-2">
                $50,000
              </p>
              <p className="text-sm text-gray-600 mb-5">
                CA/West Coast Chapter · FY 2026/2027
              </p>
              <a
                href={PLEDGE_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-full transition text-sm"
              >
                Pledge Now
              </a>
            </div>
          </div>

          <figure className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
            <img
              src="/50k-drive.jpg"
              alt="NUP Diaspora CA/West Coast Chapter Fiscal Year 2026/2027 $50,000 community engagement program flyer"
              className="w-full h-auto object-cover"
            />
            <figcaption className="px-4 py-3 text-xs text-gray-500 text-center border-t border-gray-100">
              Ugandan abroad · Stronger together
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-8">
            How your support fuels the chapter
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {PILLARS.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-gray-200 rounded-xl px-5 py-6"
              >
                <h3 className="text-sm font-bold text-[#1a3572] mb-2 border-b-2 border-red-500 inline-block pb-0.5">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-2">
          Ready to stand with us?
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Record your pledge today
        </h2>
        <p className="text-gray-600 text-sm sm:text-base mb-7 max-w-xl mx-auto">
          Tell us your pledge amount, contact details, and chapter. We will follow up with
          payment instructions through approved channels.
        </p>
        <a
          href={PLEDGE_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-full transition"
        >
          Open Pledge Form
        </a>
        <p className="mt-6 text-xs text-gray-400 max-w-md mx-auto">
          For information and updates, please contact your NUP Diaspora CA/West Coast Chapter coordinators.
        </p>
      </section>
    </main>
  )
}
