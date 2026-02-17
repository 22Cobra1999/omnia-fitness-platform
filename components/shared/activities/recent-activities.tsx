"use client"

import { useState, memo } from "react"
import { Plus, X, Edit, Trash2, Clock, Dumbbell, Utensils, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { COMMON_UNITS } from "@/constants/units"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRecentActivitiesLogic, type RecentActivity } from "./hooks/useRecentActivitiesLogic"

interface RecentActivitiesProps {
  userId?: string
}

const categoryColors = {
  fitness: "#FF7939",
  nutrition: "#4ADE80",
  other: "#60A5FA",
}

const categoryIcons = {
  fitness: Dumbbell,
  nutrition: Utensils,
  other: TrendingUp,
}

// Format date to relative time helper
const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  return date.toLocaleDateString()
}

// Componente para mostrar una actividad individual
const ActivityItem = memo(
  ({
    activity,
    onEdit,
    onDelete,
    isLoading = false,
  }: {
    activity: RecentActivity
    onEdit: (id: string) => void
    onDelete: (id: string) => void
    isLoading?: boolean
  }) => {
    const IconComponent = categoryIcons[activity.category]

    const getAdditionalVariables = () => {
      const variables = []
      if (activity.km) variables.push({ value: activity.km, unit: "km" })
      if (activity.mins) variables.push({ value: activity.mins, unit: "mins" })
      if (activity.kg) variables.push({ value: activity.kg, unit: "kg" })
      if (activity.reps) variables.push({ value: activity.reps, unit: "reps" })
      if (activity.sets) variables.push({ value: activity.sets, unit: "sets" })
      if (activity.kcal) variables.push({ value: activity.kcal, unit: "kcal" })
      if (activity.distance) variables.push({ value: activity.distance, unit: "distance" })
      if (activity.duration) variables.push({ value: activity.duration, unit: "duration" })
      if (activity.weight) variables.push({ value: activity.weight, unit: "weight" })
      return variables
    }

    const additionalVariables = getAdditionalVariables()

    return (
      <div className={`bg-[#141414] rounded-xl p-3 border border-white/5 relative group ${isLoading ? "opacity-70" : ""}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mr-2"
              style={{ backgroundColor: `${activity.color || categoryColors[activity.category]}20` }}
            >
              <IconComponent
                className="h-3.5 w-3.5"
                style={{ color: activity.color || categoryColors[activity.category] }}
              />
            </div>
            <h4 className="text-sm font-medium text-white">{activity.name}</h4>
          </div>

          {!isLoading && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 flex space-x-1">
              <button
                className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2A2A2A]"
                onClick={() => onEdit(activity.id)}
              >
                <Edit className="h-2.5 w-2.5 text-gray-400" />
              </button>
              <button
                className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2A2A2A]"
                onClick={() => onDelete(activity.id)}
              >
                <Trash2 className="h-2.5 w-2.5 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center mb-2">
          <div className="text-base font-semibold text-white">
            {activity.value} {activity.unit}
          </div>

          {additionalVariables.length > 0 && (
            <div className="ml-2 text-sm text-gray-400">
              {additionalVariables.map((variable, index) => (
                <span key={index}>
                  {index > 0 && ", "}
                  {variable.value} {variable.unit}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center text-[10px] text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          {formatTimestamp(activity.timestamp)}
        </div>
      </div>
    )
  },
)

ActivityItem.displayName = "ActivityItem"

const ActivitySkeleton = () => (
  <div className="bg-[#141414] rounded-xl p-3 border border-white/5 animate-pulse">
    <div className="flex items-center mb-2">
      <div className="w-7 h-7 rounded-full bg-gray-700 mr-2"></div>
      <div className="h-4 bg-gray-700 rounded w-24"></div>
    </div>
    <div className="h-5 bg-gray-700 rounded w-16 mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-20"></div>
  </div>
)

const ActivityFormModal = memo(
  ({
    isOpen,
    onClose,
    isEditing,
    activity,
    setActivity,
    onSave,
    isSaving,
  }: {
    isOpen: boolean
    onClose: () => void
    isEditing: boolean
    activity: RecentActivity
    setActivity: (activity: RecentActivity) => void
    onSave: () => void
    isSaving: boolean
  }) => {
    const [selectedVarType, setSelectedVarType] = useState<string>("km")
    const [selectedVarValue, setSelectedVarValue] = useState<string | number>("")

    const variableOptions = [
      { value: "km", label: "Kilómetros" },
      { value: "mins", label: "Minutos" },
      { value: "kg", label: "Kilogramos" },
      { value: "reps", label: "Repeticiones" },
      { value: "sets", label: "Series" },
      { value: "kcal", label: "Calorías" },
    ]

    const addVariable = () => {
      if (!selectedVarType || !selectedVarValue) return
      setActivity({ ...activity, [selectedVarType]: Number(selectedVarValue) })
      setSelectedVarValue("")
    }

    const removeVariable = (varType: string) => {
      const updatedActivity = { ...activity }
      updatedActivity[varType as keyof RecentActivity] = null as any
      setActivity(updatedActivity)
    }

    const getAdditionalVariables = () => {
      const variables = []
      if (activity.km) variables.push({ type: "km", value: activity.km, label: "Kilómetros" })
      if (activity.mins) variables.push({ type: "mins", value: activity.mins, label: "Minutos" })
      if (activity.kg) variables.push({ type: "kg", value: activity.kg, label: "Kilogramos" })
      if (activity.reps) variables.push({ type: "reps", value: activity.reps, label: "Repeticiones" })
      if (activity.sets) variables.push({ type: "sets", value: activity.sets, label: "Series" })
      if (activity.kcal) variables.push({ type: "kcal", value: activity.kcal, label: "Calorías" })
      if (activity.distance) variables.push({ type: "distance", value: activity.distance, label: "Distancia" })
      if (activity.duration) variables.push({ type: "duration", value: activity.duration, label: "Duración" })
      if (activity.weight) variables.push({ type: "weight", value: activity.weight, label: "Peso" })
      return variables
    }

    const additionalVariables = getAdditionalVariables()

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1A1A1A] rounded-xl p-5 w-80 max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-white">{isEditing ? "Edit Activity" : "Add Activity"}</h3>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-[#2A2A2A]" onClick={onClose}>
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Activity Name</label>
              <Input
                value={activity.name}
                onChange={(e) => setActivity({ ...activity, name: e.target.value.slice(0, 30) })}
                placeholder="e.g., Morning Run, Lunch, Gym Session"
                className="bg-[#141414] border-gray-700 text-white"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className={`p-2 h-auto flex flex-col items-center ${activity.category === "fitness"
                    ? "bg-[#FF7939]/20 border border-[#FF7939]/50"
                    : "bg-[#141414] border border-gray-700"
                    }`}
                  onClick={() => setActivity({ ...activity, category: "fitness" })}
                >
                  <Dumbbell className="h-4 w-4 mb-1" color={activity.category === "fitness" ? "#FF7939" : "#888"} />
                  <span className="text-[10px]">Fitness</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className={`p-2 h-auto flex flex-col items-center ${activity.category === "nutrition"
                    ? "bg-[#4ADE80]/20 border border-[#4ADE80]/50"
                    : "bg-[#141414] border border-gray-700"
                    }`}
                  onClick={() => setActivity({ ...activity, category: "nutrition" })}
                >
                  <Utensils className="h-4 w-4 mb-1" color={activity.category === "nutrition" ? "#4ADE80" : "#888"} />
                  <span className="text-[10px]">Nutrition</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className={`p-2 h-auto flex flex-col items-center ${activity.category === "other"
                    ? "bg-[#60A5FA]/20 border border-[#60A5FA]/50"
                    : "bg-[#141414] border border-gray-700"
                    }`}
                  onClick={() => setActivity({ ...activity, category: "other" })}
                >
                  <TrendingUp className="h-4 w-4 mb-1" color={activity.category === "other" ? "#60A5FA" : "#888"} />
                  <span className="text-[10px]">Other</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Main Value</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={activity.value || ""}
                  onChange={(e) => setActivity({ ...activity, value: Number(e.target.value) })}
                  placeholder="5"
                  className="bg-[#141414] border-gray-700 text-white w-20"
                />

                <Select value={activity.unit} onValueChange={(value) => setActivity({ ...activity, unit: value })}>
                  <SelectTrigger className="bg-[#141414] border-gray-700 text-white flex-1">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-gray-700 text-white max-h-60">
                    {COMMON_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit} className="hover:bg-[#2A2A2A]">
                        {unit}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-gray-400 italic hover:bg-[#2A2A2A]">
                      Custom...
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activity.unit === "custom" && (
                <Input
                  value={activity.unit === "custom" ? "" : activity.unit}
                  onChange={(e) => setActivity({ ...activity, unit: e.target.value })}
                  placeholder="Enter custom unit"
                  className="bg-[#141414] border-gray-700 text-white mt-2 w-full"
                  maxLength={15}
                  autoFocus
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs text-gray-400">Additional Variables</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[#60A5FA] hover:text-[#60A5FA] hover:bg-[#60A5FA]/10 text-[10px]"
                  onClick={addVariable}
                  disabled={!selectedVarType || !selectedVarValue}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <Select value={selectedVarType} onValueChange={setSelectedVarType}>
                  <SelectTrigger className="bg-[#141414] border-gray-700 text-white h-8 text-xs">
                    <SelectValue placeholder="Variable" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-gray-700 text-white max-h-60">
                    {variableOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="hover:bg-[#2A2A2A]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={selectedVarValue}
                  onChange={(e) => setSelectedVarValue(Number(e.target.value))}
                  placeholder="Value"
                  className="bg-[#141414] border-gray-700 text-white text-xs h-8"
                />
              </div>

              {additionalVariables.length > 0 && (
                <div className="space-y-2 mt-2">
                  {additionalVariables.map((variable, index) => (
                    <div key={index} className="flex justify-between items-center bg-[#141414] rounded-md p-2">
                      <div className="text-xs text-white">
                        <span className="text-gray-400">{variable.label}:</span> {variable.value}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full hover:bg-[#2A2A2A]"
                        onClick={() => removeVariable(variable.type)}
                      >
                        <X className="h-2.5 w-2.5 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                className="w-full bg-[#FF7939] hover:bg-[#E65B25] text-white"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : isEditing ? "Update Activity" : "Add Activity"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

ActivityFormModal.displayName = "ActivityFormModal"

export function RecentActivities({ userId }: RecentActivitiesProps) {
  const {
    activities,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    currentActivity,
    setCurrentActivity,
    isSaving,
    handleAddActivity,
    handleEditActivity,
    handleSaveActivity,
    handleDeleteActivity,
  } = useRecentActivitiesLogic(userId)

  return (
    <div className="px-5 pt-2 pb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-white flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-[#FF6B35] to-[#FBBF24] rounded-full mr-2"></div>
          Recent Activities
        </h2>
        <button
          onClick={handleAddActivity}
          className="text-xs px-3 py-1.5 bg-[#1D1D1D] rounded-full text-white/80 font-medium flex items-center hover:bg-[#252525] transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add New
        </button>
      </div>

      <div className="bg-[#141414] p-4 rounded-2xl shadow-md border border-white/5">
        {isLoading && !activities.length && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && activities.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">No recent activities</div>
            <Button onClick={handleAddActivity} className="bg-[#FF7939] hover:bg-[#E65B25] text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>

      <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        activity={currentActivity}
        setActivity={setCurrentActivity}
        onSave={handleSaveActivity}
        isSaving={isSaving}
      />
    </div>
  )
}
