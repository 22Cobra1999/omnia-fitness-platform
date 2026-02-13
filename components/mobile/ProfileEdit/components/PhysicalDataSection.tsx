import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from 'lucide-react'
import { ProfileData, ProfileEditErrors } from '../types'

interface PhysicalDataSectionProps {
    data: ProfileData
    onChange: (updates: Partial<ProfileData>) => void
    errors: ProfileEditErrors
}

export function PhysicalDataSection({ data, onChange, errors }: PhysicalDataSectionProps) {
    return (
        <>
            <div className="flex items-center gap-2 mb-2 mt-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="p-2 rounded-full bg-white/5 border border-white/10 text-[#FF7939]">
                    <User className="h-4 w-4" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="group">
                    <Label htmlFor="birth_date" className="text-[10px] uppercase tracking-widest text-gray-500">Fecha nacimiento</Label>
                    <Input
                        id="birth_date"
                        type="date"
                        value={data.birth_date}
                        onChange={(e) => onChange({ birth_date: e.target.value })}
                        className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] w-full text-sm font-medium"
                    />
                </div>

                <div className="group">
                    <Label htmlFor="gender" className="text-[10px] uppercase tracking-widest text-gray-500">Género</Label>
                    <Select value={data.gender} onValueChange={(value) => onChange({ gender: value })}>
                        <SelectTrigger className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus:ring-0 focus:border-[#FF7939] text-sm">
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1C1F] border-white/10 text-white">
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                            <SelectItem value="O">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="group">
                    <Label htmlFor="weight" className="text-[10px] uppercase tracking-widest text-gray-500">Peso (kg)</Label>
                    <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={data.weight}
                        onChange={(e) => onChange({ weight: e.target.value })}
                        className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] text-sm ${errors.weight ? "border-red-500" : ""}`}
                        placeholder="0.0"
                    />
                </div>

                <div className="group">
                    <Label htmlFor="height" className="text-[10px] uppercase tracking-widest text-gray-500">Altura (cm)</Label>
                    <Input
                        id="height"
                        type="number"
                        value={data.height}
                        onChange={(e) => onChange({ height: e.target.value })}
                        className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] text-sm ${errors.height ? "border-red-500" : ""}`}
                        placeholder="0"
                    />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-6 pt-2">
                    <div className="group">
                        <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest text-gray-500">Teléfono</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={(e) => onChange({ phone: e.target.value })}
                            className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] text-sm"
                            placeholder="+00 000 0000"
                        />
                    </div>
                    <div className="group">
                        <Label htmlFor="emergency" className="text-[10px] uppercase tracking-widest text-gray-500">Emergencia</Label>
                        <Input
                            id="emergency"
                            value={data.emergency_contact}
                            onChange={(e) => onChange({ emergency_contact: e.target.value.replace(/[^0-9+\s()-]/g, '') })}
                            className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] text-sm ${errors.emergency_contact ? "border-red-500" : ""}`}
                            placeholder="+00 000 0000"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
