import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRegistrants, checkIn, getCheckinStats } from '../../services/api'
import { Link } from 'react-router-dom'

// Conference starts August 12 = day 1
function getCurrentDay() {
  const start = new Date('2026-08-12')
  const today = new Date()
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(Math.max(diff, 1), 7)
}

export default function AdminCheckIn() {
  const [search, setSearch] = useState('')
  const [conferenceDay, setConferenceDay] = useState(getCurrentDay())
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: registrants = [] } = useQuery({
    queryKey: ['registrants', search],
    queryFn: () => getRegistrants({ search: search || undefined, limit: 20 }).then(r => r.data),
    enabled: search.length > 1,
  })

  const { data: stats } = useQuery({
    queryKey: ['checkin-stats'],
    queryFn: () => getCheckinStats().then(r => r.data),
    refetchInterval: 10000,
  })

  const checkInMutation = useMutation({
    mutationFn: ({ registrantId }) => checkIn(registrantId, conferenceDay),
    onSuccess: () => {
      setSuccessMsg('Checked in successfully!')
      setSearch('')
      setErrorMsg('')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Check-in failed')
      setSuccessMsg('')
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white px-6 py-4 flex items-center gap-4">
        <Link to="/admin" className="text-blue-200 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-lg font-bold">Check-In</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Day selector */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Conference Day:</label>
          <select
            value={conferenceDay}
            onChange={e => setConferenceDay(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>Day {d}</option>)}
          </select>
          {stats && (
            <span className="ml-auto text-sm text-gray-500">
              {stats.checkins_by_day[`day_${conferenceDay}`]} checked in today · {stats.total_registrants} total
            </span>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Attendee</label>
          <input
            type="text"
            placeholder="Type name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setErrorMsg(''); setSuccessMsg('') }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          {/* Results */}
          {search.length > 1 && (
            <div className="mt-3 space-y-2">
              {registrants.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No results found.</p>}
              {registrants.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-gray-500">{r.email} · <span className="capitalize">{r.ticket_type}</span></p>
                  </div>
                  <button
                    onClick={() => checkInMutation.mutate({ registrantId: r.id })}
                    disabled={checkInMutation.isPending}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {successMsg && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}
      </main>
    </div>
  )
}
