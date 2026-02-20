import { Zap, Utensils, X, ChevronDown } from "lucide-react"

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
        <div className="mt-0 space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 px-4">
            {/* Fila Principal de Filtros */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 items-center">
                {/* Categorías (Icons Only) */}
                <div className="flex gap-1.5 pr-2 border-r border-white/10">
                    {[
                        { id: 'fitness', title: 'Fitness', icon: <Zap className="w-4 h-4" /> },
                        { id: 'nutricion', title: 'Nutrición', icon: <Utensils className="w-4 h-4" /> }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            aria-label={cat.title}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${selectedCategory === cat.id
                                ? 'bg-[#FF7939] border-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.3)]'
                                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                }`}
                        >
                            {cat.icon}
                        </button>
                    ))}
                </div>

                {/* Dropdowns row */}
                <div className="flex gap-2 shrink-0">
                    <div className="relative">
                        <select
                            value={selectedSportDiet}
                            disabled={selectedCategory === 'all'}
                            onChange={(e) => setSelectedSportDiet(e.target.value)}
                            className={`bg-white/5 border border-white/5 rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold transition-all appearance-none cursor-pointer ${selectedCategory === 'all'
                                ? 'opacity-20 grayscale pointer-events-none'
                                : 'text-white/50 hover:bg-white/10'
                                }`}
                        >
                            <option value="all" className="bg-[#121212]">CATEGORÍA</option>
                            {(selectedCategory === 'nutricion' ? DIETS : SPORTS).map(item => (
                                <option key={item} value={item} className="bg-[#121212]">{item.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none ${selectedCategory === 'all' ? 'opacity-0' : ''}`} />
                    </div>

                    <div className="relative">
                        <select
                            disabled={selectedCategory === 'all'}
                            className={`bg-white/5 border border-white/5 rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold transition-all appearance-none cursor-pointer ${selectedCategory === 'all'
                                ? 'opacity-20 grayscale pointer-events-none'
                                : 'text-white/50 hover:bg-white/10'
                                }`}
                            onChange={(e) => {
                                const val = e.target.value
                                if (val !== "all") {
                                    setSelectedObjectives(prev => prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val])
                                }
                                e.target.value = "all"
                            }}
                        >
                            <option value="all" className="bg-[#121212]">OBJETIVO</option>
                            {COMMON_OBJECTIVES.map(obj => (
                                <option key={obj} value={obj} className="bg-[#121212]">{obj.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none ${selectedCategory === 'all' ? 'opacity-0' : ''}`} />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold text-white/50 focus:outline-none appearance-none cursor-pointer transition-all hover:bg-white/10"
                        >
                            <option value="all" className="bg-[#121212]">TIEMPO</option>
                            {DURATIONS.map(d => (
                                <option key={d.value} value={d.value} className="bg-[#121212]">{d.label.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Fila Secundaria: Modality (Doc / Taller / Program) - Always visible */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 animate-in slide-in-from-left-2 duration-200">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'doc', label: 'Documentos' },
                    { id: 'taller', label: 'Talleres' },
                    { id: 'programa', label: 'Programas' }
                ].map(mod => (
                    <button
                        key={mod.id}
                        onClick={() => setSelectedModality(mod.id)}
                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedModality === mod.id
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                            }`}
                    >
                        {mod.label}
                    </button>
                ))}
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
