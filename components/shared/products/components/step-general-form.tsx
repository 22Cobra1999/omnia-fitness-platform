"use client"

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import {
    Camera,
    Video as VideoIcon,
    Upload,
    Flame,
    ChevronDown,
    DollarSign,
    Users as UsersIcon,
    Info,
    Check,
    MapPin,
    Globe,
    X,
} from 'lucide-react'
import { GeneralFormState, SpecificFormState, ProductType, PLAN_COMMISSIONS, PlanType } from '../product-constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

interface StepGeneralFormProps {
    state: {
        generalForm: GeneralFormState
        specificForm: SpecificFormState
        selectedType: ProductType
        fieldErrors: Record<string, boolean>
        isPublishing: boolean
        inlineMediaLoading: boolean
        inlineMediaItems: any[]
        inlineMediaType: 'image' | 'video'
        showMediaSourceModal: boolean
        planLimit?: number
        planType?: string
        uploadProgress: number
        isVideoPreviewActive: boolean
        objectiveOptions?: { label: string, options: string[] }[]
        restrictionOptions?: { label: string, options: string[] }[]
    }
    actions: {
        setGeneralForm: React.Dispatch<React.SetStateAction<GeneralFormState>>
        setSpecificForm: React.Dispatch<React.SetStateAction<SpecificFormState>>
        clearFieldError: (field: string) => void
        addObjetivo: (val: string) => void
        removeObjetivo: (val: string) => void
        addRestriccion: (val: string) => void
        removeRestriccion: (val: string) => void
        loadInlineMedia: (type: 'image' | 'video') => void
        handleMediaSelection: (url: string, type: 'image' | 'video' | 'pdf', file?: File) => void
        handleInlineUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void
        setShowMediaSourceModal: (show: boolean) => void
        setInlineMediaType: (type: 'image' | 'video') => void
        handleStockQuantityChange: (val: string) => void
        onNext: () => void
        onBack: () => void
    }
}

export const StepGeneralForm: React.FC<StepGeneralFormProps> = ({ state, actions }) => {
    const { generalForm, specificForm, selectedType, fieldErrors } = state
    const { setGeneralForm, setSpecificForm, clearFieldError, onNext, onBack } = actions

    const [activeMediaTab, setActiveMediaTab] = React.useState<'image' | 'video'>('image')

    const intensityOptions = [
        { id: 'beginner', label: 'Principiante', flames: 1 },
        { id: 'intermediate', label: 'Intermedio', flames: 2 },
        { id: 'advanced', label: 'Avanzado', flames: 3 },
    ]

    const planType = (state.planType as PlanType) || 'free'
    const commissionRate = PLAN_COMMISSIONS[planType] || 0.05

    // Parse price safely
    const price = parseFloat(String(generalForm.price).replace(',', '.')) || 0
    const stock = parseInt(generalForm.stockQuantity) || 0

    const calculatedTotal = price * stock
    const commission = calculatedTotal * commissionRate
    const netTotal = calculatedTotal - commission

    const hasCurrentMedia = activeMediaTab === 'image' ? !!generalForm.image : !!generalForm.videoUrl

    return (
        <div className="space-y-8 max-w-xl mx-auto py-4 px-2">

            {/* Media Preview & Controls */}
            <div className="space-y-6">
                {/* Preview Frame */}
                <div className={`${activeMediaTab === 'image' ? 'aspect-[4/5] max-w-[160px]' : 'aspect-video w-full'} rounded-2xl bg-[#0A0A0A] border border-white/10 overflow-hidden relative flex items-center justify-center mx-auto transition-all duration-300 shadow-xl shadow-black/50`}>
                    {activeMediaTab === 'image' ? (
                        generalForm.image ? (
                            <img
                                src={generalForm.image instanceof File ? URL.createObjectURL(generalForm.image) : (generalForm.image as { url: string }).url}
                                className="w-full h-full object-cover"
                                alt="Preview"
                            />
                        ) : (
                            <div className="text-center space-y-2">
                                <Camera className="h-10 w-10 text-gray-700 mx-auto" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Sin foto</p>
                            </div>
                        )
                    ) : (
                        generalForm.videoUrl ? (
                            <div className="text-center space-y-2 relative w-full h-full flex flex-col items-center justify-center bg-black">
                                {state.uploadProgress > 0 && state.uploadProgress < 100 && (
                                    <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#FF7939] animate-spin mb-2" />
                                        <div className="text-white font-bold text-lg">{Math.round(state.uploadProgress)}%</div>
                                        <div className="text-gray-400 text-xs uppercase tracking-wider">Subiendo...</div>
                                    </div>
                                )}
                                <UniversalVideoPlayer
                                    videoUrl={generalForm.videoUrl}
                                    className="w-full h-full"
                                    controls={true}
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-2">
                                <VideoIcon className="h-10 w-10 text-gray-700 mx-auto" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Sin video</p>
                            </div>
                        )
                    )}
                </div>

                {/* Icons Controls */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setActiveMediaTab('image')}
                            className={`p-3 rounded-xl transition-all ${activeMediaTab === 'image' ? 'bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Camera className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => setActiveMediaTab('video')}
                            className={`p-3 rounded-xl transition-all ${activeMediaTab === 'video' ? 'bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30' : 'text-gray-500 hover:text-white'}`}
                        >
                            <VideoIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            actions.setInlineMediaType(activeMediaTab)
                            actions.setShowMediaSourceModal(true)
                        }}
                        className="flex items-center gap-2 text-[#FF7939] font-bold uppercase text-xs tracking-widest hover:opacity-80"
                    >
                        <Upload className="h-4 w-4" />
                        Subir {activeMediaTab === 'image' ? 'Foto' : 'Video'}
                    </button>

                    {hasCurrentMedia && (
                        <button
                            onClick={() => {
                                if (activeMediaTab === 'image') setGeneralForm(prev => ({ ...prev, image: null }))
                                else setGeneralForm(prev => ({ ...prev, videoUrl: '' }))
                            }}
                            className="flex items-center gap-2 text-red-500 font-bold uppercase text-[10px] tracking-widest hover:opacity-80"
                        >
                            <X className="h-3 w-3" />
                            Eliminar
                        </button>
                    )}
                </div>
            </div>

            {/* Inputs de Texto */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Título</label>
                    <Input
                        value={generalForm.name}
                        onChange={(e) => {
                            setGeneralForm(prev => ({ ...prev, name: e.target.value }))
                            clearFieldError('name')
                        }}
                        placeholder="Ej: Plan de 4 semanas"
                        className={`bg-[#0A0A0A] border-white/10 text-white h-12 rounded-xl focus:border-[#FF7939]/50 transition-all ${fieldErrors.name ? 'border-red-500/50' : ''}`}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Descripción</label>
                    <Textarea
                        value={generalForm.description}
                        onChange={(e) => {
                            setGeneralForm(prev => ({ ...prev, description: e.target.value }))
                            clearFieldError('description')
                        }}
                        placeholder="Describí tu producto..."
                        className={`bg-[#0A0A0A] border-white/10 text-white min-h-[120px] rounded-xl focus:border-[#FF7939]/50 transition-all ${fieldErrors.description ? 'border-red-500/50' : ''}`}
                    />
                </div>
            </div>

            {/* Intensidad (Screenshot 3) */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">INTENSIDAD</label>
                <div className="flex gap-2">
                    {intensityOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSpecificForm(prev => ({ ...prev, level: opt.id }))}
                            className={`flex-1 p-3 rounded-xl border text-left transition-all ${specificForm.level === opt.id
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : 'border-white/10 bg-[#0A0A0A]'
                                }`}
                        >
                            <div className="text-xs font-bold text-white mb-2">{opt.label}</div>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Flame
                                        key={i}
                                        className={`h-4 w-4 ${i < opt.flames ? 'text-[#FF7939] fill-[#FF7939]' : 'text-gray-700'}`}
                                    />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Objetivos y Restricciones (Lista Entera) */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">OBJETIVOS</label>
                    <Select onValueChange={(val) => actions.addObjetivo(val)}>
                        <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white h-12 rounded-xl">
                            <SelectValue placeholder="Agregar objetivo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white max-h-[300px] overflow-y-auto">
                            {state.objectiveOptions?.map((group: any) => (
                                <SelectGroup key={group.label}>
                                    <SelectLabel className="text-[#FF7939] px-2 py-1.5 text-xs font-bold uppercase tracking-widest">{group.label}</SelectLabel>
                                    {group.options.map((opt: string) => (
                                        <SelectItem key={opt} value={opt} className="pl-4">
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {generalForm.objetivos.map(obj => (
                            <div key={obj} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10">
                                <span className="text-xs font-bold text-[#FF7939]">{obj}</span>
                                <button onClick={() => actions.removeObjetivo(obj)} className="text-[#FF7939]/50 hover:text-[#FF7939]">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Restricciones</label>
                    <Select onValueChange={(val) => actions.addRestriccion(val)}>
                        <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white h-12 rounded-xl">
                            <SelectValue placeholder="Agregar restricción" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white max-h-[300px] overflow-y-auto">
                            {state.restrictionOptions?.map((group: any) => (
                                <SelectGroup key={group.label}>
                                    <SelectLabel className="text-red-400 px-2 py-1.5 text-xs font-bold uppercase tracking-widest">{group.label}</SelectLabel>
                                    {group.options.map((opt: string) => (
                                        <SelectItem key={opt} value={opt} className="pl-4">
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {generalForm.restricciones.map(res => (
                            <div key={res} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10">
                                <span className="text-xs font-bold text-red-400">{res}</span>
                                <button onClick={() => actions.removeRestriccion(res)} className="text-red-400/50 hover:text-red-400">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Planes de Precios y Cupos (Screenshot 4) */}
            <div className="space-y-4 pt-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">PLAN DE PRECIOS Y CUPOS</label>
                <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0A0A] space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-black/40 rounded-xl border border-white/10 p-1 flex items-center">
                            <span className="px-3 text-xs font-bold text-[#FF7939] uppercase">Cupos</span>
                            <Input
                                type="number"
                                value={generalForm.stockQuantity}
                                onChange={(e) => actions.handleStockQuantityChange(e.target.value)}
                                className="bg-transparent border-none text-right font-bold focus-visible:ring-0 h-10 w-full"
                                placeholder="0"
                            />
                        </div>
                        <span className="text-gray-500 font-bold">×</span>
                        <div className="flex-1 bg-black/40 rounded-xl border border-white/10 p-1 flex items-center">
                            <span className="px-2 text-white"><DollarSign className="h-4 w-4" /></span>
                            <Input
                                type="number"
                                value={generalForm.price}
                                onChange={(e) => setGeneralForm(prev => ({ ...prev, price: e.target.value }))}
                                className="bg-transparent border-none font-bold focus-visible:ring-0 h-10 w-full"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 text-center">
                        {/* 1. Plan & Commission */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-[#FF7939] font-bold uppercase tracking-wider">PLAN {state.planType?.toUpperCase() || 'FREE'}</span>
                            <span className="text-gray-500 font-medium">— {Math.round(commissionRate * 100)}% =</span>
                            <span className="text-white font-bold">{commission.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS</span>
                        </div>

                        {/* 2. Final Result */}
                        <div className="text-lg text-gray-400 font-medium">
                            Neto: <span className="text-white font-bold">$ {netTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
