import React from 'react'
import { FitnessExerciseDetail } from '@/hooks/shared/use-fitness-exercise-details'
import { parseSeriesString, formatSeriesForDisplay, calculateTotalReps, calculateAverageWeight } from '@/lib/data/csv-parser'

interface FitnessExerciseDetailCardProps {
  detail: FitnessExerciseDetail
  onEdit?: (detail: FitnessExerciseDetail) => void
  onDelete?: (id: string) => void
  isEditable?: boolean
}

export function FitnessExerciseDetailCard({
  detail,
  onEdit,
  onDelete,
  isEditable = false
}: FitnessExerciseDetailCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 mb-3 w-full overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="exercise-title text-white mb-2">
            {detail.nombre_actividad || 'Ejercicio'}
          </h4>

          {detail.descripción && (
            <p className="exercise-subtitle text-white/70 mb-3">
              {detail.descripción}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {detail.duracion_min && (
              <div className="glass-badge px-3 py-2 rounded-lg">
                <div className="text-xs text-white/60">Duración</div>
                <div className="exercise-meta text-white">{detail.duracion_min} min</div>
              </div>
            )}

            {detail.one_rm && (
              <div className="glass-badge px-3 py-2 rounded-lg">
                <div className="text-xs text-white/60">1RM</div>
                <div className="exercise-meta text-white">{detail.one_rm} kg</div>
              </div>
            )}

            {detail.tipo_ejercicio && (
              <div className="glass-badge px-3 py-2 rounded-lg">
                <div className="text-xs text-white/60">Tipo</div>
                <div className="exercise-meta text-white">{detail.tipo_ejercicio}</div>
              </div>
            )}

            {detail.nivel_intensidad && (
              <div className="glass-badge px-3 py-2 rounded-lg">
                <div className="text-xs text-white/60">Intensidad</div>
                <div className="exercise-meta text-white">{detail.nivel_intensidad}</div>
              </div>
            )}

            {detail.equipo_necesario && (
              <div className="glass-badge px-3 py-2 rounded-lg">
                <div className="text-xs text-white/60">Equipo</div>
                <div className="exercise-meta text-white">{detail.equipo_necesario}</div>
              </div>
            )}
          </div>

          {/* Mostrar series individuales */}
          {detail.detalle_series && detail.detalle_series.trim() !== '' && (
            <div className="mt-4">
              <h5 className="exercise-subtitle text-white/80 mb-2">Series del Ejercicio:</h5>
              {(() => {
                const series = parseSeriesString(detail.detalle_series)
                return (
                  <>
                    <div className="space-y-2">
                      {series.map((serie, index) => (
                        <div key={index} className="glass-badge px-3 py-2 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/60">Serie {index + 1}</span>
                            <span className="text-xs text-white/50">
                              60s descanso
                            </span>
                          </div>
                          <div className="exercise-meta text-white mt-1">
                            {serie.peso}kg × {serie.repeticiones} reps × {serie.series} series
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumen de series */}
                    <div className="mt-3 p-3 glass-badge rounded-lg">
                      <div className="text-xs text-white/60 mb-1">Resumen:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-white/80">
                        <div>Total Reps: {calculateTotalReps(series)}</div>
                        <div>Peso Prom: {calculateAverageWeight(series)}kg</div>
                        <div>Series: {series.length}</div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          <div className="mt-3 text-xs text-white/50">
            Semana {detail.semana}, Día {detail.día}
          </div>
        </div>

        {isEditable && (
          <div className="flex gap-2 ml-4">
            {onEdit && (
              <button
                onClick={() => onEdit(detail)}
                className="glass-badge px-3 py-1 rounded-lg text-xs text-white hover:bg-white/20 smooth-transition"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(detail.id)}
                className="glass-badge px-3 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/20 smooth-transition"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FitnessExerciseDetailCard




