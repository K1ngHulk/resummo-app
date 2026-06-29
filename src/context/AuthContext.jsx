/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const TOKEN_STORAGE_KEY = 'resummo_auth_token'

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(payload?.message || 'No fue posible completar la solicitud')
  }

  return payload
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const persistSession = useCallback((nextToken, nextUser) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const request = useCallback(
    (path, options = {}) => apiRequest(path, { ...options, token }),
    [token],
  )

  const login = useCallback(
    async (credentials) => {
      const payload = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: credentials,
      })

      persistSession(payload.token, payload.user)
      return payload.user
    },
    [persistSession],
  )

  const register = useCallback(
    async (formValues) => {
      const payload = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: formValues,
      })

      persistSession(payload.token, payload.user)
      return payload.user
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        const payload = await apiRequest('/api/auth/me', { token })

        if (isMounted) {
          setUser(payload.user)
        }
      } catch {
        if (isMounted) {
          clearSession()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [token, clearSession])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      register,
      request,
      token,
      user,
    }),
    [isLoading, login, logout, register, request, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
