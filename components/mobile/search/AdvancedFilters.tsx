"use client"

import React from 'react'
import { Filter, X, ChevronDown, Check } from 'lucide-react'

interface AdvancedFiltersProps {
    showFilters: boolean
    setShowFilters: (show: boolean) => void
    selectedModality: string
    setSelectedModality: (val: string) => void
    selectedSportDiet: string
    setSelectedSportDiet: (val: string) => void
    selectedDuration: string
    setSelectedDuration: (val: string) => void
    selectedObjectives: string[]
    setSelectedObjectives: (val: string[]) => void
    category: string
}

export function AdvancedFilters({
    showFilters,
    setShowFilters,
    selectedModality,
    setSelectedModality,
    selectedSportDiet,
    setSelectedSportDiet,
    selectedDuration,
    setSelectedDuration,
    selectedObjectives,
    setSelectedObjectives,
    category
}: AdvancedFiltersProps) {
    const modalities = [
        { id: 'all', label: 'Cualquiera' },
        { id: 'programa', label: 'Programas' },
        { id: 'taller', label: 'Talleres' },
        { id: 'doc', label: 'Documentos' },
    ]

    const objectives = [
        "Masa muscular", "Pérdida de peso", "Definición", "Resistencia", "Flexibilidad", "Salud mental"
    ]

    const sportDiets = category === 'nutricion'
        ? ["Keto", "Paleo", "Vegana", "Mediterránea", "Balanceada"]
        : ["Gym", "Fútbol", "Running", "Crossfit", "Yoga", "Natación"]

    const toggleObjective = (obj: string) => {
        if (selectedObjectives.includes(obj)) {
            setSelectedObjectives(selectedObjectives.filter(o => o !== obj))
        } else {
            setSelectedObjectives([...selectedObjectives, obj])
        }
    }

    return (
        <div className="mb-8">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-[#1A1C1F] px-4 py-2 rounded-xl border border-white/5"
            >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtros avanzados</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
                <div className="mt-4 p-5 bg-[#1A1C1F] rounded-2xl border border-white/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Modalidad */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Modalidad</p>
                        <div className="flex flex-wrap gap-2">
                            {modalities.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedModality(m.id)}
                                    className={`px-4 py-2 rounded-xl text-sm transition-all ${selectedModality === m.id
                                            ? 'bg-[#FF7939] text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Objetivos */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Objetivos</p>
                        <div className="flex flex-wrap gap-2">
                            {objectives.map(obj => {
                                const isSelected = selectedObjectives.includes(obj)
                                return (
                                    <button
                                        key={obj}
                                        onClick={() => toggleObjective(obj)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${isSelected
                                                ? 'bg-white/10 text-white border border-[#FF7939]'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                                            }`}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-[#FF7939]" />}
                                        {obj}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Deporte / Dieta */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                            {category === 'nutricion' ? 'Tipo de Dieta' : 'Deporte / Estilo'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedSportDiet('all')}
                                className={`px-4 py-2 rounded-xl text-sm transition-all ${selectedSportDiet === 'all' ? 'bg-[#FF7939] text-white' : 'bg-white/5 text-gray-400'
                                    }`}
                            >
                                Cualquiera
                            </button>
                            {sportDiets.map(item => (
                                <button
                                    key={item}
                                    onClick={() => setSelectedSportDiet(item)}
                                    className={`px-4 py-2 rounded-xl text-sm transition-all ${selectedSportDiet === item ? 'bg-[#FF7939] text-white' : 'bg-white/5 text-gray-400'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={() => {
                            setSelectedModality('all')
                            setSelectedSportDiet('all')
                            setSelectedObjectives([])
                            setSelectedDuration('all')
                        }}
                        className="w-full py-3 text-sm font-bold text-[#FF7939] bg-[#FF7939]/5 rounded-xl hover:bg-[#FF7939]/10 transition-colors"
                    >
                        Limpiar todos los filtros
                    </button>
                </div>
            )}
        </div>
    )
}
