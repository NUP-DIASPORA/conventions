import axios from 'axios'
import { triggerLogout } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear auth state — React Router's ProtectedRoute handles the redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      triggerLogout()
    }
    return Promise.reject(err)
  }
)

// --- Auth ---
export const changePassword = (current_password, new_password) =>
  api.post('/auth/change-password', { current_password, new_password })
export const login = (email, password) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
}

// --- Registrants ---
export const getRegistrants = (params) => api.get('/registrants', { params })
export const createRegistrant = (data) => api.post('/registrants', data)
export const updateRegistrant = (id, data) => api.patch(`/registrants/${id}`, data)
export const deleteRegistrant = (id) => api.delete(`/registrants/${id}`)
export const getQRCode = (id) => api.get(`/registrants/${id}/qr`)
export const getRegistrantHistory = (id) => api.get(`/registrants/${id}/history`)

// --- QR Lookup ---
export const lookupByQR = (qr_data) => api.get('/registrants/lookup/by-qr', { params: { qr_data } })

// --- Check-ins ---
export const checkIn = (registrantId, eventType, conferenceDay) =>
  api.post('/checkins', { registrant_id: registrantId, event_type: eventType, conference_day: conferenceDay ?? null })
export const getCheckins = (params) => api.get('/checkins', { params })
export const getCheckinStats = () => api.get('/checkins/stats')
export const getCheckinBreakdown = () => api.get('/checkins/breakdown')

// --- Payments ---
export const getPaymentSummary = () => api.get('/payments/summary')
export const createPayment = (data) => api.post('/payments', data)
export const deletePayment = (id) => api.delete(`/payments/${id}`)
export const getUnattributedPayments = () => api.get('/payments/unattributed')
export const linkPayment = (paymentId, registrantId) => api.patch(`/payments/${paymentId}/link?registrant_id=${registrantId}`)

// --- Speakers ---
export const getSpeakers = () => api.get('/speakers')
export const createSpeaker = (data) => api.post('/speakers', data)
export const updateSpeaker = (id, data) => api.patch(`/speakers/${id}`, data)
export const deleteSpeaker = (id) => api.delete(`/speakers/${id}`)

// --- Programs ---
export const getSessions = (params) => api.get('/programs', { params })
export const createSession = (data) => api.post('/programs', data)
export const updateSession = (id, data) => api.patch(`/programs/${id}`, data)
export const deleteSession = (id) => api.delete(`/programs/${id}`)

export default api
