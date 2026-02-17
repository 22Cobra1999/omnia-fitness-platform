import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfileInfo } from "@/components/client/hooks/useClientProfile"

interface AdditionalInfoSectionProps {
    data: ProfileInfo
    onChange: (field: string, value: string) => void
    isEditing: boolean
}

export function AdditionalInfoSection({ data, onChange, isEditing }: AdditionalInfoSectionProps) {
    return (
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="bio" className="text-white">Bio</Label>
                    <Input
                        id="bio"
                        value={data.bio || ""}
                        onChange={(e) => onChange("bio", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="location" className="text-white">Location</Label>
                    <Input
                        id="location"
                        value={data.location || ""}
                        onChange={(e) => onChange("location", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="profession" className="text-white">Profession</Label>
                    <Input
                        id="profession"
                        value={data.profession || ""}
                        onChange={(e) => onChange("profession", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="interests" className="text-white">Interests</Label>
                    <Input
                        id="interests"
                        value={data.interests || ""}
                        onChange={(e) => onChange("interests", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
            </div>
        </div>
    )
}
