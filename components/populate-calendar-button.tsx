"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CalendarCheck, CalendarX } from 'lucide-react'

interface PopulateCalendarButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PopulateCalendarButton({ onSuccess, onError }: PopulateCalendarButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const handlePopulate = async () => {
    setLoading(true)
    setMessage(null)
    setIsError(false)

    try {
      const response = await fetch('/api/populate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(result.message || 'Calendario poblado exitosamente.')
        setIsError(false)
        onSuccess?.()
      } else {
        setMessage(result.error || 'Error al poblar el calendario.')
        setIsError(true)
        onError?.(result.error || 'Error desconocido')
      }
    } catch (error: any) {
      console.error('Error populating calendar:', error)
      setMessage(`Error de red: ${error.message || 'No se pudo conectar al servidor.'}`)
      setIsError(true)
      onError?.(error.message || 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePopulate}
        disabled={loading}
        className="w-full bg-[#FF7939] hover:bg-[#FF6B35] text-white flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Poblando...
          </>
        ) : (
          <>
            <CalendarCheck className="mr-2 h-4 w-4" />
            Poblar Activity Calendar
          </>
        )}
      </Button>
      {message && (
        <div className={`flex items-center text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>
          {isError ? <CalendarX className="mr-1 h-4 w-4" /> : <CalendarCheck className="mr-1 h-4 w-4" />}
          {message}
        </div>
      )}
    </div>
  )
}
