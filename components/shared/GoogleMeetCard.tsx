"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Video, 
  Calendar,
  ExternalLink,
  Copy,
  Check
} from "lucide-react"

interface GoogleMeetCardProps {
  eventTitle: string
  meetLink: string
  startTime: string
  endTime: string
  participantType: 'coach' | 'client'
  onJoin?: () => void
}

export function GoogleMeetCard({ 
  eventTitle, 
  meetLink, 
  startTime, 
  endTime, 
  participantType,
  onJoin 
}: GoogleMeetCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const handleJoin = () => {
    if (onJoin) {
      onJoin()
    } else {
      window.open(meetLink, '_blank')
    }
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
      
      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/10">
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white truncate">
              {eventTitle}
            </h3>
            <p className="text-sm text-gray-300">
              Meet Google
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Video className="h-4 w-4 text-green-400" />
          <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
        </div>

        {/* Meet Link */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1">Enlace de reunión</p>
              <p className="text-sm text-white font-mono truncate">
                {meetLink}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLink}
                className="h-8 w-8 p-0 hover:bg-white/10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(meetLink, '_blank')}
                className="h-8 w-8 p-0 hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <Button
          onClick={handleJoin}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Video className="h-5 w-5 mr-2" />
          Unirse a la Reunión
        </Button>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Link generado automáticamente
          </p>
        </div>
      </div>
    </div>
  )
}

