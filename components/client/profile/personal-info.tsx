"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from '@/lib/supabase/supabase-client'
import { User, Edit2, Save, X, Check } from "lucide-react"

type Restriction = {
  category: string
  type: string
  specification: string
}

type NutritionJourneyItem = {
  type: "meal" | "action"
  description: string
}

type ProfileInfo = {
  bio?: string
  location?: string
  profession?: string
  interests?: string
}

export function PersonalInfo() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [personalInfo, setPersonalInfo] = useState({
    basic: {
      birthDate: "",
      weight: "",
      height: "",
      gender: "",
    },
    goals: {
      objectives: "",
      estimatedTime: "",
      fatPercentage: "",
      musclePercentage: "",
    },
    sports: [] as string[],
    restrictions: [] as Restriction[],
    profile: {} as ProfileInfo,
  })

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getSession().then(({ data }) => ({ data: { user: data.session?.user } }))
        if (!user) return

        const { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single()

        if (client) {
          setPersonalInfo({
            basic: {
              birthDate: client.birth_date ? client.birth_date.split('T')[0] : "",
              weight: client.weight ? client.weight.toString() : "",
              height: client.Height ? client.Height.toString() : "",
              gender: client.Genre || "",
            },
            goals: {
              objectives: (client.fitness_goals || []).join(', '),
              estimatedTime: "", // Not persisted in clients table
              fatPercentage: "",
              musclePercentage: "",
            },
            sports: client.sports || [],
            restrictions: [], // Not persisted yet
            profile: {
              bio: client.description || "",
              location: client.location || "",
              profession: "",
              interests: "",
            }
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [currentRestriction, setCurrentRestriction] = useState<Restriction>({
    category: "",
    type: "",
    specification: "",
  })
  const [restrictionStep, setRestrictionStep] = useState(0)

  const FITNESS_GOALS_OPTIONS = [
    "Subir de peso",
    "Bajar de peso",
    "Quemar grasas",
    "Ganar masa muscular",
    "Mejorar condición física",
    "Tonificar",
    "Mejorar flexibilidad",
    "Reducir estrés",
    "Controlar respiración",
    "Corregir postura",
    "Meditación y Mindfulness",
    "Equilibrio corporal",
    "Aumentar resistencia",
    "Salud articular"
  ]
  const SPORTS_OPTIONS = [
    "Fútbol",
    "Tenis",
    "Padel",
    "Natación",
    "Running",
    "Crossfit",
    "Yoga",
    "Pilates",
    "Ciclismo",
    "Boxeo",
    "Artes Marciales",
    "Gimnasio",
    "Básquet",
    "Vóley",
    "Patinaje",
    "Golf",
    "Escalada",
    "Surf",
    "Otro"
  ]

  const CONTRADICTORY_GOALS: Record<string, string[]> = {
    "Subir de peso": ["Bajar de peso", "Quemar grasas"],
    "Bajar de peso": ["Subir de peso", "Ganar masa muscular"],
    "Quemar grasas": ["Subir de peso"],
    "Ganar masa muscular": ["Bajar de peso"]
  }

  const [nutritionJourney, setNutritionJourney] = useLocalStorage<Record<string, NutritionJourneyItem[]>>(
    "nutritionJourney",
    {},
  )
  const [newNutritionItem, setNewNutritionItem] = useState("")
  const [nutritionItemType, setNutritionItemType] = useState<NutritionJourneyItem["type"]>("meal")

  const handleBasicChange = (field: string, value: string) => {
    setPersonalInfo({ ...personalInfo, basic: { ...personalInfo.basic, [field]: value } })
  }

  const handleGoalsChange = (field: string, value: string) => {
    setPersonalInfo({ ...personalInfo, goals: { ...personalInfo.goals, [field]: value } })
  }

  const handleRestrictionChange = (field: string, value: string) => {
    setCurrentRestriction({ ...currentRestriction, [field]: value })
  }

  const handleSportsChange = (sport: string) => {
    let newSports = [...(personalInfo.sports || [])]
    if (newSports.includes(sport)) {
      newSports = newSports.filter(s => s !== sport)
    } else {
      newSports.push(sport)
    }
    setPersonalInfo({ ...personalInfo, sports: newSports })
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

  const handleSave = async () => {
    setIsEditing(false)
    try {
      const { data: { user } } = await supabase.auth.getSession().then(({ data }) => ({ data: { user: data.session?.user } }))
      if (!user) return

      const updates = {
        birth_date: personalInfo.basic.birthDate || null,
        weight: personalInfo.basic.weight ? parseFloat(personalInfo.basic.weight) : null,
        Height: personalInfo.basic.height ? parseFloat(personalInfo.basic.height) : null,
        Genre: personalInfo.basic.gender,
        fitness_goals: personalInfo.goals.objectives.split(', ').filter(Boolean),
        sports: personalInfo.sports,
        description: personalInfo.profile.bio,
        location: personalInfo.profile.location,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('clients').update(updates).eq('id', user.id)

      if (error) throw error
      console.log("Profile updated successfully")
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }

  const renderRestrictionForm = () => {
    switch (restrictionStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Do you have any limitations or restrictions we should consider?</h3>
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
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">What category does your limitation fall under?</h3>
            <Select
              value={currentRestriction.category}
              onValueChange={(value) => {
                handleRestrictionChange("category", value)
                setRestrictionStep(2)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
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
            <h3 className="font-semibold">
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
              />
            ) : (
              <Select
                value={currentRestriction.type}
                onValueChange={(value) => {
                  handleRestrictionChange("type", value)
                  setRestrictionStep(3)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {currentRestriction.category === "dietary" && (
                    <>
                      <SelectItem value="allergies">Allergies</SelectItem>
                      <SelectItem value="specific-diets">Specific Diets</SelectItem>
                      <SelectItem value="religion-culture">Religion/Culture</SelectItem>
                      <SelectItem value="textures">Textures</SelectItem>
                    </>
                  )}
                  {currentRestriction.category === "physical" && (
                    <>
                      <SelectItem value="reduced-mobility">Reduced Mobility</SelectItem>
                      <SelectItem value="joint-issues">Joint Issues</SelectItem>
                      <SelectItem value="visual-impairment">Visual Impairment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                  {currentRestriction.category === "medical" && (
                    <>
                      <SelectItem value="diabetes">Diabetes (glycemic control)</SelectItem>
                      <SelectItem value="hypertension">Hypertension (low sodium)</SelectItem>
                      <SelectItem value="gastrointestinal">Gastrointestinal Diseases (low fiber)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
            {currentRestriction.category === "other" && <Button onClick={() => setRestrictionStep(3)}>Next</Button>}
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">
              Please provide more details about your {currentRestriction.type} restriction:
            </h3>
            <Input
              value={currentRestriction.specification}
              onChange={(e) => handleRestrictionChange("specification", e.target.value)}
              placeholder="Enter details"
            />
            <div className="flex justify-between">
              <Button onClick={handleAddRestriction}>Save Restriction</Button>
              <Button variant="outline" onClick={() => setRestrictionStep(0)}>
                Cancel
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const addNutritionItem = (item: NutritionJourneyItem) => {
    const currentDate = format(new Date(), "yyyy-MM-dd")
    setNutritionJourney((prev) => ({
      ...prev,
      [currentDate]: [...(prev[currentDate] || []), item],
    }))
  }

  const removeNutritionItem = (index: number) => {
    const currentDate = format(new Date(), "yyyy-MM-dd")
    setNutritionJourney((prev) => ({
      ...prev,
      [currentDate]: prev[currentDate].filter((_, i) => i !== index),
    }))
  }

  const handleAddNutritionItem = () => {
    if (newNutritionItem.trim() === "") return
    addNutritionItem({ type: nutritionItemType, description: newNutritionItem })
    setNewNutritionItem("")
  }

  const renderNutritionJourney = () => {
    const currentDate = format(new Date(), "yyyy-MM-dd")
    const journeyItems = nutritionJourney[currentDate] || []

    return (
      <div className="space-y-2">
        {journeyItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <span>
              {item.type === "meal" ? "🍽️" : "💪"} {item.description}
            </span>
            <Button variant="ghost" size="sm" onClick={() => removeNutritionItem(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] border-none shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-[#2D2D2D] to-[#232323] pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full bg-gradient-to-r from-[#FF7939] to-[#FF5C00]/80">
              <User className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-medium">Personal Information</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-white hover:bg-[#FF7939]/20 hover:text-white"
          >
            {isEditing ? <Save className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
            {isEditing ? "Save" : "Edit"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          // Scroll hacia arriba cuando se cambia de tab
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 100)
        }}>
          <TabsList className="grid w-full grid-cols-4 bg-[#2D2D2D] p-1">
            <TabsTrigger value="basic" className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white">
              Basic
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white">
              Goals
            </TabsTrigger>
            <TabsTrigger
              value="restrictions"
              className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white"
            >
              Restrictions
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white">
              About Me
            </TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <div className="space-y-4 p-2">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birthDate" className="text-gray-300">
                        Date of Birth
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={personalInfo.basic.birthDate}
                        onChange={(e) => handleBasicChange("birthDate", e.target.value)}
                        className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939] color-scheme-dark"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight" className="text-gray-300">
                        Weight (kg)
                      </Label>
                      <Input
                        id="weight"
                        value={personalInfo.basic.weight}
                        onChange={(e) => handleBasicChange("weight", e.target.value)}
                        className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="height" className="text-gray-300">
                        Height (cm)
                      </Label>
                      <Input
                        id="height"
                        value={personalInfo.basic.height}
                        onChange={(e) => handleBasicChange("height", e.target.value)}
                        className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender" className="text-gray-300">
                        Gender
                      </Label>
                      <Select
                        value={personalInfo.basic.gender}
                        onValueChange={(value) => handleBasicChange("gender", value)}
                      >
                        <SelectTrigger id="gender" className="bg-[#2D2D2D] border-[#3D3D3D]">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2D2D2D] border-[#3D3D3D]">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-1 text-sm">Age</div>
                    {personalInfo.basic.birthDate ? (
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          const today = new Date();
                          const birthDate = new Date(personalInfo.basic.birthDate);
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          return age;
                        })()}
                      </div>
                    ) : (
                      <div className="text-lg text-gray-500 italic">Not set</div>
                    )}
                  </div>
                  <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-1 text-sm">Weight</div>
                    {personalInfo.basic.weight ? (
                      <div className="text-2xl font-bold text-white">
                        {personalInfo.basic.weight} <span className="text-sm text-gray-400">kg</span>
                      </div>
                    ) : (
                      <div className="text-lg text-gray-500 italic">Not set</div>
                    )}
                  </div>
                  <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-1 text-sm">Height</div>
                    {personalInfo.basic.height ? (
                      <div className="text-2xl font-bold text-white">
                        {personalInfo.basic.height} <span className="text-sm text-gray-400">cm</span>
                      </div>
                    ) : (
                      <div className="text-lg text-gray-500 italic">Not set</div>
                    )}
                  </div>
                  <div className="bg-[#2D2D2D]/50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-1 text-sm">Gender</div>
                    {personalInfo.basic.gender ? (
                      <div className="text-2xl font-bold text-white capitalize">{personalInfo.basic.gender}</div>
                    ) : (
                      <div className="text-lg text-gray-500 italic">Not set</div>
                    )}
                  </div>
                </div>
              )}
              {!isEditing &&
                !personalInfo.basic.birthDate &&
                !personalInfo.basic.weight &&
                !personalInfo.basic.height &&
                !personalInfo.basic.gender && (
                  <div className="mt-4 p-4 border border-dashed border-[#FF7939]/30 rounded-lg bg-[#FF7939]/5 text-center">
                    <p className="text-gray-300">Complete your profile to get personalized recommendations</p>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="mt-2 bg-gradient-to-r from-[#FF7939] to-[#FF5C00] hover:from-[#FF5C00] hover:to-[#FF7939] text-white"
                    >
                      Complete Profile
                    </Button>
                  </div>
                )}
            </div>
          </TabsContent>
          <TabsContent value="goals">
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
                                  // Double check contradiction before adding
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
          </TabsContent>
          <TabsContent value="restrictions">
            <div className="space-y-4 p-2">
              {isEditing ? (
                <>
                  <div className="bg-[#2D2D2D]/50 p-4 rounded-lg">{renderRestrictionForm()}</div>
                  {personalInfo.restrictions.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2 text-gray-300">Current Restrictions:</h3>
                      <div className="space-y-2">
                        {personalInfo.restrictions.map((restriction, index) => (
                          <div key={index} className="flex justify-between items-center bg-[#2D2D2D] p-3 rounded-lg">
                            <div>
                              <span className="text-[#FF7939] font-medium capitalize">{restriction.category}</span>
                              <span className="text-gray-400"> - </span>
                              <span className="text-white capitalize">{restriction.type}</span>
                              <p className="text-gray-400 text-sm mt-1">{restriction.specification}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRestriction(index)}
                              className="text-gray-400 hover:text-white hover:bg-red-500/20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {personalInfo.restrictions.length > 0 ? (
                    <div className="space-y-3">
                      {personalInfo.restrictions.map((restriction, index) => (
                        <div key={index} className="bg-[#2D2D2D]/50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#FF7939] mr-2"></div>
                            <span className="text-[#FF7939] font-medium capitalize">{restriction.category}</span>
                            <span className="text-gray-400 mx-2">-</span>
                            <span className="text-white capitalize">{restriction.type}</span>
                          </div>
                          <p className="text-gray-300 text-sm pl-4">{restriction.specification}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-[#FF7939]/30 rounded-lg bg-[#FF7939]/5 text-center">
                      <p className="text-gray-300 mb-2">No restrictions added yet</p>
                      <p className="text-gray-400 text-sm mb-4">
                        Add any dietary, physical, or medical restrictions to help us personalize your experience
                      </p>
                      <Button
                        onClick={() => {
                          setIsEditing(true)
                          setActiveTab("restrictions")
                        }}
                        className="bg-gradient-to-r from-[#FF7939] to-[#FF5C00] hover:from-[#FF5C00] hover:to-[#FF7939] text-white"
                      >
                        Add Restrictions
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="profile">
            <div className="space-y-4 p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Profile Summary</h3>
                {isEditing && <div className="text-sm text-gray-400">Tell us about yourself</div>}
              </div>

              {isEditing ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio" className="text-gray-300">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={personalInfo.profile?.bio || ""}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            profile: { ...personalInfo.profile, bio: e.target.value },
                          })
                        }
                        placeholder="Write a short bio about yourself..."
                        className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939] min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location" className="text-gray-300">
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={personalInfo.profile?.location || ""}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              profile: { ...personalInfo.profile, location: e.target.value },
                            })
                          }
                          placeholder="City, Country"
                          className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profession" className="text-gray-300">
                          Profession
                        </Label>
                        <Input
                          id="profession"
                          value={personalInfo.profile?.profession || ""}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              profile: { ...personalInfo.profile, profession: e.target.value },
                            })
                          }
                          placeholder="Your profession"
                          className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="interests" className="text-gray-300">
                        Fitness Interests
                      </Label>
                      <Input
                        id="interests"
                        value={personalInfo.profile?.interests || ""}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            profile: { ...personalInfo.profile, interests: e.target.value },
                          })
                        }
                        placeholder="Running, Yoga, Weightlifting, etc."
                        className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-300">Sports</Label>
                    <div className="max-h-[220px] overflow-y-auto pr-2 thin-scrollbar bg-black/20 rounded-xl p-2 border border-white/5">
                      <div className="grid grid-cols-2 gap-2">
                        {SPORTS_OPTIONS.map((sport) => {
                          const currentSports = personalInfo.sports || []
                          const isSelected = currentSports.includes(sport)

                          return (
                            <button
                              key={sport}
                              type="button"
                              onClick={() => handleSportsChange(sport)}
                              className={`py-2 px-3 text-[11px] rounded-lg border text-left transition-all duration-300 flex items-center gap-2 ${isSelected
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)]'
                                : 'border-white/5 bg-black/20 text-gray-400 hover:border-white/20'
                                }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#FF7939] bg-[#FF7939]' : 'border-gray-600'}`}>
                                {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className="truncate">{sport}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
            </>
            ) : (
            <>
              {personalInfo.profile?.bio ||
                personalInfo.profile?.location ||
                personalInfo.profile?.profession ||
                personalInfo.profile?.interests ? (
                <div className="space-y-4">
                  {personalInfo.profile?.bio && (
                    <div className="bg-[#2D2D2D]/50 p-4 rounded-lg">
                      <p className="text-white leading-relaxed">{personalInfo.profile.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {personalInfo.profile?.location && (
                      <div className="bg-[#2D2D2D]/50 p-4 rounded-lg">
                        <div className="text-gray-400 mb-1 text-sm">Location</div>
                        <div className="text-white font-medium">{personalInfo.profile.location}</div>
                      </div>
                    )}

                    {personalInfo.profile?.profession && (
                      <div className="bg-[#2D2D2D]/50 p-4 rounded-lg">
                        <div className="text-gray-400 mb-1 text-sm">Profession</div>
                        <div className="text-white font-medium">{personalInfo.profile.profession}</div>
                      </div>
                    )}
                  </div>

                  {personalInfo.profile?.interests && (
                    <div className="bg-[#2D2D2D]/50 p-4 rounded-lg">
                      <div className="text-gray-400 mb-1 text-sm">Fitness Interests</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {personalInfo.profile.interests.split(",").map((interest, index) => (
                          <span key={index} className="bg-[#FF7939]/20 text-[#FF7939] px-2 py-1 rounded-md text-sm">
                            {interest.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {personalInfo.sports && personalInfo.sports.length > 0 && (
                    <div className="bg-[#2D2D2D]/50 p-4 rounded-lg">
                      <div className="text-gray-400 mb-1 text-sm">Sports</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {personalInfo.sports.map((sport, index) => (
                          <span key={index} className="bg-[#FF7939]/20 text-[#FF7939] px-2 py-1 rounded-md text-sm">
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-[#FF7939]/30 rounded-lg bg-[#FF7939]/5 text-center">
                  <p className="text-gray-300 mb-2">Your profile is empty</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Add information about yourself to complete your profile
                  </p>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-[#FF7939] to-[#FF5C00] hover:from-[#FF5C00] hover:to-[#FF7939] text-white"
                  >
                    Complete Profile
                  </Button>
                </div>
              )}
            </>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
    </Card >
  )
}
