import { Link } from 'react-router-dom'
import { useAuth } from '../../services/auth'

export default function AdminHub() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: 'linear-gradient(to right, #111e45, #1a3572)' }} className="text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3 shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-white text-lg font-bold" style={{ color: '#a8b8d8' }}>← Home</Link>
          <h1 className="text-lg font-bold tracking-wide">Admin</h1>
        </div>
        <button onClick={logout} className="text-lg font-bold hover:text-white" style={{ color: '#a8b8d8' }}>Sign out</button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <p className="text-base font-bold uppercase tracking-widest text-red-600 mb-3">NUP Diaspora</p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#0a1c46] mb-3">Choose a dashboard</h2>
          <p className="text-gray-500 text-xl">Pick where you want to work.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <Link
            to="/admin/pledges"
            className="group block bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10 hover:shadow-md transition-all"
            style={{ borderTop: '4px solid #cc2229' }}
          >
            <p className="text-4xl mb-5">💰</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition">$50k Drive</h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Manage pledges, log installment payments, and upload Google Form responses.
            </p>
            <p className="mt-6 text-lg font-bold text-red-600">Open pledges →</p>
          </Link>

          <Link
            to="/admin/convention"
            className="group block bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10 hover:shadow-md transition-all"
            style={{ borderTop: '4px solid #1a3572' }}
          >
            <p className="text-4xl mb-5">🏛️</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-[#1a3572] transition">Convention Admin</h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Registrants, check-in, payments, and convention stats from Los Angeles 2026.
            </p>
            <p className="mt-6 text-lg font-bold text-[#1a3572]">Open convention →</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
