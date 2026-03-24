import React from 'react'
import { ExerciseData } from '../types'
import { FitnessTable } from './FitnessTable'
import { NutritionTable } from './NutritionTable'
import { Flame, Video, Trash2 } from 'lucide-react'

interface CsvTableProps {
    data: ExerciseData[]
    startIndex: number
    selectedRows: Set<number>
    toggleRow: (actualIndex: number) => void
    toggleSelectAll: () => void
    isAllSelected: boolean
    onEdit: (item: ExerciseData, index: number) => void
    productCategory: 'fitness' | 'nutricion'
    activityId: number
    planLimits?: any
    exerciseUsage?: Record<number, { activities: Array<{ id: number; name: string }> }>
    activityNamesMap?: Record<number, string>
    activityImagesMap?: Record<number, string | null>
    duplicateNames?: string[]
    loadingExisting?: boolean
    bunnyVideoTitles?: Record<string, string>
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null
    onSort?: (key: string) => void
    onDelete?: (index: number) => void
    onDeleteSelected?: () => void
    onAddVideosToSelected?: () => void
    newlyAddedIds?: Set<string | number>
}

export function CsvTable({
    productCategory,
    newlyAddedIds = new Set(),
    ...props
}: CsvTableProps) {
    const tableContainerRef = React.useRef<HTMLDivElement>(null)
    const topScrollRef = React.useRef<HTMLDivElement>(null)
    const [contentWidth, setContentWidth] = React.useState(0)

    // Sync scrolls
    const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = e.currentTarget.scrollLeft
        }
    }

    const handleBottomScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (topScrollRef.current) {
            topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
        }
    }

    const hasSelected = props.selectedRows.size > 0

    // Measure table content on mount/data change
    React.useEffect(() => {
        const updateWidth = () => {
            if (tableContainerRef.current) {
                const table = tableContainerRef.current.querySelector('table')
                if (table) {
                    setContentWidth(table.scrollWidth)
                }
            }
        }
        
        const timer = setTimeout(updateWidth, 500) // Small delay for content render
        window.addEventListener('resize', updateWidth)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updateWidth)
        }
    }, [props.data])

    return (
        <div className="w-full flex flex-col gap-0 overflow-visible">
            {/* Instructions Bar INSIDE CsvTable for precise scrollbar positioning */}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mt-4 px-2 py-3 bg-zinc-900/40 rounded-t-xl border-x border-t border-white/5">
                <div className="flex items-center gap-2 text-zinc-400">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Selecciona las filas apretando el logo de llama</span>
                    <div className="p-1 bg-[#FF7939]/10 rounded-full border border-[#FF7939]/20 shadow-[0_0_10px_rgba(255,121,57,0.1)]">
                        <Flame className="h-3.5 w-3.5 text-[#FF7939]" fill="#FF7939" />
                    </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    <button 
                        onClick={props.onAddVideosToSelected}
                        disabled={!hasSelected}
                        className="flex items-center gap-2 text-zinc-400 hover:text-[#FF7939] disabled:opacity-20 transition-all group"
                    >
                        <Video className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Agregar videos</span>
                    </button>

                    <div className="w-px h-3 bg-white/10" />

                    <button 
                        onClick={props.onDeleteSelected}
                        disabled={!hasSelected}
                        className="flex items-center gap-2 text-zinc-400 hover:text-red-400 disabled:opacity-20 transition-all group"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Eliminar</span>
                    </button>
                </div>
            </div>

            {/* Top Scrollbar - HIGHER and Orange */}
            <div 
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="w-full overflow-x-auto h-4 mb-0.5 z-[20] sticky top-0 bg-zinc-950/20 backdrop-blur-sm"
                style={{ direction: 'ltr' }}
            >
                <div style={{ width: `${contentWidth}px`, height: '1px' }} />
            </div>

            <div 
                ref={tableContainerRef}
                onScroll={handleBottomScroll}
                className="w-full overflow-x-auto pb-4" 
                id="csv-table-scroll-target"
            >
                {productCategory === 'nutricion' ? (
                    <NutritionTable
                        {...props}
                        newlyAddedIds={newlyAddedIds}
                        duplicateNames={props.duplicateNames || []}
                        loadingExisting={!!props.loadingExisting}
                        bunnyVideoTitles={props.bunnyVideoTitles}
                        sortConfig={props.sortConfig}
                        onSort={props.onSort}
                    />
                ) : (
                    <FitnessTable
                        {...props}
                        newlyAddedIds={newlyAddedIds}
                        exerciseUsage={props.exerciseUsage || {}}
                        activityNamesMap={props.activityNamesMap || {}}
                        activityImagesMap={props.activityImagesMap || {}}
                        duplicateNames={props.duplicateNames || []}
                        loadingExisting={!!props.loadingExisting}
                        bunnyVideoTitles={props.bunnyVideoTitles}
                        sortConfig={props.sortConfig}
                        onSort={props.onSort}
                    />
                )}
            </div>
            
            <style jsx>{`
                #csv-table-scroll-target::-webkit-scrollbar {
                    height: 6px;
                }
                #csv-table-scroll-target::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                #csv-table-scroll-target::-webkit-scrollbar-thumb {
                    background: #FF7939;
                    border-radius: 10px;
                }
                #csv-table-scroll-target::-webkit-scrollbar-thumb:hover {
                    background: #FF9B6A;
                }
                
                /* Custom styles for the top scrollbar container to make it always visible and orange */
                div[ref="topScrollRef"]::-webkit-scrollbar,
                .w-full.overflow-x-auto.h-4::-webkit-scrollbar {
                    height: 6px;
                }
                .w-full.overflow-x-auto.h-4::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .w-full.overflow-x-auto.h-4::-webkit-scrollbar-thumb {
                    background: #FF7939;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    )
}
