import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRegistrants, createRegistrant, deleteRegistrant, createPayment, deletePayment, getUnattributedPayments, linkPayment } from '../../services/api'
import { Link } from 'react-router-dom'

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin',
  'Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia',
  'Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini',
  'Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania',
  'Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay',
  'Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis',
  'Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
  'Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste',
  'Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Venezuela',
  'Vietnam','Yemen','Zambia','Zimbabwe'
]

function CountrySelect({ value, onChange }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filtered = query.length === 0
    ? COUNTRIES
    : COUNTRIES.filter(c => c.toLowerCase().startsWith(query.toLowerCase()))
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const select = (country) => { setQuery(country); onChange(country); setOpen(false) }
  return (
    <div ref={ref} className="relative">
      <input type="text" placeholder="Country" value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off" />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 text-sm">
          {filtered.slice(0, 50).map(c => (
            <li key={c} onMouseDown={() => select(c)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700">{c}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Pricing reference
const PRICES = {
  convention_adult: '300.00',
  convention_child: '160.00',
  convention_installment_adult: '150.00',
  convention_installment_child: '80.00',
  boat_cruise: '220.00',
  boat_cruise_installment: '110.00',
}

// Expected total per product given registrant age group
function expectedTotal(productType, ageGroup) {
  if (productType === 'convention') return ageGroup === 'child' ? 160 : 300
  if (productType === 'boat_cruise') return 220
  return null  // donations have no expected total
}

// Total paid for a given product type
function paidTotal(payments, productType) {
  return (payments || [])
    .filter(p => p.product_type === productType)
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
}

// Balance owed for a product (null if not applicable)
// Early-bird convention rate: adults who paid $280 are considered paid in full
const EARLY_BIRD_CONVENTION = 280
function balanceOwed(registrant, productType) {
  if (productType === 'convention' && !registrant.convention) return null
  if (productType === 'boat_cruise' && !registrant.boat_cruise) return null
  const expected = expectedTotal(productType, registrant.age_group)
  if (expected === null) return null
  const paid = paidTotal(registrant.payments, productType)
  if (productType === 'convention' && registrant.age_group !== 'child' && paid >= EARLY_BIRD_CONVENTION) return 0
  return Math.max(0, expected - paid)
}

const EMPTY_PAYMENT = { product_type: '', installment: '', amount: '', payer_name: '', stripe_pi_id: '', notes: '' }

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  address: '', city: '', state: '', country: '', continent: '',
  age_group: 'adult',
  payments: [],
  notes: '',
}

const CONTINENTS = ['Africa', 'North America', 'South America', 'Europe', 'Asia', 'Oceania', 'Middle East']

// Summarise payments for a registrant row
function paymentSummary(payments) {
  if (!payments?.length) return null
  const total = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  return `$${total.toFixed(2)}`
}

function productLabel(type) {
  if (type === 'convention') return 'Convention'
  if (type === 'boat_cruise') return 'Boat Cruise'
  if (type === 'donation') return 'Donation'
  return type
}

export default function AdminRegistrants() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [newPayment, setNewPayment] = useState(EMPTY_PAYMENT)
  const [paymentTarget, setPaymentTarget] = useState(null) // registrant object, or 'unattributed'
  const [showUnattributed, setShowUnattributed] = useState(false)
  const [linkTarget, setLinkTarget] = useState(null) // payment to link
  const [linkSearch, setLinkSearch] = useState('')

  const { data: registrants = [], isLoading } = useQuery({
    queryKey: ['registrants', search],
    queryFn: () => getRegistrants({ search: search || undefined, limit: 200 }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: createRegistrant,
    onSuccess: () => {
      queryClient.invalidateQueries(['registrants'])
      setShowForm(false)
      setForm(EMPTY_FORM)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Error creating registrant'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRegistrant,
    onSuccess: () => queryClient.invalidateQueries(['registrants']),
  })

  const addPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['registrants'])
      setPaymentTarget(null)
      setNewPayment(EMPTY_PAYMENT)
    },
    onError: (err) => alert(err.response?.data?.detail || 'Error adding payment'),
  })

  const deletePaymentMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => queryClient.invalidateQueries(['registrants']),
  })

  const { data: unattributedPayments = [], refetch: refetchUnattributed } = useQuery({
    queryKey: ['unattributed-payments'],
    queryFn: () => getUnattributedPayments().then(r => r.data),
    enabled: showUnattributed,
  })

  const linkPaymentMutation = useMutation({
    mutationFn: ({ paymentId, registrantId }) => linkPayment(paymentId, registrantId),
    onSuccess: () => {
      queryClient.invalidateQueries(['registrants'])
      queryClient.invalidateQueries(['unattributed-payments'])
      setLinkTarget(null)
      setLinkSearch('')
    },
    onError: (err) => alert(err.response?.data?.detail || 'Error linking payment'),
  })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  // Auto-fill payment amount based on product type + age group
  const defaultAmount = (productType, ageGroup, installment) => {
    if (productType === 'convention') {
      if (installment) return ageGroup === 'child' ? PRICES.convention_installment_child : PRICES.convention_installment_adult
      return ageGroup === 'child' ? PRICES.convention_child : PRICES.convention_adult
    }
    if (productType === 'boat_cruise') {
      return installment ? PRICES.boat_cruise_installment : PRICES.boat_cruise
    }
    return ''
  }

  // Inline payment rows in the Add Registrant form
  const addInlinePayment = (productType) => {
    const installment = null
    setForm(f => ({
      ...f,
      payments: [...f.payments, {
        product_type: productType,
        installment: installment,
        amount: defaultAmount(productType, f.age_group, false),
        payer_name: '',
        stripe_pi_id: '',
        notes: '',
      }]
    }))
  }

  const removeInlinePayment = (idx) => {
    setForm(f => ({ ...f, payments: f.payments.filter((_, i) => i !== idx) }))
  }

  const updateInlinePayment = (idx, field, value) => {
    setForm(f => {
      const payments = f.payments.map((p, i) => {
        if (i !== idx) return p
        const updated = { ...p, [field]: value }
        // Auto-update amount when type or installment changes
        if (field === 'installment' || field === 'product_type') {
          updated.amount = defaultAmount(
            field === 'product_type' ? value : p.product_type,
            f.age_group,
            field === 'installment' ? value : p.installment
          )
        }
        return updated
      })
      return { ...f, payments }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate(form)
  }

  // Detect which installment to pre-select based on existing payments
  const detectInstallment = (registrant, productType) => {
    if (!registrant || !productType || productType === 'donation') return ''
    const existing = (registrant.payments || []).filter(p => p.product_type === productType)
    const hasInst1 = existing.some(p => p.installment === 1)
    const hasInst2 = existing.some(p => p.installment === 2)
    if (hasInst1 && !hasInst2) return '2'
    if (!hasInst1) return ''
    return ''
  }

  const openPaymentModal = (registrant) => {
    setPaymentTarget(registrant)
    setNewPayment(EMPTY_PAYMENT)
  }

  const handleAddPayment = (e) => {
    e.preventDefault()
    const registrantId = paymentTarget === 'unattributed' ? null : paymentTarget.id
    addPaymentMutation.mutate({
      registrant_id: registrantId,
      ...newPayment,
      installment: newPayment.installment ? parseInt(newPayment.installment) : null,
    })
  }

  const input = 'border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-200 hover:text-white text-sm">← Home</Link>
          <Link to="/admin" className="text-blue-200 hover:text-white text-sm">Dashboard</Link>
          <h1 className="text-lg font-bold">Registrants</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPaymentTarget('unattributed'); setNewPayment(EMPTY_PAYMENT) }}
            className="bg-blue-700 border border-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600">
            + Record Payment
          </button>
          <button onClick={() => setShowForm(true)} className="bg-white text-blue-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50">
            + Add Registrant
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <input type="text" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

        {/* Unattributed payments panel */}
        <div className="mb-4">
          <button onClick={() => { setShowUnattributed(v => !v); refetchUnattributed() }}
            className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1">
            {showUnattributed ? '▾' : '▸'} Unattributed Payments
            {unattributedPayments.length > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full ml-1">
                {unattributedPayments.length}
              </span>
            )}
          </button>
          {showUnattributed && (
            <div className="mt-2 bg-orange-50 border border-orange-100 rounded-xl p-4">
              {unattributedPayments.length === 0
                ? <p className="text-sm text-gray-400">No unattributed payments.</p>
                : (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left py-1 pr-4">Product</th>
                        <th className="text-left py-1 pr-4">Amount</th>
                        <th className="text-left py-1 pr-4">Payer</th>
                        <th className="text-left py-1 pr-4">Stripe PI</th>
                        <th className="text-left py-1 pr-4">Notes</th>
                        <th className="text-left py-1"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                      {unattributedPayments.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 pr-4 text-gray-700">
                            {productLabel(p.product_type)}
                            {p.installment ? ` inst.${p.installment}` : ''}
                          </td>
                          <td className="py-2 pr-4 font-medium text-gray-800">${p.amount}</td>
                          <td className="py-2 pr-4 text-gray-500">{p.payer_name || '—'}</td>
                          <td className="py-2 pr-4 text-gray-400 text-xs font-mono">{p.stripe_pi_id || '—'}</td>
                          <td className="py-2 pr-4 text-gray-500">{p.notes || '—'}</td>
                          <td className="py-2">
                            <button onClick={() => { setLinkTarget(p); setLinkSearch('') }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              Link to registrant →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}
        </div>

        {isLoading && <p className="text-gray-400 text-center py-10">Loading...</p>}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Attendee</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Age</th>
                <th className="px-4 py-3 text-left">Registered For</th>
                <th className="px-4 py-3 text-left">Payments</th>
                <th className="px-4 py-3 text-left">Balance</th>
                <th className="px-4 py-3 text-left">Check-in</th>
                <th className="px-4 py-3 text-left">Entered By</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrants.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-gray-400">{new Date(r.registered_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{r.email}</p>
                    {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <p>{[r.city, r.state].filter(Boolean).join(', ') || '—'}</p>
                    {r.country && <p className="text-xs text-gray-400">{r.country}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.age_group === 'child' ? 'bg-pink-50 text-pink-600' :
                      r.age_group === 'youth' ? 'bg-purple-50 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>{r.age_group}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {r.convention && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs w-fit">Convention</span>
                      )}
                      {r.boat_cruise && (
                        <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full text-xs w-fit">Boat Cruise</span>
                      )}
                      {!r.convention && !r.boat_cruise && (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {r.payments?.map(p => (
                        <div key={p.id} className="flex items-center gap-1 group">
                          <span className="text-xs text-gray-600">
                            {productLabel(p.product_type)}
                            {p.installment ? ` inst.${p.installment}` : ''} — ${p.amount}
                          </span>
                          <button
                            onClick={() => { if (window.confirm('Remove this payment?')) deletePaymentMutation.mutate(p.id) }}
                            className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs ml-1">✕</button>
                        </div>
                      ))}
                      <button
                        onClick={() => { setPaymentTarget(r); setNewPayment(EMPTY_PAYMENT) }}
                        className="text-xs text-blue-500 hover:text-blue-700 mt-0.5 text-left">
                        + Add payment
                      </button>
                    </div>
                    {r.payments?.length > 0 && (
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        Paid: {paymentSummary(r.payments)}
                      </p>
                    )}
                  </td>

                  {/* Balance column */}
                  <td className="px-4 py-3">
                    {(() => {
                      const convBal = balanceOwed(r, 'convention')
                      const cruiseBal = balanceOwed(r, 'boat_cruise')
                      const lines = []
                      if (convBal !== null) lines.push({ label: 'Conv', amount: convBal })
                      if (cruiseBal !== null) lines.push({ label: 'Cruise', amount: cruiseBal })
                      if (lines.length === 0) return <span className="text-gray-300 text-xs">—</span>
                      return (
                        <div className="flex flex-col gap-1">
                          {lines.map(({ label, amount }) => (
                            <span key={label} className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                              amount === 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {label}: {amount === 0 ? 'Paid ✓' : `$${amount.toFixed(2)} due`}
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {r.convention && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${r.checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          Conv: {r.checked_in ? 'In' : 'Pending'}
                        </span>
                      )}
                      {r.boat_cruise && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${r.boat_cruise_checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          Cruise: {r.boat_cruise_checked_in ? 'In' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.entered_by || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (window.confirm('Delete this registrant?')) deleteMutation.mutate(r.id) }}
                      className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {!isLoading && registrants.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No registrants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Add Registrant Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Add Registrant</h2>
            <p className="text-xs text-gray-400 mb-4">Fields marked * are required</p>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Attendee</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="First name *" value={form.first_name} onChange={set('first_name')} className={input} />
                  <input required placeholder="Last name *" value={form.last_name} onChange={set('last_name')} className={input} />
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Contact</p>
                <div className="space-y-2">
                  <input required type="email" placeholder="Email *" value={form.email} onChange={set('email')} className={`w-full ${input}`} />
                  <div>
                    <input placeholder="Phone — E.164 format, e.g. +12065551234" value={form.phone} onChange={set('phone')} className={`w-full ${input}`} />
                    <p className="text-xs text-gray-400 mt-1">Include country code — US: +1, Uganda: +256, Vietnam: +84</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Address</p>
                <div className="space-y-2">
                  <input placeholder="Street address" value={form.address} onChange={set('address')} className={`w-full ${input}`} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="City" value={form.city} onChange={set('city')} className={input} />
                    <input placeholder="State / Province" value={form.state} onChange={set('state')} className={input} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CountrySelect value={form.country} onChange={val => setForm({ ...form, country: val })} />
                    <select value={form.continent} onChange={set('continent')} className={input + ' text-gray-500'}>
                      <option value="">Continent</option>
                      {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Age group */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Age Group *</p>
                <select required value={form.age_group} onChange={set('age_group')} className={`w-full ${input}`}>
                  <option value="adult">Adult</option>
                  <option value="youth">Youth</option>
                  <option value="child">Child</option>
                </select>
              </div>

              {/* Payments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Payments Received</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addInlinePayment('convention')}
                      className="text-xs text-blue-600 hover:text-blue-800">+ Convention</button>
                    <button type="button" onClick={() => addInlinePayment('boat_cruise')}
                      className="text-xs text-cyan-600 hover:text-cyan-800">+ Boat Cruise</button>
                    <button type="button" onClick={() => addInlinePayment('donation')}
                      className="text-xs text-green-600 hover:text-green-800">+ Donation</button>
                  </div>
                </div>

                {form.payments.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No payments recorded yet — add one above.</p>
                )}

                {form.payments.map((p, idx) => (
                  <div key={idx} className="border rounded-lg p-3 mb-2 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{productLabel(p.product_type)}</span>
                      <button type="button" onClick={() => removeInlinePayment(idx)}
                        className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={p.installment ?? ''} onChange={e => updateInlinePayment(idx, 'installment', e.target.value || null)}
                        className={input}>
                        <option value="">Full payment</option>
                        <option value="1">Installment 1</option>
                        <option value="2">Installment 2</option>
                      </select>
                      <input placeholder="Amount" value={p.amount}
                        onChange={e => updateInlinePayment(idx, 'amount', e.target.value)}
                        className={input} />
                    </div>
                    <input placeholder="Paid by (if someone else paid)"
                      value={p.payer_name}
                      onChange={e => updateInlinePayment(idx, 'payer_name', e.target.value)}
                      className={`w-full ${input}`} />
                    <input placeholder="Stripe PI ID (optional)"
                      value={p.stripe_pi_id}
                      onChange={e => updateInlinePayment(idx, 'stripe_pi_id', e.target.value)}
                      className={`w-full ${input}`} />
                  </div>
                ))}
              </div>

              {/* Notes */}
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={set('notes')}
                rows={2} className={`w-full ${input} resize-none`} />

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Add Registrant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Payment Modal (works for both linked registrant and unattributed) ── */}
      {paymentTarget && (() => {
        const isUnattributed = paymentTarget === 'unattributed'
        const pt = newPayment.product_type
        const inst = newPayment.installment
        const ageGroup = isUnattributed ? 'adult' : paymentTarget.age_group

        // Expected total and suggested amount for the selected product + installment
        const suggested = pt ? defaultAmount(pt, ageGroup, inst) : ''
        const expected = pt && pt !== 'donation' ? expectedTotal(pt, ageGroup) : null
        const alreadyPaid = !isUnattributed && pt ? paidTotal(paymentTarget.payments, pt) : 0
        const remaining = expected !== null ? Math.max(0, expected - alreadyPaid) : null

        const updateField = (field, value) => {
          const updated = { ...newPayment, [field]: value }
          // Auto-fill amount when product or installment changes
          if (field === 'product_type' || field === 'installment') {
            const newType = field === 'product_type' ? value : newPayment.product_type
            const newInst = field === 'installment' ? value : newPayment.installment
            updated.amount = defaultAmount(newType, ageGroup, newInst)
          }
          setNewPayment(updated)
        }

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-0.5">Add Payment</h2>
              {isUnattributed
                ? <p className="text-sm text-orange-500 mb-4 flex items-center gap-1.5">
                    <span className="text-base">⚠️</span> Not linked to any registrant
                  </p>
                : <p className="text-sm text-gray-500 mb-4">
                    {paymentTarget.first_name} {paymentTarget.last_name}
                    <span className="ml-2 text-xs text-gray-400 capitalize">({ageGroup})</span>
                  </p>
              }

              {/* Balance summary — only for linked registrants */}
              {!isUnattributed && (paymentTarget.convention || paymentTarget.boat_cruise) && (
                <div className="mb-4 space-y-1">
                  {paymentTarget.convention && (() => {
                    const exp = expectedTotal('convention', ageGroup)
                    const paid = paidTotal(paymentTarget.payments, 'convention')
                    const bal = Math.max(0, exp - paid)
                    return (
                      <div className="flex justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 border">
                        <span className="text-gray-600">Convention</span>
                        <span>
                          <span className="text-gray-500">Paid ${paid.toFixed(2)} of ${exp}</span>
                          {bal > 0
                            ? <span className="ml-2 text-red-600 font-medium">${bal.toFixed(2)} due</span>
                            : <span className="ml-2 text-green-600 font-medium">✓ Paid in full</span>}
                        </span>
                      </div>
                    )
                  })()}
                  {paymentTarget.boat_cruise && (() => {
                    const exp = expectedTotal('boat_cruise', ageGroup)
                    const paid = paidTotal(paymentTarget.payments, 'boat_cruise')
                    const bal = Math.max(0, exp - paid)
                    return (
                      <div className="flex justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 border">
                        <span className="text-gray-600">Boat Cruise</span>
                        <span>
                          <span className="text-gray-500">Paid ${paid.toFixed(2)} of $220</span>
                          {bal > 0
                            ? <span className="ml-2 text-red-600 font-medium">${bal.toFixed(2)} due</span>
                            : <span className="ml-2 text-green-600 font-medium">✓ Paid in full</span>}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}

              <form onSubmit={handleAddPayment} className="space-y-3">
                {/* Product */}
                <select required value={pt} onChange={e => updateField('product_type', e.target.value)}
                  className={`w-full ${input}`}>
                  <option value="">Select product *</option>
                  <option value="convention">Convention</option>
                  <option value="boat_cruise">Boat Cruise</option>
                  <option value="donation">Donation</option>
                </select>

                {/* Installment — only for convention and boat_cruise */}
                {pt && pt !== 'donation' && (
                  <select value={inst} onChange={e => updateField('installment', e.target.value)}
                    className={`w-full ${input}`}>
                    <option value="">Full payment</option>
                    <option value="1">Installment 1 of 2</option>
                    <option value="2">Installment 2 of 2</option>
                  </select>
                )}

                {/* Amount — auto-filled but editable */}
                <div>
                  <input required placeholder="Amount" value={newPayment.amount}
                    onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className={`w-full ${input}`} />
                  {suggested && (
                    <p className="text-xs text-gray-400 mt-1">
                      Standard: <strong>${suggested}</strong>
                      {!isUnattributed && remaining !== null && remaining > 0 &&
                        <span className="ml-2">· Remaining balance: <strong className="text-red-600">${remaining.toFixed(2)}</strong></span>
                      }
                    </p>
                  )}
                </div>

                <input placeholder="Paid by (if someone else paid)" value={newPayment.payer_name}
                  onChange={e => setNewPayment({ ...newPayment, payer_name: e.target.value })}
                  className={`w-full ${input}`} />
                <input placeholder="Stripe PI ID (optional)" value={newPayment.stripe_pi_id}
                  onChange={e => setNewPayment({ ...newPayment, stripe_pi_id: e.target.value })}
                  className={`w-full ${input}`} />
                <input placeholder="Notes (optional)" value={newPayment.notes}
                  onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })}
                  className={`w-full ${input}`} />

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setPaymentTarget(null)}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={addPaymentMutation.isPending}
                    className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                    {addPaymentMutation.isPending ? 'Saving...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* ── Link Payment to Registrant Modal ── */}
      {linkTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Link Payment to Registrant</h2>
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-4 text-sm">
              <p className="font-medium text-orange-700">
                {productLabel(linkTarget.product_type)}
                {linkTarget.installment ? ` — Installment ${linkTarget.installment}` : ''}
                {' '}— ${linkTarget.amount}
              </p>
              {linkTarget.payer_name && <p className="text-xs text-orange-500 mt-0.5">Paid by: {linkTarget.payer_name}</p>}
              {linkTarget.notes && <p className="text-xs text-orange-500 mt-0.5">{linkTarget.notes}</p>}
            </div>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={linkSearch}
              onChange={e => setLinkSearch(e.target.value)}
              className={`w-full ${input} mb-3`}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border rounded-lg mb-4">
              {(() => {
                const q = linkSearch.toLowerCase()
                const filtered = registrants.filter(r =>
                  !q ||
                  r.first_name.toLowerCase().includes(q) ||
                  r.last_name.toLowerCase().includes(q) ||
                  r.email.toLowerCase().includes(q)
                ).slice(0, 20)
                if (filtered.length === 0) {
                  return <p className="text-sm text-gray-400 text-center py-6">No matching registrants</p>
                }
                return filtered.map(r => (
                  <button key={r.id} type="button"
                    onClick={() => {
                      if (window.confirm(`Link this payment to ${r.first_name} ${r.last_name}?`)) {
                        linkPaymentMutation.mutate({ paymentId: linkTarget.id, registrantId: r.id })
                      }
                    }}
                    disabled={linkPaymentMutation.isPending}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm transition-colors">
                    <p className="font-medium text-gray-800">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-gray-400">
                      {r.email}
                      {(r.city || r.country) && ` · ${[r.city, r.country].filter(Boolean).join(', ')}`}
                    </p>
                  </button>
                ))
              })()}
            </div>
            <button type="button"
              onClick={() => { setLinkTarget(null); setLinkSearch('') }}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
