import React from "react"
import { Dumbbell, ChefHat, X } from "lucide-react"

interface SearchFiltersProps {
    selectedCategory: string
    setSelectedCategory: (cat: string) => void
    selectedModality: string
    setSelectedModality: (mod: string) => void
    selectedWorkshopType: string
    setSelectedWorkshopType: (type: string) => void
    selectedSportDiet: string
    setSelectedSportDiet: (val: string) => void
    selectedDuration: string
    setSelectedDuration: (val: string) => void
    selectedObjectives: string[]
    setSelectedObjectives: (updater: (prev: string[]) => string[]) => void
    DIETS: string[]
    SPORTS: string[]
    COMMON_OBJECTIVES: string[]
    DURATIONS: Array<{ label: string; value: string }>
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
    selectedCategory,
    setSelectedCategory,
    selectedModality,
    setSelectedModality,
    selectedWorkshopType,
    setSelectedWorkshopType,
    selectedSportDiet,
    setSelectedSportDiet,
    selectedDuration,
    setSelectedDuration,
    selectedObjectives,
    setSelectedObjectives,
    DIETS,
    SPORTS,
    COMMON_OBJECTIVES,
    DURATIONS,
}) => {
    return (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 px-4">
            {/* Paso 1: Fitness / Nutrición */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-3 h-3" /> },
                    { id: 'nutricion', label: 'Nutrición', icon: <ChefHat className="w-3 h-3" /> }
                ].map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold transition-all whitespace-nowrap ${selectedCategory === cat.id
                            ? 'bg-[#FF7939] border-[#FF7939] text-white'
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                    >
                        {cat.icon}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Paso 2: Modality (Doc / Taller / Program) - Only if category selected */}
            {selectedCategory !== 'all' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 animate-in slide-in-from-left-2 duration-200">
                    {[
                        { id: 'doc', label: 'Documento' },
                        { id: 'taller', label: 'Taller' },
                        { id: 'programa', label: 'Programa' }
                    ].map(mod => (
                        <button
                            key={mod.id}
                            onClick={() => setSelectedModality(mod.id)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all whitespace-nowrap ${selectedModality === mod.id
                                ? 'bg-white/20 border-white/30 text-white'
                                : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                                }`}
                        >
                            {mod.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Paso 3: Workshop Subtype - Only if Taller selected */}
            {selectedModality === 'taller' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 animate-in slide-in-from-left-2 duration-200">
                    {[
                        { id: 'grupal', label: 'Grupal' },
                        { id: 'individual', label: 'Individual' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedWorkshopType(type.id)}
                            className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${selectedWorkshopType === type.id
                                ? 'bg-[#FF7939]/30 border-[#FF7939] text-[#FF7939]'
                                : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Paso 4: Deporte / Dieta / Objetivos / Tiempo (Dropdowns row) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                <select
                    value={selectedSportDiet}
                    onChange={(e) => setSelectedSportDiet(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/50 focus:outline-none appearance-none"
                >
                    <option value="all" className="bg-[#121212]">{selectedCategory === 'nutricion' ? 'Dieta/Tipo' : 'Deporte/Tipo'}</option>
                    {(selectedCategory === 'nutricion' ? DIETS : SPORTS).map(item => (
                        <option key={item} value={item} className="bg-[#121212]">{item}</option>
                    ))}
                </select>

                <select
                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/50 focus:outline-none appearance-none"
                    onChange={(e) => {
                        const val = e.target.value
                        if (val !== "all") {
                            setSelectedObjectives(prev => prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val])
                        }
                        e.target.value = "all"
                    }}
                >
                    <option value="all" className="bg-[#121212]">Objetivo</option>
                    {COMMON_OBJECTIVES.map(obj => (
                        <option key={obj} value={obj} className="bg-[#121212]">{obj}</option>
                    ))}
                </select>

                <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/50 focus:outline-none appearance-none"
                >
                    <option value="all" className="bg-[#121212]">Duración</option>
                    {DURATIONS.map(d => (
                        <option key={d.value} value={d.value} className="bg-[#121212]">{d.label}</option>
                    ))}
                </select>
            </div>

            {selectedObjectives.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedObjectives.map(obj => (
                        <span key={obj} className="flex items-center gap-1 bg-[#FF7939]/10 border border-[#FF7939]/20 px-2 py-0.5 rounded-lg text-[9px] font-bold text-[#FF7939]">
                            {obj}
                            <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedObjectives(prev => prev.filter(o => o !== obj))} />
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
