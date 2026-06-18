import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCheckinStats, getCheckinBreakdown, getPaymentSummary, changePassword } from '../../services/api'
import { useAuth } from '../../services/auth'

// Country flag emoji from country name (best-effort)
const FLAG_MAP = {
  'USA': '🇺🇸', 'United States': '🇺🇸', 'US': '🇺🇸',
  'Uganda': '🇺🇬', 'uganda': '🇺🇬',
  'Germany': '🇩🇪',
  'Ireland': '🇮🇪',
  'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
  'Canada': '🇨🇦',
  'South Africa': '🇿🇦',
  'Kenya': '🇰🇪',
  'Tanzania': '🇹🇿',
  'Rwanda': '🇷🇼',
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
  'Australia': '🇦🇺',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Netherlands': '🇳🇱',
  'France': '🇫🇷',
  'Belgium': '🇧🇪',
}

function flag(country) {
  return FLAG_MAP[country] || '🌍'
}

const BAR_COLORS = [
  'bg-blue-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500',
]

function BarChart({ data, colorClass = 'bg-blue-500' }) {
  if (!data?.length) return <p className="text-gray-400 text-sm">No data yet.</p>
  const max = Math.max(...data.map(d => d.count))
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-36 truncate shrink-0">{d.name}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-5 rounded-full ${typeof colorClass === 'string' ? colorClass : BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-500`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 w-6 text-right shrink-0">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function CountryChart({ data }) {
  if (!data?.length) return <p className="text-gray-400 text-sm">No data yet.</p>
  const max = Math.max(...data.map(d => d.count))
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="text-lg w-7 shrink-0">{flag(d.name)}</span>
          <span className="text-sm text-gray-600 w-28 truncate shrink-0 capitalize">{d.name}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-5 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-500`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 w-6 text-right shrink-0">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function ProgressRing({ value, max, size = 80, stroke = 8, color = '#3b82f6' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? value / max : 0
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function CheckinCard({ label, checked, total, color }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-5">
      <div className="relative shrink-0">
        <ProgressRing value={checked} max={total} size={72} stroke={7} color={color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{checked} <span className="text-base font-normal text-gray-400">/ {total}</span></p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

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

  const { data: breakdown } = useQuery({
    queryKey: ['checkin-breakdown'],
    queryFn: () => getCheckinBreakdown().then(r => r.data),
  })

  const { data: revenue } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => getPaymentSummary().then(r => r.data),
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
    if (pwForm.new_password !== pwForm.confirm) { setPwError('New passwords do not match'); return }
    if (pwForm.new_password.length < 6) { setPwError('New password must be at least 6 characters'); return }
    changePwMutation.mutate()
  }

  // US data = entries whose country is USA
  const usStates = breakdown?.by_state || []
  const international = breakdown?.by_country || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(to right, #111e45, #1a3572)' }} className="text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-white text-sm" style={{ color: '#a8b8d8' }}>← Home</Link>
          <h1 className="text-lg font-bold tracking-wide">NUP Convention — Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowPwForm(true)} className="text-sm hover:text-white" style={{ color: '#a8b8d8' }}>Change Password</button>
          <button onClick={logout} className="text-sm hover:text-white" style={{ color: '#a8b8d8' }}>Sign out</button>
        </div>
      </header>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0d1a3a 0%, #1a3572 60%, #1e4080 100%)' }} className="text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-widest mb-2" style={{ color: '#a8b8d8' }}>2026 NUP Diaspora Convention</p>
          <h2 className="text-4xl font-bold mb-1">Los Angeles, California</h2>
          {/* Red accent underline */}
          <div className="w-16 h-1 rounded-full mb-3" style={{ background: '#cc2229' }} />
          <p className="text-base" style={{ color: '#a8b8d8' }}>August 12 – 16, 2026</p>

          {stats && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <HeroStat label="Total Registrants" value={stats.total_registrants} />
              <HeroStat label="Registration" value={stats.convention_registrants} />
              <HeroStat label="Boat Cruise" value={stats.boat_cruise_registrants} />
              <HeroStat label="Checked In" value={stats.convention_checkins} accent />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Check-in Progress */}
        {stats && (
          <section>
            <SectionHeading>Check-in Progress</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CheckinCard
                label="Registration Check-ins"
                checked={stats.convention_checkins}
                total={stats.convention_registrants}
                color="#1a3572"
              />
              <CheckinCard
                label="Boat Cruise Check-ins"
                checked={stats.boat_cruise_checkins}
                total={stats.boat_cruise_registrants}
                color="#cc2229"
              />
            </div>
          </section>
        )}

        {/* Payment Breakdown */}
        {revenue && stats && (
          <section>
            <SectionHeading>Payment Breakdown</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PaymentBreakdownCard
                label="Registration"
                icon="🎟️"
                color="#1a3572"
                total={stats.convention_registrants}
                full={revenue.convention_full}
                partial={revenue.convention_partial}
                collected={revenue.convention}
              />
              <PaymentBreakdownCard
                label="Boat Cruise"
                icon="🚢"
                color="#cc2229"
                total={stats.boat_cruise_registrants}
                full={revenue.boat_cruise_full}
                partial={revenue.boat_cruise_partial}
                collected={revenue.boat_cruise}
              />
              <VipCard
                total={stats.vip_registrants ?? 0}
                vipConvention={stats.vip_convention ?? 0}
                vipBoatCruise={stats.vip_boat_cruise ?? 0}
              />
              <RevenueCard label="Total Collected" amount={revenue.total} bold icon="💰" />
            </div>
          </section>
        )}

        {/* Country + State charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* US States */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6" style={{ borderTop: '3px solid #1a3572' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🇺🇸</span>
              <h3 className="text-base font-bold text-gray-800">US States</h3>
            </div>
            {usStates.length > 0
              ? <BarChart data={usStates} colorClass="bg-indigo-900" />
              : <p className="text-gray-400 text-sm">No US state data yet.</p>
            }
          </div>

          {/* International */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6" style={{ borderTop: '3px solid #cc2229' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🌍</span>
              <h3 className="text-base font-bold text-gray-800">International Attendees</h3>
            </div>
            {international.length > 0
              ? <CountryChart data={international} />
              : <p className="text-gray-400 text-sm">No international data yet.</p>
            }
          </div>
        </div>

        {/* Age group */}
        {breakdown?.by_age_group?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeading>Age Groups</SectionHeading>
            <div className="flex gap-6 flex-wrap">
              {breakdown.by_age_group.map(d => (
                <div key={d.name} className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-gray-800">{d.count}</span>
                  <span className="text-sm text-gray-500 capitalize">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <section>
          <SectionHeading>Quick Actions</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/admin/registrants"
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all" style={{ borderTop: '3px solid #1a3572' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors" style={{ background: '#eef1f9' }}>👥</div>
              <h3 className="font-semibold text-gray-800 text-base">Manage Registrants</h3>
              <p className="text-sm text-gray-500 mt-1">Add, search, and view all attendees</p>
            </Link>
            <Link to="/admin/checkin"
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all" style={{ borderTop: '3px solid #cc2229' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors" style={{ background: '#fef1f1' }}>✅</div>
              <h3 className="font-semibold text-gray-800 text-base">Check-In</h3>
              <p className="text-sm text-gray-500 mt-1">Scan QR codes and check attendees in</p>
            </Link>
            <Link to="/admin/registrants/deleted"
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all" style={{ borderTop: '3px solid #6b7280' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors" style={{ background: '#f3f4f6' }}>🗑️</div>
              <h3 className="font-semibold text-gray-800 text-base">Deleted Registrants</h3>
              <p className="text-sm text-gray-500 mt-1">View registrants that have been removed</p>
            </Link>
          </div>
        </section>
      </main>

      {/* Change Password Modal */}
      {showPwForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Change Password</h2>
            <form onSubmit={handlePwSubmit} className="space-y-3">
              {['current_password', 'new_password', 'confirm'].map((field, i) => (
                <input key={field} type="password"
                  placeholder={['Current password', 'New password', 'Confirm new password'][i]}
                  value={pwForm[field]}
                  onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ))}
              {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
              {pwSuccess && <p className="text-green-600 text-sm">{pwSuccess}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowPwForm(false); setPwError(''); setPwSuccess('') }}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
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

function HeroStat({ label, value, accent }) {
  return (
    <div className="backdrop-blur rounded-xl px-5 py-4 border border-white/20"
      style={{ background: accent ? 'rgba(204,34,41,0.25)' : 'rgba(255,255,255,0.1)', borderColor: accent ? 'rgba(204,34,41,0.4)' : 'rgba(255,255,255,0.2)' }}>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-sm mt-1" style={{ color: accent ? '#ffaaad' : '#a8b8d8' }}>{label}</p>
    </div>
  )
}

function PaymentBreakdownCard({ label, icon, color, total, full, partial, collected }) {
  const fmt = (n) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const unpaid = total - full - partial
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{total} <span className="text-base font-normal text-gray-400">registered</span></p>
      <p className="text-sm text-gray-400 mb-4">{fmt(collected)} collected</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-600">Paid in full</span>
          </div>
          <span className="font-bold text-gray-800">{full}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-gray-600">Partial payment</span>
          </div>
          <span className="font-bold text-gray-800">{partial}</span>
        </div>
        {unpaid > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              <span className="text-gray-600">No payment recorded</span>
            </div>
            <span className="font-bold text-gray-800">{unpaid}</span>
          </div>
        )}
        {/* Progress bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 mt-3">
          <div className="bg-green-500 transition-all" style={{ width: `${total ? (full/total)*100 : 0}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${total ? (partial/total)*100 : 0}%` }} />
        </div>
      </div>
    </div>
  )
}

function RevenueCard({ label, amount, color, icon, bold, full, partial }) {
  const fmt = (n) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      style={color ? { borderTop: `3px solid ${color}` } : { borderTop: '3px solid #374151' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{icon}</div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className={`text-3xl font-bold mb-3 ${bold ? 'text-gray-900' : 'text-gray-800'}`}>{fmt(amount)}</p>
      {(full !== undefined) && (
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-xs text-gray-600"><span className="font-semibold">{full}</span> fully paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-xs text-gray-600"><span className="font-semibold">{partial}</span> partial</span>
          </div>
        </div>
      )}
    </div>
  )
}

function VipCard({ vipConvention, vipBoatCruise, total }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      style={{ borderTop: '3px solid #b45309' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⭐</span>
        <p className="text-sm font-semibold text-gray-600">VIP Guests</p>
        <span className="ml-auto text-2xl font-bold text-amber-700">{total}</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-gray-600">Convention VIPs</span>
          </div>
          <span className="font-bold text-gray-800">{vipConvention}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block" />
            <span className="text-gray-600">Boat Cruise VIPs</span>
          </div>
          <span className="font-bold text-gray-800">{vipBoatCruise}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 mt-3">
          <div className="bg-amber-500 transition-all" style={{ width: total ? `${(vipConvention/total)*100}%` : '0%' }} />
          <div className="bg-amber-300 transition-all" style={{ width: total ? `${(vipBoatCruise/total)*100}%` : '0%' }} />
        </div>
        <p className="text-xs text-gray-400">Note: a VIP may have both Convention & Boat Cruise</p>
      </div>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-lg font-bold text-gray-800">{children}</h3>
      <div className="flex-1 h-px bg-gray-200" />
      <div className="w-6 h-1 rounded-full" style={{ background: '#cc2229' }} />
    </div>
  )
}
