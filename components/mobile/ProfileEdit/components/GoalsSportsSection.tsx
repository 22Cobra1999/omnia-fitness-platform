import { useRef, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Plus, X } from 'lucide-react'
import { FITNESS_GOALS_OPTIONS, SPORTS_OPTIONS } from '../constants'

interface GoalsSportsSectionProps {
    goals: string[]
    sports: string[]
    onToggleGoal: (goal: string) => void
    onToggleSport: (sport: string) => void
    isGoalsPopoverOpen: boolean
    setIsGoalsPopoverOpen: (val: boolean) => void
    isSportsPopoverOpen: boolean
    setIsSportsPopoverOpen: (val: boolean) => void
}

export function GoalsSportsSection({
    goals,
    sports,
    onToggleGoal,
    onToggleSport,
    isGoalsPopoverOpen,
    setIsGoalsPopoverOpen,
    isSportsPopoverOpen,
    setIsSportsPopoverOpen
}: GoalsSportsSectionProps) {
    const goalsSectionRef = useRef<HTMLDivElement>(null)
    const sportsSectionRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isGoalsPopoverOpen) goalsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [isGoalsPopoverOpen])

    useEffect(() => {
        if (isSportsPopoverOpen) sportsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [isSportsPopoverOpen])

    const availableGoals = FITNESS_GOALS_OPTIONS.filter(g => !goals.includes(g))
    const availableSports = SPORTS_OPTIONS.filter(s => !sports.includes(s))

    return (
        <div className="space-y-6">
            <div ref={goalsSectionRef}>
                <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] uppercase tracking-widest text-[#FF7939]">Metas de Rendimiento</Label>
                    <button type="button" onClick={() => setIsGoalsPopoverOpen(!isGoalsPopoverOpen)} className="w-6 h-6 rounded-full bg-[#FF7939]/10 text-[#FF7939] flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {goals.map((g, i) => (
                        <div key={i} onClick={() => onToggleGoal(g)} className="cursor-pointer flex items-center gap-1.5 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1 text-xs font-bold uppercase transition-all hover:scale-105">
                            <span>{g}</span><X className="h-3 w-3 opacity-50" />
                        </div>
                    ))}
                </div>
                {isGoalsPopoverOpen && (
                    <div className="mt-4 grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableGoals.map((g) => (
                            <button key={g} type="button" onClick={() => onToggleGoal(g)} className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors border border-white/5">
                                {g}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div ref={sportsSectionRef}>
                <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] uppercase tracking-widest text-[#FF7939]">Deportes</Label>
                    <button type="button" onClick={() => setIsSportsPopoverOpen(!isSportsPopoverOpen)} className="w-6 h-6 rounded-full bg-[#FF7939]/10 text-[#FF7939] flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sports.map((s, i) => (
                        <div key={i} onClick={() => onToggleSport(s)} className="cursor-pointer flex items-center gap-1.5 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors hover:bg-[#FF7939]/20">
                            <span>{s}</span><X className="h-3 w-3 opacity-50" />
                        </div>
                    ))}
                </div>
                {isSportsPopoverOpen && (
                    <div className="mt-4 grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableSports.map((s) => (
                            <button key={s} type="button" onClick={() => onToggleSport(s)} className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors border border-white/5">
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
