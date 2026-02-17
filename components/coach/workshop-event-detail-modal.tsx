'use client'

import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Clock, Video, FileText, Upload, Users, Trash2, Lock, Eye, RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useWorkshopDetailLogic } from './hooks/useWorkshopDetailLogic'

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: 'workshop' | 'consultation' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  meet_link?: string
  meet_link_id?: string
  google_event_id?: string
  activity_id?: number
  description?: string
  notes?: string
  max_participants?: number
  current_participants?: number
}

interface WorkshopEventDetailModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function WorkshopEventDetailModal({ event, isOpen, onClose, onUpdate }: WorkshopEventDetailModalProps) {
  const {
    loading,
    editingDate,
    setEditingDate,
    editingTime,
    setEditingTime,
    editingDescription,
    setEditingDescription,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    description,
    setDescription,
    pdfUrl,
    pdfFileName,
    participants,
    showDeletePdfDialog,
    setShowDeletePdfDialog,
    deletingPdf,
    showPdfViewer,
    setShowPdfViewer,
    handleSaveChanges,
    handleDeletePdf,
    handleJoinMeeting,
    handleViewPdf,
    getPdfViewerUrl,
    handleClose,
    topicName,
    workshopName,
    formattedDate,
    formattedTime,
    isEventPast
  } = useWorkshopDetailLogic({ event, isOpen, onClose, onUpdate })

  if (!event || !isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl transition-transform max-h-[85vh] flex flex-col"
        style={{ backgroundColor: '#111111' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-lg transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>

        <div className="flex-1 overflow-y-auto p-4 px-5 pb-24">
          <div className="space-y-4">
            {/* Título y subtítulo */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-0.5 leading-tight">
                    {topicName}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {workshopName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-black">
                  <Users className="h-3 w-3" />
                  Taller
                </span>
                {(event.max_participants || 0) > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-gray-300">
                    <Users className="h-3 w-3" />
                    Grupal
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF7939] text-black">
                  <Globe className="h-3 w-3" />
                  Online
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-white">
                  <Users className="h-3 w-3" />
                  {participants.length}/{event.max_participants || 10}
                </span>
              </div>
            </div>

            {/* Fecha y Horario Compacto */}
            <div>
              {/* Modo Edición (Solo si no es pasado) */}
              {(!isEventPast && (editingDate || editingTime)) ? (
                <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  {/* Date Editor */}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800 h-8 text-xs",
                            !selectedDate && "text-gray-400"
                          )}
                        >
                          {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                        <div className="p-3">
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 35 }, (_, i) => {
                              const date = new Date(selectedDate || new Date())
                              const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
                              const startDate = new Date(firstDay); startDate.setDate(startDate.getDate() - startDate.getDay())
                              const currentDate = new Date(startDate); currentDate.setDate(startDate.getDate() + i)
                              const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString()
                              return (
                                <button
                                  key={i}
                                  onClick={() => { setSelectedDate(new Date(currentDate)); }}
                                  className={cn("h-7 w-7 rounded-md text-xs", isSelected && "bg-[#FF7939] text-black font-bold", !isSelected && "text-gray-400 hover:text-white")}
                                >
                                  {currentDate.getDate()}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Time Editor */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 h-8 bg-zinc-950 border-zinc-700 text-white text-xs" />
                    <span className="text-gray-500">-</span>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 h-8 bg-zinc-950 border-zinc-700 text-white text-xs" />
                  </div>
                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm" variant="ghost" className="h-6 text-xs text-gray-400 hover:text-white"
                      onClick={() => {
                        setEditingDate(false); setEditingTime(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Modo Visualización (Pasado o Presente no editando) */
                <div
                  className={cn(
                    "flex items-center justify-between py-1 transition-colors rounded-lg",
                    !isEventPast && "cursor-pointer hover:bg-zinc-900/40 -mx-2 px-2"
                  )}
                  onClick={() => { if (!isEventPast) { setEditingDate(true); setEditingTime(true); } }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[#FF7939]">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white leading-tight">
                        {formattedDate || 'Sin fecha'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formattedTime || 'Sin horario'}
                      </span>
                    </div>
                  </div>
                  {!isEventPast && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-white">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Descripción del tema */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Descripcióm
              </label>
              {editingDescription && !isEventPast ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="En esta sesión trabajaremos articulaciones..."
                    className="bg-zinc-900 border-zinc-700 text-white text-sm min-h-[100px] resize-none focus-visible:ring-[#FF7939]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setEditingDescription(false)
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white h-8"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`min-h-[20px] transition-colors ${!isEventPast
                    ? 'cursor-pointer p-3 -mx-3 rounded-lg hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800'
                    : ''
                    }`}
                  onClick={() => !isEventPast && setEditingDescription(true)}
                >
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {description || 'Sin descripción'}
                  </p>
                </div>
              )}
            </div>

            {/* Botón Unirse a la reunión */}
            <Button
              onClick={handleJoinMeeting}
              disabled={!event.meet_link}
              className="w-full h-7 text-[10px] font-bold rounded-lg uppercase tracking-wider"
              style={{ backgroundColor: '#FF7939', color: '#000' }}
            >
              <Globe className="h-2.5 w-2.5 mr-1" />
              Unirse a la reunión
            </Button>

            {/* Sección PDF adjunto (Vista Compacta) */}
            <div>
              {pdfFileName && pdfUrl && (
                <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-[#FF7939]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3.5 w-3.5 text-[#FF7939]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-white truncate max-w-[150px]" title={pdfFileName}>{pdfFileName}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-tight">Documento</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleViewPdf}
                    size="sm" variant="ghost"
                    className="h-7 px-2 text-[#FF7939] hover:bg-[#FF7939]/10 flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase">Ver PDF</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Diálogo de confirmación para eliminar PDF */}
            <AlertDialog open={showDeletePdfDialog} onOpenChange={setShowDeletePdfDialog}>
              <AlertDialogContent className="bg-[#111111] border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Eliminar PDF</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    ¿Estás seguro de que deseas eliminar el archivo "{pdfFileName}"? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700"
                    disabled={deletingPdf}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePdf}
                    disabled={deletingPdf}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deletingPdf ? 'Eliminando...' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {showPdfViewer && pdfUrl && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
                onClick={() => setShowPdfViewer(false)}
              >
                <div
                  className="relative w-full h-full max-w-6xl max-h-[95vh] m-4 bg-[#111111] rounded-lg border border-zinc-800 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#FF7939]" />
                      <h3 className="text-white font-semibold truncate">{pdfFileName}</h3>
                    </div>
                    <button
                      onClick={() => setShowPdfViewer(false)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={getPdfViewerUrl(pdfUrl as string)}
                      className="w-full h-full border-0"
                      title={pdfFileName || 'PDF'}
                      style={{
                        pointerEvents: 'auto'
                      }}
                    />
                  </div>

                  <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                    <p className="text-xs text-gray-400 text-center">
                      Este documento es solo para visualización
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sección Participantes */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-white">
                Participantes ({participants.filter((p: any) => !p.isCoach).length})
              </h3>
              {participants.some((p: any) => !p.isCoach) ? (
                <ul className="space-y-1.5">
                  {participants
                    .filter((p: any) => !p.isCoach)
                    .map((participant: any, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-[#FF7939]">•</span>
                        <span>{participant.name}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="py-2">
                  <p className="text-sm text-gray-500 font-medium italic">No hay participantes registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón Guardar cambios - Flotante */}
        {!isEventPast && (
          <div className="absolute bottom-12 right-6 z-20">
            <Button
              onClick={handleSaveChanges}
              disabled={loading}
              className="h-9 px-5 font-medium rounded-full shadow-lg"
              style={{ backgroundColor: '#FF7939', color: '#000' }}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

