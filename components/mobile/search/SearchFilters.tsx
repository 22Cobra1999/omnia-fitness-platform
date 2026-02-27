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
            {/* Dropdowns row */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 items-center pb-2">
                <div className="relative shrink-0">
                    <select
                        value={selectedSportDiet}
                        disabled={selectedCategory === 'all'}
                        onChange={(e) => setSelectedSportDiet(e.target.value)}
                        className={`bg-transparent border-b border-white/20 pl-1 pr-6 py-1 text-sm font-medium transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#FF7939] ${selectedCategory === 'all'
                            ? 'opacity-30 grayscale pointer-events-none'
                            : 'text-white/60 hover:text-white'
                            }`}
                    >
                        <option value="all" className="bg-[#121212]">CATEGORÍA</option>
                        {(selectedCategory === 'nutricion' ? DIETS : SPORTS).map(item => (
                            <option key={item} value={item} className="bg-[#121212]">{item.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown className={`absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none ${selectedCategory === 'all' ? 'opacity-0' : ''}`} />
                </div>

                <div className="relative shrink-0">
                    <select
                        disabled={selectedCategory === 'all'}
                        className={`bg-transparent border-b border-white/20 pl-1 pr-6 py-1 text-sm font-medium transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#FF7939] ${selectedCategory === 'all'
                            ? 'opacity-30 grayscale pointer-events-none'
                            : 'text-white/60 hover:text-white'
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
                    <ChevronDown className={`absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none ${selectedCategory === 'all' ? 'opacity-0' : ''}`} />
                </div>

                <div className="relative shrink-0">
                    <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="bg-transparent border-b border-white/20 pl-1 pr-6 py-1 text-sm font-medium transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#FF7939] text-white/60 hover:text-white"
                    >
                        <option value="all" className="bg-[#121212]">TIEMPO</option>
                        {DURATIONS.map(d => (
                            <option key={d.value} value={d.value} className="bg-[#121212]">{d.label.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                </div>
            </div>

            {selectedObjectives.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedObjectives.map(obj => (
                        <span key={obj} className="flex items-center gap-1 bg-[#FF7939]/10 border border-[#FF7939]/20 px-2 py-0.5 rounded-lg text-[9px] font-bold text-[#FF7939]">
                            {obj}
                            <button
                                onClick={() => setSelectedObjectives(prev => prev.filter(o => o !== obj))}
                                aria-label={`Eliminar objetivo ${obj}`}
                                className="hover:text-red-500 transition-colors"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
