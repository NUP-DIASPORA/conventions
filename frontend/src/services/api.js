import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

// --- Auth ---
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

// --- Check-ins ---
export const checkIn = (registrantId, conferenceDay) =>
  api.post('/checkins', { registrant_id: registrantId, conference_day: conferenceDay })
export const getCheckins = (params) => api.get('/checkins', { params })
export const getCheckinStats = () => api.get('/checkins/stats')

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
