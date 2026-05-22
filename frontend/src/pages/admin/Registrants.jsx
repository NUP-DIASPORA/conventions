import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRegistrants, createRegistrant, deleteRegistrant } from '../../services/api'
import { Link } from 'react-router-dom'

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  address: '', city: '', state: '',
  age_group: 'adult',
  product_id: '', product_name: '', payment_amount: '',
  payer_name: '',
  ticket_type: 'general', notes: '',
}

export default function AdminRegistrants() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate(form)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-blue-200 hover:text-white text-sm">← Dashboard</Link>
          <h1 className="text-lg font-bold">Registrants</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-white text-blue-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50">
          + Add Registrant
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {isLoading && <p className="text-gray-400 text-center py-10">Loading...</p>}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Attendee</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Age Group</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Paid By</th>
                <th className="px-4 py-3 text-left">Ticket</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Entered By</th>
                <th className="px-4 py-3 text-left">Entered At</th>
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
                    {[r.city, r.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.age_group === 'child' ? 'bg-pink-50 text-pink-600' :
                      r.age_group === 'youth' ? 'bg-purple-50 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {r.age_group}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.product_name || '—'}
                    {r.product_id && <p className="text-xs text-gray-400">#{r.product_id}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {r.payment_amount ? `$${r.payment_amount}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.payer_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{r.ticket_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.checked_in
                      ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Checked in</span>
                      : <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">Pending</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.entered_by || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.entered_at ? new Date(r.entered_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (window.confirm('Delete this registrant?')) deleteMutation.mutate(r.id) }}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && registrants.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400">No registrants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Registrant Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Add Registrant</h2>
            <p className="text-xs text-gray-400 mb-4">Fields marked * are required</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Attendee name */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Attendee</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="First name *" value={form.first_name} onChange={set('first_name')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input required placeholder="Last name *" value={form.last_name} onChange={set('last_name')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Contact</p>
                <div className="space-y-2">
                  <input required type="email" placeholder="Email *" value={form.email} onChange={set('email')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input placeholder="Phone" value={form.phone} onChange={set('phone')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Address</p>
                <div className="space-y-2">
                  <input placeholder="Street address" value={form.address} onChange={set('address')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="City" value={form.city} onChange={set('city')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input placeholder="State" value={form.state} onChange={set('state')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Age group & ticket */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Age Group *</p>
                  <select required value={form.age_group} onChange={set('age_group')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="adult">Adult</option>
                    <option value="youth">Youth</option>
                    <option value="child">Child</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Ticket Type</p>
                  <select value={form.ticket_type} onChange={set('ticket_type')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="general">General</option>
                    <option value="vip">VIP</option>
                    <option value="speaker">Speaker</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>

              {/* Product & payment */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Product & Payment</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Product ID" value={form.product_id} onChange={set('product_id')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input placeholder="Product name" value={form.product_name} onChange={set('product_name')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <input placeholder="Payment amount (e.g. 150.00)" value={form.payment_amount} onChange={set('payment_amount')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input
                    placeholder="Paid by (if someone else paid)"
                    value={form.payer_name}
                    onChange={set('payer_name')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={set('notes')}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Add Registrant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
