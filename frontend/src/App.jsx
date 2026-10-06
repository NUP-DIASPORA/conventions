import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './services/auth'

// Public pages
import Home from './pages/Home'
import Convention from './pages/Convention'
import Speakers from './pages/Speakers'
import Schedule from './pages/Schedule'
import Executives from './pages/Executives'
import Fundraiser from './pages/Fundraiser'
import MyQR from './pages/MyQR'

// Admin pages
import AdminLogin from './pages/admin/Login'
import AdminHub from './pages/admin/AdminHub'
import AdminDashboard from './pages/admin/Dashboard'
import AdminRegistrants, { DeletedRegistrantsView } from './pages/admin/Registrants'
import AdminCheckIn from './pages/admin/CheckIn'
import PledgesDashboard from './pages/admin/PledgesDashboard'

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
        <Route path="/convention" element={<><Navbar /><Convention /></>} />
        <Route path="/speakers" element={<><Navbar /><Speakers /></>} />
        <Route path="/schedule" element={<><Navbar /><Schedule /></>} />
        <Route path="/executives" element={<><Navbar /><Executives /></>} />
        <Route path="/fundraiser" element={<><Navbar /><Fundraiser /></>} />
        <Route path="/my-qr" element={<MyQR />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />
        <Route path="/admin/convention" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/registrants" element={<ProtectedRoute><AdminRegistrants /></ProtectedRoute>} />
        <Route path="/admin/registrants/deleted" element={<ProtectedRoute><DeletedRegistrantsView /></ProtectedRoute>} />
        <Route path="/admin/checkin" element={<ProtectedRoute><AdminCheckIn /></ProtectedRoute>} />
        <Route path="/admin/pledges" element={<ProtectedRoute><PledgesDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
