import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BasicInfo } from "@/components/client/hooks/useClientProfile"

interface BasicInfoSectionProps {
    data: BasicInfo
    onChange: (field: string, value: string) => void
    isEditing: boolean
}

export function BasicInfoSection({ data, onChange, isEditing }: BasicInfoSectionProps) {
    return (
        <div className="bg-[#2D2D2D] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => onChange("name", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="age" className="text-white">Age</Label>
                    <Input
                        id="age"
                        value={data.age}
                        onChange={(e) => onChange("age", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="weight" className="text-white">Weight (kg)</Label>
                    <Input
                        id="weight"
                        value={data.weight}
                        onChange={(e) => onChange("weight", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="height" className="text-white">Height (cm)</Label>
                    <Input
                        id="height"
                        value={data.height}
                        onChange={(e) => onChange("height", e.target.value)}
                        disabled={!isEditing}
                        className="bg-[#2D2D2D] border-[#3D3D3D] text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="gender" className="text-white">Gender</Label>
                    <Select
                        value={data.gender}
                        onValueChange={(value) => onChange("gender", value)}
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
                    <Label htmlFor="level" className="text-white">Fitness Level</Label>
                    <Select
                        value={data.level}
                        onValueChange={(value) => onChange("level", value)}
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
    )
}
