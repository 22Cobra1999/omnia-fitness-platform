import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfileData } from '../types'

interface BasicInfoSectionProps {
    data: ProfileData
    onChange: (updates: Partial<ProfileData>) => void
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2 space-y-4">
                <div className="group">
                    <Label htmlFor="full_name" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939]">Nombre completo</Label>
                    <Input
                        id="full_name"
                        value={data.full_name}
                        onChange={(e) => onChange({ full_name: e.target.value })}
                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 text-sm"
                        placeholder="Tu nombre"
                    />
                </div>
                <div className="group">
                    <Label htmlFor="location" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939]">Ubicación</Label>
                    <Input
                        id="location"
                        value={data.location}
                        onChange={(e) => onChange({ location: e.target.value })}
                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 text-sm"
                        placeholder="Ciudad, País"
                    />
                </div>
            </div>
        </div>
    )
}
