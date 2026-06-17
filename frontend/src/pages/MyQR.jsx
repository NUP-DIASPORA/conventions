import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { getBalanceDue } from '../utils/balance'

export default function MyQR() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const lookup = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await api.get('/registrants/by-email', { params: { email } })
      setResult(res.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string' ? detail : 'No registration found for that email.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: 'linear-gradient(to right, #111e45, #1a3572)' }} className="text-white px-6 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Link to="/" className="text-blue-300 hover:text-white text-sm">← Home</Link>
          <span className="text-blue-600">|</span>
          <h1 className="text-lg font-bold">My QR Code</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-4">
            Enter the email you used when registering to retrieve your check-in QR code.
          </p>
          <form onSubmit={lookup} className="space-y-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3572]"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition"
              style={{ background: '#1a3572' }}>
              {loading ? 'Looking up…' : 'Get My QR Code'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
            <div>
              <p className="font-bold text-gray-800 text-xl">{result.first_name} {result.last_name}</p>
              <p className="text-sm text-gray-400">{result.email}</p>
              <div className="flex justify-center gap-2 mt-2">
                {result.convention && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Convention</span>}
                {result.boat_cruise && <span className="text-xs px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full">Boat Cruise</span>}
                {result.is_vip && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">VIP</span>}
              </div>
            </div>
            {/* Balance due */}
            {(() => {
              const bal = getBalanceDue(result)
              if (bal.total <= 0) return null
              return (
                <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-left">
                  <p className="text-red-700 font-bold text-sm">⚠ Outstanding Balance</p>
                  {bal.convention > 0 && (
                    <p className="text-red-600 text-sm mt-0.5">Convention: <span className="font-semibold">${bal.convention.toFixed(2)}</span></p>
                  )}
                  {bal.boat_cruise > 0 && (
                    <p className="text-red-600 text-sm mt-0.5">Boat Cruise: <span className="font-semibold">${bal.boat_cruise.toFixed(2)}</span></p>
                  )}
                  {bal.convention > 0 && bal.boat_cruise > 0 && (
                    <p className="text-red-700 text-sm font-semibold mt-1 border-t border-red-200 pt-1">Total Due: ${bal.total.toFixed(2)}</p>
                  )}
                  <p className="text-red-500 text-xs mt-1">Please settle your balance for faster check-in process.</p>
                </div>
              )
            })()}

            {result.qr_code ? (
              <>
                <img
                  src={result.qr_code}
                  alt="Your QR Code"
                  className="mx-auto w-56 h-56 rounded-xl border border-gray-200"
                />
                <p className="text-xs text-gray-400">Show this QR code at the check-in desk.</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">QR code not yet generated. Please contact the organizers.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
