import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PersonalInfoState } from "../types"

interface BasicInfoTabProps {
    isEditing: boolean
    personalInfo: PersonalInfoState
    handleBasicChange: (field: string, value: string) => void
    setIsEditing: (isEditing: boolean) => void
}

export function BasicInfoTab({ isEditing, personalInfo, handleBasicChange, setIsEditing }: BasicInfoTabProps) {
    return (
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
    )
}
