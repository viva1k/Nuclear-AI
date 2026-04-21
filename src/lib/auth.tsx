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

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => { success: boolean; error?: string }
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

const STORAGE_KEY = "nuclear-ai-auth"
const REGISTERED_USERS_KEY = "nuclear-ai-registered-users"

function getRegisteredUsers(): { email: string; password: string; user: AuthUser }[] {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Restore session from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    }
    setIsLoading(false)
  }, [])

  const login = React.useCallback((email: string, password: string) => {
    // Check mock users first
    const match = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (match) {
      setUser(match.user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match.user))
      return { success: true }
    }
    // Check registered users from localStorage
    const registered = getRegisteredUsers()
    const regMatch = registered.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (regMatch) {
      setUser(regMatch.user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(regMatch.user))
      return { success: true }
    }
    return { success: false, error: "Invalid email or password" }
  }, [])

  const signup = React.useCallback((name: string, email: string, password: string) => {
    // Check if email already exists in mock users
    const existsInMock = mockUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )
    if (existsInMock) {
      return { success: false, error: "An account with this email already exists" }
    }
    // Check if email already exists in registered users
    const registered = getRegisteredUsers()
    const existsInRegistered = registered.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )
    if (existsInRegistered) {
      return { success: false, error: "An account with this email already exists" }
    }
    // Create new user
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: "client",
    }
    registered.push({ email, password, user: newUser })
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered))
    // Auto-login after signup
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    return { success: true }
  }, [])

  const logout = React.useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
