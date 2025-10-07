"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

export function useCoachClients(coachId: string | undefined) {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (!coachId) {
      setLoading(false)
      return
    }

    async function fetchClients() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/coaches/${coachId}/clients`)

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setClients(data)
      } catch (err) {
        console.error("Error fetching coach clients:", err)
        setError("Failed to load clients. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [coachId])

  return { clients, loading, error }
}
