import { Input } from "@/components/ui/input"
import { Goal } from "@/components/client/hooks/useClientProfile"
import { useClientProfile } from "@/components/client/hooks/useClientProfile"

interface GoalsSectionProps {
    goals: Goal[]
    actions: ReturnType<typeof useClientProfile>['actions']['goals']
    state: ReturnType<typeof useClientProfile>['state']
    isEditing: boolean
}

export function GoalsSection({ goals, actions, state, isEditing }: GoalsSectionProps) {
    const { newGoalText, editingGoalId, editingGoalText } = state

    return (
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Goals</h3>
            {isEditing && (
                <div className="flex mb-4">
                    <Input
                        value={newGoalText}
                        onChange={(e) => actions.setNewText(e.target.value)}
                        placeholder="Add a new goal"
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white mr-2"
                    />
                    <button
                        onClick={actions.add}
                        className="px-4 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
                    >
                        Add
                    </button>
                </div>
            )}
            <div className="space-y-2">
                {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between bg-[#222222] p-2 rounded-md">
                        {editingGoalId === goal.id ? (
                            <div className="flex-1 flex">
                                <Input
                                    value={editingGoalText}
                                    onChange={(e) => actions.setEditText(e.target.value)}
                                    className="bg-[#2D2D2D] border-[#3D3D3D] text-white mr-2"
                                />
                                <button
                                    onClick={actions.saveEdit}
                                    className="px-2 py-1 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition mr-2"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center flex-1">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: goal.color || "#4ADE80" }}
                                ></div>
                                <span className="text-white">{goal.text}</span>
                            </div>
                        )}
                        {isEditing && (
                            <div className="flex">
                                <button
                                    onClick={() => actions.startEdit(goal.id)}
                                    className="text-white hover:text-[#FF7939] transition mr-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => actions.delete(goal.id)}
                                    className="text-white hover:text-[#FF7939] transition"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
