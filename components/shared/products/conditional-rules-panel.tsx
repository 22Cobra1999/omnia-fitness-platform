"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Plus,
    ChevronRight,
    ChevronLeft,
    Trash2,
    Settings2,
    Zap,
    Users,
    ListChecks,
    Dumbbell,
    UtensilsCrossed,
    Check,
    AlertCircle,
    Pencil,
    ChevronDown,
    Target
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export interface ConditionalRule {
    id: string
    name: string
    isActive: boolean
    criteria: {
        type?: 'fitness' | 'nutricion' // Add type to criteria
        gender?: 'male' | 'female' | 'all'
        ageRange?: [number, number]
        weightRange?: [number, number]
        activityLevel?: string[]
        programLevel?: string[]
        fitnessGoals?: string[]
    }
    adjustments: {
        weight?: number // percentage
        reps?: number   // percentage
        series?: number // percentage
        portions?: number // percentage (nutrition)
    }
    affectedItems: 'all' | string[]
    targetProductIds?: (number | string)[] // IDs can be number or string depending on DB schema
}

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

const ACTIVITY_LEVEL_OPTIONS = [
    "Sedentario",
    "Ligero",
    "Moderado",
    "Activo",
    "Muy Activo"
]

interface ConditionalRulesPanelProps {
    isOpen: boolean
    onClose: () => void
    productCategory: 'fitness' | 'nutricion'
    availableItems: any[] // exercises or plates
    onSaveRules: (rules: ConditionalRule[]) => void
    initialRules?: ConditionalRule[]
}

import { createClient } from "@/lib/supabase/supabase-client"

export function ConditionalRulesPanel({
    isOpen,
    onClose,
    productCategory,
    availableItems,
    onSaveRules,
    initialRules = [],
    productId,
    coachId
}: ConditionalRulesPanelProps & { productId?: number, coachId?: string }) {
    // console.log('🔍 [RulesPanel DEBUG] Render. coachId:', coachId, 'productId:', productId)
    const supabase = createClient()
    const [rules, setRules] = useState<ConditionalRule[]>(initialRules)
    const [isCreating, setIsCreating] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 4
    const [searchQuery, setSearchQuery] = useState('')
    const [fetchedItems, setFetchedItems] = useState<any[]>([]) // Store items fetched for alternate type
    const [fetchedProducts, setFetchedProducts] = useState<any[]>([]) // Store available products (workshops)
    const [itemsCount, setItemsCount] = useState(0) // Force re-render helper
    const [newRule, setNewRule] = useState<Partial<ConditionalRule>>({
        name: '',
        isActive: true,
        criteria: {
            type: productCategory, // Initialize with prop
            gender: 'all',
            ageRange: [0, 100],
            weightRange: [0, 200],
            activityLevel: [],
            programLevel: [],
            fitnessGoals: []
        },
        adjustments: {
            weight: 0,
            reps: 0,
            series: 0,
            portions: 0
        },
        affectedItems: 'all',
        targetProductIds: productId ? [productId] : []
    })

    // Fetch rules from DB on load
    useEffect(() => {
        const fetchRules = async () => {
            if (!coachId) {
                // console.log('⚠️ [RulesPanel] Skipping fetch: No coachId')
                return
            }

            try {
                // Fetch all rules for this coach (we filter by target/global in UI if needed, or backend logic)
                const { data, error } = await supabase
                    .from('product_conditional_rules')
                    .select('*')
                    .eq('coach_id', coachId)
                    .order('created_at', { ascending: true })

                if (error) {
                    console.error('Error fetching rules:', error)
                    return
                }

                if (data) {
                    // console.log('✅ [RulesPanel] Rules fetched:', data.length)
                    const parsedRules: ConditionalRule[] = data.map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        isActive: r.is_active,
                        criteria: r.criteria,
                        adjustments: r.adjustments,
                        affectedItems: r.affected_items,
                        targetProductIds: r.target_product_ids || []
                    }))
                    setRules(parsedRules)
                    // Only update parent if we have rules to avoid wiping state
                    if (data.length > 0) {
                        onSaveRules(parsedRules)
                    }
                }
            } catch (err) {
                console.error('Error loading rules:', err)
            }
        }

        const fetchAlternateItems = async () => {
            const currentType = newRule.criteria?.type || productCategory

            // Only fetch if type differs from current context
            if (currentType === productCategory) return

            // console.log('🔄 [RulesPanel] Fetching alternate items for:', currentType)

            try {
                // Map 'fitness' -> 'exercise', 'nutricion' -> 'recipe'
                const dbType = currentType === 'fitness' ? 'exercise' : 'recipe'

                const { data, error } = await supabase
                    .from('activities')
                    .select('id, title, type') // Assuming 'title' is the column based on csv-manager
                    .eq('coach_id', coachId)
                    .eq('type', dbType)
                    .eq('is_active', true)

                if (error) throw error

                if (data) {
                    // console.log(`✅ [RulesPanel] Loaded ${data.length} alternate items`)
                    setFetchedItems(data.map(item => ({
                        ...item,
                        nombre: item.title, // Map title to nombre for consistency
                        'Nombre': item.title
                    })))
                }
            } catch (err) {
                console.error('❌ [RulesPanel] Error fetching alternate items:', err)
            }
        }

        const fetchProducts = async () => {
            if (!coachId) return
            try {
                // Fetch workshops/products to be targets
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, title, type') // Removed category as it caused 400 error
                    .eq('coach_id', coachId)
                    .in('type', ['workshop', 'program']) // Include programs as they are also products
                    .eq('is_active', true)

                if (data) {
                    // console.log('📦 [RulesPanel] Loaded products:', data)
                    setFetchedProducts(data)
                }
            } catch (err) {
                console.error('Error fetching products:', err)
            }
        }

        if (isOpen) {
            fetchRules()
            fetchProducts()
        }

        fetchAlternateItems() // Run when type changes
    }, [isOpen, productId, coachId, supabase, newRule.criteria?.type]) // Add dependency on type

    // Sincronizar reglas iniciales si cambian (fallback)
    useEffect(() => {
        if (initialRules && initialRules.length > 0 && rules.length === 0) {
            setRules(initialRules)
        }
    }, [initialRules])

    const resetForm = () => {
        setIsCreating(false)
        setCurrentStep(1)
        setNewRule({
            name: '',
            isActive: true,
            criteria: {
                type: productCategory, // Reset to prop default
                gender: 'all',
                ageRange: [0, 100],
                weightRange: [0, 200],
                activityLevel: [],
                programLevel: []
            },
            adjustments: {
                weight: 0,
                reps: 0,
                series: 0,
                portions: 0
            },
            affectedItems: 'all'
        })
    }

    const handleSaveNewRule = async () => {
        // console.log('💾 [RulesPanel] Saving rule...', { name: newRule.name, productId, coachId })
        if (!newRule.name) return

        const isEditing = !!newRule.id
        const ruleId = newRule.id || Math.random().toString(36).substr(2, 9)

        // Optimistic update
        const rule: ConditionalRule = {
            ...newRule as ConditionalRule,
            id: ruleId
        }

        let updatedRules
        if (isEditing) {
            updatedRules = rules.map(r => r.id === ruleId ? rule : r)
        } else {
            updatedRules = [...rules, rule]
        }

        setRules(updatedRules)
        onSaveRules(updatedRules)
        resetForm()

        // DB Operations
        if (coachId) {
            const rulePayload = {
                coach_id: coachId,
                name: rule.name,
                is_active: rule.isActive,
                criteria: rule.criteria,
                adjustments: rule.adjustments,
                affected_items: rule.affectedItems,
                rule_type: rule.criteria?.type || 'fitness',
                target_product_ids: rule.targetProductIds || []
            }

            try {
                if (isEditing) {
                    // console.log('🔄 [RulesPanel] Updating rule:', ruleId, 'coachId:', coachId)
                    const { error } = await supabase
                        .from('product_conditional_rules')
                        .update(rulePayload)
                        .eq('id', ruleId)

                    if (error) throw error
                } else {
                    // console.log('💾 [RulesPanel] Inserting new rule. coachId:', coachId)
                    const { data, error } = await supabase
                        .from('product_conditional_rules')
                        .insert(rulePayload)
                        .select()
                        .single()

                    if (error) throw error

                    if (data) {
                        // Update the local rule with the real DB ID if it was a new creation
                        const confirmedRules = updatedRules.map(r =>
                            r.id === ruleId ? { ...r, id: data.id } : r
                        )
                        setRules(confirmedRules)
                        onSaveRules(confirmedRules)
                    }
                }
            } catch (err) {
                console.error('❌ [RulesPanel] DB Error:', err)
                // Ideally revert optimistic update here
            }
        } else {
            // console.log('⚠️ [RulesPanel] No coachId, saved only to local state. coachId value:', coachId)
        }
    }

    const handleDeleteRule = async (id: string) => {
        // Optimistic update
        const updatedRules = rules.filter(r => r.id !== id)
        setRules(updatedRules)
        onSaveRules(updatedRules)

        // DB Delete
        if (coachId) {
            try {
                const { error } = await supabase
                    .from('product_conditional_rules')
                    .delete()
                    .eq('id', id)

                if (error) throw error
            } catch (err) {
                console.error('Error deleting rule:', err)
            }
        }
    }

    const handleToggleRule = async (id: string) => {
        const updatedRules = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
        setRules(updatedRules)
        onSaveRules(updatedRules)

        // DB Update
        if (coachId) {
            const rule = updatedRules.find(r => r.id === id)
            if (rule) {
                try {
                    const { error } = await supabase
                        .from('product_conditional_rules')
                        .update({ is_active: rule.isActive })
                        .eq('id', id)

                    if (error) throw error
                } catch (err) {
                    console.error('Error updating rule status:', err)
                }
            }
        }
    }

    const handleEditRule = (rule: ConditionalRule) => {
        setNewRule({
            ...rule,
            criteria: { ...rule.criteria },
            adjustments: { ...rule.adjustments }
        })
        setIsCreating(true)
    }

    // Helper para generar resumen de ajustes
    const getAdjustmentsSummary = (rule: ConditionalRule) => {
        const type = rule.criteria?.type || productCategory
        // console.log('📊 [RulesPanel] Summary for:', rule.name, { type, criteriaType: rule.criteria?.type, productCategory })

        if (type === 'fitness') {
            const parts = []
            if ((rule.adjustments.weight || 0) !== 0) parts.push(`Peso ${(rule.adjustments.weight || 0) > 0 ? '+' : ''}${rule.adjustments.weight}%`)
            if ((rule.adjustments.reps || 0) !== 0) parts.push(`Reps ${(rule.adjustments.reps || 0) > 0 ? '+' : ''}${rule.adjustments.reps}%`)
            if ((rule.adjustments.series || 0) !== 0) parts.push(`Series ${(rule.adjustments.series || 0) > 0 ? '+' : ''}${rule.adjustments.series}%`)

            if (parts.length === 0) return 'Sin ajustes de entrenamiento'
            return parts.join(' • ')
        } else {
            const portions = rule.adjustments.portions || 0
            return `Porciones ${portions > 0 ? '+' : ''}${portions}%`
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0b0b0b] border-l border-white/10 z-[110] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#FF7939]/10">
                                    <Settings2 className="h-5 w-5 text-[#FF7939]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Reglas Condicionales</h2>
                                    <p className="text-xs text-gray-400">Ajustes automáticos por cliente</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {!isCreating ? (
                                /* Rules List */
                                <div className="space-y-4">
                                    {rules.length === 0 ? (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <div className="p-4 rounded-full bg-white/5 mb-4">
                                                <Zap className="h-8 w-8 text-gray-600" />
                                            </div>
                                            <p className="text-gray-400 text-sm mb-6">No hay reglas configuradas aún.</p>
                                            <Button
                                                onClick={() => setIsCreating(true)}
                                                className="bg-[#FF7939] hover:bg-[#E66829] text-white"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Crear Primera Regla
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-sm font-medium text-gray-400">
                                                    {rules.length} {rules.length === 1 ? 'regla activa' : 'reglas activas'}
                                                </span>
                                                <Button
                                                    onClick={() => setIsCreating(true)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#FF7939] hover:text-[#FF7939] hover:bg-[#FF7939]/10"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Agregar
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {rules.map((rule) => {
                                                    const summary = getAdjustmentsSummary(rule)
                                                    const type = rule.criteria?.type || productCategory
                                                    const isFitness = type === 'fitness'

                                                    return (
                                                        <div
                                                            key={rule.id}
                                                            className={`group relative p-4 rounded-xl border transition-all duration-300 ${rule.isActive
                                                                ? 'border-white/10 bg-gradient-to-r from-white/5 to-transparent'
                                                                : 'border-white/5 bg-transparent opacity-60'
                                                                } hover:border-white/20`}
                                                        >
                                                            <div className="flex items-center justify-between gap-4">
                                                                {/* Left: Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        {/* Type Badge */}
                                                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${isFitness
                                                                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                            }`}>
                                                                            {isFitness ? <Dumbbell className="h-3 w-3" /> : <UtensilsCrossed className="h-3 w-3" />}
                                                                            {isFitness ? 'Fitness' : 'Nutrición'}
                                                                        </div>

                                                                        {rule.criteria.gender !== 'all' && (
                                                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md font-medium">
                                                                                {rule.criteria.gender === 'male' ? 'H' : 'M'}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <h3 className="font-medium text-white text-sm truncate mb-1.5">{rule.name}</h3>

                                                                    <div className="text-xs text-gray-400 flex items-center gap-2 truncate">
                                                                        <Zap className="h-3 w-3 text-[#FF7939]" />
                                                                        <span>{summary}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Right: Actions */}
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={rule.isActive}
                                                                        onCheckedChange={() => handleToggleRule(rule.id)}
                                                                        className="scale-75"
                                                                    />
                                                                    <div className="h-4 w-px bg-white/10 mx-1" />
                                                                    <button
                                                                        onClick={() => handleEditRule(rule)}
                                                                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                        title="Editar regla"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteRule(rule.id)}
                                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                        title="Eliminar regla"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* Multi-step Creation Flow */
                                <div className="space-y-6">
                                    {/* Step Progress */}
                                    <div className="flex items-center justify-between mb-8">
                                        {[1, 2, 3, 4].map((step) => (
                                            <React.Fragment key={step}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step
                                                    ? 'bg-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.4)]'
                                                    : 'bg-white/10 text-gray-500'
                                                    }`}>
                                                    {step}
                                                </div>
                                                {step < 4 && (
                                                    <div className={`flex-1 h-px transition-all ${currentStep > step ? 'bg-[#FF7939]' : 'bg-white/10'
                                                        }`} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* Step Content */}
                                    <AnimatePresence mode="wait">
                                        {currentStep === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6 pb-4"
                                            >
                                                <div className="space-y-4">
                                                    <Label className="text-white text-xs font-semibold uppercase tracking-wider opacity-60">Nombre de la regla</Label>
                                                    <Input
                                                        value={newRule.name}
                                                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                                        placeholder="Ej: Aumento por nivel avanzado"
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 focus:ring-[#FF7939]/20"
                                                    />
                                                </div>



                                                <div className="space-y-3">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Tipo de Regla</span>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewRule({
                                                                ...newRule,
                                                                criteria: { ...newRule.criteria, type: 'fitness' }
                                                            })}
                                                            className={`p-3 rounded-xl border text-center transition-all duration-300 ${newRule.criteria?.type === 'fitness'
                                                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                                                : 'border-white/5 bg-black/20 text-gray-500 hover:border-white/20'
                                                                }`}
                                                        >
                                                            <Dumbbell className={`h-4 w-4 mx-auto mb-2 ${newRule.criteria?.type === 'fitness' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                                                            <div className="text-xs font-semibold">Entremiento</div>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewRule({
                                                                ...newRule,
                                                                criteria: { ...newRule.criteria, type: 'nutricion' }
                                                            })}
                                                            className={`p-3 rounded-xl border text-center transition-all duration-300 ${newRule.criteria?.type === 'nutricion'
                                                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                                                : 'border-white/5 bg-black/20 text-gray-500 hover:border-white/20'
                                                                }`}
                                                        >
                                                            <UtensilsCrossed className={`h-4 w-4 mx-auto mb-2 ${newRule.criteria?.type === 'nutricion' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                                                            <div className="text-xs font-semibold">Nutrición</div>
                                                        </button>
                                                    </div>
                                                </div>



                                            </motion.div>
                                        )}

                                        {currentStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                                                        <Target className="h-4 w-4 text-[#FF7939]" />
                                                        <Label className="text-white font-semibold">Alcance de la Regla</Label>
                                                    </div>

                                                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                                        Define a qué productos o talleres se aplicará esta regla. Puedes hacerla global o específica para ciertos programas.
                                                    </p>

                                                    <div className="space-y-3">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Aplica a (Productos)</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewRule({ ...newRule, targetProductIds: [] })}
                                                                className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${(!newRule.targetProductIds || newRule.targetProductIds.length === 0)
                                                                    ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]'
                                                                    : 'border-white/5 bg-black/20 text-gray-500 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                Todos (Global)
                                                            </button>
                                                            {fetchedProducts.map(prod => {
                                                                // Use loose equality or check type to handle string vs number issues
                                                                const isSelected = newRule.targetProductIds?.some(id => String(id) === String(prod.id))
                                                                return (
                                                                    <button
                                                                        key={prod.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = newRule.targetProductIds || []
                                                                            const prodIdStr = String(prod.id)
                                                                            // Clean up current list to ensure consistency
                                                                            const next = isSelected
                                                                                ? current.filter(id => String(id) !== prodIdStr)
                                                                                : [...current, prod.id] // Keep original type
                                                                            setNewRule({ ...newRule, targetProductIds: next })
                                                                        }}
                                                                        className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${isSelected
                                                                            ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]'
                                                                            : 'border-white/5 bg-black/20 text-gray-500 hover:border-white/20'
                                                                            }`}
                                                                    >
                                                                        {prod.title}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                        {fetchedProducts.length === 0 && (
                                                            <p className="text-[10px] text-gray-600 italic mt-2">
                                                                No se encontraron talleres activos. La regla aplicará globalmente.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {currentStep === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6 pb-4"
                                            >
                                                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-6">
                                                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                                                        <Users className="h-4 w-4 text-[#FF7939]" />
                                                        <Label className="text-white font-semibold">Criterios de Aplicación</Label>
                                                    </div>

                                                    {/* MOVED CRITERIA HERE */}
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {/* Sex selection */}
                                                        <div className="space-y-3">
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Sexo</span>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['all', 'male', 'female'].map((g) => (
                                                                    <button
                                                                        key={g}
                                                                        type="button"
                                                                        onClick={() => setNewRule({
                                                                            ...newRule,
                                                                            criteria: { ...newRule.criteria, gender: g as any }
                                                                        })}
                                                                        className={`py-2.5 text-[10px] rounded-xl border transition-all duration-300 ${newRule.criteria?.gender === g
                                                                            ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)]'
                                                                            : 'border-white/5 bg-black/20 text-gray-500 hover:border-white/20'
                                                                            }`}
                                                                    >
                                                                        {g === 'all' ? 'Ambos' : g === 'male' ? 'Hombre' : 'Mujer'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Fitness Goals */}
                                                        <div className="space-y-3">
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Objetivos</span>
                                                            <div className="max-h-[220px] overflow-y-auto pr-2 thin-scrollbar bg-black/20 rounded-xl p-2 border border-white/5">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {FITNESS_GOALS_OPTIONS.map((goal) => {
                                                                        const isSelected = newRule.criteria?.fitnessGoals?.includes(goal)
                                                                        return (
                                                                            <button
                                                                                key={goal}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const current = newRule.criteria?.fitnessGoals || []
                                                                                    const next = isSelected
                                                                                        ? current.filter(g => g !== goal)
                                                                                        : [...current, goal]
                                                                                    setNewRule({
                                                                                        ...newRule,
                                                                                        criteria: { ...newRule.criteria, fitnessGoals: next }
                                                                                    })
                                                                                }}
                                                                                className={`py-2 px-3 text-[10px] rounded-lg border text-left transition-all duration-300 flex items-center gap-2 ${isSelected
                                                                                    ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                                                                    : 'border-white/5 bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                                                    }`}
                                                                            >
                                                                                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF7939] bg-[#FF7939]' : 'border-gray-600'}`}>
                                                                                    {isSelected && <Check className="h-2 w-2 text-white" />}
                                                                                </div>
                                                                                <span className="truncate">{goal}</span>
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Activity Level */}
                                                        <div className="space-y-3">
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Nivel de Actividad</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {ACTIVITY_LEVEL_OPTIONS.map((level) => {
                                                                    const isSelected = newRule.criteria?.activityLevel?.includes(level)
                                                                    return (
                                                                        <button
                                                                            key={level}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const current = newRule.criteria?.activityLevel || []
                                                                                const next = isSelected
                                                                                    ? current.filter(l => l !== level)
                                                                                    : [...current, level]
                                                                                setNewRule({
                                                                                    ...newRule,
                                                                                    criteria: { ...newRule.criteria, activityLevel: next }
                                                                                })
                                                                            }}
                                                                            className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${isSelected
                                                                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                                                                : 'border-white/5 bg-black/20 text-gray-500 hover:border-white/20'
                                                                                }`}
                                                                        >
                                                                            {level}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Age Range */}
                                                            <div className="space-y-2">
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Edad</span>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Min"
                                                                        value={newRule.criteria?.ageRange?.[0]}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 0
                                                                            setNewRule({
                                                                                ...newRule,
                                                                                criteria: { ...newRule.criteria, ageRange: [val, newRule.criteria?.ageRange?.[1] || 100] }
                                                                            })
                                                                        }}
                                                                        className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Max"
                                                                        value={newRule.criteria?.ageRange?.[1]}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 100
                                                                            setNewRule({
                                                                                ...newRule,
                                                                                criteria: { ...newRule.criteria, ageRange: [newRule.criteria?.ageRange?.[0] || 0, val] }
                                                                            })
                                                                        }}
                                                                        className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Weight Range */}
                                                            <div className="space-y-2">
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Peso (kg)</span>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Min"
                                                                        value={newRule.criteria?.weightRange?.[0]}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 0
                                                                            setNewRule({
                                                                                ...newRule,
                                                                                criteria: { ...newRule.criteria, weightRange: [val, newRule.criteria?.weightRange?.[1] || 200] }
                                                                            })
                                                                        }}
                                                                        className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Max"
                                                                        value={newRule.criteria?.weightRange?.[1]}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 200
                                                                            setNewRule({
                                                                                ...newRule,
                                                                                criteria: { ...newRule.criteria, weightRange: [newRule.criteria?.weightRange?.[0] || 0, val] }
                                                                            })
                                                                        }}
                                                                        className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-6 text-center text-gray-500 text-xs">
                                                    <ChevronDown className="h-4 w-4 mx-auto animate-bounce opacity-50" />
                                                    <p>Desplázate hacia abajo para seleccionar items afectados</p>
                                                </div>

                                                {/* Affected Items Section (Formerly part of Step 2) */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                                                        <ListChecks className="h-4 w-4 text-[#FF7939]" />
                                                        <Label className="text-white font-semibold">Items Afectados</Label>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <Input
                                                                placeholder={newRule.criteria?.type === 'fitness' ? "Buscar ejercicio..." : "Buscar plato..."}
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="bg-white/5 border-white/10 pl-10 h-11 text-white placeholder:text-gray-500 focus:ring-[#FF7939]/20"
                                                            />
                                                            <div className="absolute left-3 top-3.5 text-gray-500">
                                                                {newRule.criteria?.type === 'fitness' ? <Dumbbell className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
                                                            </div>
                                                        </div>

                                                        <div className="max-h-[300px] overflow-y-auto pr-2 thin-scrollbar space-y-2">
                                                            {(fetchedItems.length > 0 ? fetchedItems : availableItems)
                                                                .filter(item => {
                                                                    const name = item.nombre || item['Nombre'] || item.title || ''
                                                                    return name.toLowerCase().includes(searchQuery.toLowerCase())
                                                                })
                                                                .map((item) => {
                                                                    const itemId = String(item.id)
                                                                    const isSelected = newRule.affectedItems === 'all' || newRule.affectedItems?.includes(itemId)

                                                                    return (
                                                                        <div
                                                                            key={itemId}
                                                                            onClick={() => {
                                                                                let current = newRule.affectedItems === 'all' ? [] : (newRule.affectedItems || [])
                                                                                if (isSelected) {
                                                                                    current = current.filter(id => id !== itemId)
                                                                                } else {
                                                                                    current = [...current, itemId]
                                                                                }
                                                                                setNewRule({ ...newRule, affectedItems: current.length === 0 ? [] : current })
                                                                            }}
                                                                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                                                                                ? 'bg-[#FF7939]/10 border-[#FF7939]/30'
                                                                                : 'bg-white/5 border-white/5 hover:border-white/10'
                                                                                }`}
                                                                        >
                                                                            <span className="text-sm text-gray-300 font-medium truncate pr-4">
                                                                                {item.nombre || item['Nombre'] || item.title}
                                                                                {item.etiqueta && <Badge variant="secondary" className="ml-2 text-[10px] h-5">{item.etiqueta}</Badge>}
                                                                            </span>
                                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                                                                ? 'border-[#FF7939] bg-[#FF7939]'
                                                                                : 'border-white/20'
                                                                                }`}>
                                                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                        </div>
                                                        <div className="text-center text-xs text-gray-500 mt-2">
                                                            {Array.isArray(newRule.affectedItems)
                                                                ? `${newRule.affectedItems.length} seleccionados`
                                                                : 'Todos seleccionados'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {currentStep === 4 && (
                                            <motion.div
                                                key="step4"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-8">
                                                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                                                        <Zap className="h-4 w-4 text-[#FF7939]" />
                                                        <Label className="text-white font-semibold">Ajustes Automáticos ({newRule.criteria?.type === 'fitness' ? 'Fitness' : 'Nutrición'})</Label>
                                                    </div>

                                                    {(newRule.criteria?.type || productCategory) === 'fitness' ? (
                                                        <div className="grid grid-cols-1 gap-8">
                                                            {[
                                                                { key: 'weight', label: 'Peso', icon: Dumbbell },
                                                                { key: 'reps', label: 'Repeticiones', icon: ListChecks },
                                                                { key: 'series', label: 'Series', icon: Zap }
                                                            ].map((adj) => {
                                                                const value = (newRule.adjustments as any)[adj.key]
                                                                return (
                                                                    <div key={adj.key} className="space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="p-1.5 rounded-lg bg-white/5">
                                                                                    <adj.icon className="h-3.5 w-3.5 text-gray-400" />
                                                                                </div>
                                                                                <Label className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{adj.label}</Label>
                                                                            </div>
                                                                            <span className="text-xs font-bold text-[#FF7939] bg-[#FF7939]/10 px-2 py-1 rounded-md">
                                                                                {value > 0 ? `+${value}%` : `${value}%`}
                                                                            </span>
                                                                        </div>
                                                                        <input
                                                                            type="range"
                                                                            min="-200"
                                                                            max="200"
                                                                            step="5"
                                                                            value={value}
                                                                            onChange={(e) => setNewRule({
                                                                                ...newRule,
                                                                                adjustments: {
                                                                                    ...newRule.adjustments,
                                                                                    [adj.key]: parseInt(e.target.value)
                                                                                }
                                                                            })}
                                                                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#FF7939]"
                                                                        />
                                                                        <div className="flex justify-between text-[10px] text-gray-600 font-bold px-1">
                                                                            <span>-200%</span>
                                                                            <span>0%</span>
                                                                            <span>+200%</span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-white/5">
                                                                        <UtensilsCrossed className="h-3.5 w-3.5 text-gray-400" />
                                                                    </div>
                                                                    <Label className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Porciones / Ingredientes</Label>
                                                                </div>
                                                                <span className="text-xs font-bold text-[#FF7939] bg-[#FF7939]/10 px-2 py-1 rounded-md">
                                                                    {newRule.adjustments?.portions || 0 > 0 ? `+${newRule.adjustments?.portions || 0}%` : `${newRule.adjustments?.portions || 0}%`}
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="-200"
                                                                max="200"
                                                                step="5"
                                                                value={newRule.adjustments?.portions || 0}
                                                                onChange={(e) => setNewRule({
                                                                    ...newRule,
                                                                    adjustments: {
                                                                        ...newRule.adjustments,
                                                                        portions: parseInt(e.target.value)
                                                                    }
                                                                })}
                                                                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#FF7939]"
                                                            />
                                                            <div className="flex justify-between text-[10px] text-gray-600 font-bold px-1">
                                                                <span>-200%</span>
                                                                <span>0%</span>
                                                                <span>+200%</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                                        <div className="flex gap-3">
                                                            <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-blue-300/80 leading-relaxed font-medium">
                                                                Las repeticiones y series se redondearán automáticamente hacia arriba para asegurar la progresión adecuada.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-[#0b0b0b]">
                            {!isCreating ? (
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    className="w-full text-gray-400 hover:text-white"
                                >
                                    Cerrar
                                </Button>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => {
                                            if (currentStep === 1) setIsCreating(false)
                                            else setCurrentStep(currentStep - 1)
                                        }}
                                        variant="ghost"
                                        className="flex-1 text-gray-400 hover:text-white"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                                    </Button>

                                    {currentStep < 4 ? (
                                        <Button
                                            onClick={() => setCurrentStep(currentStep + 1)}
                                            disabled={currentStep === 1 && !newRule.name}
                                            className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white"
                                        >
                                            Siguiente
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSaveNewRule}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Guardar Regla
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    )
}
