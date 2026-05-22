import { useState, createContext, useContext } from 'react'
import { login as apiLogin } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const t = res.data.access_token
    localStorage.setItem('token', t)
    setToken(t)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
