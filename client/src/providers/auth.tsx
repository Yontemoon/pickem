import React, { createContext, useContext, useState, useEffect } from "react"
import { CLIENT_URL } from "@/lib/constants"

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Restore auth state on app load
  useEffect(() => {
    const getData = async () => {
      const res = await fetch(`${CLIENT_URL}/auth/user`, {
        credentials: "include",
      })
      const { data } = await res.json()
      console.log(data)
      if (data) {
        setUser(data)
        setIsAuthenticated(true)
      }

      setIsLoading(false)
    }
    getData()
  }, [])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  }

  const login = async (email: string, password: string) => {
    // Replace with your authentication logic
    const response = await fetch(`${CLIENT_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    if (response.ok) {
      const userData = await response.json()
      console.log(userData)
      setUser(userData.user)
      setIsAuthenticated(true)
    } else {
      throw new Error("Authentication failed")
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
