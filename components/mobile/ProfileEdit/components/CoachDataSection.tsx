import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ProfileData } from '../types'
import { Star, Smartphone, Instagram, Coffee, Video, Briefcase, Award, Plus, X } from "lucide-react"
import { useState } from "react"

interface CoachDataSectionProps {
    data: ProfileData
    onChange: (updates: Partial<ProfileData>) => void
}

const COMMON_SPECIALTIES = [
    'Fútbol', 'Fitness', 'Musculación', 'Yoga', 'Pilates',
    'CrossFit', 'Running', 'Funcional', 'Preparación Física', 'Rehabilitación'
]

export function CoachDataSection({ data, onChange }: CoachDataSectionProps) {
    const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false)

    const specs = data.specialization
        ? data.specialization.split(',').map(s => s.trim()).filter(Boolean)
        : []

    const toggleSpecialty = (spec: string) => {
        if (specs.includes(spec)) {
            onChange({ specialization: specs.filter(s => s !== spec).join(', ') })
        } else {
            onChange({ specialization: [...specs, spec].join(', ') })
        }
    }

    const availableSpecialties = COMMON_SPECIALTIES.filter(s => !specs.includes(s))

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="group">
                    <Label htmlFor="bio" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] mb-2 block">Bio / Presentación</Label>
                    <Textarea
                        id="bio"
                        value={data.bio}
                        onChange={(e) => onChange({ bio: e.target.value })}
                        className="bg-white/5 border-white/10 rounded-xl px-4 py-3 h-24 text-white focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-gray-700 text-sm"
                        placeholder="Contale a tus alumnos sobre vos, tu experiencia y tu filosofía de entrenamiento..."
                    />
                </div>

                <div className="group">
                    <Label htmlFor="experience_years" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] mb-2 block flex items-center gap-1">
                        <Award className="w-3 h-3" /> Años de Experiencia
                    </Label>
                    <Input
                        id="experience_years"
                        type="number"
                        value={data.experience_years}
                        onChange={(e) => onChange({ experience_years: e.target.value })}
                        className="bg-white/5 border-white/10 rounded-xl px-4 h-12 text-white focus:ring-[#FF7939]/30 focus:border-[#FF7939]/50 transition-all placeholder:text-gray-700 text-sm"
                        placeholder="Ej: 5"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Label className="text-[10px] uppercase tracking-widest text-[#FF7939] flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Especialidades
                        </Label>
                        <button type="button" onClick={() => setIsSpecialtiesOpen(!isSpecialtiesOpen)} className="w-6 h-6 rounded-full bg-[#FF7939]/10 text-[#FF7939] flex items-center justify-center">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {specs.map((s, i) => (
                            <div key={i} onClick={() => toggleSpecialty(s)} className="cursor-pointer flex items-center gap-1.5 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1 text-xs font-bold uppercase transition-all hover:scale-105">
                                <span>{s}</span><X className="h-3 w-3 opacity-50" />
                            </div>
                        ))}
                    </div>

                    {isSpecialtiesOpen && (
                        <div className="mt-4 grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableSpecialties.map((s) => (
                                <button key={s} type="button" onClick={() => toggleSpecialty(s)} className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors border border-white/5">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-[10px] uppercase tracking-widest text-[#FF7939] font-black italic">Servicios y Monetización</h4>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
                    {/* Cafecito / Invítame un café */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-xl">
                                <Coffee className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase italic">Café</p>
                                <p className="text-[9px] text-white/30 uppercase font-bold">Activar propinas</p>
                            </div>
                        </div>
                        <Switch
                            checked={data.cafe_enabled}
                            onCheckedChange={(checked) => onChange({ cafe_enabled: checked })}
                        />
                    </div>
                    {data.cafe_enabled && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="cafe" className="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Valor del Café (ARS)</Label>
                            <Input
                                id="cafe"
                                type="number"
                                value={data.cafe}
                                onChange={(e) => onChange({ cafe: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl px-4 h-10 text-white text-sm"
                                placeholder="7000"
                            />
                        </div>
                    )}

                    {/* Meet 1:1 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Video className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase italic">Meet 1h</p>
                                <p className="text-[9px] text-white/30 uppercase font-bold">Sesión individual</p>
                            </div>
                        </div>
                        <Switch
                            checked={data.meet_1_enabled}
                            onCheckedChange={(checked) => onChange({ meet_1_enabled: checked })}
                        />
                    </div>
                    {data.meet_1_enabled && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="meet_1" className="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Precio Sesión 1h (ARS)</Label>
                            <Input
                                id="meet_1"
                                type="number"
                                value={data.meet_1}
                                onChange={(e) => onChange({ meet_1: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl px-4 h-10 text-white text-sm"
                                placeholder="15000"
                            />
                        </div>
                    )}

                    {/* Meet 30min */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Video className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase italic">Meet 30m</p>
                                <p className="text-[9px] text-white/30 uppercase font-bold">Consulta rápida</p>
                            </div>
                        </div>
                        <Switch
                            checked={data.meet_30_enabled}
                            onCheckedChange={(checked) => onChange({ meet_30_enabled: checked })}
                        />
                    </div>
                    {data.meet_30_enabled && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="meet_30" className="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Precio Sesión 30m (ARS)</Label>
                            <Input
                                id="meet_30"
                                type="number"
                                value={data.meet_30}
                                onChange={(e) => onChange({ meet_30: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl px-4 h-10 text-white text-sm"
                                placeholder="10000"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
