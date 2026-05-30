import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRegistrants, checkIn, getCheckinStats, lookupByQR } from '../../services/api'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

export default function AdminCheckIn() {
  const [eventType, setEventType] = useState('convention')
  const [mode, setMode] = useState('search') // 'search' | 'qr'
  const [search, setSearch] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [scannedRegistrant, setScannedRegistrant] = useState(null)
  const [scanning, setScanning] = useState(false)
  const qrRef = useRef(null)
  const html5QrRef = useRef(null)

  const { data: registrants = [] } = useQuery({
    queryKey: ['registrants', search],
    queryFn: () => getRegistrants({ search: search || undefined, limit: 20 }).then(r => r.data),
    enabled: search.length > 1,
  })

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['checkin-stats'],
    queryFn: () => getCheckinStats().then(r => r.data),
    refetchInterval: 10000,
  })

  const checkInMutation = useMutation({
    mutationFn: ({ registrantId }) => checkIn(registrantId, eventType, null),
    onSuccess: () => {
      setSuccessMsg(`✓ Checked in for ${eventType === 'boat_cruise' ? 'Boat Cruise' : 'Convention'}!`)
      setSearch('')
      setScannedRegistrant(null)
      setErrorMsg('')
      refetchStats()
      setTimeout(() => setSuccessMsg(''), 4000)
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Check-in failed')
      setSuccessMsg('')
    },
  })

  // Start/stop QR scanner
  useEffect(() => {
    if (mode !== 'qr') {
      stopScanner()
      return
    }
    if (scanning) startScanner()
    return () => stopScanner()
  }, [mode, scanning])

  const startScanner = async () => {
    if (!qrRef.current) return
    try {
      const html5Qr = new Html5Qrcode('qr-reader')
      html5QrRef.current = html5Qr
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Pause scanning while processing
          await html5Qr.pause()
          try {
            const res = await lookupByQR(decodedText)
            setScannedRegistrant(res.data)
            setErrorMsg('')
          } catch {
            setErrorMsg('QR code not recognized — try searching manually.')
            setTimeout(async () => {
              setErrorMsg('')
              try { await html5Qr.resume() } catch {}
            }, 2000)
          }
        },
        () => {}
      )
    } catch (err) {
      setErrorMsg('Camera access denied. Please allow camera permissions and try again.')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch {}
      try { html5QrRef.current.clear() } catch {}
      html5QrRef.current = null
    }
  }

  const resetScan = async () => {
    setScannedRegistrant(null)
    setErrorMsg('')
    setSuccessMsg('')
    if (html5QrRef.current) {
      try { await html5QrRef.current.resume() } catch {}
    }
  }

  const isAlreadyCheckedIn = (r) => eventType === 'boat_cruise' ? r.boat_cruise_checked_in : r.checked_in
  const canCheckIn = (r) => eventType === 'boat_cruise' ? r.boat_cruise : r.convention

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: 'linear-gradient(to right, #111e45, #1a3572)' }} className="text-white px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-blue-300 hover:text-white text-sm">← Home</Link>
          <span className="text-blue-600">|</span>
          <Link to="/admin" className="text-blue-300 hover:text-white text-sm">Dashboard</Link>
          <span className="text-blue-600">|</span>
          <h1 className="text-lg font-bold">Check-In</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Event type tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => { setEventType('convention'); setSearch(''); setErrorMsg(''); setSuccessMsg(''); setScannedRegistrant(null) }}
            className={`flex-1 py-3 text-sm font-semibold transition ${eventType === 'convention' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            style={eventType === 'convention' ? { background: '#1a3572' } : {}}>
            🏛️ Convention
          </button>
          <button
            onClick={() => { setEventType('boat_cruise'); setSearch(''); setErrorMsg(''); setSuccessMsg(''); setScannedRegistrant(null) }}
            className={`flex-1 py-3 text-sm font-semibold transition ${eventType === 'boat_cruise' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            ⛵ Boat Cruise
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex gap-3 text-sm">
            <div className="flex-1 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {eventType === 'convention' ? stats.convention_checkins : stats.boat_cruise_checkins}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Checked In</p>
            </div>
            <div className="flex-1 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {eventType === 'convention' ? stats.convention_registrants : stats.boat_cruise_registrants}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Registered</p>
            </div>
            <div className="flex-1 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {eventType === 'convention'
                  ? (stats.convention_registrants - stats.convention_checkins)
                  : (stats.boat_cruise_registrants - stats.boat_cruise_checkins)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Remaining</p>
            </div>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <button onClick={() => { setMode('search'); setScannedRegistrant(null); setScanning(false) }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${mode === 'search' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🔍 Search by Name
          </button>
          <button onClick={() => { setMode('qr'); setSearch(''); setScanning(true) }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${mode === 'qr' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            📷 Scan QR Code
          </button>
        </div>

        {/* Search mode */}
        {mode === 'search' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Attendee</label>
            <input
              type="text"
              placeholder="Type name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setErrorMsg(''); setSuccessMsg('') }}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3572]"
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
                    <div key={r.id} className={`flex items-center justify-between border rounded-xl px-4 py-3 ${!eligible ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                      <div>
                        <p className="font-semibold text-gray-800">{r.first_name} {r.last_name}
                          {r.is_vip && <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-semibold">VIP</span>}
                        </p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                        {!eligible && <p className="text-xs text-orange-500 mt-0.5">Not registered for {eventType === 'boat_cruise' ? 'boat cruise' : 'convention'}</p>}
                      </div>
                      <button
                        onClick={() => checkInMutation.mutate({ registrantId: r.id })}
                        disabled={checkInMutation.isPending || alreadyIn || !eligible}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          alreadyIn ? 'bg-gray-100 text-gray-400 cursor-default'
                          : !eligible ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : eventType === 'boat_cruise' ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}>
                        {alreadyIn ? '✓ In' : 'Check In'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* QR scanner mode */}
        {mode === 'qr' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {!scannedRegistrant ? (
              <>
                <p className="text-sm text-gray-500 mb-4 text-center">Point the camera at the attendee's QR code</p>
                <div id="qr-reader" ref={qrRef} className="rounded-xl overflow-hidden" />
                {!scanning && (
                  <button onClick={() => setScanning(true)}
                    className="mt-4 w-full py-3 rounded-xl text-white font-semibold text-sm"
                    style={{ background: '#1a3572' }}>
                    📷 Start Camera
                  </button>
                )}
              </>
            ) : (
              /* Scanned result card */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: '#1a3572' }}>
                    {scannedRegistrant.first_name[0]}{scannedRegistrant.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">
                      {scannedRegistrant.first_name} {scannedRegistrant.last_name}
                      {scannedRegistrant.is_vip && <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-semibold">VIP</span>}
                    </p>
                    <p className="text-sm text-gray-500">{scannedRegistrant.email}</p>
                    <div className="flex gap-2 mt-1">
                      {scannedRegistrant.convention && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Convention</span>}
                      {scannedRegistrant.boat_cruise && <span className="text-xs px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full">Boat Cruise</span>}
                    </div>
                  </div>
                </div>

                {/* Check-in status */}
                {isAlreadyCheckedIn(scannedRegistrant) ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-green-700 font-semibold text-lg">✓ Already Checked In</p>
                    <p className="text-green-500 text-sm">This attendee is already checked in for {eventType === 'boat_cruise' ? 'Boat Cruise' : 'Convention'}.</p>
                  </div>
                ) : !canCheckIn(scannedRegistrant) ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                    <p className="text-orange-700 font-semibold">Not registered for {eventType === 'boat_cruise' ? 'Boat Cruise' : 'Convention'}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => checkInMutation.mutate({ registrantId: scannedRegistrant.id })}
                    disabled={checkInMutation.isPending}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg transition"
                    style={{ background: eventType === 'boat_cruise' ? '#0891b2' : '#16a34a' }}>
                    {checkInMutation.isPending ? 'Checking in...' : `✓ Check In for ${eventType === 'boat_cruise' ? 'Boat Cruise' : 'Convention'}`}
                  </button>
                )}

                <button onClick={resetScan}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                  ← Scan Another
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success / Error messages */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}
      </main>
    </div>
  )
}
