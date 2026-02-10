"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export const FITNESS_GOALS_OPTIONS = [
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

export const SPORTS_OPTIONS = [
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

export const steps = [
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

interface UseOnboardingLogicProps {
    isOpen: boolean
    onClose: () => void
    fromRegistration?: boolean
}

export function useOnboardingLogic({ isOpen, onClose, fromRegistration = false }: UseOnboardingLogicProps) {
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

    const filteredSteps = fromRegistration
        ? steps
        : steps.filter(step => step.id !== 'profile_completion')

    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        injuries: false,
        conditions: false,
        goals: false,
        sports: false
    })

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
    }

    useEffect(() => {
        if (isOpen && user) {
            const loadExistingAnswers = async () => {
                const { data: onboardingData } = await supabase
                    .from('client_onboarding_responses')
                    .select('*')
                    .eq('client_id', user.id)
                    .single()

                const { data: clientData } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                const { data: injuriesData } = await supabase
                    .from('user_injuries')
                    .select('name')
                    .eq('user_id', user.id)

                const combinedAnswers: any = {
                    interests: [],
                    injuries: [],
                    conditions: [],
                    goals: [],
                    sports: []
                }

                if (onboardingData) {
                    combinedAnswers.intensity = onboardingData.intensity_level
                    combinedAnswers.change_goal = onboardingData.change_goal
                    combinedAnswers.progress_horizon = onboardingData.progress_horizon
                    combinedAnswers.consistency_level = onboardingData.consistency_level
                    combinedAnswers.coaching_style = onboardingData.coaching_style
                    combinedAnswers.training_modality = onboardingData.training_modality
                    combinedAnswers.interests = onboardingData.interests || []
                    combinedAnswers.health_notes = onboardingData.observaciones || ''
                }

                if (clientData) {
                    combinedAnswers.birth_date = clientData.birth_date || ''
                    combinedAnswers.height_cm = clientData.Height || ''
                    combinedAnswers.weight_kg = clientData.weight || ''
                    combinedAnswers.gender = clientData.Genre || ''
                    combinedAnswers.goals = Array.isArray(clientData.fitness_goals) ? clientData.fitness_goals : []
                    combinedAnswers.sports = Array.isArray(clientData.sports) ? clientData.sports : []
                    combinedAnswers.conditions = Array.isArray(clientData.health_conditions) ? clientData.health_conditions : []
                    combinedAnswers.location = combinedAnswers.location || ''
                }

                if (injuriesData && injuriesData.length > 0) {
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

                setAnswers((prev: any) => ({ ...prev, ...combinedAnswers }))
            }
            loadExistingAnswers()
        }
    }, [isOpen, user, supabase])

    const handleOptionSelect = (stepId: string, optionId: string) => {
        setAnswers((prev: any) => ({ ...prev, [stepId]: optionId }))
        const currentStepData = filteredSteps[currentStep]
        if (currentStep < filteredSteps.length - 1 && !currentStepData.isMultiSection && !(currentStepData as any).fields && !currentStepData.isProfileCompletion) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 250)
        }
    }

    const handleMultiSelect = (sectionId: string, optionId: string, max?: number) => {
        setAnswers((prev: any) => {
            const current = (prev[sectionId] || []) as string[]
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

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSubmit = async () => {
        if (!user) return
        setIsSubmitting(true)

        try {
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

            const clientUpdates: any = {
                fitness_goals: answers.goals || [],
                sports: answers.sports || [],
                updated_at: new Date().toISOString()
            }

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

            if (answers.injuries && answers.injuries.length > 0) {
                const injuryNames: { [key: string]: string } = {
                    'rodilla': 'Rodilla',
                    'espalda': 'Espalda',
                    'hombro': 'Hombro',
                    'cadera': 'Cadera',
                    'tobillo': 'Tobillo',
                    'muneca': 'Muñeca'
                }

                if (answers.injuries.includes('Ninguna') || answers.injuries.includes('ninguna')) {
                    await supabase
                        .from('user_injuries')
                        .delete()
                        .eq('user_id', user.id)
                } else {
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

    const handleNext = () => {
        if (currentStep < filteredSteps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    return {
        currentStep,
        setCurrentStep,
        answers,
        setAnswers,
        isSubmitting,
        avatarFile,
        setAvatarFile,
        avatarPreview,
        setAvatarPreview,
        filteredSteps,
        handleOptionSelect,
        handleMultiSelect,
        handleInputChange,
        handleNext,
        handleBack,
        handleSubmit,
        toggleSection,
        expandedSections
    }
}
