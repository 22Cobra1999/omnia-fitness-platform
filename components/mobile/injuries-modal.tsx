"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Trash2 } from "lucide-react"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { MUSCLE_GROUPS, PAIN_LEVELS, getAllMuscles, getMuscleById, getPainLevel, type StandardizedInjury } from '@/lib/data/muscle-system'

interface Injury {
  id: string
  name: string
  severity: 'low' | 'medium' | 'high'
  description?: string
  restrictions?: string
  // Nuevos campos estandarizados
  muscleId?: string
  muscleName?: string
  muscleGroup?: string
  painLevel?: number
  painDescription?: string
  injuryType?: string
}

interface InjuriesModalProps {
  isOpen: boolean
  onClose: () => void
  injuries: Injury[]
  onSave: (injuries: Injury[]) => void
}

const InjuriesModal = ({ isOpen, onClose, injuries, onSave }: InjuriesModalProps) => {
  const [localInjuries, setLocalInjuries] = useState<Injury[]>([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [injuryToDelete, setInjuryToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (injuries && injuries.length > 0) {
        const mappedInjuries = injuries.map(injury => {
          let foundMuscle = null
          for (const group of MUSCLE_GROUPS) {
            for (const muscle of group.muscles) {
              if (muscle.name.toLowerCase() === injury.name.toLowerCase()) {
                foundMuscle = muscle
                break
              }
            }
            if (foundMuscle) break
          }

          return {
            id: injury.id,
            name: injury.name,
            severity: injury.severity,
            description: injury.description,
            restrictions: injury.restrictions,
            muscleId: foundMuscle?.id || '',
            muscleName: foundMuscle?.name || injury.name,
            muscleGroup: foundMuscle ? MUSCLE_GROUPS.find(g => g.id === foundMuscle.groupId)?.name || '' : '',
            painLevel: injury.severity === 'low' ? 1 : injury.severity === 'medium' ? 2 : 3,
            painDescription: injury.severity === 'low' ? 'Molestia leve' :
              injury.severity === 'medium' ? 'Dolor moderado' :
                'Dolor fuerte'
          }
        })
        setLocalInjuries(mappedInjuries)
      } else {
        setLocalInjuries([])
      }
    }
  }, [isOpen, injuries])

  const addInjury = () => {
    const newInjury: Injury = {
      id: `temp_${Date.now()}`,
      name: '',
      severity: 'low',
      muscleId: '',
      painLevel: 1,
      description: ''
    }
    setLocalInjuries([...localInjuries, newInjury])
  }

  const updateInjury = (id: string, field: keyof Injury, value: string | number) => {
    setLocalInjuries(localInjuries.map(injury => {
      if (injury.id === id) {
        const updated = { ...injury, [field]: value }

        if (field === 'muscleId' && typeof value === 'string') {
          const muscle = getMuscleById(value)
          if (muscle) {
            updated.muscleName = muscle.name
            updated.name = muscle.name
            const group = MUSCLE_GROUPS.find(g => g.id === muscle.groupId)
            updated.muscleGroup = group?.name
          }
        }

        if (field === 'painLevel' && typeof value === 'number') {
          const pain = getPainLevel(value)
          updated.painDescription = pain?.description
          if (value === 1) updated.severity = 'low'
          else if (value === 2) updated.severity = 'medium'
          else if (value === 3) updated.severity = 'high'
        }

        return updated
      }
      return injury
    }))
  }

  const removeInjury = (id: string) => {
    setInjuryToDelete(id)
    setShowDeleteConfirmation(true)
  }

  const confirmDelete = () => {
    if (injuryToDelete) {
      setLocalInjuries(localInjuries.filter(injury => injury.id !== injuryToDelete))
      setInjuryToDelete(null)
    }
    setShowDeleteConfirmation(false)
  }

  const handleSave = () => {
    const validInjuries = localInjuries.filter(injury => {
      if (injury.id && !injury.id.toString().startsWith('temp_')) return true
      return injury.muscleId && injury.muscleId.trim() !== '' && injury.painLevel
    }).map(injury => ({
      id: injury.id,
      name: injury.muscleName || injury.name || 'Lesión',
      severity: injury.severity || 'low',
      description: injury.description || undefined,
      restrictions: injury.restrictions || undefined,
      muscleId: injury.muscleId,
      muscleName: injury.muscleName,
      muscleGroup: injury.muscleGroup,
      painLevel: injury.painLevel,
      painDescription: injury.painDescription
    }))

    onSave(validInjuries)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1C1F] rounded-3xl w-full max-w-[350px] max-h-[85vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Lesiones</h3>
            <span className="px-1.5 py-0.5 rounded-full bg-[#FF6A00]/10 text-[#FF6A00] text-[9px] font-bold uppercase tracking-wider">
              {localInjuries.length}
            </span>
          </div>

        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto overflow-x-hidden flex-1 space-y-3 custom-scrollbar">
          {localInjuries.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-white text-sm font-medium mb-1">Sin lesiones</p>
              <button
                onClick={addInjury}
                className="text-xs text-[#FF6A00] hover:underline mt-1"
              >
                Agregar primera lesión
              </button>
            </div>
          ) : (
            localInjuries.map((injury, index) => (
              <div key={injury.id} className="group relative bg-[#0F1012] hover:bg-white/[0.02] rounded-xl p-3 transition-all border border-white/5 hover:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] font-bold text-[10px]">
                      {index + 1}
                    </div>
                  </div>
                  <button
                    onClick={() => removeInjury(injury.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Zona</label>
                    <Select
                      value={injury.muscleId || ''}
                      onValueChange={(value) => updateInjury(injury.id, 'muscleId', value)}
                    >
                      <SelectTrigger className="w-full bg-[#1A1C1F] border-white/10 rounded-lg px-3 h-9 text-xs text-white focus:ring-[#FF6A00]/50 focus:border-[#FF6A00]/50">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1C1F] border-white/10 text-white rounded-xl max-h-[250px] z-[100]">
                        {MUSCLE_GROUPS.map(group => (
                          <SelectGroup key={group.id}>
                            <SelectLabel className="text-[#FF6A00] pl-2 text-[10px] uppercase tracking-wider font-bold bg-white/5 py-1.5">{group.name}</SelectLabel>
                            {group.muscles.map(muscle => (
                              <SelectItem key={muscle.id} value={muscle.id} className="text-white hover:bg-white/10 cursor-pointer pl-4 text-xs">
                                {muscle.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Dolor</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => updateInjury(injury.id, 'painLevel', level)}
                          className={`h-8 rounded-lg text-[10px] font-medium transition-all ${injury.painLevel === level
                            ? level === 1
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : level === 2
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                : 'bg-red-500/20 text-red-400 border border-red-500/50'
                            : 'bg-[#1A1C1F] text-gray-400 border border-white/5 hover:border-white/20'
                            }`}
                        >
                          {level === 1 ? 'Leve' : level === 2 ? 'Mod.' : 'Sev.'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      value={injury.description || ''}
                      onChange={(e) => updateInjury(injury.id, 'description', e.target.value)}
                      placeholder="Detalles..."
                      className="w-full bg-[#1A1C1F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00]/50 focus:ring-1 focus:ring-[#FF6A00]/50 min-h-[50px] resize-none"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-white/5 flex flex-col gap-2 shrink-0">
          {localInjuries.length > 0 && (
            <button
              onClick={addInjury}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-400 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Otra lesión
            </button>
          )}

          <Button
            onClick={handleSave}
            className="w-full h-10 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white font-semibold text-sm shadow-lg shadow-[#FF6A00]/20"
          >
            Guardar cambios
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Eliminar lesión"
        description="¿Seguro que deseas eliminarla?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
}

export default InjuriesModal