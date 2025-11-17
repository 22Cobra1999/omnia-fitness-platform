"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Edit, Flame } from "lucide-react"

interface ClientProfileCardProps {
  client: any
  onClientSelect: (client: any) => void
  isSelected: boolean
}

export function ClientProfileCard({ client, onClientSelect, isSelected }: ClientProfileCardProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(client.notes || "")

  const getProgressColor = (progress: number) => {
    if (progress > 75) return "bg-green-500"
    if (progress > 50) return "bg-yellow-500"
    return "bg-[#FF7939]"
  }

  // Extraer datos del usuario del cliente
  const user = client.users || {}
  const fullName =
    user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email?.split("@")[0] || "Cliente"

  // Obtener iniciales para el avatar
  const initials = fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <Card
      className={`bg-[#1A1A1A] border-none rounded-2xl overflow-hidden p-4 cursor-pointer transition-all hover:bg-[#222222] ${isSelected ? "ring-2 ring-[#FF7939]" : ""}`}
      onClick={() => onClientSelect(client)}
    >
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-[#FF7939] hover:text-[#FF7939]/80 hover:bg-[#333]"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditingNotes(!isEditingNotes)
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-[#333]">
            <AvatarImage src={user.avatar_url || undefined} alt={fullName} />
            <AvatarFallback className="bg-[#FF7939]/10 text-[#FF7939] text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2 leading-tight">
              {fullName}
              {client.engagement === "active" && <Flame className="h-5 w-5 text-[#FF7939]" />}
            </h2>
            <p className="text-xs text-gray-400">
              {client.engagement === "active" ? "Activo" : client.engagement === "at risk" ? "En riesgo" : "Inactivo"}
              {client.lastActive ? ` · Última actividad: ${client.lastActive}` : ""}
            </p>
          </div>
        </div>

        {/* Progreso compacto + contadores */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Progreso</span>
            {(() => {
              const completed = client.completedExercises || 0
              const total = client.totalExercises || 0
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0 // Removido client.progress ya que no existe
              return (
                <span className="text-xs font-medium text-[#FF7939]">
                  {completed}/{total} ({percent}%)
                </span>
              )
            })()}
          </div>
          <Progress
            value={(client.totalExercises || 0) > 0 ? Math.round(((client.completedExercises || 0) / (client.totalExercises || 0)) * 100) : 0}
            className="h-1.5 bg-[#333]"
            indicatorClassName={getProgressColor(((client.totalExercises || 0) > 0 ? Math.round(((client.completedExercises || 0) / (client.totalExercises || 0)) * 100) : 0))}
          />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Actividades: {Array.isArray(client.activities) ? client.activities.length : (client.activitiesCount || 0)}</span>
            <span>Todos: {client.todoCount || 0}</span>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-[#FF7939] text-sm">Notas:</h3>
          {isEditingNotes ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#222] border-[#333] min-h-[80px] text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm text-gray-300 overflow-hidden" 
               style={{
                 display: '-webkit-box',
                 WebkitLineClamp: 2,
                 WebkitBoxOrient: 'vertical',
                 lineHeight: '1.2em',
                 height: '2.4em'
               }}>{notes}</p>
          )}
        </div>

        {isEditingNotes && (
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-[#FF7939] hover:bg-[#FF7939]/80"
              onClick={(e) => {
                e.stopPropagation()
                // Aquí guardaríamos las notas en la base de datos
                setIsEditingNotes(false)
              }}
            >
              Guardar
            </Button>
          </div>
        )}

        <div className="flex justify-between mt-1">
          <Badge
            className={`${
              client.engagement === "active"
                ? "bg-green-500/20 text-green-500"
                : client.engagement === "at risk"
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "bg-red-500/20 text-red-500"
            } border-none`}
          >
            {(() => {
              const completed = client.completedExercises || 0
              const total = client.totalExercises || 0
              const percent = total > 0 ? Math.round((completed / total) * 100) : (client.progress || 0 || 0)
              return `Progreso: ${completed}/${total} (${percent}%)`
            })()}
          </Badge>
          <Badge className="bg-[#FF7939]/20 text-[#FF7939] border-none">
            {Array.isArray(client.activities) ? `Act.: ${client.activities.length}` : `Act.: ${client.activitiesCount || 0}`}
          </Badge>
        </div>

        {/* Acción para ver detalle */}
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="outline" className="h-8 px-3 bg-[#222] border-[#333] text-xs" onClick={(e) => { e.stopPropagation(); onClientSelect(client) }}>
            Ver detalle
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
