import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './services/auth'

// Public pages
import Home from './pages/Home'
import Speakers from './pages/Speakers'
import Schedule from './pages/Schedule'
import MyQR from './pages/MyQR'

// Admin pages
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminRegistrants, { DeletedRegistrantsView } from './pages/admin/Registrants'
import AdminCheckIn from './pages/admin/CheckIn'

// Layout components
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes with navbar */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/speakers" element={<><Navbar /><Speakers /></>} />
        <Route path="/schedule" element={<><Navbar /><Schedule /></>} />
        <Route path="/my-qr" element={<MyQR />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/registrants" element={<ProtectedRoute><AdminRegistrants /></ProtectedRoute>} />
        <Route path="/admin/registrants/deleted" element={<ProtectedRoute><DeletedRegistrantsView /></ProtectedRoute>} />
        <Route path="/admin/checkin" element={<ProtectedRoute><AdminCheckIn /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
