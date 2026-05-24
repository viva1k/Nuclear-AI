"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export type UserRole = "client" | "admin"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

// Mock credentials
export const mockUsers: { email: string; password: string; user: AuthUser }[] = [
  {
    email: "e.vasquez@nuclear-ai.org",
    password: "password",
    user: {
      id: "user-1",
      name: "Dr. Elena Vasquez",
      email: "e.vasquez@nuclear-ai.org",
      role: "client",
    },
  },
  {
    email: "j.chen@nuclear-ai.org",
    password: "password",
    user: {
      id: "user-2",
      name: "Dr. James Chen",
      email: "j.chen@nuclear-ai.org",
      role: "client",
    },
  },
  {
    email: "admin@nuclear-ai.org",
    password: "admin123",
    user: {
      id: "admin-1",
      name: "System Administrator",
      email: "admin@nuclear-ai.org",
      role: "admin",
    },
  },
  {
    email: "ops@nuclear-ai.org",
    password: "admin123",
    user: {
      id: "admin-2",
      name: "Operations Manager",
      email: "ops@nuclear-ai.org",
      role: "admin",
    },
  },
]

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
const STORAGE_KEY = "nuclear-ai-auth"
const TOKEN_KEY = "nuclear-ai-token"

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: (token: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Verify and restore session on mount
  React.useEffect(() => {
    async function restoreSession() {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
          // Verify token against /users/me
          const res = await fetch(`${BACKEND_BASE_URL}/users/me`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })
          if (res.ok) {
            const dbUser = await res.json()
            const authUser: AuthUser = {
              id: dbUser.id,
              name: dbUser.name || "User",
              email: dbUser.email,
              role: dbUser.role === "ADMIN" ? "admin" : "client",
            }
            setUser(authUser)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
          } else {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(STORAGE_KEY)
            setUser(null)
          }
        } else {
          // If no token but stored user, clear it to stay in sync
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
        }
      } catch (err) {
        console.error("Failed to restore session", err)
        // Network error, try to fallback to stored user without clearing
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            setUser(JSON.parse(stored))
          } catch {
            // ignore
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const res = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })

      const data = await res.json()
      if (!res.ok) {
        let errMsg = "Invalid email or password"
        if (data && data.detail) {
          if (typeof data.detail === "string") {
            errMsg = data.detail
          } else if (Array.isArray(data.detail) && data.detail[0]?.message) {
            errMsg = data.detail[0].message
          }
        }
        return { success: false, error: errMsg }
      }

      const token = data.access_token
      localStorage.setItem(TOKEN_KEY, token)

      // Fetch user profile details
      const profileRes = await fetch(`${BACKEND_BASE_URL}/users/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!profileRes.ok) {
        localStorage.removeItem(TOKEN_KEY)
        return { success: false, error: "Failed to load user profile" }
      }

      const dbUser = await profileRes.json()
      const authUser: AuthUser = {
        id: dbUser.id,
        name: dbUser.name || "User",
        email: dbUser.email,
        role: dbUser.role === "ADMIN" ? "admin" : "client",
      }

      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return { success: true }
    } catch (err) {
      console.error("Login request failed", err)
      return { success: false, error: "Unable to connect to the backend server. Make sure it is running." }
    }
  }, [])

  const signup = React.useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()
      if (!res.ok) {
        let errMsg = "Registration failed"
        if (data && data.detail) {
          if (typeof data.detail === "string") {
            errMsg = data.detail
          } else if (Array.isArray(data.detail) && data.detail[0]?.message) {
            errMsg = data.detail[0].message
          }
        }
        return { success: false, error: errMsg }
      }

      // Automatically log in after registration
      return await login(email, password)
    } catch (err) {
      console.error("Registration request failed", err)
      return { success: false, error: "Unable to connect to the backend server. Make sure it is running." }
    }
  }, [login])

  const loginWithGoogle = React.useCallback(async (googleToken: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: googleToken }),
      })

      const data = await res.json()
      if (!res.ok) {
        let errMsg = "Google authentication failed"
        if (data && data.detail) {
          if (typeof data.detail === "string") {
            errMsg = data.detail
          } else if (Array.isArray(data.detail) && data.detail[0]?.message) {
            errMsg = data.detail[0].message
          }
        }
        return { success: false, error: errMsg }
      }

      const token = data.access_token
      localStorage.setItem(TOKEN_KEY, token)

      const profileRes = await fetch(`${BACKEND_BASE_URL}/users/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!profileRes.ok) {
        localStorage.removeItem(TOKEN_KEY)
        return { success: false, error: "Failed to load user profile" }
      }

      const dbUser = await profileRes.json()
      const authUser: AuthUser = {
        id: dbUser.id,
        name: dbUser.name || "User",
        email: dbUser.email,
        role: dbUser.role === "ADMIN" ? "admin" : "client",
      }

      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return { success: true }
    } catch (err) {
      console.error("Google login failed", err)
      return { success: false, error: "Unable to connect to the backend server. Make sure it is running." }
    }
  }, [])

  const logout = React.useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard")
    }
  }, [user, isLoading, requiredRole, router])

  return { user, isLoading }
}
