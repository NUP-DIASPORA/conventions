import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCheckinStats } from '../../services/api'
import { useAuth } from '../../services/auth'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const { data: stats } = useQuery({
    queryKey: ['checkin-stats'],
    queryFn: () => getCheckinStats().then(r => r.data),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin nav */}
      <header className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">NUP Convention — Admin</h1>
        <button onClick={logout} className="text-sm text-blue-200 hover:text-white">Sign out</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Registrants" value={stats.total_registrants} color="blue" />
            <StatCard label="Total Check-ins" value={stats.total_checkins} color="green" />
            {Object.entries(stats.checkins_by_day).map(([day, count]) => (
              <StatCard key={day} label={`Day ${day.split('_')[1]}`} value={count} color="gray" />
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/admin/registrants" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition border border-gray-100">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-800">Manage Registrants</h3>
            <p className="text-sm text-gray-500 mt-1">Add, search, and view registrants</p>
          </Link>
          <Link to="/admin/checkin" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition border border-gray-100">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-gray-800">Check-In</h3>
            <p className="text-sm text-gray-500 mt-1">Check attendees in for today</p>
          </Link>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  )
}
