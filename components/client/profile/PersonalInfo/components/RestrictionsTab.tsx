import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X } from "lucide-react"
import { PersonalInfoState, Restriction } from "../types"

interface RestrictionsTabProps {
    isEditing: boolean
    personalInfo: PersonalInfoState
    currentRestriction: Restriction
    restrictionStep: number
    setRestrictionStep: (step: number) => void
    handleRestrictionChange: (field: string, value: string) => void
    handleAddRestriction: () => void
    handleRemoveRestriction: (index: number) => void
    setIsEditing: (isEditing: boolean) => void
    setActiveTab: (tab: string) => void
}

export function RestrictionsTab({
    isEditing,
    personalInfo,
    currentRestriction,
    restrictionStep,
    setRestrictionStep,
    handleRestrictionChange,
    handleAddRestriction,
    handleRemoveRestriction,
    setIsEditing,
    setActiveTab
}: RestrictionsTabProps) {

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
                                    handleRestrictionChange("category", "")
                                    handleRestrictionChange("type", "")
                                    handleRestrictionChange("specification", "")
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

    return (
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
    )
}
