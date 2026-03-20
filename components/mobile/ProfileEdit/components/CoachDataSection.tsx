import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProfileData } from '../types'
import { Award, Briefcase, Plus, X, Calendar, GraduationCap, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

interface CoachDataSectionProps {
    data: ProfileData
    onChange: (updates: Partial<ProfileData>) => void
}

const SPECIALTIES_CATALOG = {
    fitness: [
        'Hipertrofia', 'Musculación', 'CrossFit', 'Running', 'Yoga', 'Pilates', 
        'Calistenia', 'Preparación Física', 'Rehabilitación', 'HIIT', 
        'Powerlifting', 'Kettlebell', 'Hyrox'
    ],
    nutrition: [
        'Planificación', 'Suplementación', 'Pérdida de Peso', 'Ganancia de Masa', 
        'Dieta Keto', 'Ayuno Intermitente', 'Nutrición Deportiva', 'Vegano/Vegetariano',
        'Nutrición Clínica'
    ]
}

export function CoachDataSection({ data, onChange }: CoachDataSectionProps) {
    const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false)
    const [newExp, setNewExp] = useState({ title: '', start_date: '', end_date: '', is_current: false })

    const specs = data.specialization
        ? data.specialization.split(',').map(s => s.trim()).filter(Boolean)
        : []

    const history = data.experience_history || []

    // Calcular años totales automáticamente
    useEffect(() => {
        if (history.length > 0) {
            let totalMonths = 0
            history.forEach(item => {
                const start = new Date(item.start_date)
                const end = item.end_date ? new Date(item.end_date) : new Date()
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
                totalMonths += Math.max(0, months)
            })
            const years = Math.floor(totalMonths / 12)
            if (years.toString() !== data.experience_years) {
                onChange({ experience_years: years.toString() })
            }
        }
    }, [history])

    const toggleSpecialty = (spec: string) => {
        if (specs.includes(spec)) {
            onChange({ specialization: specs.filter(s => s !== spec).join(', ') })
        } else {
            onChange({ specialization: [...specs, spec].join(', ') })
        }
    }

    const addExperience = () => {
        if (!newExp.title || !newExp.start_date) return
        onChange({ experience_history: [...history, { ...newExp, end_date: newExp.end_date || null }] })
        setNewExp({ title: '', start_date: '', end_date: '', is_current: false })
    }

    const removeExperience = (index: number) => {
        onChange({ experience_history: history.filter((_, i) => i !== index) })
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* BIO */}
            <div className="space-y-4">
                <div className="group">
                    <Label htmlFor="bio" className="text-[10px] uppercase tracking-widest text-[#FF7939] font-black italic mb-2 block">Bio / Presentación</Label>
                    <Textarea
                        id="bio"
                        value={data.bio}
                        onChange={(e) => onChange({ bio: e.target.value })}
                        className="bg-zinc-900/50 border-white/5 rounded-2xl px-4 py-4 h-32 text-white focus:ring-[#FF7939]/20 focus:border-[#FF7939]/30 transition-all placeholder:text-gray-700 text-sm italic"
                        placeholder="Tu filosofía de entrenamiento..."
                    />
                </div>

                {/* ESPECIALIDADES CATEGORIZADAS */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <Label className="text-[10px] uppercase tracking-widest text-[#FF7939] font-black italic flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" /> Especialidades
                        </Label>
                        <button 
                            type="button" 
                            onClick={() => setIsSpecialtiesOpen(!isSpecialtiesOpen)} 
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isSpecialtiesOpen ? 'bg-[#FF7939] text-black rotate-45' : 'bg-white/5 text-white/40'}`}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {specs.map((s, i) => (
                            <div key={i} onClick={() => toggleSpecialty(s)} className="cursor-pointer flex items-center gap-2 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-tight transition-all hover:bg-[#FF7939]/20">
                                <span>{s}</span>
                                <X className="h-3 w-3 opacity-40" />
                            </div>
                        ))}
                    </div>

                    {isSpecialtiesOpen && (
                        <div className="space-y-6 bg-white/5 p-5 rounded-2xl border border-white/5 animate-in zoom-in-95 duration-200">
                            {/* FITNESS */}
                            <div>
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Award className="w-3 h-3 text-orange-500" /> Fitness & Training
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {SPECIALTIES_CATALOG.fitness.map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => toggleSpecialty(s)}
                                            className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${specs.includes(s) ? 'bg-[#FF7939] text-black border-transparent' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* NUTRITION */}
                            <div>
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-green-500" /> Nutrición & Salud
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {SPECIALTIES_CATALOG.nutrition.map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => toggleSpecialty(s)}
                                            className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${specs.includes(s) ? 'bg-[#FF7939] text-black border-transparent' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* HISTORIAL DE EXPERIENCIA */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] uppercase tracking-widest text-[#FF7939] font-black italic flex items-center gap-2 leading-none">
                            <GraduationCap className="w-3.5 h-3.5" /> Trayectoria
                        </Label>
                        <div className="bg-[#FF7939]/10 rounded-lg px-1.5 py-0.5 border border-[#FF7939]/10">
                            <span className="text-[9px] font-black text-[#FF7939] uppercase">{data.experience_years || 0} AÑOS TOTALES</span>
                        </div>
                    </div>

                    {/* List Experience - Super Compact */}
                    <div className="grid grid-cols-1 gap-1.5">
                        {history.map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                     <Briefcase className="w-3 h-3 text-white/20" />
                                     <div>
                                        <p className="text-[11px] font-black text-white/80 uppercase italic tracking-tighter leading-none">{item.title}</p>
                                        <p className="text-[8px] font-mono text-white/20 leading-none mt-1 uppercase tracking-widest">{new Date(item.start_date).getFullYear()} - {item.is_current ? 'PRESENTE' : (item.end_date ? new Date(item.end_date).getFullYear() : '---')}</p>
                                     </div>
                                </div>
                                <button onClick={() => removeExperience(i)} className="p-1.5 text-red-500/20 hover:text-red-500 transition-all">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Experience Form - Integrated */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                             <Input 
                                placeholder="Institución / academia" 
                                value={newExp.title}
                                onChange={e => setNewExp(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-transparent border-white/10 h-8 text-[11px] font-bold rounded-lg placeholder:text-white/10"
                             />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 h-7">
                                <span className="text-[7px] font-black text-white/20 uppercase">INICIO</span>
                                <input 
                                    type="date" 
                                    value={newExp.start_date}
                                    onChange={e => setNewExp(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="bg-transparent text-[9px] text-white/60 focus:outline-none w-full [color-scheme:dark]"
                                />
                            </div>
                            <div className={`flex items-center gap-2 bg-white/5 rounded-lg px-2 h-7 ${newExp.is_current ? 'opacity-20 pointer-events-none' : ''}`}>
                                <span className="text-[7px] font-black text-white/20 uppercase">FIN</span>
                                <input 
                                    type="date"
                                    value={newExp.end_date || ""}
                                    disabled={newExp.is_current}
                                    onChange={e => setNewExp(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="bg-transparent text-[9px] text-white/60 focus:outline-none w-full [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 px-1">
                            <input 
                                type="checkbox" 
                                id="is_current"
                                checked={newExp.is_current}
                                onChange={e => setNewExp(prev => ({ ...prev, is_current: e.target.checked }))}
                                className="w-3 h-3 rounded bg-white/5 border-white/10 text-[#FF7939] focus:ring-0"
                            />
                            <label htmlFor="is_current" className="text-[9px] font-bold text-white/40 uppercase tracking-widest cursor-pointer">Sigo trabajando aquí</label>
                        </div>

                        <button 
                            type="button"
                            onClick={addExperience}
                            disabled={!newExp.title || !newExp.start_date}
                            className="w-full h-8 bg-[#FF7939]/10 text-[#FF7939] hover:bg-[#FF7939] hover:text-black transition-all rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-30 border border-[#FF7939]/20"
                        >
                            + INTEGRAR ACADEMIA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
