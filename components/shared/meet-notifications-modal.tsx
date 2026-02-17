'use client'

import { Bell, X } from 'lucide-react'
import { useMeetNotificationsLogic, Role } from './hooks/useMeetNotificationsLogic'
import { NotificationItemView } from './components/NotificationItemView'

interface MeetNotificationsModalProps {
  open: boolean
  onClose: () => void
  role: Role
  supabase: any
  userId: string
  coachId?: string | null
  onOpenMeet: (eventId: string) => void
}

export function MeetNotificationsModal({
  open,
  onClose,
  role,
  supabase,
  userId,
  coachId,
  onOpenMeet,
}: MeetNotificationsModalProps) {
  const {
    loading,
    error,
    filteredItems,
    filter,
    setFilter,
    actingId,
    updateRsvp,
    respondToReschedule,
    describe
  } = useMeetNotificationsLogic({
    open,
    role,
    supabase,
    userId,
    coachId
  })

  if (!open) return null

  const title = role === 'coach' ? 'Notificaciones de meets' : 'Notificaciones'

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col max-h-[85vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#FF7939]" />
            <div className="text-white font-semibold">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl w-fit">
          {(['all', 'pending', 'accepted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${filter === f
                  ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Aceptadas'}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-50">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF7939] mb-3"></div>
              <div className="text-sm text-white/70">Cargando notificaciones…</div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-300 py-8 text-center bg-red-500/5 rounded-xl border border-red-500/10">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-white/5 mb-3" />
              <div className="text-sm text-white/40 italic">No hay notificaciones que coincidan</div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((it) => (
                <NotificationItemView
                  key={it.id}
                  item={it}
                  role={role}
                  userId={userId}
                  actingId={actingId}
                  onOpenMeet={onOpenMeet}
                  onUpdateRsvp={updateRsvp}
                  onRespondToReschedule={respondToReschedule}
                  describe={describe}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
