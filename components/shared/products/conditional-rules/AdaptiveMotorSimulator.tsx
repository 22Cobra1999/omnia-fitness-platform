import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Calculator, Settings2, Check, CheckCircle2,
    Circle, AlertTriangle, ArrowRight, Info,
    Zap, Utensils, ArrowLeft
} from "lucide-react"
import {
    reconstructPrescription,
    reconstructNutrition,
    adjustIngredientManual,
    AdaptiveProfile,
    AdaptiveBase,
    OMNIA_DEFAULTS
} from "@/lib/omnia-adaptive-motor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const AdaptiveMotorSimulator = ({
    productBase: initialBase,
    onSave,
    selectedCount
}: {
    productBase: AdaptiveBase,
    onSave?: (rules: any) => void,
    selectedCount?: number
}) => {
    // TAB "MATRIZ": Selección de reglas activas (Configuración Global)
    const [activeRules, setActiveRules] = useState<{
        level: string[],
        age: string[],
        weight: string[],
        gender: string[],
        bmi: string[],
        injuries: string[]
    }>({
        level: ["Beginner", "Intermediate", "Advanced"],
        age: ["<18", "18-25", "26-35", "36-45", "46-55", "56-65", ">65"],
        weight: ["<50", "50-65", "66-80", "81-95", "96-110", ">110"],
        gender: ["male", "female"],
        bmi: ["<18.5", "Ideal", "Sobrepeso", "Obesidad"],
        injuries: Object.keys(OMNIA_DEFAULTS.PHASE3_INJURIES).map(name => `${name}_medium`)
    })

    // Intensidades por Fase (Matriz)
    const [phaseIntensities, setPhaseIntensities] = useState<{
        phase1: 'baja' | 'media' | 'alta',
        phase2: 'baja' | 'media' | 'alta',
        phase3: 'baja' | 'media' | 'alta',
    }>({
        phase1: 'media',
        phase2: 'media',
        phase3: 'media',
    })

    // TAB "SIMULADOR": Valores de un cliente específico
    const [simBase, setSimBase] = useState<AdaptiveBase>({
        sets: 4,
        series: 4,
        reps: 12,
        load_kg: 50
    })
    const [simProfile, setSimProfile] = useState<AdaptiveProfile>({
        trainingLevel: "Intermediate",
        activityLevel: "Moderately Active",
        ages: [30],
        genders: ["male"],
        bmis: [24],
        weight: 75,
        injuries: []
    })

    const calcM = (val: number, intensity: 'baja' | 'media' | 'alta') => {
        const scale = intensity === 'baja' ? 0.3 : intensity === 'alta' ? 1.5 : 1.0;
        return (1 + (val - 1) * scale).toFixed(2);
    };
    const [nutritionIntensity, setNutritionIntensity] = useState<'Leve' | 'Intermedio' | 'Alto'>('Intermedio')

    const testPlate = [
        { nombre: 'Pechuga de Pollo', cantidad: 200, unidad: 'g' },
        { nombre: 'Arroz Integral', cantidad: 150, unidad: 'g' },
        { nombre: 'Aceite de Oliva', cantidad: 10, unidad: 'ml' },
        { nombre: 'Huevo', cantidad: 1, unidad: 'un' }
    ]

    const result = reconstructPrescription(simBase, simProfile, [0])
    const nutriResult = reconstructNutrition(simProfile, nutritionIntensity)

    const [domain, setDomain] = useState<'fitness' | 'nutrition'>('fitness')
    const [activeTab, setActiveTab] = useState("matriz")

    const toggleRule = (category: keyof typeof activeRules, id: string) => {
        setActiveRules(prev => {
            if (category === 'injuries') {
                const name = id.split('_')[0]
                const exists = prev.injuries.some(i => i.startsWith(name))
                // Usamos la intensidad de la fase 3
                const idWithSeverity = `${name}_${phaseIntensities.phase3 === 'baja' ? 'low' : phaseIntensities.phase3 === 'media' ? 'medium' : 'high'}`

                return {
                    ...prev,
                    injuries: exists
                        ? prev.injuries.filter(i => !i.startsWith(name))
                        : [...prev.injuries, idWithSeverity]
                }
            }
            return {
                ...prev,
                [category]: prev[category].includes(id)
                    ? prev[category].filter(i => i !== id)
                    : [...prev[category], id]
            }
        })
    }

    const toggleAllInCategory = (category: keyof typeof activeRules, allIds: string[]) => {
        const isAll = activeRules[category].length === allIds.length
        setActiveRules(prev => ({ ...prev, [category]: isAll ? [] : allIds }))
    }

    const [dbRules, setDbRules] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/activities/rules-catalog')
            .then(res => res.json())
            .then(data => {
                if (data.success) setDbRules(data.catalog)
            })
    }, [])

    const resolveAdaptiveRuleIds = () => {
        const ids: number[] = []

        const findAndAdd = (cat: string, labels: string[], intensity: string) => {
            labels.forEach(label => {
                // Buscamos la regla exacta que matcheé categoría, intensidad y etiqueta
                const rule = dbRules.find(r =>
                    r.category === cat &&
                    r.intensity === intensity &&
                    r.name.toLowerCase().includes(label.toLowerCase())
                )
                if (rule) ids.push(rule.id)
            })
        }

        findAndAdd('level', activeRules.level, phaseIntensities.phase1)
        findAndAdd('age', activeRules.age, phaseIntensities.phase2)
        findAndAdd('weight', activeRules.weight, phaseIntensities.phase2)
        findAndAdd('gender', activeRules.gender, phaseIntensities.phase2)
        findAndAdd('bmi', activeRules.bmi, phaseIntensities.phase2)

        activeRules.injuries.forEach(id => {
            const name = id.split('_')[0]
            const rule = dbRules.find(r => r.category === 'injury' && r.intensity === phaseIntensities.phase3 && r.name.toLowerCase().includes(name.toLowerCase()))
            if (rule) ids.push(rule.id)
        })

        return ids
    }

    const toggleSimInjury = (injury: string) => {
        setSimProfile(prev => {
            const current = prev.injuries.find(i => i.startsWith(injury))
            let newInjuries = prev.injuries.filter(i => !i.startsWith(injury))

            if (!current) {
                newInjuries.push(`${injury}_low`)
            } else if (current.endsWith('_low')) {
                newInjuries.push(`${injury}_medium`)
            } else if (current.endsWith('_medium')) {
                newInjuries.push(`${injury}_high`)
            }

            return { ...prev, injuries: newInjuries }
        })
    }

    return (
        <div className="space-y-4 w-full pb-10">
            {/* CABECERA COMPACTA UNIFICADA */}
            <div className="flex items-center justify-between gap-4 px-6 py-2 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-6">
                    {/* SELECTOR DE DOMINIO - MINI */}
                    <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                        <button
                            onClick={() => setDomain('fitness')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${domain === 'fitness' ? 'bg-[#FF7939] text-black' : 'text-white/20'}`}
                        >
                            <Zap className="w-3 h-3" />
                            Fitness
                        </button>
                        <button
                            onClick={() => setDomain('nutrition')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${domain === 'nutrition' ? 'bg-[#FF7939] text-black' : 'text-white/20'}`}
                        >
                            <Utensils className="w-3 h-3" />
                            Nutri
                        </button>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setActiveTab('matriz')}
                            className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${activeTab === 'matriz' ? 'bg-white/10 text-[#FF7939] border border-white/10' : 'text-white/20'}`}
                        >
                            <Settings2 className="w-3 h-3" />
                            Matriz
                        </button>
                        <button
                            onClick={() => setActiveTab('simulador')}
                            className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${activeTab === 'simulador' ? 'bg-white/10 text-[#FF7939] border border-white/10' : 'text-white/20'}`}
                        >
                            <Calculator className="w-3 h-3" />
                            Calculadora
                        </button>
                    </div>
                </div>

                {onSave && selectedCount !== undefined && (
                    <button
                        onClick={() => onSave({
                            adaptive_rule_ids: resolveAdaptiveRuleIds()
                        })}
                        className="px-6 py-2 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#FF7939] transition-all flex items-center gap-2"
                    >
                        <Check className="w-3 h-3" />
                        Confirmar y Aplicar ({selectedCount})
                    </button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                <TabsContent value="matriz" className="space-y-6 outline-none w-full px-6 text-left">
                    {/* FASE 1: ACTIVIDAD */}
                    <section className="space-y-2">
                        <div className="flex justify-between items-center px-4 py-2 bg-white/[0.01] rounded-lg border border-white/5">
                            <div className="flex items-center gap-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7939]">
                                    F1. {domain === 'fitness' ? 'NIVEL ENTRENAMIENTO' : 'NIVEL ACTIVIDAD'}
                                </h3>
                                <div className="flex gap-1">
                                    {(['baja', 'media', 'alta'] as const).map((lvl) => (
                                        <button
                                            key={lvl}
                                            onClick={() => setPhaseIntensities(p => ({ ...p, phase1: lvl }))}
                                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${phaseIntensities.phase1 === lvl ? 'bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30' : 'text-white/10 hover:text-white/30'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div
                                onClick={() => toggleAllInCategory('level', domain === 'fitness' ? ["Beginner", "Intermediate", "Advanced"] : ["Sedentary", "Lightly Active", "Moderately Active", "Active", "Very Active"])}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${activeRules.level.length === (domain === 'fitness' ? 3 : 5) ? 'bg-[#FF7939] border-[#FF7939]' : 'border-white/5 hover:border-white/20'}`}
                            >
                                {activeRules.level.length === (domain === 'fitness' ? 3 : 5) && <Check className="h-3 w-3 text-black" strokeWidth={4} />}
                            </div>
                        </div>
                        <div className="bg-white/[0.005] border border-white/5 rounded-lg overflow-hidden divide-y divide-white/5">
                            {domain === 'fitness' ? [
                                { id: "Beginner", label: "Beginner", k: 0.85, s: 0.80, r: 0.85 },
                                { id: "Intermediate", label: "Intermediate", k: 1.00, s: 1.00, r: 1.00 },
                                { id: "Advanced", label: "Advanced", k: 1.15, s: 1.20, r: 1.10 }
                            ].map((row) => (
                                <div key={row.id} className={`flex items-center px-6 py-3 cursor-pointer hover:bg-white/[0.01] ${activeRules.level.includes(row.id) ? 'bg-[#FF7939]/5' : ''}`} onClick={() => toggleRule('level', row.id)}>
                                    <span className="font-bold text-white/30 w-1/4 text-[11px]">{row.label}</span>
                                    <span className="font-mono text-white/10 flex-1 italic text-[10px]">
                                        k × {calcM(row.k, phaseIntensities.phase1)}, s × {calcM(row.s, phaseIntensities.phase1)}, r × {calcM(row.r, phaseIntensities.phase1)}
                                    </span>
                                    {activeRules.level.includes(row.id) ? <CheckCircle2 className="h-4 w-4 text-[#FF7939] opacity-80" /> : <Circle className="h-4 w-4 text-white/5" />}
                                </div>
                            )) : [
                                { id: "Sedentary", label: "Sedentario", m: "kcal × 0.82, prot × 1.0, carb × 0.82, fat × 0.88" },
                                { id: "Lightly Active", label: "Ligero", m: "kcal × 0.95, macros × 0.95" },
                                { id: "Moderately Active", label: "Moderado", m: "kcal × 1.0, macros × 1.0" },
                                { id: "Active", label: "Activo", m: "kcal × 1.10, macros × 1.05" },
                                { id: "Very Active", label: "Intenso", m: "kcal × 1.20, macros × 1.10" }
                            ].map((row) => (
                                <div key={row.id} className={`flex items-center px-6 py-3 cursor-pointer hover:bg-white/[0.01] ${activeRules.level.includes(row.id) ? 'bg-[#FF7939]/5' : ''}`} onClick={() => toggleRule('level', row.id)}>
                                    <span className="font-bold text-white/40 w-1/4 text-[13px]">{row.label}</span>
                                    <span className="font-mono text-white/20 flex-1 italic text-[11px] ml-4">{row.m}</span>
                                    {activeRules.level.includes(row.id) ? <CheckCircle2 className="h-6 w-6 text-[#4CAF50]" /> : <Circle className="h-6 w-6 text-white/5" />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FASE 2: CARACTERÍSTICAS */}
                    <section className="space-y-2">
                        <div className="flex justify-between items-center px-4 py-2 bg-white/[0.01] rounded-lg border border-white/5">
                            <div className="flex items-center gap-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7939]">
                                    F2. CARACTERÍSTICAS METABÓLICAS
                                </h3>
                                <div className="flex gap-1">
                                    {(['baja', 'media', 'alta'] as const).map((lvl) => (
                                        <button
                                            key={lvl}
                                            onClick={() => setPhaseIntensities(p => ({ ...p, phase2: lvl }))}
                                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${phaseIntensities.phase2 === lvl ? 'bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30' : 'text-white/10 hover:text-white/30'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div
                                onClick={() => {
                                    toggleAllInCategory('age', ["<18", "18-25", "26-35", "36-45", "46-55", "56-65", ">65"]);
                                    toggleAllInCategory('weight', ["<50", "50-65", "66-80", "81-95", "96-110", ">110"]);
                                    toggleAllInCategory('gender', ["male", "female"]);
                                    toggleAllInCategory('bmi', ["<18.5", "Ideal", "Sobrepeso", "Obesidad"]);
                                }}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${activeRules.age.length === 7 && activeRules.weight?.length === 6 && activeRules.gender.length === 2 && activeRules.bmi.length === 4 ? 'bg-[#FF7939] border-[#FF7939]' : 'border-white/5 hover:border-white/20'}`}
                            >
                                {activeRules.age.length === 7 && activeRules.weight?.length === 6 && activeRules.gender.length === 2 && activeRules.bmi.length === 4 && <Check className="h-3 w-3 text-black" strokeWidth={4} />}
                            </div>
                        </div>
                        <div className="bg-white/[0.005] border border-white/5 rounded-lg overflow-hidden divide-y divide-white/5 text-[10px]">
                            {/* Edad */}
                            <div className="px-6 py-2 bg-white/[0.01] flex items-center justify-between border-b border-white/5">
                                <span className="font-black text-white/10 uppercase tracking-[0.2em] text-[8px]">Edad</span>
                            </div>
                            {[
                                { label: "Joven (<18 años)", id: "<18", k: 0.80, s: 0.85, r: 0.90, nk: 1.10, nm: 1.10 },
                                { label: "Joven Adulto (18–25 años)", id: "18-25", k: 1.00, s: 1.00, r: 1.00, nk: 1.00, nm: 1.00 },
                                { label: "Plenitud (26–35 años)", id: "26-35", k: 1.05, s: 1.00, r: 1.00, nk: 1.00, nm: 1.00 },
                                { label: "Maduro I (36–45 años)", id: "36-45", k: 1.00, s: 0.95, r: 0.95, nk: 1.00, nm: 1.00 },
                                { label: "Maduro II (46–55 años)", id: "46-55", k: 0.90, s: 0.90, r: 0.95, nk: 0.95, nm: 1.00 },
                                { label: "Master I (56–65 años)", id: "56-65", k: 0.85, s: 0.85, r: 0.90, nk: 0.95, nm: 1.00 },
                                { label: "Senior (>65 años)", id: ">65", k: 0.75, s: 0.80, r: 0.85, nk: 0.90, nm: 1.00 }
                            ].map((row: any) => (
                                <div key={row.id} className={`flex items-center px-6 py-2 cursor-pointer hover:bg-white/[0.01] ${activeRules.age.includes(row.id) ? 'bg-[#FF7939]/5' : ''}`} onClick={() => toggleRule('age', row.id)}>
                                    <span className="font-bold text-white/30 w-1/4 text-[10px]">{row.label}</span>
                                    <span className="font-mono text-white/10 flex-1 italic text-[9px]">
                                        {domain === 'fitness' ?
                                            `k × ${calcM(row.k, phaseIntensities.phase2)}, s × ${calcM(row.s, phaseIntensities.phase2)}, r × ${calcM(row.r, phaseIntensities.phase2)}` :
                                            `kcal × ${calcM(row.nk, phaseIntensities.phase2)}, macros × ${calcM(row.nm, phaseIntensities.phase2)}`
                                        }
                                    </span>
                                    {activeRules.age.includes(row.id) ? <CheckCircle2 className="h-4 w-4 text-[#FF7939] opacity-80" /> : <Circle className="h-4 w-4 text-white/5" />}
                                </div>
                            ))}

                            {/* Peso */}
                            <div className="px-6 py-2 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                                <span className="font-black text-white/10 uppercase tracking-[0.2em] text-[8px]">Peso</span>
                            </div>
                            {[
                                { label: "Muy Ligero (<50kg)", id: "<50", k: 0.80, s: 1.00, r: 1.00 },
                                { label: "Ligero (50–65kg)", id: "50-65", k: 0.90, s: 1.00, r: 1.00 },
                                { label: "Medio (66–80kg)", id: "66-80", k: 1.00, s: 1.00, r: 1.00 },
                                { label: "Pesado (81–95kg)", id: "81-95", k: 1.05, s: 1.00, r: 1.00 },
                                { label: "Intenso (96–110kg)", id: "96-110", k: 1.10, s: 0.95, r: 0.95 },
                                { label: "Muy Pesado (>110kg)", id: ">110", k: 1.15, s: 0.90, r: 0.90 }
                            ].map((row) => (
                                <div key={row.id} className={`flex items-center px-6 py-2 cursor-pointer hover:bg-white/[0.01] ${activeRules.weight?.includes(row.id) ? 'bg-[#FF7939]/5' : ''}`} onClick={() => toggleRule('weight' as any, row.id)}>
                                    <span className="font-bold text-white/30 w-1/4 text-[10px]">{row.label}</span>
                                    <span className="font-mono text-white/10 flex-1 italic text-[9px]">
                                        k × {calcM(row.k, phaseIntensities.phase2)}, s × {calcM(row.s, phaseIntensities.phase2)}, r × {calcM(row.r, phaseIntensities.phase2)}
                                    </span>
                                    {activeRules.weight?.includes(row.id) ? <CheckCircle2 className="h-4 w-4 text-[#FF7939] opacity-80" /> : <Circle className="h-4 w-4 text-white/5" />}
                                </div>
                            ))}

                            {/* Sexo */}
                            <div className="px-6 py-2 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                                <span className="font-black text-white/10 uppercase tracking-[0.2em] text-[8px]">Sexo</span>
                            </div>
                            {[
                                { label: "Hombre", id: "male", m: domain === 'fitness' ? "k × 1.00" : "kcal × 1.05, macros × 1.00" },
                                { label: "Mujer", id: "female", m: domain === 'fitness' ? "k × 0.90" : "kcal × 0.90, macros × 1.00" }
                            ].map((row) => (
                                <div key={row.id} className={`flex items-center px-6 py-2.5 cursor-pointer hover:bg-white/[0.01] ${activeRules.gender.includes(row.id) ? 'bg-[#FF7939]/5' : ''}`} onClick={() => toggleRule('gender', row.id)}>
                                    <span className="font-bold text-white/30 w-1/4 text-[11px]">{row.label}</span>
                                    <span className="font-mono text-white/10 flex-1 italic text-[10px]">{row.m}</span>
                                    {activeRules.gender.includes(row.id) ? <CheckCircle2 className="h-4 w-4 text-[#FF7939] opacity-80" /> : <Circle className="h-4 w-4 text-white/5" />}
                                </div>
                            ))}

                            {/* BMI */}
                            <div className="px-6 py-2 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                                <span className="font-black text-white/10 uppercase tracking-[0.2em] text-[8px]">BMI</span>
                            </div>
                            {[
                                { label: "Bajo (<18.5)", id: "<18.5", k: 0.90, s: 1.00, r: 1.00, nk: 1.15, nm: 1.15 },
                                { label: "Ideal (18.5–24.9)", id: "Ideal", k: 1.00, s: 1.00, r: 1.00, nk: 1.00, nm: 1.00 },
                                { label: "Sobrepeso (25–29.9)", id: "Sobrepeso", k: 1.00, s: 0.95, r: 0.95, nk: 0.95, nm: 0.95 },
                                { label: "Obesidad (>30)", id: "Obesidad", k: 0.85, s: 0.90, r: 0.90, nk: 0.90, nm: 0.90 }
                            ].map((row) => (
                                <div key={row.id} className={`flex items-center px-6 py-2 cursor-pointer hover:bg-white/[0.01] ${activeRules.bmi.includes(row.id) ? 'bg-[#FF7939]/5' : ''}`} onClick={() => toggleRule('bmi', row.id)}>
                                    <span className="font-bold text-white/30 w-1/4 text-[10px]">{row.label}</span>
                                    <span className="font-mono text-white/10 flex-1 italic text-[9px]">
                                        {domain === 'fitness' ?
                                            `k × ${calcM(row.k, phaseIntensities.phase2)}, s × ${calcM(row.s, phaseIntensities.phase2)}, r × ${calcM(row.r, phaseIntensities.phase2)}` :
                                            `kcal × ${calcM(row.nk, phaseIntensities.phase2)}, macros × ${calcM(row.nm, phaseIntensities.phase2)}`
                                        }
                                    </span>
                                    {activeRules.bmi.includes(row.id) ? <CheckCircle2 className="h-4 w-4 text-[#FF7939] opacity-80" /> : <Circle className="h-4 w-4 text-white/5" />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FASE 3: LESIONES */}
                    <section className="space-y-2 pb-8">
                        <div className="flex justify-between items-center px-4 py-2 bg-white/[0.01] rounded-lg border border-white/5">
                            <div className="flex items-center gap-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7939]">
                                    F3. {domain === 'fitness' ? 'LESIONES (SAFETY)' : 'RESTRICCIONES'}
                                </h3>
                                <div className="flex gap-1">
                                    {(['baja', 'media', 'alta'] as const).map((sev) => (
                                        <button
                                            key={sev}
                                            onClick={() => setPhaseIntensities(p => ({ ...p, phase3: sev }))}
                                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${phaseIntensities.phase3 === sev ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'text-white/10 hover:text-white/30'}`}
                                        >
                                            {sev === 'baja' ? 'Leve' : sev === 'media' ? 'Media' : 'Alta'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div onClick={() => toggleAllInCategory('injuries', Object.keys(OMNIA_DEFAULTS.PHASE3_INJURIES).map(n => `${n}_${phaseIntensities.phase3 === 'baja' ? 'low' : phaseIntensities.phase3 === 'media' ? 'medium' : 'high'}`))} className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${activeRules.injuries.length === Object.keys(OMNIA_DEFAULTS.PHASE3_INJURIES).length ? 'bg-red-500 border-red-500' : 'border-white/5 hover:border-white/20'}`}>
                                {activeRules.injuries.length === Object.keys(OMNIA_DEFAULTS.PHASE3_INJURIES).length && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                            </div>
                        </div>

                        <div className="bg-white/[0.005] border border-white/5 rounded-lg overflow-hidden divide-y divide-white/5 text-[10px]">
                            {Object.entries(OMNIA_DEFAULTS.PHASE3_INJURIES).map(([name, factor]: [string, any]) => {
                                const isSelected = activeRules.injuries.some(i => i.startsWith(name))
                                const currentPhaseSev = phaseIntensities.phase3;
                                return (
                                    <div key={name} onClick={() => toggleRule('injuries', name)} className={`flex items-center px-6 py-3 cursor-pointer hover:bg-white/[0.01] ${isSelected ? 'bg-red-500/5' : ''}`}>
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'border-white/10'}`}>
                                                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                                            </div>
                                            <span className={`font-bold text-[11px] ${isSelected ? 'text-white' : 'text-white/20'}`}>{name}</span>
                                        </div>
                                        <span className="font-mono text-white/10 italic text-[9px]">
                                            {domain === 'fitness' ? (
                                                <>
                                                    {currentPhaseSev === 'baja' && "k × 0.90, s/r × 0.95"}
                                                    {currentPhaseSev === 'media' && `k × ${factor.peso.toFixed(2)}, s/r × ${factor.series.toFixed(2)}`}
                                                    {currentPhaseSev === 'alta' && `k × ${(factor.peso * 0.85).toFixed(2)}, s/r × ${(factor.series * 0.90).toFixed(2)}`}
                                                </>
                                            ) : (
                                                <>
                                                    {currentPhaseSev === 'baja' && "kcal × 0.95, macros × 0.98"}
                                                    {currentPhaseSev === 'media' && "kcal × 0.90, macros × 0.95"}
                                                    {currentPhaseSev === 'alta' && "kcal × 0.80, macros × 0.85"}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                </TabsContent>

                {/* --- TAB CALCULADORA: ALTA DENSIDAD / TIPO TABLA --- */}
                <TabsContent value="simulador" className="space-y-4 outline-none w-full px-4 md:px-6 text-left pb-10">
                    {/* MINI HEADER */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] font-bold text-[#FF7939] uppercase tracking-widest whitespace-nowrap">Simulación Adaptativa</span>
                            <div className="h-3 w-[1px] bg-white/10 hidden md:block" />
                        </div>
                        <span className="text-[11px] text-white/20 italic">Selecciona rangos para perfilar y observa el ajuste dinámico</span>
                    </div>

                    {/* PERFIL & CONFIG GRID - ULTRA COMPACTO */}
                    <div className="bg-white/[0.005] border border-white/5 rounded-lg divide-y divide-white/5 overflow-hidden">
                        {/* FILA 1: DATOS BÁSICOS */}
                        <div className="grid grid-cols-1 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-white/5">
                            <div className="p-3 space-y-1">
                                <label className="text-[10px] font-black text-white/20 uppercase">Nivel</label>
                                <select
                                    value={domain === 'fitness' ? simProfile.trainingLevel : simProfile.activityLevel}
                                    onChange={(e) => setSimProfile(p => ({ ...p, [domain === 'fitness' ? 'trainingLevel' : 'activityLevel']: e.target.value }))}
                                    className="w-full bg-transparent border-none p-0 text-[12px] font-bold text-white focus:ring-0 appearance-none"
                                >
                                    {domain === 'fitness' ? (
                                        <>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Sedentary">Sedentario</option>
                                            <option value="Lightly Active">Ligero</option>
                                            <option value="Moderately Active">Moderado</option>
                                            <option value="Active">Activo</option>
                                            <option value="Very Active">Intenso</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* RANGOS CLICKEABLES: PESO */}
                            <div className="p-3 space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-white/20 uppercase block">Peso (Rango de Carga)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '<50', v: 45 },
                                        { label: '50-65', v: 58 },
                                        { label: '66-80', v: 73 },
                                        { label: '81-95', v: 88 },
                                        { label: '96-110', v: 103 },
                                        { label: '>110 (Muy Pesado)', v: 115 }
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => setSimProfile(p => ({ ...p, weight: item.v }))}
                                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${(item.v < 50 && (simProfile.weight || 0) < 50) ||
                                                (item.v >= 50 && item.v <= 65 && (simProfile.weight || 0) >= 50 && (simProfile.weight || 0) <= 65) ||
                                                (item.v >= 66 && item.v <= 80 && (simProfile.weight || 0) >= 66 && (simProfile.weight || 0) <= 80) ||
                                                (item.v >= 81 && item.v <= 95 && (simProfile.weight || 0) >= 81 && (simProfile.weight || 0) <= 95) ||
                                                (item.v >= 96 && item.v <= 110 && (simProfile.weight || 0) >= 96 && (simProfile.weight || 0) <= 110) ||
                                                (item.v > 110 && (simProfile.weight || 0) > 110)
                                                ? 'bg-[#FF7939]/20 border-[#FF7939]/40 text-white' : 'border-white/5 text-white/20 hover:text-white/40'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RANGOS CLICKEABLES: EDAD */}
                            <div className="p-3 space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-white/20 uppercase block">Edad (Ciclo Vital)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '<18', v: 16 },
                                        { label: '18-25', v: 22 },
                                        { label: '26-35', v: 30 },
                                        { label: '36-45', v: 40 },
                                        { label: '46-55', v: 50 },
                                        { label: '56-65', v: 60 },
                                        { label: '>65', v: 70 }
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => setSimProfile(p => ({ ...p, ages: [item.v] }))}
                                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${(item.v < 18 && simProfile.ages[0] < 18) ||
                                                (item.v >= 18 && item.v <= 25 && simProfile.ages[0] >= 18 && simProfile.ages[0] <= 25) ||
                                                (item.v >= 26 && item.v <= 35 && simProfile.ages[0] >= 26 && simProfile.ages[0] <= 35) ||
                                                (item.v >= 36 && item.v <= 45 && simProfile.ages[0] >= 36 && simProfile.ages[0] <= 45) ||
                                                (item.v >= 46 && item.v <= 55 && simProfile.ages[0] >= 46 && simProfile.ages[0] <= 55) ||
                                                (item.v >= 56 && item.v <= 65 && simProfile.ages[0] >= 56 && simProfile.ages[0] <= 65) ||
                                                (item.v > 65 && simProfile.ages[0] > 65)
                                                ? 'bg-[#FF7939]/20 border-[#FF7939]/40 text-white' : 'border-white/5 text-white/20 hover:text-white/40'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 space-y-1">
                                <label className="text-[10px] font-black text-white/20 uppercase">Sexo</label>
                                <div className="flex gap-3">
                                    {['male', 'female'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setSimProfile(p => ({ ...p, genders: [g as any] }))}
                                            className={`text-[12px] font-bold uppercase transition-all ${simProfile.genders[0] === g ? 'text-white underline underline-offset-8 decoration-2 decoration-[#FF7939]' : 'text-white/20 hover:text-white/40'}`}
                                        >
                                            {g === 'male' ? 'Hombre' : 'Mujer'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RANGOS CLICKEABLES: BMI */}
                            <div className="p-3 space-y-2 col-span-1 md:col-span-1">
                                <label className="text-[10px] font-black text-white/20 uppercase block">BMI (Metabólico)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '<18.5', v: 17 },
                                        { label: 'Ideal', v: 22 },
                                        { label: 'Sobrepeso', v: 27 },
                                        { label: 'Obesidad', v: 33 }
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => setSimProfile(p => ({ ...p, bmis: [item.v] }))}
                                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${(item.v < 18.5 && simProfile.bmis[0] < 18.5) ||
                                                (item.v >= 18.5 && item.v <= 24.9 && simProfile.bmis[0] >= 18.5 && simProfile.bmis[0] <= 24.9) ||
                                                (item.v >= 25 && item.v <= 29.9 && simProfile.bmis[0] >= 25 && simProfile.bmis[0] <= 29.9) ||
                                                (item.v > 30 && simProfile.bmis[0] > 30)
                                                ? 'bg-[#FF7939]/20 border-[#FF7939]/40 text-white' : 'border-white/5 text-white/20 hover:text-white/40'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {domain === 'nutrition' && (
                                <div className="p-3 space-y-1 bg-white/[0.01]">
                                    <label className="text-[10px] font-black text-white/20 uppercase">Rigidez</label>
                                    <select
                                        value={nutritionIntensity}
                                        onChange={(e) => setNutritionIntensity(e.target.value as any)}
                                        className="w-full bg-transparent border-none p-0 text-[12px] font-bold text-white focus:ring-0 appearance-none"
                                    >
                                        <option value="Leve">Leve</option>
                                        <option value="Intermedio">Mid</option>
                                        <option value="Alto">High</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* FILA 2: LESIONES / RESTRICCIONES REPARTIDAS */}
                        <div className="p-3 bg-white/[0.002]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Lesiones & Restricciones</span>
                                <span className="text-[7px] text-white/30 italic uppercase">● Click para rotar intensidad (Leve → Media → Alta → Off)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.keys(OMNIA_DEFAULTS.PHASE3_INJURIES).map(injury => {
                                    const current = simProfile.injuries.find(i => i.startsWith(injury))
                                    const level = current ? current.split('_')[1] : null

                                    const getColor = () => {
                                        if (level === 'low') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                        if (level === 'medium') return 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                                        if (level === 'high') return 'bg-red-500/10 border-red-500/30 text-red-500'
                                        return 'bg-transparent border-white/5 text-white/10 hover:text-white/30 hover:border-white/10'
                                    }

                                    return (
                                        <button
                                            key={injury}
                                            onClick={() => toggleSimInjury(injury)}
                                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all border ${getColor()}`}
                                        >
                                            {injury} {level && <span className="ml-1 opacity-50">{level[0]}</span>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* TABLA DE COMPARATIVO: BASE vs FINAL */}
                    <div className="w-full overflow-x-auto border border-white/10 rounded-lg">
                        <table className="w-full text-left text-[10px] bg-white/[0.005] min-w-[500px]">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-4 py-2 font-black text-white/20 uppercase tracking-widest w-1/4">Variable</th>
                                    <th className="px-4 py-2 font-black text-white/20 uppercase tracking-widest w-1/4">Entrada (Base)</th>
                                    <th className="px-4 py-2 font-black text-[#FF7939] uppercase tracking-widest w-1/4">Salida (Adaptada)</th>
                                    <th className="px-4 py-2 font-black text-white/10 uppercase tracking-widest w-1/4">Δ Delta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {domain === 'fitness' ? (
                                    <>
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-white/30 italic">Sets</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={simBase.sets}
                                                    onChange={(e) => setSimBase(b => ({ ...b, sets: parseInt(e.target.value) || 0 }))}
                                                    className="bg-transparent border-none p-0 text-white font-bold focus:ring-0 w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-[#FF7939] font-black text-xl">{result.final.sets}</td>
                                            <td className="px-4 py-3 text-white/10 font-mono italic">
                                                {result.final.sets - simBase.sets !== 0 ? (result.final.sets - simBase.sets > 0 ? '+' : '') + (result.final.sets - simBase.sets) : '—'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-white/30 italic">Series</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={simBase.series}
                                                    onChange={(e) => setSimBase(b => ({ ...b, series: parseInt(e.target.value) || 0 }))}
                                                    className="bg-transparent border-none p-0 text-white font-bold focus:ring-0 w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-[#FF7939] font-black text-xl">{result.final.series}</td>
                                            <td className="px-4 py-3 text-white/10 font-mono italic">
                                                {result.final.series - simBase.series !== 0 ? (result.final.series - simBase.series > 0 ? '+' : '') + (result.final.series - simBase.series) : '—'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-white/30 italic">Repeticiones</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={simBase.reps}
                                                    onChange={(e) => setSimBase(b => ({ ...b, reps: parseInt(e.target.value) || 0 }))}
                                                    className="bg-transparent border-none p-0 text-white font-bold focus:ring-0 w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-[#FF7939] font-black text-xl">{result.final.reps}</td>
                                            <td className="px-4 py-3 text-white/10 font-mono italic">
                                                {result.final.reps - simBase.reps !== 0 ? (result.final.reps - simBase.reps > 0 ? '+' : '') + (result.final.reps - simBase.reps) : '—'}
                                            </td>
                                        </tr>
                                        <tr className="bg-[#FF7939]/5">
                                            <td className="px-4 py-4 font-black text-white/40 uppercase tracking-tighter">Carga Adaptada (kg)</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1 border-b border-white/10 focus-within:border-white/30 transition-all">
                                                    <input
                                                        type="number"
                                                        value={simBase.load_kg}
                                                        onChange={(e) => setSimBase(b => ({ ...b, load_kg: parseInt(e.target.value) || 0 }))}
                                                        className="bg-transparent border-none p-0 text-white text-lg font-black focus:ring-0 w-20"
                                                    />
                                                    <span className="text-[8px] opacity-20 uppercase font-black">Ref</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-[#FF7939] font-black text-3xl md:text-4xl tracking-tighter shadow-orange-500/20 drop-shadow-sm">
                                                {result.final.load}<small className="text-xs ml-1 opacity-50">kg</small>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="px-3 py-1 bg-[#FF7939]/20 border border-[#FF7939]/30 rounded-md inline-block">
                                                    <span className="text-[#FF7939] font-black text-xs">
                                                        {(result.final.load / simBase.load_kg * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <>
                                        <tr>
                                            <td className="px-4 py-3 font-bold text-white/30 italic">Distribución Macros</td>
                                            <td className="px-4 py-3 space-y-1 text-white/20 font-mono text-[9px]">
                                                <div>P: 120g (Ref)</div>
                                                <div>C: 250g (Ref)</div>
                                                <div>G: 65g (Ref)</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col"><span className="text-[7px] font-black text-[#4CAF50]/50 uppercase">P</span><span className="text-sm font-black text-white">{Math.round(120 * nutriResult.factorProtein)}g</span></div>
                                                    <div className="flex flex-col"><span className="text-[7px] font-black text-[#4CAF50]/50 uppercase">C</span><span className="text-sm font-black text-white">{Math.round(250 * nutriResult.factorCarbs)}g</span></div>
                                                    <div className="flex flex-col"><span className="text-[7px] font-black text-[#4CAF50]/50 uppercase">G</span><span className="text-sm font-black text-white">{Math.round(65 * nutriResult.factorFats)}g</span></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-white/5 italic">Calculado vía Om_v2</td>
                                        </tr>
                                        <tr className="bg-[#4CAF50]/5">
                                            <td className="px-4 py-4 font-black text-white/40 uppercase tracking-tighter">Presupuesto Calórico</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1 border-b border-white/10">
                                                    <input
                                                        type="number"
                                                        value={simBase.load_kg}
                                                        onChange={(e) => setSimBase(b => ({ ...b, load_kg: parseInt(e.target.value) || 0 }))}
                                                        className="bg-transparent border-none p-0 text-white text-lg font-black focus:ring-0 w-24"
                                                    />
                                                    <span className="text-[8px] opacity-20 uppercase font-black">kcal</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-[#4CAF50] font-black text-3xl md:text-4xl tracking-tighter">
                                                {Math.round(simBase.load_kg * nutriResult.factorKcal)}<small className="text-xs ml-1 opacity-50 uppercase">kcal</small>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="px-3 py-1 bg-[#4CAF50]/20 border border-[#4CAF50]/30 rounded-md inline-block">
                                                    <span className="text-[#4CAF50] font-black text-xs">
                                                        {nutriResult.targetPercent}% de Base
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
