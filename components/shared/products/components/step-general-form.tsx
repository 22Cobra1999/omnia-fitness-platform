"use client"

import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Camera,
    Image as ImageIcon,
    Video as VideoIcon,
    Upload,
    Flame,
    ChevronDown,
    DollarSign,
    Users as UsersIcon,
    Info,
    Check,
    X,
    MapPin,
    Globe,
    Pause,
    Play
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
        totalSales?: number
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

    const [mediaSourceSelection, setMediaSourceSelection] = useState<'new' | 'existing' | null>(null)

    // Load existing media automatically when 'existing' is selected
    React.useEffect(() => {
        if (mediaSourceSelection === 'existing') {
            actions.loadInlineMedia(activeMediaTab)
        }
    }, [activeMediaTab, mediaSourceSelection])

    const hasCurrentMedia = activeMediaTab === 'image' ? !!generalForm.image : !!generalForm.videoUrl

    // Hidden file input ref for direct upload
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="space-y-4 sm:space-y-8 max-w-xl mx-auto py-2 sm:py-4 px-2">

            {/* Media Preview & Controls */}
            <div className="space-y-4 sm:space-y-6">
                {/* Preview Frame */}
                <div className={`${activeMediaTab === 'image' ? 'aspect-[4/5] max-w-[160px]' : 'aspect-video w-full'} rounded-3xl bg-black border border-white/5 overflow-hidden relative flex items-center justify-center mx-auto transition-all duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] group`}>
                    {activeMediaTab === 'image' ? (
                        generalForm.image ? (
                            <img
                                src={generalForm.image instanceof File ? URL.createObjectURL(generalForm.image) : (generalForm.image as { url: string }).url}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt="Preview"
                            />
                        ) : (
                            <div className="text-center space-y-3 opacity-40">
                                <div className="p-4 bg-white/5 rounded-full inline-block">
                                    <Camera className="h-8 w-8 text-white mx-auto" strokeWidth={1.5} />
                                </div>
                                <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Sin foto</p>
                            </div>
                        )
                    ) : (
                        generalForm.videoUrl ? (
                            <div className="text-center space-y-2 relative w-full h-full flex flex-col items-center justify-center bg-black">
                                {state.uploadProgress > 0 && state.uploadProgress < 100 && (
                                    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                                        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#FF7939] animate-spin mb-4" />
                                        <div className="text-white font-black text-2xl tracking-tighter">{Math.round(state.uploadProgress)}%</div>
                                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Subiendo...</div>
                                    </div>
                                )}
                                <UniversalVideoPlayer
                                    videoUrl={generalForm.videoUrl}
                                    className="w-full h-full"
                                    controls={true}
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-3 opacity-40">
                                <div className="p-4 bg-white/5 rounded-full inline-block">
                                    <VideoIcon className="h-8 w-8 text-white mx-auto" strokeWidth={1.5} />
                                </div>
                                <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Sin video</p>
                            </div>
                        )
                    )}
                </div>

                {/* Source Selection & Actions */}
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-6">
                        {/* Title Choice */}
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF7939]">
                                Cambiar {activeMediaTab === 'image' ? 'Foto' : 'Video'}
                            </p>
                        </div>

                        {/* Compact Source Buttons */}
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 group transition-all"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#FF7939]/20 group-hover:scale-110 transition-all border border-white/5 group-hover:border-[#FF7939]/30">
                                    <Upload className="h-4 w-4 text-white/40 group-hover:text-[#FF7939]" />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors">Subir Nuevo</span>
                            </button>

                            <div className="w-px h-6 bg-white/5 self-center" />

                            <button
                                onClick={() => setMediaSourceSelection('existing')}
                                className="flex flex-col items-center gap-2 group transition-all"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#FF7939]/20 group-hover:scale-110 transition-all border border-white/5 group-hover:border-[#FF7939]/30">
                                    <ImageIcon className="h-4 w-4 text-white/40 group-hover:text-[#FF7939]" />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors">De Galería</span>
                            </button>
                        </div>

                        {hasCurrentMedia && (
                            <button
                                onClick={() => {
                                    if (activeMediaTab === 'image') setGeneralForm(prev => ({ ...prev, image: null }))
                                    else setGeneralForm(prev => ({ ...prev, videoUrl: '' }))
                                    setMediaSourceSelection(null)
                                }}
                                className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-500/30 hover:text-red-500 transition-colors pt-2"
                            >
                                <X className="h-3 w-3 inline mr-1 -mt-0.5" />
                                ELIMINAR ACTUAL
                            </button>
                        )}
                    </div>

                    {/* Gallery View (if selected) */}
                    {mediaSourceSelection === 'existing' && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                  <button onClick={() => setMediaSourceSelection(null)} className="hover:text-white mr-2 transition-colors">
                                    <X className="h-3 w-3" />
                                  </button>
                                  Explorar Almacenamiento
                                </label>
                                {state.inlineMediaLoading && <div className="w-3 h-3 rounded-full border-2 border-white/10 border-t-[#FF7939] animate-spin" />}
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar px-1 snap-x pt-2">
                                {state.inlineMediaItems.length === 0 && !state.inlineMediaLoading ? (
                                    <div className="py-10 px-6 border border-dashed border-white/5 rounded-[24px] w-full text-center bg-white/[0.02]">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 italic">No hay archivos en tu galería</p>
                                    </div>
                                ) : (
                                    state.inlineMediaItems.map((item: any, idx: number) => (
                                        <motion.button
                                            key={item.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => {
                                                actions.handleMediaSelection(item.url, activeMediaTab)
                                                setMediaSourceSelection(null)
                                            }}
                                            className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center bg-white/5 snap-start shadow-lg ${
                                                (activeMediaTab === 'image' && (generalForm.image as any)?.url === item.url) || 
                                                (activeMediaTab === 'video' && generalForm.videoUrl === item.url)
                                                    ? 'border-[#FF7939] scale-95 shadow-[0_0_30px_-5px_rgba(255,121,57,0.3)]' 
                                                    : 'border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            {activeMediaTab === 'image' ? (
                                                <img src={item.url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 p-2 w-full h-full justify-center">
                                                    <div className="p-2 bg-white/5 rounded-full">
                                                      <VideoIcon className="h-5 w-5 text-[#FF7939]" />
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase text-white/30 truncate w-full text-center px-1 tracking-wider">{item.filename}</span>
                                                </div>
                                            )}
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Icons Controls (Tab selection) */}
                <div className="flex flex-col items-center gap-8 pt-4">
                    <div className="flex items-center gap-16">
                        <button
                            onClick={() => {
                                setActiveMediaTab('image')
                                setMediaSourceSelection(null)
                            }}
                            className={`flex flex-col items-center gap-3 transition-all ${activeMediaTab === 'image' ? 'text-[#FF7939]' : 'text-gray-600 hover:text-white'}`}
                        >
                            <div className={`p-5 rounded-[22px] transition-all duration-300 ${activeMediaTab === 'image' ? 'bg-[#FF7939]/20 border border-[#FF7939]/30 shadow-[0_0_40px_-10px_rgba(255,121,57,0.4)] ring-4 ring-[#FF7939]/5' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                                <Camera className="h-6 w-6" strokeWidth={activeMediaTab === 'image' ? 2.5 : 1.5} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">FOTOS</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveMediaTab('video')
                                setMediaSourceSelection(null)
                            }}
                            className={`flex flex-col items-center gap-3 transition-all ${activeMediaTab === 'video' ? 'text-[#FF7939]' : 'text-gray-600 hover:text-white'}`}
                        >
                            <div className={`p-5 rounded-[22px] transition-all duration-300 ${activeMediaTab === 'video' ? 'bg-[#FF7939]/20 border border-[#FF7939]/30 shadow-[0_0_40px_-10px_rgba(255,121,57,0.4)] ring-4 ring-[#FF7939]/5' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                                <VideoIcon className="h-6 w-6" strokeWidth={activeMediaTab === 'video' ? 2.5 : 1.5} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">VIDEOS</span>
                        </button>
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept={activeMediaTab === 'image' ? "image/*" : "video/*"}
                        onChange={actions.handleInlineUploadChange}
                    />
                </div>
            </div>

            {/* Inputs de Texto */}
            <div className="space-y-4 sm:space-y-6">
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
                            onClick={() => {
                                setSpecificForm(prev => ({ ...prev, level: opt.id }))
                                clearFieldError('level')
                            }}
                            className={`flex-1 p-3 rounded-xl border text-left transition-all ${specificForm.level === opt.id
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : (state.fieldErrors?.level ? 'border-red-500/50 bg-[#0A0A0A]' : 'border-white/10 bg-[#0A0A0A]')
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
            <div className="space-y-4 sm:space-y-6">
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
                    {(state.totalSales ?? 0) > 0 && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-2">
                            <div className="flex gap-2">
                                <Info className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-gray-300 leading-relaxed">
                                    Este producto tiene <strong className="text-white">{state.totalSales} ventas</strong>. 
                                    Los cambios en precio y cupos deben ser cuidadosos. Si necesitas cancelar, hazlo desde la <strong className="text-white">Agenda</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className={`flex-1 bg-black/40 rounded-xl border p-1 flex items-center ${fieldErrors.stockQuantity ? 'border-red-500/50' : 'border-white/10'}`}>
                            <span className="px-3 text-xs font-bold text-[#FF7939] uppercase">Cupos</span>
                            <Input
                                type="number"
                                value={generalForm.stockQuantity}
                                onChange={(e) => {
                                    actions.handleStockQuantityChange(e.target.value)
                                    clearFieldError('stockQuantity')
                                }}
                                className="bg-transparent border-none text-right font-bold focus-visible:ring-0 h-10 w-full"
                                placeholder="0"
                            />
                        </div>
                        <span className="text-gray-500 font-bold">×</span>
                        <div className={`flex-1 bg-black/40 rounded-xl border p-1 flex items-center ${fieldErrors.price ? 'border-red-500/50' : 'border-white/10'}`}>
                            <span className="px-2 text-white"><DollarSign className="h-4 w-4" /></span>
                            <Input
                                type="number"
                                value={generalForm.price}
                                onChange={(e) => {
                                    setGeneralForm(prev => ({ ...prev, price: e.target.value }))
                                    clearFieldError('price')
                                }}
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
