import { ViewMode } from '../hooks/storage/useStorageLogic'

interface StorageFiltersProps {
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
    conceptFilter: 'all' | 'image' | 'video' | 'pdf'
    setConceptFilter: (concept: 'all' | 'image' | 'video' | 'pdf') => void
}

export function StorageFilters({ viewMode, setViewMode, conceptFilter, setConceptFilter }: StorageFiltersProps) {
    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-white/5 pb-2">
                <button onClick={() => setViewMode('usage')} className={`text-[10px] font-semibold ${viewMode === 'usage' ? 'text-white' : 'text-white/20'}`}>Archivos</button>
                <button onClick={() => setViewMode('activity')} className={`text-[10px] font-semibold ${viewMode === 'activity' ? 'text-white' : 'text-white/20'}`}>Actividades</button>
            </div>

            <div className="flex gap-1.5">
                {['video', 'image', 'pdf', 'all'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setConceptFilter(f as any)}
                        className={`px-3 py-1 rounded-full text-[9px] transition-all ${conceptFilter === f ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    )
}
