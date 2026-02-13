import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { PersonalInfoState } from "../types"
import { FITNESS_GOALS_OPTIONS, CONTRADICTORY_GOALS } from "../constants"

interface GoalsTabProps {
    isEditing: boolean
    personalInfo: PersonalInfoState
    handleGoalsChange: (field: string, value: string) => void
    setIsEditing: (isEditing: boolean) => void
}

export function GoalsTab({ isEditing, personalInfo, handleGoalsChange, setIsEditing }: GoalsTabProps) {
    return (
        <div className="space-y-4 p-2">
            {isEditing ? (
                <>
                    <div className="space-y-3">
                        <Label className="text-gray-300">Objectives</Label>
                        <div className="max-h-[220px] overflow-y-auto pr-2 thin-scrollbar bg-black/20 rounded-xl p-2 border border-white/5">
                            <div className="grid grid-cols-2 gap-2">
                                {FITNESS_GOALS_OPTIONS.map((goal) => {
                                    const currentGoals = personalInfo.goals.objectives?.split(', ').filter(Boolean) || []
                                    const isSelected = currentGoals.includes(goal)
                                    const isContradictory = currentGoals.some(g => CONTRADICTORY_GOALS[goal]?.includes(g))

                                    return (
                                        <button
                                            key={goal}
                                            type="button"
                                            disabled={isContradictory && !isSelected}
                                            onClick={() => {
                                                let nextGoals: string[]
                                                if (isSelected) {
                                                    nextGoals = currentGoals.filter(g => g !== goal)
                                                } else {
                                                    if (isContradictory) return
                                                    nextGoals = [...currentGoals, goal]
                                                }
                                                handleGoalsChange("objectives", nextGoals.join(', '))
                                            }}
                                            className={`py-2 px-3 text-[11px] rounded-lg border text-left transition-all duration-300 flex items-center gap-2 ${isSelected
                                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)]'
                                                : isContradictory
                                                    ? 'border-white/5 bg-black/10 text-gray-700 cursor-not-allowed opacity-40'
                                                    : 'border-white/5 bg-black/20 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#FF7939] bg-[#FF7939]' : 'border-gray-600'}`}>
                                                {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                            </div>
                                            <span className="truncate">{goal}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="estimatedTime" className="text-gray-300">
                                Estimated time (weeks)
                            </Label>
                            <Input
                                id="estimatedTime"
                                value={personalInfo.goals.estimatedTime}
                                onChange={(e) => handleGoalsChange("estimatedTime", e.target.value)}
                                className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="fatPercentage" className="text-gray-300">
                                Fat percentage
                            </Label>
                            <Input
                                id="fatPercentage"
                                value={personalInfo.goals.fatPercentage}
                                onChange={(e) => handleGoalsChange("fatPercentage", e.target.value)}
                                className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="musclePercentage" className="text-gray-300">
                                Muscle percentage
                            </Label>
                            <Input
                                id="musclePercentage"
                                value={personalInfo.goals.musclePercentage}
                                onChange={(e) => handleGoalsChange("musclePercentage", e.target.value)}
                                className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                            />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-[#2D2D2D]/50 p-5 rounded-2xl mb-4 border border-white/5">
                        <div className="text-gray-400 mb-3 text-[10px] uppercase font-bold tracking-wider">Objectives</div>
                        {personalInfo.goals.objectives ? (
                            <div className="flex flex-wrap gap-2">
                                {personalInfo.goals.objectives.split(', ').map(goal => (
                                    <span key={goal} className="px-3 py-1 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] text-xs font-medium">
                                        {goal}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic text-sm">Not set</div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                            <div className="text-gray-400 mb-1 text-sm">Timeline</div>
                            {personalInfo.goals.estimatedTime ? (
                                <div className="text-xl font-bold text-white">
                                    {personalInfo.goals.estimatedTime} <span className="text-sm text-gray-400">weeks</span>
                                </div>
                            ) : (
                                <div className="text-lg text-gray-500 italic">Not set</div>
                            )}
                        </div>

                        <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                            <div className="text-gray-400 mb-1 text-sm">Fat %</div>
                            {personalInfo.goals.fatPercentage ? (
                                <div className="text-xl font-bold text-white">{personalInfo.goals.fatPercentage}%</div>
                            ) : (
                                <div className="text-lg text-gray-500 italic">Not set</div>
                            )}
                        </div>

                        <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                            <div className="text-gray-400 mb-1 text-sm">Muscle %</div>
                            {personalInfo.goals.musclePercentage ? (
                                <div className="text-xl font-bold text-white">{personalInfo.goals.musclePercentage}%</div>
                            ) : (
                                <div className="text-lg text-gray-500 italic">Not set</div>
                            )}
                        </div>
                    </div>

                    {!personalInfo.goals.objectives &&
                        !personalInfo.goals.estimatedTime &&
                        !personalInfo.goals.fatPercentage &&
                        !personalInfo.goals.musclePercentage && (
                            <div className="mt-4 p-4 border border-dashed border-[#FF7939]/30 rounded-lg bg-[#FF7939]/5 text-center">
                                <p className="text-gray-300">Set your fitness goals to track your progress</p>
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 bg-gradient-to-r from-[#FF7939] to-[#FF5C00] hover:from-[#FF5C00] hover:to-[#FF7939] text-white"
                                >
                                    Set Goals
                                </Button>
                            </div>
                        )}
                </>
            )}
        </div>
    )
}
