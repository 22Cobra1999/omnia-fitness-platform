"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, ChevronRight, X, ArrowLeft, User, Calendar, Ruler, Weight, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ChevronDown, ChevronUp } from "lucide-react"

const FITNESS_GOALS_OPTIONS = [
    "Subir de peso",
    "Bajar de peso",
    "Quemar grasas",
    "Ganar masa muscular",
    "Mejorar condición física",
    "Tonificar",
    "Mejorar flexibilidad",
    "Reducir estrés",
    "Controlar respiración",
    "Corregir postura",
    "Meditación y Mindfulness",
    "Equilibrio corporal",
    "Aumentar resistencia",
    "Salud articular"
]

const SPORTS_OPTIONS = [
    "Fútbol",
    "Tenis",
    "Padel",
    "Calistenia",
    "Natación",
    "Running",
    "Crossfit",
    "Yoga",
    "Pilates",
    "Ciclismo",
    "Boxeo",
    "Artes Marciales",
    "Gimnasio",
    "Básquet",
    "Vóley",
    "Patinaje",
    "Golf",
    "Escalada",
    "Surf",
    "Otro"
]

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
}

const steps = [
    {
        id: "intensity",
        title: "¿Qué tan fuerte querés ir con esto?",
        description: "Medí tu ritmo deseado y tolerancia a la exigencia.",
        options: [
            { id: "tranquilo", label: "Tranquilo, paso a paso", icon: "🌱" },
            { id: "constante", label: "Constante y equilibrado", icon: "⚖️" },
            { id: "exigente", label: "Exigente, quiero ver resultados", icon: "🔥" },
            { id: "a_fondo", label: "A fondo, voy con todo", icon: "🚀" }
        ]
    },
    {
        id: "change_goal",
        title: "¿Qué estás buscando cambiar hoy?",
        description: "Para entender si buscamos una transición o mantenimiento.",
        options: [
            { id: "desde_cero", label: "Quiero arrancar desde cero" },
            { id: "mejorar", label: "Quiero mejorar lo que ya hago" },
            { id: "mantener", label: "Quiero mantenerme activo" },
            { id: "depende", label: "Depende del momento / semana" }
        ]
    },
    {
        id: "progress_horizon",
        title: "¿Cuándo te gustaría empezar a notar cambios?",
        description: "Esto nos ayuda a alinear expectativas.",
        options: [
            { id: "semana", label: "Esta semana" },
            { id: "mes", label: "En un mes" },
            { id: "2-3_meses", label: "En 2–3 meses" },
            { id: "sostenible", label: "No tengo apuro, quiero algo sostenible" }
        ]
    },
    {
        id: "consistency_level",
        title: "En general, ¿qué tan fácil te resulta sostener hábitos?",
        description: "No hay respuestas buenas o malas. Esto nos ayuda a acompañarte mejor.",
        options: [
            { id: "cuesta", label: "Me cuesta bastante, abandono fácil" },
            { id: "arranco_bien", label: "Arranco bien pero me desinflo" },
            { id: "constante", label: "Soy bastante constante" },
            { id: "disciplinado", label: "Soy disciplinado/a" }
        ]
    },
    {
        id: "coaching_style",
        title: "¿Cómo te sentís más cómodo/a trabajando con un coach?",
        description: "Definamos el nivel de acompañamiento ideal.",
        options: [
            { id: "independiente", label: "👤 Independiente: dame el plan" },
            { id: "acompañado", label: "🤝 Acompañado: feedback y ajustes" },
            { id: "guiado", label: "🧑‍🏫 Guiado: seguimiento cercano" },
            { id: "encima_mio", label: "🔔 Necesito que estén encima mío" }
        ]
    },
    {
        id: "training_modality_interests",
        title: "Modalidad e Intereses",
        description: "¿Cómo te gustaría entrenar y qué te interesa hoy?",
        isMultiSection: true,
        sections: [
            {
                id: "training_modality",
                title: "¿Cómo te gustaría entrenar principalmente?",
                type: "single",
                options: [
                    { id: "presencial", label: "Presencial" },
                    { id: "online", label: "Online" },
                    { id: "hibrido", label: "Híbrido" },
                    { id: "adaptable", label: "Me adapto según el momento" }
                ]
            },
            {
                id: "interests",
                title: "¿Qué tipo de actividades te interesan hoy? (Máx. 5)",
                type: "multi",
                maxSelections: 5,
                options: [
                    { id: "fuerza", label: "🏋️ Fuerza / gimnasio" },
                    { id: "hiit", label: "⚡ Alta intensidad / HIIT" },
                    { id: "movilidad", label: "🧘 Movilidad / yoga" },
                    { id: "nutricion", label: "🥗 Nutrición / hábitos" },
                    { id: "mental", label: "🧠 Mental / foco" },
                    { id: "estructurados", label: "🎯 Programas estructurados" },
                    { id: "cortas", label: "🔁 Rutinas cortas" },
                    { id: "grupales", label: "👥 Actividades grupales" },
                    { id: "1on1", label: "👤 Acompañamiento 1:1" }
                ]
            }
        ]
    },
    {
        id: "profile_completion",
        title: "Completá tu perfil",
        description: "Última información para personalizar tu experiencia.",
        isProfileCompletion: true,
        sections: [
            {
                id: "goals",
                title: "Metas de Rendimiento",
                type: "multi",
                options: [
                    { id: "quemar_grasas", label: "Quemar Grasas" },
                    { id: "ganar_masa", label: "Ganar Masa Muscular" },
                    { id: "mejorar_condicion", label: "Mejorar Condición Física" },
                    { id: "tonificar", label: "Tonificar" },
                    { id: "aumentar_fuerza", label: "Aumentar Fuerza" },
                    { id: "flexibilidad", label: "Mejorar Flexibilidad" },
                    { id: "perder_peso", label: "Perder Peso" },
                    { id: "mantener", label: "Mantener Forma" }
                ]
            },
            {
                id: "sports",
                title: "Deportes que practicás",
                type: "multi",
                options: SPORTS_OPTIONS.map(sport => ({ id: sport.toLowerCase().replace(/ /g, '_'), label: sport }))
            },
            {
                id: "injuries",
                title: "Lesiones",
                type: "multi",
                options: [
                    { id: "rodilla", label: "Rodilla" },
                    { id: "espalda", label: "Espalda" },
                    { id: "hombro", label: "Hombro" },
                    { id: "cadera", label: "Cadera" },
                    { id: "tobillo", label: "Tobillo" },
                    { id: "muneca", label: "Muñeca" },
                    { id: "ninguna", label: "Ninguna" }
                ]
            }
        ],
        fields: [
            { id: "location", label: "Ubicación", type: "text", optional: true },
            { id: "health_notes", label: "Observaciones", type: "textarea", optional: true, maxLength: 500 }
        ]
    }
]

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
    fromRegistration?: boolean  // Nuevo prop para saber si viene del registro
}

export function OnboardingModal({ isOpen, onClose, fromRegistration = false }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<any>({
        interests: [],
        injuries: [],
        conditions: [],
        goals: [],
        sports: [],
        location: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const { user } = useAuth()
    const supabase = createClient()

    // Filtrar steps según el origen
    // Si viene del registro: mostrar todos los steps (preferencias + profile_completion)
    // Si viene del ícono: solo preferencias (excluir profile_completion)
    const filteredSteps = fromRegistration
        ? steps // Mostrar todos (6 preferencias + 1 profile_completion)
        : steps.filter(step => step.id !== 'profile_completion') // Solo preferencias (6 pasos)

    // Estado para secciones colapsables
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        injuries: false,
        conditions: false,
        goals: false,
        sports: false
    })

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
    }

    // Cargar respuestas existentes al abrir
    useEffect(() => {
        if (isOpen && user) {
            const loadExistingAnswers = async () => {
                // 1. Cargar desde client_onboarding_responses (solo preferencias de entrenamiento)
                const { data: onboardingData } = await supabase
                    .from('client_onboarding_responses')
                    .select('*')
                    .eq('client_id', user.id)
                    .single()

                // 2. Cargar desde clients (datos físicos, goals, sports, conditions)
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                // 3. Cargar lesiones desde user_injuries
                const { data: injuriesData } = await supabase
                    .from('user_injuries')
                    .select('name')
                    .eq('user_id', user.id)

                // Combinar datos
                const combinedAnswers: any = {
                    interests: [],
                    injuries: [],
                    conditions: [],
                    goals: [],
                    sports: []
                }

                // Datos de preferencias de entrenamiento
                if (onboardingData) {
                    combinedAnswers.intensity = onboardingData.intensity_level
                    combinedAnswers.change_goal = onboardingData.change_goal
                    combinedAnswers.progress_horizon = onboardingData.progress_horizon
                    combinedAnswers.consistency_level = onboardingData.consistency_level
                    combinedAnswers.coaching_style = onboardingData.coaching_style
                    combinedAnswers.training_modality = onboardingData.training_modality
                    combinedAnswers.interests = onboardingData.interests || []
                }

                // Datos físicos y objetivos desde clients
                if (clientData) {
                    combinedAnswers.birth_date = clientData.birth_date || ''
                    combinedAnswers.height_cm = clientData.Height || '' // Nota: columna es "Height" con mayúscula
                    combinedAnswers.weight_kg = clientData.weight || ''
                    combinedAnswers.gender = clientData.Genre || '' // Nota: columna es "Genre"
                    combinedAnswers.goals = Array.isArray(clientData.fitness_goals) ? clientData.fitness_goals : []
                    combinedAnswers.sports = Array.isArray(clientData.sports) ? clientData.sports : []
                    combinedAnswers.conditions = Array.isArray(clientData.health_conditions) ? clientData.health_conditions : []
                }

                // Lesiones desde user_injuries (mapear nombres a IDs del formulario)
                if (injuriesData && injuriesData.length > 0) {
                    // Mapear nombres de lesiones a los IDs usados en el formulario
                    const injuryMap: { [key: string]: string } = {
                        'rodilla': 'rodilla',
                        'espalda': 'espalda',
                        'espalda baja': 'espalda',
                        'hombro': 'hombro',
                        'cadera': 'cadera',
                        'tobillo': 'tobillo',
                        'muñeca': 'muneca'
                    }
                    combinedAnswers.injuries = injuriesData.map((inj: { name: string }) => {
                        const name = inj.name.toLowerCase()
                        return injuryMap[name] || name.replace(/ /g, '_')
                    })
                }

                setAnswers(combinedAnswers)
            }
            loadExistingAnswers()
        }
    }, [isOpen, user, supabase])


    if (!isOpen) return null

    const handleOptionSelect = (stepId: string, optionId: string) => {
        setAnswers((prev: any) => ({ ...prev, [stepId]: optionId }))
        // Auto-advance for single choice steps if not the last one
        if (currentStep < filteredSteps.length - 1 && !filteredSteps[currentStep].isMultiSection && !(filteredSteps[currentStep] as any).fields && !filteredSteps[currentStep].isProfileCompletion) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 250)
        }
    }

    const handleMultiSelect = (sectionId: string, optionId: string, max?: number) => {
        setAnswers((prev: any) => {
            const current = prev[sectionId] || []
            if (current.includes(optionId)) {
                return { ...prev, [sectionId]: current.filter((id: string) => id !== optionId) }
            }
            if (max && current.length >= max) return prev
            return { ...prev, [sectionId]: [...current, optionId] }
        })
    }

    const handleInputChange = (fieldId: string, value: any) => {
        setAnswers((prev: any) => ({ ...prev, [fieldId]: value }))
    }

    const handleNext = () => {
        if (currentStep < filteredSteps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSubmit = async () => {
        if (!user) return
        setIsSubmitting(true)

        try {
            // 0. Si viene del registro y hay avatar, subirlo primero
            let avatarUrl = null
            if (fromRegistration && avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName)
                    avatarUrl = publicUrl
                }
            }

            // 1. Guardar preferencias de entrenamiento en client_onboarding_responses
            const { error: onboardingError } = await supabase
                .from('client_onboarding_responses')
                .upsert({
                    client_id: user.id,
                    intensity_level: answers.intensity,
                    change_goal: answers.change_goal,
                    progress_horizon: answers.progress_horizon,
                    consistency_level: answers.consistency_level,
                    coaching_style: answers.coaching_style,
                    training_modality: answers.training_modality,
                    interests: answers.interests || [],
                    observaciones: answers.health_notes || null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'client_id'
                })

            if (onboardingError) throw onboardingError

            // 2. Si viene del registro, actualizar perfil con avatar y ubicación
            if (fromRegistration) {
                const profileUpdates: any = {}
                if (avatarUrl) profileUpdates.avatar_url = avatarUrl
                if (answers.location) profileUpdates.location = answers.location

                if (Object.keys(profileUpdates).length > 0) {
                    await supabase
                        .from('user_profiles')
                        .update(profileUpdates)
                        .eq('id', user.id)
                }
            }

            // 3. Actualizar datos en clients (goals, sports)
            const clientUpdates: any = {
                fitness_goals: answers.goals || [],
                sports: answers.sports || [],
                updated_at: new Date().toISOString()
            }

            // Solo actualizar datos físicos si NO viene del registro (ya se guardaron)
            if (!fromRegistration) {
                if (answers.height_cm) clientUpdates.Height = answers.height_cm
                if (answers.weight_kg) clientUpdates.weight = answers.weight_kg
                if (answers.birth_date) clientUpdates.birth_date = answers.birth_date
                if (answers.gender) clientUpdates.Genre = answers.gender
                if (answers.conditions) clientUpdates.health_conditions = answers.conditions
            }

            const { error: clientError } = await supabase
                .from('clients')
                .update(clientUpdates)
                .eq('id', user.id)

            if (clientError) console.warn('Error updating client data:', clientError)

            // 4. Manejar lesiones en user_injuries
            if (answers.injuries && answers.injuries.length > 0) {
                // Mapear IDs del formulario a nombres legibles
                const injuryNames: { [key: string]: string } = {
                    'rodilla': 'Rodilla',
                    'espalda': 'Espalda',
                    'hombro': 'Hombro',
                    'cadera': 'Cadera',
                    'tobillo': 'Tobillo',
                    'muneca': 'Muñeca'
                }

                // Primero, eliminar lesiones existentes si el usuario seleccionó "ninguna"
                if (answers.injuries.includes('Ninguna') || answers.injuries.includes('ninguna')) {
                    await supabase
                        .from('user_injuries')
                        .delete()
                        .eq('user_id', user.id)
                } else {
                    // Crear/actualizar lesiones
                    for (const injury of answers.injuries) {
                        const injuryName = injuryNames[injury.toLowerCase()] || injury
                        if (injuryName !== 'Ninguna') {
                            await supabase
                                .from('user_injuries')
                                .upsert({
                                    user_id: user.id,
                                    name: injuryName,
                                    severity: 'medium',
                                    description: `Registrado desde onboarding`,
                                    updated_at: new Date().toISOString()
                                }, {
                                    onConflict: 'user_id,name'
                                })
                        }
                    }
                }
            }


            toast.success("¡Información guardada!", {
                description: "Tu perfil ha sido actualizado exitosamente."
            })
            onClose()
        } catch (error) {
            console.error('Error saving onboarding:', error)
            toast.error("Error al guardar", {
                description: "Por favor intentá nuevamente."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const step = filteredSteps[currentStep]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl h-[85vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <Button onClick={handleBack} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-full">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex gap-1">
                            {filteredSteps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentStep ? 'bg-[#FF6A00]' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                                <p className="text-gray-400 text-sm">{step.description}</p>
                            </div>

                            {/* OPCIONES TIPO CARD (Pasos normales) */}
                            {!step.isMultiSection && !step.isProfileCompletion && step.options && (
                                <div className="grid grid-cols-1 gap-3">
                                    {step.options.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(step.id, option.id)}
                                            className={`
                                                w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3
                                                ${answers[step.id] === option.id
                                                    ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'}
                                            `}
                                        >
                                            {'icon' in option && <span className="text-2xl">{option.icon as string}</span>}
                                            <span className="font-medium">{option.label}</span>
                                            {answers[step.id] === option.id && <Check className="ml-auto h-5 w-5 text-[#FF6A00]" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* SECCIONES MÚLTIPLES (Modalidad e Intereses) */}
                            {step.isMultiSection && step.sections && (
                                <div className="space-y-8">
                                    {step.sections.map((section: any) => (
                                        <div key={section.id} className="space-y-3">
                                            <h3 className="text-lg font-semibold text-white/90">{section.title}</h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {section.options.map((option: any) => {
                                                    const isSelected = section.type === 'multi'
                                                        ? (answers[section.id] || []).includes(option.id)
                                                        : answers[section.id] === option.id

                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => section.type === 'multi'
                                                                ? handleMultiSelect(section.id, option.id, section.maxSelections)
                                                                : handleOptionSelect(section.id, option.id)
                                                            }
                                                            className={`
                                                                w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3
                                                                ${isSelected
                                                                    ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-white'
                                                                    : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'}
                                                            `}
                                                        >
                                                            <span className="font-medium text-sm">{option.label}</span>
                                                            {isSelected && <Check className="ml-auto h-4 w-4 text-[#FF6A00]" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Profile Completion Step */}
                            {step.isProfileCompletion && (
                                <div className="space-y-6">
                                    {/* Avatar Upload */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative w-24 h-24">
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] flex items-center justify-center overflow-hidden">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="h-12 w-12 text-white" />
                                                )}
                                            </div>
                                            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center cursor-pointer hover:bg-[#FF5500] transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            setAvatarFile(file)
                                                            const reader = new FileReader()
                                                            reader.onloadend = () => {
                                                                setAvatarPreview(reader.result as string)
                                                            }
                                                            reader.readAsDataURL(file)
                                                        }
                                                    }}
                                                />
                                                <Plus className="h-4 w-4 text-white" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-400">Foto de perfil (opcional)</p>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Ubicación</label>
                                        <input
                                            type="text"
                                            value={answers['location'] || ''}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#FF6A00]/50 outline-none placeholder-gray-600"
                                            placeholder="Ej: Buenos Aires, Argentina"
                                        />
                                    </div>

                                    {/* Goals & Sports & Injuries sections mapping */}
                                    {step.sections?.map((section: any) => (
                                        <div key={section.id} className="space-y-3">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{section.title}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {section.options.map((option: any) => {
                                                    const isSelected = (answers[section.id] || []).includes(option.label)
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleMultiSelect(section.id, option.label)}
                                                            className={`
                                                                px-4 py-2 rounded-xl text-sm transition-all border
                                                                ${isSelected
                                                                    ? section.id === 'goals' ? 'bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]' :
                                                                        section.id === 'sports' ? 'bg-orange-300/10 border-orange-300 text-orange-300' :
                                                                            'bg-red-500/10 border-red-500 text-red-400'
                                                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}
                                                            `}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Observaciones de salud */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Observaciones</label>
                                        <div className="relative">
                                            <textarea
                                                value={answers['health_notes'] || ''}
                                                onChange={(e) => handleInputChange('health_notes', e.target.value.slice(0, 500))}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#FF6A00]/50 outline-none h-32 resize-none placeholder-gray-600"
                                                placeholder="¿Hay algo más que debamos saber sobre tu salud o estado físico?"
                                                maxLength={500}
                                            />
                                            <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                {(answers['health_notes'] || '').length}/500
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white font-bold h-12 rounded-xl"
                    >
                        {isSubmitting ? "Guardando..." : (currentStep === filteredSteps.length - 1 ? 'Listo, empezar' : 'Continuar')}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
