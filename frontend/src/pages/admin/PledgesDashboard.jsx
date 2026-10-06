import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  addPledgePayment,
  bulkUploadPledges,
  cancelPledge,
  createPledge,
  deletePledgePayment,
  getPledgeSummary,
  getPledges,
  updatePledge,
} from '../../services/api'
import { useAuth } from '../../services/auth'

const METHODS = [
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'cash', label: 'Cash' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'stripe', label: 'Stripe' },
]

const emptyPledgeForm = () => ({
  name: '',
  email: '',
  phone: '',
  chapter: '',
  message: '',
  amount_pledged: '',
  pledged_at: new Date().toISOString().slice(0, 10),
  notes: '',
})

const emptyPaymentForm = () => ({
  amount: '',
  paid_at: new Date().toISOString().slice(0, 10),
  method: 'zelle',
  reference: '',
})

function money(n) {
  const v = Number(n || 0)
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function statusBadge(status) {
  const styles = {
    open: 'bg-amber-50 text-amber-800 border-amber-200',
    fulfilled: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] || styles.open}`}>
      {status}
    </span>
  )
}

export default function PledgesDashboard() {
  const { logout } = useAuth()
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [chapter, setChapter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [pledgeForm, setPledgeForm] = useState(emptyPledgeForm)
  const [createError, setCreateError] = useState('')
  const [selected, setSelected] = useState(null)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [paymentError, setPaymentError] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [amountSaved, setAmountSaved] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadError, setUploadError] = useState('')

  const params = useMemo(() => {
    const p = {}
    if (status) p.status = status
    if (search.trim()) p.search = search.trim()
    if (chapter.trim()) p.chapter = chapter.trim()
    return p
  }, [status, search, chapter])

  const { data: summary } = useQuery({
    queryKey: ['pledge-summary'],
    queryFn: () => getPledgeSummary().then(r => r.data),
  })

  const { data: pledges = [], isLoading } = useQuery({
    queryKey: ['pledges', params],
    queryFn: () => getPledges(params).then(r => r.data),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pledges'] })
    qc.invalidateQueries({ queryKey: ['pledge-summary'] })
  }

  const createMutation = useMutation({
    mutationFn: () => createPledge(pledgeForm),
    onSuccess: (res) => {
      setShowCreate(false)
      setPledgeForm(emptyPledgeForm())
      setCreateError('')
      invalidate()
      openDetail(res.data)
    },
    onError: (err) => setCreateError(err.response?.data?.detail || 'Failed to create pledge'),
  })

  const paymentMutation = useMutation({
    mutationFn: () => addPledgePayment(selected.id, paymentForm),
    onSuccess: (res) => {
      setSelected(res.data)
      setPaymentForm(emptyPaymentForm())
      setPaymentError('')
      invalidate()
    },
    onError: (err) => setPaymentError(formatDetail(err) || 'Failed to add payment'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelPledge(selected.id),
    onSuccess: (res) => {
      setSelected(res.data)
      invalidate()
    },
  })

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId) => deletePledgePayment(paymentId),
    onSuccess: (res) => {
      setSelected(res.data)
      invalidate()
    },
  })

  const notesMutation = useMutation({
    mutationFn: () => updatePledge(selected.id, { notes: editNotes }),
    onSuccess: (res) => {
      setSelected(res.data)
      invalidate()
    },
  })

  const amountMutation = useMutation({
    mutationFn: () => updatePledge(selected.id, { amount_pledged: editAmount }),
    onSuccess: (res) => {
      setSelected(res.data)
      setEditAmount(res.data.amount_pledged)
      setAmountError('')
      setAmountSaved(true)
      setTimeout(() => setAmountSaved(false), 2000)
      invalidate()
    },
    onError: (err) => setAmountError(formatDetail(err) || 'Failed to update amount'),
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => bulkUploadPledges(file),
    onSuccess: (res) => {
      setUploadResult(res.data)
      setUploadError('')
      invalidate()
    },
    onError: (err) => {
      setUploadResult(null)
      setUploadError(formatDetail(err) || 'Upload failed')
    },
  })

  function openDetail(pledge) {
    setSelected(pledge)
    setEditNotes(pledge.notes || '')
    setEditAmount(pledge.amount_pledged || '')
    setAmountError('')
    setAmountSaved(false)
    setPaymentForm(emptyPaymentForm())
    setPaymentError('')
  }

  function handleSaveAmount(e) {
    e.preventDefault()
    setAmountError('')
    if (!editAmount.trim()) {
      setAmountError('Enter a pledge amount')
      return
    }
    amountMutation.mutate()
  }

  function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    createMutation.mutate()
  }

  function handlePayment(e) {
    e.preventDefault()
    setPaymentError('')
    paymentMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: 'linear-gradient(to right, #111e45, #1a3572)' }} className="text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <Link to="/admin" className="hover:text-white text-lg font-bold" style={{ color: '#a8b8d8' }}>← Admin</Link>
          <h1 className="text-lg font-bold tracking-wide">$50k Drive — Pledges</h1>
          <Link to="/admin/convention" className="text-lg font-bold px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20" style={{ color: '#fff' }}>
            Convention
          </Link>
        </div>
        <button onClick={logout} className="text-lg font-bold hover:text-white" style={{ color: '#a8b8d8' }}>Sign out</button>
      </header>

      <div style={{ background: 'linear-gradient(135deg, #0d1a3a 0%, #1a3572 60%, #1e4080 100%)' }} className="text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-widest mb-2" style={{ color: '#a8b8d8' }}>CA / West Coast Chapter</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-1">Pledge &amp; Payment Ledger</h2>
          <div className="w-16 h-1 rounded-full mb-6" style={{ background: '#cc2229' }} />
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Total Pledged" value={money(summary.total_pledged)} />
              <Stat label="Total Paid" value={money(summary.total_paid)} />
              <Stat label="Remaining" value={money(summary.total_remaining)} accent />
              <Stat label="Open Pledges" value={summary.open_count} />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setShowCreate(true); setCreateError('') }}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              + New Pledge
            </button>
            <label className="bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
              Bulk Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Export Responses as CSV from the Google Form, then upload here.
          </p>
        </div>

        {(uploadResult || uploadError) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${uploadError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {uploadError || (
              <>
                Created <strong>{uploadResult.created}</strong>, skipped duplicates <strong>{uploadResult.skipped}</strong>
                {uploadResult.errors?.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-amber-800">
                    {uploadResult.errors.slice(0, 8).map((err, i) => <li key={i}>{err}</li>)}
                    {uploadResult.errors.length > 8 && <li>…and {uploadResult.errors.length - 8} more</li>}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="Chapter"
            className="sm:w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Chapter</th>
                  <th className="px-4 py-3 font-medium">Pledged</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                )}
                {!isLoading && pledges.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No pledges yet.</td></tr>
                )}
                {pledges.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.chapter || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{money(p.amount_pledged)}</td>
                    <td className="px-4 py-3 text-gray-700">{money(p.amount_paid)}</td>
                    <td className="px-4 py-3 text-gray-700">{money(p.amount_remaining)}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(p)}
                        className="text-sm font-semibold text-[#1a3572] hover:underline"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCreate && (
        <Modal title="New Pledge" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <Field label="Name" required value={pledgeForm.name} onChange={(v) => setPledgeForm({ ...pledgeForm, name: v })} />
            <Field label="Email" type="email" required value={pledgeForm.email} onChange={(v) => setPledgeForm({ ...pledgeForm, email: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={pledgeForm.phone} onChange={(v) => setPledgeForm({ ...pledgeForm, phone: v })} />
              <Field label="Chapter" value={pledgeForm.chapter} onChange={(v) => setPledgeForm({ ...pledgeForm, chapter: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount pledged" required value={pledgeForm.amount_pledged} onChange={(v) => setPledgeForm({ ...pledgeForm, amount_pledged: v })} placeholder="500" />
              <Field label="Pledge date" type="date" required value={pledgeForm.pledged_at} onChange={(v) => setPledgeForm({ ...pledgeForm, pledged_at: v })} />
            </div>
            <Field label="Message" value={pledgeForm.message} onChange={(v) => setPledgeForm({ ...pledgeForm, message: v })} />
            <Field label="Notes" value={pledgeForm.notes} onChange={(v) => setPledgeForm({ ...pledgeForm, notes: v })} />
            {createError && <p className="text-sm text-red-600">{String(createError)}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
                {createMutation.isPending ? 'Saving…' : 'Create Pledge'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
                <p className="text-sm text-gray-500">{selected.chapter || 'No chapter'} · pledged {selected.pledged_at}</p>
                <div className="mt-2">{statusBadge(selected.status)}</div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-400">Remaining</p>
                <p className="text-2xl font-black text-[#1a3572]">{money(selected.amount_remaining)}</p>
                <p className="text-xs text-gray-500">{money(selected.amount_paid)} of {money(selected.amount_pledged)}</p>
              </div>
            </div>

            {selected.message && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{selected.message}</p>
            )}

            <form onSubmit={handleSaveAmount} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Edit pledge amount</h3>
              <p className="text-xs text-gray-500">
                Change this if the pledged total was wrong or increased (e.g. $100 → $500). Past payments stay; remaining balance and status update automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="sm:w-48">
                  <Field
                    label="Amount pledged"
                    required
                    value={editAmount}
                    onChange={(v) => { setEditAmount(v); setAmountSaved(false) }}
                    placeholder="500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={amountMutation.isPending || editAmount === selected.amount_pledged}
                  className="bg-[#1a3572] hover:bg-[#152a5c] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60 h-[38px]"
                >
                  {amountMutation.isPending ? 'Saving…' : 'Save amount'}
                </button>
              </div>
              {amountError && <p className="text-sm text-red-600">{amountError}</p>}
              {amountSaved && <p className="text-sm text-emerald-600">Pledge amount updated.</p>}
            </form>

            {selected.status !== 'cancelled' && (
              <form onSubmit={handlePayment} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm">Record payment</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Amount" required value={paymentForm.amount} onChange={(v) => setPaymentForm({ ...paymentForm, amount: v })} />
                  <Field label="Date" type="date" required value={paymentForm.paid_at} onChange={(v) => setPaymentForm({ ...paymentForm, paid_at: v })} />
                  <label className="block text-sm">
                    <span className="text-gray-600 text-xs font-medium">Method</span>
                    <select
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    >
                      {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </label>
                  <Field label="Reference" value={paymentForm.reference} onChange={(v) => setPaymentForm({ ...paymentForm, reference: v })} placeholder="Txn / note" />
                </div>
                {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
                <button type="submit" disabled={paymentMutation.isPending} className="bg-[#1a3572] hover:bg-[#152a5c] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
                  {paymentMutation.isPending ? 'Saving…' : 'Add Payment'}
                </button>
              </form>
            )}

            <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2">Payment history</h3>
              {(!selected.payments || selected.payments.length === 0) ? (
                <p className="text-sm text-gray-400">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selected.payments.map((pay) => (
                        <tr key={pay.id}>
                          <td className="px-3 py-2">{pay.paid_at}</td>
                          <td className="px-3 py-2 font-medium">{money(pay.amount)}</td>
                          <td className="px-3 py-2 capitalize">{pay.method}</td>
                          <td className="px-3 py-2 text-gray-500">{pay.reference || '—'}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => {
                                if (window.confirm('Delete this payment?')) deletePaymentMutation.mutate(pay.id)
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm">
                <span className="text-gray-600 text-xs font-medium">Admin notes</span>
                <textarea
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[72px]"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => notesMutation.mutate()}
                disabled={notesMutation.isPending}
                className="text-sm font-semibold text-[#1a3572] hover:underline"
              >
                Save notes
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              {selected.status !== 'cancelled' ? (
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => {
                    if (window.confirm('Cancel this pledge? Payment history will be kept.')) cancelMutation.mutate()
                  }}
                >
                  Cancel pledge
                </button>
              ) : (
                <span className="text-sm text-gray-400">Cancelled</span>
              )}
              <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-gray-600">Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function formatDetail(err) {
  const d = err.response?.data?.detail
  if (!d) return null
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join('; ')
  return String(d)
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3">
      <p className="text-xs uppercase tracking-wide" style={{ color: '#a8b8d8' }}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-red-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl p-6 w-full ${wide ? 'max-w-3xl' : 'max-w-md'} my-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600 text-xs font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      />
    </label>
  )
}
