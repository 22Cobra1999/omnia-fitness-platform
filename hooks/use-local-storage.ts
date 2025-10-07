"use client"

import { useState, useEffect } from "react"

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error("Error reading localStorage:", error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    } catch (error) {
      console.error("Error writing to localStorage:", error)
    }
  }

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = localStorage.getItem(key)
        setStoredValue(item ? JSON.parse(item) : initialValue)
      } catch (error) {
        console.error("Error reading localStorage:", error)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue]
}

export { useLocalStorage }
