import { createContext, useContext, useState, useCallback } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => {
    const v = localStorage.getItem('userId')
    return v ? Number(v) : null
  })

  const login = useCallback((token, id) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userId', String(id))
    setUserId(id)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    setUserId(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ userId, isAuth: !!userId, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
