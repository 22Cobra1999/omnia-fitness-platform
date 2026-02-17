import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Restriction, useClientProfile } from "@/components/client/hooks/useClientProfile"

interface RestrictionsSectionProps {
    restrictions: Restriction[]
    draft: Restriction
    step: number
    actions: ReturnType<typeof useClientProfile>['actions']['restrictions']
    isEditing: boolean
}

export function RestrictionsSection({ restrictions, draft, step, actions, isEditing }: RestrictionsSectionProps) {

    const renderRestrictionForm = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-white">
                            Do you have any limitations or restrictions we should consider?
                        </h3>
                        <RadioGroup
                            onValueChange={(value) => {
                                if (value === "yes") {
                                    actions.setStep(1)
                                } else {
                                    actions.setStep(0)
                                    actions.resetDraft()
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
                            value={draft.category}
                            onValueChange={(value) => {
                                actions.updateDraft("category", value)
                                actions.setStep(2)
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
                            {draft.category === "dietary"
                                ? "What type of dietary restriction do you have?"
                                : draft.category === "physical"
                                    ? "What type of physical limitation do you have?"
                                    : draft.category === "medical"
                                        ? "What medical condition should we consider?"
                                        : "Please specify your restriction:"}
                        </h3>
                        {draft.category === "other" ? (
                            <Input
                                value={draft.type}
                                onChange={(e) => actions.updateDraft("type", e.target.value)}
                                placeholder="Specify your restriction"
                                className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                            />
                        ) : (
                            <Select
                                value={draft.type}
                                onValueChange={(value) => {
                                    actions.updateDraft("type", value)
                                    actions.setStep(3)
                                }}
                            >
                                <SelectTrigger className="bg-[#2D2D2D] border-[#3D3D3D] text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2D2D2D] border-[#3D3D3D]">
                                    {draft.category === "dietary" && (
                                        <>
                                            <SelectItem value="allergies">Allergies</SelectItem>
                                            <SelectItem value="specific-diets">Specific Diets</SelectItem>
                                        </>
                                    )}
                                    {draft.category === "physical" && (
                                        <>
                                            <SelectItem value="mobility">Mobility</SelectItem>
                                            <SelectItem value="strength">Strength</SelectItem>
                                            <SelectItem value="endurance">Endurance</SelectItem>
                                        </>
                                    )}
                                    {draft.category === "medical" && (
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
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Restricciones</h3>
            {isEditing && (
                <div className="mb-4">
                    {step <= 2 ? (
                        <div className="bg-[#222222] p-4 rounded-md">{renderRestrictionForm()}</div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="specification" className="text-white">
                                    Please provide more details about your {draft.type}:
                                </Label>
                                <Input
                                    id="specification"
                                    value={draft.specification}
                                    onChange={(e) => actions.updateDraft("specification", e.target.value)}
                                    className="bg-[#2D2D2D] border-[#3D3D3D] text-white mt-2"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={actions.add}
                                    className="px-4 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
                                >
                                    Add Restriction
                                </button>
                                <button
                                    onClick={() => {
                                        actions.setStep(0)
                                        actions.resetDraft()
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
                {restrictions.map((restriction, index) => (
                    <div key={index} className="bg-[#222222] p-2 rounded-md flex justify-between">
                        <div>
                            <span className="text-white capitalize">{restriction.category}: </span>
                            <span className="text-gray-300 capitalize">{restriction.type}</span>
                            {restriction.specification && <p className="text-sm text-gray-400">{restriction.specification}</p>}
                        </div>
                        {isEditing && (
                            <button
                                onClick={() => actions.remove(index)}
                                className="text-white hover:text-[#FF7939] transition"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
                {restrictions.length === 0 && <p className="text-gray-400">No restrictions added yet.</p>}
            </div>
        </div>
    )
}
