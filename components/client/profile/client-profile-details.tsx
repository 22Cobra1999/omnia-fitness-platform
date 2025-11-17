"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLocalStorage } from '@/hooks/shared/use-local-storage'

type Restriction = {
  category: string
  type: string
  specification: string
}

type Goal = {
  id: string
  text: string
  color?: string
  trainingFrequency?: string
  changeTimeline?: string
}

type ProfileInfo = {
  bio?: string
  location?: string
  profession?: string
  interests?: string
}

export function ClientProfileDetails() {
  const [personalInfo, setPersonalInfo] = useLocalStorage("personalInfo", {
    basic: {
      name: "Andrew",
      age: "21",
      weight: "64",
      height: "172",
      gender: "male",
      level: "Beginner",
    },
    goals: [
      { id: "1", text: "Lose weight", color: "#4ADE80" },
      { id: "2", text: "Improve running", color: "#86EFAC" },
      { id: "3", text: "Quit smoking", color: "#FF8C00" },
    ] as Goal[],
    restrictions: [] as Restriction[],
    profile: {} as ProfileInfo,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("restrictions")
  const [currentRestriction, setCurrentRestriction] = useState<Restriction>({
    category: "",
    type: "",
    specification: "",
  })
  const [restrictionStep, setRestrictionStep] = useState(0)
  const [newGoalText, setNewGoalText] = useState("")
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalText, setEditingGoalText] = useState("")

  const handleBasicChange = (field: string, value: string) => {
    setPersonalInfo({ ...personalInfo, basic: { ...personalInfo.basic, [field]: value } })
  }

  const handleRestrictionChange = (field: string, value: string) => {
    setCurrentRestriction({ ...currentRestriction, [field]: value })
  }

  const handleAddRestriction = () => {
    setPersonalInfo({
      ...personalInfo,
      restrictions: [...personalInfo.restrictions, currentRestriction],
    })
    setCurrentRestriction({ category: "", type: "", specification: "" })
    setRestrictionStep(0)
  }

  const handleRemoveRestriction = (index: number) => {
    const newRestrictions = [...personalInfo.restrictions]
    newRestrictions.splice(index, 1)
    setPersonalInfo({ ...personalInfo, restrictions: newRestrictions })
  }

  const handleAddGoal = () => {
    if (newGoalText.trim()) {
      const newGoal: Goal = {
        id: Date.now().toString(),
        text: newGoalText.trim(),
        color: getRandomColor(),
      }
      setPersonalInfo({
        ...personalInfo,
        goals: [...personalInfo.goals, newGoal],
      })
      setNewGoalText("")
    }
  }

  const handleEditGoal = (id: string) => {
    const goal = personalInfo.goals.find((g) => g.id === id)
    if (goal) {
      setEditingGoalId(id)
      setEditingGoalText(goal.text)
    }
  }

  const handleSaveGoalEdit = () => {
    if (editingGoalId && editingGoalText.trim()) {
      setPersonalInfo({
        ...personalInfo,
        goals: personalInfo.goals.map((g) => (g.id === editingGoalId ? { ...g, text: editingGoalText.trim() } : g)),
      })
      setEditingGoalId(null)
      setEditingGoalText("")
    }
  }

  const handleDeleteGoal = (id: string) => {
    setPersonalInfo({
      ...personalInfo,
      goals: personalInfo.goals.filter((g) => g.id !== id),
    })
  }

  const handleSave = () => {
    setIsEditing(false)
  }

  const getRandomColor = () => {
    const colors = ["#4ADE80", "#86EFAC", "#FF8C00", "#60A5FA", "#FF6B35", "#FBBF24"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const renderRestrictionForm = () => {
    switch (restrictionStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">
              Do you have any limitations or restrictions we should consider?
            </h3>
            <RadioGroup
              onValueChange={(value) => {
                if (value === "yes") {
                  setRestrictionStep(1)
                } else {
                  setRestrictionStep(0)
                  setCurrentRestriction({ category: "", type: "", specification: "" })
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" className="border-[#FF7939]" />
                <Label htmlFor="yes" className="text-white">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" className="border-[#FF7939]" />
                <Label htmlFor="no" className="text-white">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">What category does your limitation fall under?</h3>
            <Select
              value={currentRestriction.category}
              onValueChange={(value) => {
                handleRestrictionChange("category", value)
                setRestrictionStep(2)
              }}
            >
              <SelectTrigger className="bg-[#2D2D2D] border-[#3D3D3D] text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#2D2D2D] border-[#3D3D3D]">
                <SelectItem value="dietary">Dietary</SelectItem>
                <SelectItem value="physical">Physical/Motor</SelectItem>
                <SelectItem value="medical">Medical Conditions</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">
              {currentRestriction.category === "dietary"
                ? "What type of dietary restriction do you have?"
                : currentRestriction.category === "physical"
                  ? "What type of physical limitation do you have?"
                  : currentRestriction.category === "medical"
                    ? "What medical condition should we consider?"
                    : "Please specify your restriction:"}
            </h3>
            {currentRestriction.category === "other" ? (
              <Input
                value={currentRestriction.type}
                onChange={(e) => handleRestrictionChange("type", e.target.value)}
                placeholder="Specify your restriction"
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            ) : (
              <Select
                value={currentRestriction.type}
                onValueChange={(value) => {
                  handleRestrictionChange("type", value)
                  setRestrictionStep(3)
                }}
              >
                <SelectTrigger className="bg-[#2D2D2D] border-[#3D3D3D] text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2D2D2D] border-[#3D3D3D]">
                  {currentRestriction.category === "dietary" && (
                    <>
                      <SelectItem value="allergies">Allergies</SelectItem>
                      <SelectItem value="specific-diets">Specific Diets</SelectItem>
                    </>
                  )}
                  {currentRestriction.category === "physical" && (
                    <>
                      <SelectItem value="mobility">Mobility</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                    </>
                  )}
                  {currentRestriction.category === "medical" && (
                    <>
                      <SelectItem value="diabetes">Diabetes</SelectItem>
                      <SelectItem value="heart-condition">Heart Condition</SelectItem>
                      <SelectItem value="asthma">Asthma</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 bg-[#1A1A1A] rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Profile Details</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Basic Info and Profile Data - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Basic Info */}
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={personalInfo.basic.name}
                onChange={(e) => handleBasicChange("name", e.target.value)}
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="age" className="text-white">
                Age
              </Label>
              <Input
                id="age"
                value={personalInfo.basic.age}
                onChange={(e) => handleBasicChange("age", e.target.value)}
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-white">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                value={personalInfo.basic.weight}
                onChange={(e) => handleBasicChange("weight", e.target.value)}
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-white">
                Height (cm)
              </Label>
              <Input
                id="height"
                value={personalInfo.basic.height}
                onChange={(e) => handleBasicChange("height", e.target.value)}
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-white">
                Gender
              </Label>
              <Select
                value={personalInfo.basic.gender}
                onValueChange={(value) => handleBasicChange("gender", value)}
                disabled={!isEditing}
              >
                <SelectTrigger id="gender" className="bg-[#2D2D2D] border-[#3D3D3D] text-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-[#2D2D2D] border-[#3D3D3D]">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level" className="text-white">
                Fitness Level
              </Label>
              <Select
                value={personalInfo.basic.level}
                onValueChange={(value) => handleBasicChange("level", value)}
                disabled={!isEditing}
              >
                <SelectTrigger id="level" className="bg-[#2D2D2D] border-[#3D3D3D] text-white">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="bg-[#2D2D2D] border-[#3D3D3D]">
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio" className="text-white">
                Bio
              </Label>
              <Input
                id="bio"
                value={personalInfo.profile.bio || ""}
                onChange={(e) =>
                  setPersonalInfo({
                    ...personalInfo,
                    profile: { ...personalInfo.profile, bio: e.target.value },
                  })
                }
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="location" className="text-white">
                Location
              </Label>
              <Input
                id="location"
                value={personalInfo.profile.location || ""}
                onChange={(e) =>
                  setPersonalInfo({
                    ...personalInfo,
                    profile: { ...personalInfo.profile, location: e.target.value },
                  })
                }
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="profession" className="text-white">
                Profession
              </Label>
              <Input
                id="profession"
                value={personalInfo.profile.profession || ""}
                onChange={(e) =>
                  setPersonalInfo({
                    ...personalInfo,
                    profile: { ...personalInfo.profile, profession: e.target.value },
                  })
                }
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
            <div>
              <Label htmlFor="interests" className="text-white">
                Interests
              </Label>
              <Input
                id="interests"
                value={personalInfo.profile.interests || ""}
                onChange={(e) =>
                  setPersonalInfo({
                    ...personalInfo,
                    profile: { ...personalInfo.profile, interests: e.target.value },
                  })
                }
                disabled={!isEditing}
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals and Restrictions - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals */}
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Goals</h3>
          {isEditing && (
            <div className="flex mb-4">
              <Input
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Add a new goal"
                className="bg-[#2D2D2D] border-[#3D3D3D] text-white mr-2"
              />
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
              >
                Add
              </button>
            </div>
          )}
          <div className="space-y-2">
            {personalInfo.goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between bg-[#222222] p-2 rounded-md">
                {editingGoalId === goal.id ? (
                  <div className="flex-1 flex">
                    <Input
                      value={editingGoalText}
                      onChange={(e) => setEditingGoalText(e.target.value)}
                      className="bg-[#2D2D2D] border-[#3D3D3D] text-white mr-2"
                    />
                    <button
                      onClick={handleSaveGoalEdit}
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
                      onClick={() => handleEditGoal(goal.id)}
                      className="text-white hover:text-[#FF7939] transition mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
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

        {/* Restrictions */}
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Restricciones</h3>
          {isEditing && (
            <div className="mb-4">
              {restrictionStep <= 2 ? (
                <div className="bg-[#222222] p-4 rounded-md">{renderRestrictionForm()}</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="specification" className="text-white">
                      Please provide more details about your {currentRestriction.type}:
                    </Label>
                    <Input
                      id="specification"
                      value={currentRestriction.specification}
                      onChange={(e) => handleRestrictionChange("specification", e.target.value)}
                      className="bg-[#2D2D2D] border-[#3D3D3D] text-white mt-2"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddRestriction}
                      className="px-4 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
                    >
                      Add Restriction
                    </button>
                    <button
                      onClick={() => {
                        setRestrictionStep(0)
                        setCurrentRestriction({ category: "", type: "", specification: "" })
                      }}
                      className="px-4 py-2 bg-[#3D3D3D] text-white rounded-md hover:bg-[#4D4D4D] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            {personalInfo.restrictions.map((restriction, index) => (
              <div key={index} className="bg-[#222222] p-2 rounded-md flex justify-between">
                <div>
                  <span className="text-white capitalize">{restriction.category}: </span>
                  <span className="text-gray-300 capitalize">{restriction.type}</span>
                  {restriction.specification && <p className="text-sm text-gray-400">{restriction.specification}</p>}
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveRestriction(index)}
                    className="text-white hover:text-[#FF7939] transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {personalInfo.restrictions.length === 0 && <p className="text-gray-400">No restrictions added yet.</p>}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}
