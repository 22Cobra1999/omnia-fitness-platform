"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Video, 
  Calendar,
  ExternalLink
} from "lucide-react"

interface GoogleMeetCardMinimalProps {
  productName?: string
  productType: string
  eventTitle: string
  meetLink: string
  meetLinkId?: string
  startTime: string
  endTime: string
  participantType: 'coach' | 'client'
}

export function GoogleMeetCardMinimal({ 
  productName,
  productType, 
  eventTitle, 
  meetLink, 
  meetLinkId,
  startTime, 
  endTime, 
  participantType
}: GoogleMeetCardMinimalProps) {
  const handleJoinMeet = async () => {
    try {
      if (meetLinkId) {
        await fetch('/api/meetings/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetLinkId, participantType })
        })
      }
    } catch (e) {
      console.error('Error registrando join:', e)
    } finally {
      window.open(meetLink, '_blank')
    }
  }

  // Registrar salida con sendBeacon al cerrar/ocultar
  if (typeof window !== 'undefined' && meetLinkId) {
    const handler = () => {
      try {
        const data = JSON.stringify({ meetLinkId, participantType })
        navigator.sendBeacon('/api/meetings/leave', new Blob([data], { type: 'application/json' }))
      } catch {}
    }
    window.addEventListener('pagehide', handler)
    window.addEventListener('beforeunload', handler)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10"></div>
      
      {/* Content - ULTRA MINIMALISTA */}
      <div className="relative p-4 flex items-center justify-between">
        {/* Información */}
        <div className="flex-1 min-w-0">
          {/* Solo nombre del tema */}
          <p className="text-sm font-medium text-white truncate">
            {eventTitle}
          </p>
          
          {/* Solo horario */}
          <p className="text-xs text-gray-300">
            {formatTime(startTime)} - {formatTime(endTime)}
          </p>
        </div>

        {/* Solo ícono de link */}
        <Button
          onClick={handleJoinMeet}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-white/10 rounded-full ml-2 flex-shrink-0"
        >
          <ExternalLink className="h-4 w-4 text-blue-400" />
        </Button>
      </div>
    </div>
  )
}
