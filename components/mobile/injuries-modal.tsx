"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Trash2 } from "lucide-react"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { MUSCLE_GROUPS, PAIN_LEVELS, getAllMuscles, getMuscleById, getPainLevel, type StandardizedInjury } from "@/lib/muscle-system"

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
      
      // Si hay lesiones existentes, cargarlas y mapear al formato del modal
      if (injuries && injuries.length > 0) {
        const mappedInjuries = injuries.map(injury => {
          
          // Buscar el músculo que coincida con el nombre de la lesión
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
          if (!foundMuscle) {
          }
          
          return {
            id: injury.id, // ID real de la BD
            name: injury.name,
            severity: injury.severity,
            description: injury.description,
            restrictions: injury.restrictions,
            // Mapear el músculo encontrado o usar valores por defecto
            muscleId: foundMuscle?.id || '',
            muscleName: foundMuscle?.name || injury.name,
            muscleGroup: foundMuscle ? MUSCLE_GROUPS.find(g => g.id === foundMuscle.groupId)?.name || '' : '',
            painLevel: injury.severity === 'low' ? 1 : injury.severity === 'medium' ? 2 : 3,
            painDescription: injury.severity === 'low' ? 'Molestia leve, no interfiere con actividades' : 
                           injury.severity === 'medium' ? 'Dolor moderado, interfiere con algunas actividades' : 
                           'Dolor fuerte, limita actividades diarias'
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
      id: `temp_${Date.now()}`, // ID temporal para nuevas lesiones
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
        
        // Si se cambia el músculo, actualizar información relacionada
        if (field === 'muscleId' && typeof value === 'string') {
          const muscle = getMuscleById(value)
          if (muscle) {
            updated.muscleName = muscle.name
            updated.name = muscle.name // Usar para la columna 'name' existente
            const group = MUSCLE_GROUPS.find(g => g.id === muscle.groupId)
            updated.muscleGroup = group?.name
          }
        }
        
        // Si se cambia el nivel de dolor, actualizar severidad y descripción
        if (field === 'painLevel' && typeof value === 'number') {
          const pain = getPainLevel(value)
          updated.painDescription = pain?.description
          
          // Mapear nivel de dolor a severidad existente
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
    // Para lesiones existentes (con ID real), mantenerlas aunque no tengan muscleId
    // Para lesiones nuevas (con ID temporal), solo guardar las válidas
    const validInjuries = localInjuries.filter(injury => {
      // Si es una lesión existente (ID real), mantenerla
      if (injury.id && !injury.id.toString().startsWith('temp_')) {
        return true
      }
      // Si es una lesión nueva (ID temporal), solo si es válida
      return injury.muscleId && injury.muscleId.trim() !== '' && injury.painLevel
    }).map(injury => ({
      id: injury.id,
      name: injury.muscleName || injury.name || 'Lesión',
      severity: injury.severity || 'low',
      description: injury.description || null,
      restrictions: injury.restrictions || null,
      // Campos adicionales para el frontend
      muscleId: injury.muscleId,
      muscleName: injury.muscleName,
      muscleGroup: injury.muscleGroup,
      painLevel: injury.painLevel,
      painDescription: injury.painDescription
    }))
    
    onSave(validInjuries)
    onClose()
  }

  const handleClose = () => {
    // Para lesiones existentes (con ID real), mantenerlas aunque no tengan muscleId
    // Para lesiones nuevas (con ID temporal), solo guardar las válidas
    const validInjuries = localInjuries.filter(injury => {
      // Si es una lesión existente (ID real), mantenerla
      if (injury.id && !injury.id.toString().startsWith('temp_')) {
        return true
      }
      // Si es una lesión nueva (ID temporal), solo si es válida
      return injury.muscleId && injury.muscleId.trim() !== '' && injury.painLevel
    }).map(injury => ({
      id: injury.id,
      name: injury.muscleName || injury.name || 'Lesión',
      severity: injury.severity || 'low',
      description: injury.description || null,
      restrictions: injury.restrictions || null,
      // Campos adicionales para el frontend
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
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1A1C1F] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Lesiones</h3>
                <p className="text-xs text-gray-400 mt-1">Se guarda automáticamente al cerrar</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              {localInjuries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No hay lesiones registradas</p>
                  <p className="text-sm text-gray-500">Haz clic en "Agregar lesión" para empezar</p>
                </div>
              ) : (
                localInjuries.map((injury, index) => (
             <div key={injury.id} className="p-4 bg-gray-800/50 rounded-xl space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-400">Lesión {index + 1}</span>
                   {injury.id && !injury.id.toString().startsWith('temp_') && (
                     <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                       Existente
                     </span>
                   )}
                   {injury.id && injury.id.toString().startsWith('temp_') && (
                     <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">
                       Nueva
                     </span>
                   )}
                 </div>
                 <button
                   onClick={() => removeInjury(injury.id)}
                   className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                 >
                   <Trash2 className="w-4 h-4 text-red-400" />
                 </button>
               </div>
                  
                  <div className="space-y-3">
                    {/* Selección de músculo - Simple */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Músculo</label>
                      <select
                        value={injury.muscleId || ''}
                        onChange={(e) => updateInjury(injury.id, 'muscleId', e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      >
                        <option value="">Seleccionar músculo...</option>
                        {MUSCLE_GROUPS.map(group => (
                          <optgroup key={group.id} label={group.name}>
                            {group.muscles.map(muscle => (
                              <option key={muscle.id} value={muscle.id}>
                                {muscle.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Nivel de dolor - Simple */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Intensidad del dolor</label>
                      <select
                        value={injury.painLevel || ''}
                        onChange={(e) => updateInjury(injury.id, 'painLevel', parseInt(e.target.value))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      >
                        <option value="">Seleccionar intensidad...</option>
                        {PAIN_LEVELS.map(pain => (
                          <option key={pain.level} value={pain.level}>
                            {pain.level} - {pain.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Descripción</label>
                    <textarea
                      value={injury.description || ''}
                      onChange={(e) => updateInjury(injury.id, 'description', e.target.value)}
                      placeholder="Describe la lesión o molestia..."
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                ))
              )}

              <button
                onClick={addInjury}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar lesión</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white"
            >
              Guardar y Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Eliminar lesión"
        message="¿Estás seguro de que quieres eliminar esta lesión?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  )
}

export default InjuriesModal