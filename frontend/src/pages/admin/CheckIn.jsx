import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRegistrants, checkIn, getCheckinStats } from '../../services/api'
import { Link } from 'react-router-dom'

export default function AdminCheckIn() {
  const [eventType, setEventType] = useState('convention')  // 'convention' | 'boat_cruise'
  const [search, setSearch] = useState('')
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
    mutationFn: ({ registrantId }) => checkIn(registrantId, eventType, null),
    onSuccess: () => {
      setSuccessMsg(`Checked in for ${eventType === 'boat_cruise' ? 'Boat Cruise' : 'Convention'}!`)
      setSearch('')
      setErrorMsg('')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Check-in failed')
      setSuccessMsg('')
    },
  })

  const isAlreadyCheckedIn = (r) => {
    if (eventType === 'boat_cruise') return r.boat_cruise_checked_in
    return r.checked_in  // simplified — full day-by-day truth is in check_ins table
  }

  const canCheckIn = (r) => {
    if (eventType === 'boat_cruise') return r.boat_cruise
    return r.convention
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-blue-200 hover:text-white text-sm">← Home</Link>
        <Link to="/admin" className="text-blue-200 hover:text-white text-sm">Dashboard</Link>
        <h1 className="text-lg font-bold">Check-In</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Event type tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-white shadow-sm">
          <button
            onClick={() => { setEventType('convention'); setSearch(''); setErrorMsg(''); setSuccessMsg('') }}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              eventType === 'convention'
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            🏛️ Convention
          </button>
          <button
            onClick={() => { setEventType('boat_cruise'); setSearch(''); setErrorMsg(''); setSuccessMsg('') }}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              eventType === 'boat_cruise'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            ⛵ Boat Cruise
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex gap-4 mb-6 text-sm text-gray-600">
            {eventType === 'convention' ? (
              <>
                <span className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <strong>{stats.convention_checkins}</strong> checked in
                </span>
                <span className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <strong>{stats.convention_registrants}</strong> registered
                </span>
              </>
            ) : (
              <>
                <span className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <strong>{stats.boat_cruise_checkins}</strong> checked in
                </span>
                <span className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <strong>{stats.boat_cruise_registrants}</strong> registered
                </span>
              </>
            )}
          </div>
        )}

        {eventType === 'boat_cruise' && (
          <div className="mb-5 bg-cyan-50 border border-cyan-100 rounded-lg px-4 py-2 text-sm text-cyan-700">
            Saturday Aug 15 · Heroes Celebration Cruise
          </div>
        )}

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

          {search.length > 1 && (
            <div className="mt-3 space-y-2">
              {registrants.length === 0 && (
                <p className="text-gray-400 text-sm py-4 text-center">No results found.</p>
              )}
              {registrants.map(r => {
                const eligible = canCheckIn(r)
                const alreadyIn = isAlreadyCheckedIn(r)
                return (
                  <div key={r.id} className={`flex items-center justify-between border rounded-lg px-4 py-3 ${
                    !eligible ? 'border-gray-100 opacity-60' : 'border-gray-200'
                  }`}>
                    <div>
                      <p className="font-medium text-gray-800">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                      {!eligible && (
                        <p className="text-xs text-orange-500 mt-0.5">
                          Not registered for {eventType === 'boat_cruise' ? 'boat cruise' : 'convention'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => checkInMutation.mutate({ registrantId: r.id })}
                      disabled={checkInMutation.isPending || alreadyIn || !eligible}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                        alreadyIn
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : !eligible
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : eventType === 'boat_cruise'
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {alreadyIn ? '✓ Checked In' : 'Check In'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {successMsg && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            ✓ {successMsg}
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
