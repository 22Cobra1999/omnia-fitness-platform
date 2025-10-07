"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database, CheckCircle, AlertCircle } from "lucide-react"

interface RepopulateCalendarButtonProps {
  onSuccess?: () => void
}

export default function RepopulateCalendarButton({ onSuccess }: RepopulateCalendarButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleRepopulate = async () => {
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/repopulate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setMessage(`✅ ${result.message}. ${result.data.insertedRecords} registros insertados.`)
        onSuccess?.()
      } else {
        setStatus('error')
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(`❌ Error de conexión: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleRepopulate}
        disabled={loading}
        className="w-full"
        variant="outline"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Repoblando calendario...
          </>
        ) : (
          <>
            <Database className="h-4 w-4 mr-2" />
            Repoblar Activity Calendar
          </>
        )}
      </Button>

      {message && (
        <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
