import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCheckinStats, changePassword } from '../../services/api'
import { useAuth } from '../../services/auth'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['checkin-stats'],
    queryFn: () => getCheckinStats().then(r => r.data),
  })

  const changePwMutation = useMutation({
    mutationFn: () => changePassword(pwForm.current_password, pwForm.new_password),
    onSuccess: () => {
      setPwSuccess('Password changed successfully.')
      setPwError('')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
      setTimeout(() => { setShowPwForm(false); setPwSuccess('') }, 2000)
    },
    onError: (err) => setPwError(err.response?.data?.detail || 'Failed to change password'),
  })

  const handlePwSubmit = (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('New passwords do not match')
      return
    }
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters')
      return
    }
    changePwMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin nav */}
      <header className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-200 hover:text-white text-sm">← Home</Link>
          <h1 className="text-lg font-bold">NUP Convention — Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowPwForm(true)} className="text-sm text-blue-200 hover:text-white">
            Change Password
          </button>
          <button onClick={logout} className="text-sm text-blue-200 hover:text-white">Sign out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Registrants" value={stats.total_registrants} color="blue" />
            <StatCard label="Convention" value={stats.convention_registrants} color="blue" />
            <StatCard label="Boat Cruise" value={stats.boat_cruise_registrants} color="cyan" />
            <StatCard label="Conv. Check-ins" value={stats.convention_checkins} color="green" />
            <StatCard label="Cruise Check-ins" value={stats.boat_cruise_checkins} color="green" />
            {Object.entries(stats.checkins_by_day).map(([day, count]) => (
              <StatCard key={day} label={`Day ${day.split('_')[1]} Check-ins`} value={count} color="gray" />
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

      {/* Change Password Modal */}
      {showPwForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Change Password</h2>
            <form onSubmit={handlePwSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={pwForm.current_password}
                onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New password"
                value={pwForm.new_password}
                onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={pwForm.confirm}
                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
              {pwSuccess && <p className="text-green-600 text-sm">{pwSuccess}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowPwForm(false); setPwError(''); setPwSuccess('') }}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={changePwMutation.isPending}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                  {changePwMutation.isPending ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
