import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { PersonalInfoState } from "../types"
import { SPORTS_OPTIONS } from "../constants"

interface AboutMeTabProps {
    isEditing: boolean
    personalInfo: PersonalInfoState
    handleProfileChange: (field: string, value: string) => void
    handleSportsChange: (sport: string) => void
    setIsEditing: (isEditing: boolean) => void
}

export function AboutMeTab({
    isEditing,
    personalInfo,
    handleProfileChange,
    handleSportsChange,
    setIsEditing
}: AboutMeTabProps) {
    return (
        <div className="space-y-4 p-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Profile Summary</h3>
                {isEditing && <div className="text-sm text-gray-400">Tell us about yourself</div>}
            </div>

            {isEditing ? (
                <>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                            <Textarea
                                id="bio"
                                value={personalInfo.profile?.bio || ""}
                                onChange={(e) => handleProfileChange("bio", e.target.value)}
                                placeholder="Write a short bio about yourself..."
                                className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939] min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="location" className="text-gray-300">Location</Label>
                                <Input
                                    id="location"
                                    value={personalInfo.profile?.location || ""}
                                    onChange={(e) => handleProfileChange("location", e.target.value)}
                                    placeholder="City, Country"
                                    className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                                />
                            </div>
                            <div>
                                <Label htmlFor="profession" className="text-gray-300">Profession</Label>
                                <Input
                                    id="profession"
                                    value={personalInfo.profile?.profession || ""}
                                    onChange={(e) => handleProfileChange("profession", e.target.value)}
                                    placeholder="Your profession"
                                    className="bg-[#2D2D2D] border-[#3D3D3D] focus:border-[#FF7939]"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="interests" className="text-gray-300">Fitness Interests</Label>
                            <Input
                                id="interests"
                                value={personalInfo.profile?.interests || ""}
                                onChange={(e) => handleProfileChange("interests", e.target.value)}
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
    )
}
