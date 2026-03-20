import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfileData } from '../types'
import { User, MapPin, Phone, Calendar } from "lucide-react"

interface BasicInfoSectionProps {
    data: ProfileData
    onChange: (updates: Partial<ProfileData>) => void
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-5">
                {/* NOMBRE */}
                <div className="group">
                    <Label htmlFor="full_name" className="text-[9px] uppercase tracking-[0.2em] text-white/20 group-focus-within:text-[#FF7939] transition-colors flex items-center gap-2">
                        <User className="w-3 h-3" /> Nombre completo
                    </Label>
                    <Input
                        id="full_name"
                        value={data.full_name}
                        onChange={(e) => onChange({ full_name: e.target.value })}
                        className="bg-transparent border-0 border-b border-white/5 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-800 text-sm font-medium italic transition-all"
                        placeholder="Tu identidad..."
                    />
                </div>

                {/* GEOGRAFÍA TRIPLE */}
                <div className="grid grid-cols-1 gap-4 bg-zinc-900/40 p-5 rounded-3xl border border-white/5">
                    <div className="group">
                        <Label htmlFor="country" className="text-[9px] uppercase tracking-[0.2em] text-[#FF7939] font-black italic flex items-center gap-2 mb-2">
                            <MapPin className="w-3 h-3" /> País
                        </Label>
                        <Input
                            id="country"
                            value={data.country || ""}
                            onChange={(e) => onChange({ country: e.target.value })}
                            className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-1 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-white/5 text-[11px] font-bold"
                            placeholder="Ej: Argentina"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <Label htmlFor="city" className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-2 block">Ciudad</Label>
                            <Input
                                id="city"
                                value={data.city || ""}
                                onChange={(e) => onChange({ city: e.target.value })}
                                className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-1 h-auto text-white focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/5 text-[11px] font-bold"
                                placeholder="Ciudad..."
                            />
                        </div>
                        <div className="group">
                            <Label htmlFor="neighborhood" className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-2 block">Barrio</Label>
                            <Input
                                id="neighborhood"
                                value={data.neighborhood || ""}
                                onChange={(e) => onChange({ neighborhood: e.target.value })}
                                className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-1 h-auto text-white focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/5 text-[11px] font-bold"
                                placeholder="Barrio..."
                            />
                        </div>
                    </div>
                </div>

                {/* FECHA NACIMIENTO */}
                <div className="group">
                    <Label htmlFor="birth_date" className="text-[9px] uppercase tracking-[0.2em] text-white/20 group-focus-within:text-[#FF7939] transition-colors flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Fecha de Nacimiento
                    </Label>
                    <Input
                        id="birth_date"
                        type="date"
                        value={data.birth_date}
                        onChange={(e) => onChange({ birth_date: e.target.value })}
                        className="bg-transparent border-0 border-b border-white/5 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] text-sm font-medium [color-scheme:dark]"
                    />
                </div>
            </div>
        </div>
    )
}
