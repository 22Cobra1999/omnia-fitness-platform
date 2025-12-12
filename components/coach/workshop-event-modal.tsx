'use client'

import { useState, useEffect } from 'react'
import { Clock, Video, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: 'workshop' | 'consultation' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled'
  meet_link?: string
  google_event_id?: string
  description?: string
  notes?: string
  activity_id?: number
}

interface WorkshopEventModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function WorkshopEventModal({ event, isOpen, onClose, onUpdate }: WorkshopEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (event) {
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      setStartDate(format(start, 'yyyy-MM-dd'))
      setStartTime(format(start, 'HH:mm'))
      setEndTime(format(end, 'HH:mm'))
    }
  }, [event])

  const handleSaveSchedule = async () => {
    if (!event) return

    setLoading(true)
    try {
      const newStart = new Date(`${startDate}T${startTime}:00`)
      const newEnd = new Date(`${startDate}T${endTime}:00`)

      if (newEnd <= newStart) {
        toast.error('La hora de fin debe ser posterior a la hora de inicio')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('calendar_events')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)

      if (error) throw error

      toast.success('Horario actualizado correctamente')
      setEditingSchedule(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error actualizando evento:', error)
      toast.error('Error al actualizar el horario')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSchedule = () => {
    if (event) {
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      setStartDate(format(start, 'yyyy-MM-dd'))
      setStartTime(format(start, 'HH:mm'))
      setEndTime(format(end, 'HH:mm'))
    }
    setEditingSchedule(false)
  }


  const handleCreateMeet = async () => {
    if (!event) return

    setLoading(true)
    try {
      const response = await fetch('/api/google/calendar/create-meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Google Meet creado correctamente')
        onUpdate()
      } else {
        if (result.error?.includes('no está conectado') || result.error?.includes('connected')) {
          toast.error('Google Calendar no está conectado. Conéctalo desde tu perfil primero.')
        } else {
          toast.error(result.error || 'Error al crear Google Meet')
        }
      }
    } catch (error: any) {
      console.error('Error creando Meet:', error)
      toast.error('Error al crear Google Meet. Verifica que Google Calendar esté conectado.')
    } finally {
      setLoading(false)
    }
  }

  if (!event) return null

  const hasValidMeet = event.meet_link && 
    event.meet_link.includes('meet.google.com/') && 
    event.google_event_id && 
    !event.meet_link.includes('test-') && 
    !event.meet_link.includes('xxx-')

  // Extraer nombre del taller (sin "Taller: ")
  const workshopName = event.title.replace(/^Taller:\s*/i, '')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-w-md p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold text-white">
            {workshopName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tema/Nombre del taller */}
          <div className="text-sm text-gray-400">
            {event.description || event.notes || 'Sin descripción'}
          </div>

          {/* Horario - Minimalista con lápiz para editar */}
          <div className="flex items-center justify-between py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              {editingSchedule ? (
                <div className="flex-1 space-y-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-8"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-8 flex-1"
                    />
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-8 flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveSchedule}
                      disabled={loading}
                      className="flex-1 bg-[#FF7939] hover:bg-[#FF7939]/80 text-white text-xs h-7"
                      size="sm"
                    >
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancelSchedule}
                      variant="outline"
                      className="flex-1 border-zinc-700 text-gray-300 text-xs h-7"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <span className="text-white">
                  {format(new Date(event.start_time), 'dd/MM/yyyy HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
                </span>
              )}
            </div>
            {!editingSchedule && (
              <button
                onClick={() => setEditingSchedule(true)}
                className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                title="Editar horario"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>

          {/* Botones de acción - Minimalistas */}
          <div className="flex gap-2 pt-2">
            {/* Botón Meet - Siempre visible */}
            {hasValidMeet ? (
              <Button
                onClick={() => window.open(event.meet_link, '_blank')}
                className="flex-1 bg-[#FF7939] hover:bg-[#FF7939]/80 text-white text-xs h-8"
                size="sm"
              >
                <Video className="h-3.5 w-3.5 mr-1.5" />
                Meet
              </Button>
            ) : (
              <Button
                onClick={handleCreateMeet}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                size="sm"
              >
                <Video className="h-3.5 w-3.5 mr-1.5" />
                Crear Meet
              </Button>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
