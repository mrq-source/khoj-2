import { useCallback, useMemo, useState } from 'react'
import { login as apiLogin, signup as apiSignup } from '../api/mockApi'
import { AuthContext } from './sessionContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('derma-ai-session')) || null
    } catch {
      return null
    }
  })

  async function signIn(credentials) {
    const session = await apiLogin(credentials)
    localStorage.setItem('derma-ai-session', JSON.stringify(session))
    setUser(session)
    return session
  }

  async function register(details) {
    const session = await apiSignup(details)
    localStorage.setItem('derma-ai-session', JSON.stringify(session))
    setUser(session)
    return session
  }

  const signOut = useCallback(() => {
    localStorage.removeItem('derma-ai-session')
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, signIn, register, signOut }), [user, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
