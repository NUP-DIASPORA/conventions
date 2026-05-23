import { useState, useEffect, createContext, useContext } from 'react'
import { login as apiLogin } from './api'

const AuthContext = createContext(null)

// Module-level callback so api.js can trigger logout without circular imports
let _logoutCallback = null
export function setLogoutCallback(fn) { _logoutCallback = fn }
export function triggerLogout() { if (_logoutCallback) _logoutCallback() }

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  // Register logout callback for api.js to call on 401
  useEffect(() => {
    setLogoutCallback(logout)
    return () => setLogoutCallback(null)
  }, [])

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const t = res.data.access_token
    localStorage.setItem('token', t)
    setToken(t)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
