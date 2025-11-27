import React, { createContext, useContext, useState, useEffect } from "react"
import { CLIENT_URL } from "@/lib/constants"
import { postLogin, postSignout } from "@/lib/fetch"
import type { User } from "@/lib/fetch"

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Restore auth state on app load
  useEffect(() => {
    const getData = async () => {
      try {
        const res = await fetch(`${CLIENT_URL}/auth/user`, {
          credentials: "include",
        })

        if (!res.ok) {
          throw Error("Error getting user")
        }
        const { data } = await res.json()
        console.log(data)
        if (data) {
          setUser(data)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("No user")
      } finally {
        setIsLoading(false)
      }
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
    const res = await postLogin(email, password)

    if (!res.error) {
      setUser(res.user)
      setIsAuthenticated(true)
      return { success: true, message: null }
    } else {
      console.error("Authentication failed")
      return { success: false, message: res.error }
    }
  }

  const logout = async () => {
    const res = await postSignout()

    if (res.success) {
      setUser(null)
      setIsAuthenticated(false)
    }
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
