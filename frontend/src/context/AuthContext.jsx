import { createContext, useState } from 'react'
import { loginUser, registerReader } from '../features/auth/api/authApi'
import { getStoredUser, setStoredUser, clearStoredUser } from '../utils/storage'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Khi F5 lại trang, đọc user đã lưu trong localStorage ra để không bị văng
  // về trang login.
  const [user, setUser] = useState(getStoredUser())

  async function login(username, password) {
    const res = await loginUser({ username, password })
    const loggedInUser = res.data.user
    setStoredUser(loggedInUser)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function register(payload) {
    const res = await registerReader(payload)
    return res.data
  }

  function logout() {
    clearStoredUser()
    setUser(null)
  }

  const value = { user, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
