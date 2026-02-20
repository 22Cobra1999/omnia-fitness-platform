import React from "react"
import { Search, Filter, X, ArrowLeft, Dumbbell, ChefHat, Zap } from "lucide-react"

interface SearchHeaderProps {
    expandedSection: 'coaches' | 'activities' | null
    searchTerm: string
    handleSearchChange: (val: string) => void
    showFilters: boolean
    setShowFilters: (show: boolean) => void
    clearAllFilters: () => void
    setExpandedSection: (section: 'coaches' | 'activities' | null) => void
    setShowAllCoaches: (show: boolean) => void
    setShowAllActivities: (show: boolean) => void
    selectedCategory: string
    setSelectedCategory: (cat: string) => void
    resultsCount: number
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    expandedSection,
    searchTerm,
    handleSearchChange,
    showFilters,
    setShowFilters,
    clearAllFilters,
    setExpandedSection,
    setShowAllCoaches,
    setShowAllActivities,
    selectedCategory,
    setSelectedCategory,
    resultsCount,
}) => {
    if (expandedSection) {
        return (
            <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setExpandedSection(null)
                            setShowAllCoaches(false)
                            setShowAllActivities(false)
                        }}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[#FF7939] hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                            {[
                                { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-3 h-3" /> },
                                { id: 'nutricion', label: 'Nutrición', icon: <ChefHat className="w-3 h-3" /> },
                                ...(expandedSection === 'coaches' ? [{ id: 'general', label: 'General', icon: <Zap className="w-3 h-3" /> }] : [])
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${selectedCategory === cat.id
                                        ? 'bg-[#FF7939] border-[#FF7939] text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    {cat.icon}
                                    <span className="text-[11px] font-bold whitespace-nowrap">{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 min-w-[120px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF7939]/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pl-1">
                    <div className="text-xs text-white/40">
                        <span className="text-[#FF7939] font-black">{resultsCount}</span> resultados
                    </div>

                    {searchTerm && (
                        <div className="flex items-center gap-2 bg-[#FF7939]/10 border border-[#FF7939]/20 px-3 py-1 rounded-full">
                            <span className="text-[11px] font-bold text-[#FF7939]">{searchTerm}</span>
                            <button onClick={() => handleSearchChange("")}>
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="mb-2 mt-0.5">
            <div className="flex items-center gap-3">
                {/* Buscador Compacto */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF7939]/10 to-transparent rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#FF7939] transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Coach o actividad..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF7939]/50 focus:bg-white/10 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Botón de Filtro */}
                <button
                    onClick={() => {
                        if (showFilters) {
                            clearAllFilters();
                        } else {
                            setShowFilters(true);
                        }
                    }}
                    aria-label={showFilters ? "Cerrar filtros" : "Abrir filtros"}
                    className={`w-11 h-11 rounded-2xl border transition-all flex items-center justify-center flex-shrink-0 ${showFilters
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                >
                    {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}
