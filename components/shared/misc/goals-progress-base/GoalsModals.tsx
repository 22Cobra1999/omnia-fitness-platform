import React from "react"
import { X, Plus, Edit, Trash, Dumbbell, Bike, FishIcon as Swim, SpaceIcon as Yoga, Brain, Heart, Clock } from "lucide-react"
import type { ActivityTag, Goal, PersonalBest } from "../goals-progress-data"

interface GoalsModalsProps {
    state: any
    actions: any
}

export const GoalsModals = ({ state, actions }: GoalsModalsProps) => {
    const getIconByName = (iconName: string): React.ElementType => {
        switch (iconName) {
            case "bike": return Bike
            case "swim": return Swim
            case "yoga": return Yoga
            case "brain": return Brain
            case "dumbbell": return Dumbbell
            case "heart": return Heart
            case "clock": return Clock
            default: return Dumbbell
        }
    }

    return (
        <>
            {/* Add Goal Modal */}
            {state.isAddingGoal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-white">Add New Goal</h3>
                            <button className="text-gray-400 hover:text-white" onClick={() => actions.setIsAddingGoal(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Goal Name</label>
                                <input
                                    type="text"
                                    value={state.newGoalName}
                                    onChange={(e) => actions.setNewGoalName(e.target.value)}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                    placeholder="e.g., Weekly Runs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Target Value</label>
                                <input
                                    type="number"
                                    value={state.newGoalTarget || ""}
                                    onChange={(e) => actions.setNewGoalTarget(Number(e.target.value))}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                    placeholder="e.g., 5"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Unit</label>
                                <input
                                    type="text"
                                    value={state.newGoalUnit}
                                    onChange={(e) => actions.setNewGoalUnit(e.target.value)}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                    placeholder="e.g., km, sessions, hours"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Category</label>
                                <select
                                    value={state.newGoalCategory}
                                    onChange={(e) => actions.setNewGoalCategory(e.target.value)}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                >
                                    <option value="addiction">Addiction Control</option>
                                    <option value="fitness">Fitness</option>
                                    <option value="nutrition">Nutrition</option>
                                    <option value="wellness">Wellness</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {state.newGoalCategory === "addiction" && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Sub-Category</label>
                                    <select
                                        className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                        onChange={(e) => actions.setNewGoalSubCategory(e.target.value)}
                                    >
                                        <option value="alcohol">Alcohol</option>
                                        <option value="smoke">Smoke</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Color</label>
                                <div className="flex space-x-2">
                                    {["#FF7939", "#FFB56B", "#F59E0B", "#EF4444"].map((color) => (
                                        <button
                                            key={color}
                                            className={`w-6 h-6 rounded-full ${state.newGoalColor === color ? "ring-2 ring-white" : ""}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => actions.setNewGoalColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    className="bg-[#FF7939] text-white px-4 py-2 rounded-lg text-sm font-medium"
                                    onClick={actions.addNewGoal}
                                >
                                    Add Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Logging Modal */}
            {state.isLoggingActivity && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-white">Log Activity</h3>
                            <button className="text-gray-400 hover:text-white" onClick={() => actions.setIsLoggingActivity(null)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Value</label>
                                <input
                                    type="number"
                                    value={state.activityValue || ""}
                                    onChange={(e) => actions.setActivityValue(Number(e.target.value))}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={state.activityDate}
                                    onChange={(e) => actions.setActivityDate(e.target.value)}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    className="bg-[#FF7939] text-white px-4 py-2 rounded-lg text-sm font-medium"
                                    onClick={() => actions.logActivity(state.isLoggingActivity)}
                                >
                                    Save Activity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Tags Modal */}
            {state.isManagingTags && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] rounded-xl p-5 w-[500px] max-w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-white">Manage Activity Tags</h3>
                            <button className="text-gray-400 hover:text-white" onClick={() => actions.setIsManagingTags(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <button
                                className="flex items-center justify-center w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white hover:bg-[#1A1A1A]"
                                onClick={() => actions.setIsAddingTag(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Activity Tag
                            </button>

                            <div className="space-y-3">
                                {state.userTags.map((tag: ActivityTag) => (
                                    <div key={tag.id} className="bg-[#141414] rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                            >
                                                <tag.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white">{tag.name}</h4>
                                                <p className="text-xs text-gray-400">
                                                    Target: {tag.target} {tag.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            {/* Edit button placeholder as in original */}
                                            <button className="text-gray-400 hover:text-white">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="text-gray-400 hover:text-red-500" onClick={() => actions.deleteTag(tag.id)}>
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Tag Modal */}
            {state.isAddingTag && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-white">Add New Activity Tag</h3>
                            <button className="text-gray-400 hover:text-white" onClick={() => actions.setIsAddingTag(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Activity Name</label>
                                <input
                                    type="text"
                                    value={state.newTagName}
                                    onChange={(e) => actions.setNewTagName(e.target.value)}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                    placeholder="e.g., Cycling, Swimming"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Icon</label>
                                <select
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                    onChange={(e) => actions.setNewTagIcon(getIconByName(e.target.value))}
                                >
                                    <option value="bike">Cycling</option>
                                    <option value="swim">Swimming</option>
                                    <option value="yoga">Yoga</option>
                                    <option value="brain">Meditation</option>
                                    <option value="dumbbell">Strength</option>
                                    <option value="heart">Cardio</option>
                                    <option value="clock">Time-based</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Target Value</label>
                                <input
                                    type="number"
                                    value={state.newTagTarget || ""}
                                    onChange={(e) => actions.setNewTagTarget(Number(e.target.value))}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Unit</label>
                                <input
                                    type="text"
                                    value={state.newTagUnit}
                                    onChange={(e) => actions.setNewTagUnit(e.target.value)}
                                    className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-sm text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Color</label>
                                <div className="flex space-x-2">
                                    {["#FF7939", "#FFB56B", "#F59E0B", "#EF4444", "#DC2626"].map((color) => (
                                        <button
                                            key={color}
                                            className={`w-6 h-6 rounded-full ${state.newTagColor === color ? "ring-2 ring-white" : ""}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => actions.setNewTagColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    className="bg-[#FF7939] text-white px-4 py-2 rounded-lg text-sm font-medium"
                                    onClick={actions.addNewTag}
                                >
                                    Add Activity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View All Personal Bests Modal */}
            {state.isViewingAllBests && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] rounded-xl p-5 w-[500px] max-w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-white">All Personal Bests</h3>
                            <button className="text-gray-400 hover:text-white" onClick={() => actions.setIsViewingAllBests(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {state.userBests.map((best: PersonalBest) => (
                                <div key={best.id} className="bg-[#141414] rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                            style={{ backgroundColor: `${best.color}20`, color: best.color }}
                                        >
                                            <best.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-white">{best.name}</h4>
                                                <div className="flex items-baseline">
                                                    <span className="text-[1.3rem] font-bold text-white">{best.value}</span>
                                                    <span className="text-[10px] text-gray-400 ml-1">{best.unit}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <span className="text-[10px] text-gray-500">Achieved: {best.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
