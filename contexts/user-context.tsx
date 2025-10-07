"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type UserType = "client" | "coach" | null
type User = {
  id: string
  name: string
  email: string
  type: UserType
} | null

interface UserContextType {
  user: User
  isLoading: boolean
  login: (type: UserType) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (type: UserType) => {
    // Create a mock user based on the type
    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      name: type === "coach" ? "Coach Smith" : "John Doe",
      email: type === "coach" ? "coach@example.com" : "client@example.com",
      type,
    }

    setUser(newUser)
    localStorage.setItem("user", JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <UserContext.Provider value={{ user, isLoading, login, logout }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
