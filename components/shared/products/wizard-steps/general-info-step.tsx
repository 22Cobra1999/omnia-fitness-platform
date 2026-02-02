import React, { useState, RefObject } from 'react'
import { Flame } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductMediaUploader } from '../ui/product-media-uploader'
import {
    INTENSITY_CHOICES,
    FITNESS_OBJECTIVE_GROUPS,
    NUTRITION_OBJECTIVE_GROUPS,
    FITNESS_RESTRICTION_GROUPS,
    NUTRITION_RESTRICTION_GROUPS,
    PLAN_COMMISSIONS,
    PLAN_LABELS,
    PlanType,
    groupsToSelectItems,
    ProductType,
    ProgramSubType
} from '../product-constants'

interface GeneralInfoStepProps {
    selectedType: ProductType
    selectedProgramType: ProgramSubType | null
    generalForm: any // Typed as any for flexibility, ideally define strict shared type
    specificForm: any
    onUpdateGeneral: (updates: any) => void
    onUpdateSpecific: (updates: any) => void

    // Media props
    inlineMediaType: 'image' | 'video'
    onMediaTypeChange: (type: 'image' | 'video') => void
    isUploadingMedia: boolean
    mediaError?: string | null
    fileInputRef: RefObject<HTMLInputElement>
    onUploadClick: () => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    videoEmbedUrl?: string | null

    // Context
    userPlan: PlanType
}

export function GeneralInfoStep({
    selectedType,
    selectedProgramType,
    generalForm,
    specificForm,
    onUpdateGeneral,
    onUpdateSpecific,
    inlineMediaType,
    onMediaTypeChange,
    isUploadingMedia,
    mediaError,
    fileInputRef,
    onUploadClick,
    onFileChange,
    videoEmbedUrl,
    userPlan
}: GeneralInfoStepProps) {

    const [objetivosToAdd, setObjetivosToAdd] = useState('')
    const [restriccionesToAdd, setRestriccionesToAdd] = useState('')

    // Derived options based on type
    const objectiveOptions = groupsToSelectItems(
        selectedProgramType === 'nutrition' ? NUTRITION_OBJECTIVE_GROUPS : FITNESS_OBJECTIVE_GROUPS
    )
    const restrictionOptions = groupsToSelectItems(
        selectedProgramType === 'nutrition' ? NUTRITION_RESTRICTION_GROUPS : FITNESS_RESTRICTION_GROUPS
    )

    // Handlers
    const addObjetivo = (obj: string) => {
        const current = generalForm.objetivos || []
        if (obj && !current.includes(obj)) {
            onUpdateGeneral({ objetivos: [...current, obj] })
        }
    }

    const removeObjetivo = (obj: string) => {
        const current = generalForm.objetivos || []
        onUpdateGeneral({ objetivos: current.filter((o: string) => o !== obj) })
    }

    const addRestriccion = (r: string) => {
        const current = generalForm.restricciones || []
        if (r && !current.includes(r)) {
            onUpdateGeneral({ restricciones: [...current, r] })
        }
    }

    const removeRestriccion = (r: string) => {
        const current = generalForm.restricciones || []
        onUpdateGeneral({ restricciones: current.filter((item: string) => item !== r) })
    }

    // Price calculations
    const priceAmount = parseFloat(generalForm.price) || 0
    const stockAmount = generalForm.capacity === 'ilimitada' ? Infinity : parseInt(generalForm.stockQuantity) || 0
    const isLimitedStock = generalForm.capacity === 'limitada'

    const potentialRevenue = isLimitedStock
        ? (stockAmount * priceAmount)
        : (priceAmount > 0 ? priceAmount : null)

    const commissionPercent = PLAN_COMMISSIONS[userPlan] || 0.05
    const commissionPercentLabel = `${(commissionPercent * 100).toFixed(0)}%`

    // Formatting helper
    const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val)

    return (
        <div className="space-y-6">
            {/* 1. Media Upload */}
            <ProductMediaUploader
                mediaType={inlineMediaType}
                imageUrl={generalForm.image?.url}
                videoUrl={generalForm.videoUrl}
                videoEmbedUrl={videoEmbedUrl}
                isUploading={isUploadingMedia}
                error={mediaError}
                onMediaTypeChange={onMediaTypeChange}
                onUploadClick={onUploadClick}
                fileInputRef={fileInputRef}
                onFileChange={onFileChange}
            />

            <div className="grid grid-cols-1 gap-4">
                {/* 2. Basic Info */}
                <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Título</Label>
                    <Input
                        value={generalForm.name}
                        onChange={(e) => onUpdateGeneral({ name: e.target.value })}
                        placeholder="Ej: Plan de 4 semanas"
                        className="bg-black border-white/10 text-white placeholder:text-gray-600"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Descripción</Label>
                    <Textarea
                        value={generalForm.description}
                        onChange={(e) => onUpdateGeneral({ description: e.target.value })}
                        placeholder="Describí tu producto..."
                        className="bg-black border-white/10 text-white placeholder:text-gray-600 min-h-[100px]"
                    />
                </div>
            </div>

            {/* 3. Intensity */}
            <div className="space-y-3">
                <div className="text-base font-bold text-white uppercase tracking-wider">Intensidad</div>
                <div className="grid grid-cols-3 gap-2">
                    {INTENSITY_CHOICES.map((choice, idx) => (
                        <button
                            key={`${choice.value}-${idx}`}
                            type="button"
                            onClick={() => onUpdateSpecific({ level: choice.value })}
                            className={`rounded-lg border px-2 py-2 sm:px-3 sm:py-3 text-left transition-all min-w-0 ${specificForm.level === choice.value
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                                }`}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="text-xs sm:text-sm font-semibold text-white truncate">{choice.label}</div>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 3 }).map((_, idx) => (
                                        <Flame
                                            key={idx}
                                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${idx < choice.flames ? 'text-[#FF7939]' : 'text-white/10'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Duration (Document only) */}
            {selectedType === 'document' && (
                <div className="space-y-2">
                    <div className="text-base font-bold text-white uppercase tracking-wider">Duración</div>
                    <div className="grid grid-cols-[1fr_120px] gap-2">
                        <Input
                            type="text"
                            placeholder="Ejemplo: 4 o 4,5"
                            value={generalForm.duration_value || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^[\d.,]*$/.test(val)) {
                                    onUpdateGeneral({ duration_value: val })
                                }
                            }}
                            className="bg-black border-white/10 text-white"
                        />
                        <Select
                            value={generalForm.duration_unit || 'semanas'}
                            onValueChange={(v) => onUpdateGeneral({ duration_unit: v })}
                        >
                            <SelectTrigger className="bg-black border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-white/10 text-white">
                                <SelectItem value="días" className="text-white">Días</SelectItem>
                                <SelectItem value="semanas" className="text-white">Semanas</SelectItem>
                                <SelectItem value="meses" className="text-white">Meses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* 5. Objectives & Restrictions */}
            <div className="space-y-2">
                <div className="text-base font-bold text-white uppercase tracking-wider">Objetivos</div>
                <div className="flex items-center gap-2">
                    <Select
                        value={objetivosToAdd}
                        onValueChange={(v) => {
                            addObjetivo(v)
                            setObjetivosToAdd('') // Reset after add
                        }}
                    >
                        <SelectTrigger className="bg-black border-white/10 text-white">
                            <SelectValue placeholder="Seleccionar objetivo" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                            {objectiveOptions.map((group, gIdx) => (
                                <React.Fragment key={`${group.label}-${gIdx}`}>
                                    <SelectGroup>
                                        <SelectLabel className="text-white/70">{group.label}</SelectLabel>
                                        {group.options.map((opt, oIdx) => (
                                            <SelectItem key={`${group.label}-${opt}-${oIdx}`} value={opt} className="text-white">
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </React.Fragment>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {(generalForm.objetivos || []).map((obj: string, idx: number) => (
                        <button
                            key={`${obj}-${idx}`}
                            type="button"
                            onClick={() => removeObjetivo(obj)}
                            className="bg-[#FF7939]/20 text-[#FF7939] text-xs px-3 py-1.5 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0"
                            title="Eliminar"
                        >
                            {obj}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-sm font-semibold text-white">Restricciones</div>
                <div className="flex items-center gap-2">
                    <Select
                        value={restriccionesToAdd}
                        onValueChange={(v) => {
                            addRestriccion(v)
                            setRestriccionesToAdd('')
                        }}
                    >
                        <SelectTrigger className="bg-black border-white/10 text-white">
                            <SelectValue placeholder="Seleccionar restricción" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                            {restrictionOptions.map((group, gIdx) => (
                                <React.Fragment key={`${group.label}-${gIdx}`}>
                                    <SelectGroup>
                                        <SelectLabel className="text-white/70">{group.label}</SelectLabel>
                                        {group.options.map((opt, oIdx) => (
                                            <SelectItem key={`${group.label}-${opt}-${oIdx}`} value={opt} className="text-white">
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </React.Fragment>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {(generalForm.restricciones || []).map((r: string, idx: number) => (
                        <button
                            key={`${r}-${idx}`}
                            type="button"
                            onClick={() => removeRestriccion(r)}
                            className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full font-medium border border-white/10 whitespace-nowrap flex-shrink-0"
                            title="Eliminar"
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* 6. Price & Capacity */}
            <div className="space-y-2">
                <div className="text-base font-bold text-white uppercase tracking-wider">Plan de precios y cupos</div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="grid grid-cols-12 gap-2 items-center text-sm">
                        <button
                            type="button"
                            onClick={() => onUpdateGeneral({
                                capacity: generalForm.capacity === 'ilimitada' ? 'limitada' : 'ilimitada',
                                stockQuantity: generalForm.capacity === 'ilimitada' ? '' : generalForm.stockQuantity
                            })}
                            className={`col-span-3 sm:col-span-2 px-2 py-2 rounded-md border text-xs font-semibold transition-all ${isLimitedStock
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                                }`}
                        >
                            {generalForm.capacity === 'ilimitada' ? '∞' : 'Cupos'}
                        </button>

                        <Input
                            value={generalForm.capacity === 'ilimitada' ? '∞' : generalForm.stockQuantity}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '')
                                onUpdateGeneral({ stockQuantity: val })
                            }}
                            inputMode="numeric"
                            placeholder="0"
                            disabled={generalForm.capacity === 'ilimitada'}
                            className="col-span-3 sm:col-span-2 h-10 bg-black border-white/10 text-white placeholder:text-gray-600 disabled:opacity-60"
                        />

                        <span className="col-span-1 text-gray-500 text-center">×</span>

                        <div className="col-span-5 sm:col-span-3 flex items-center h-10 rounded-md border border-white/10 bg-black px-3">
                            <span className="text-white/60 mr-2">$</span>
                            <input
                                value={generalForm.price}
                                onChange={(e) => {
                                    let val = e.target.value
                                    // Allow typing logic handled here simplistically
                                    if (/^[\d.,]*$/.test(val)) onUpdateGeneral({ price: val })
                                }}
                                onBlur={() => {
                                    const normalized = generalForm.price?.replace(',', '.') || '0'
                                    const parsed = parseFloat(normalized)
                                    if (!isNaN(parsed)) onUpdateGeneral({ price: parsed.toFixed(2) })
                                }}
                                placeholder="0.00"
                                className="w-full bg-transparent outline-none text-white placeholder:text-gray-600"
                            />
                        </div>

                        <div className="col-span-12 flex items-center justify-center pt-2">
                            <span className="text-white/70 font-medium">
                                Cupos{' '}
                                {generalForm.capacity === 'ilimitada' ? '∞' : (generalForm.stockQuantity || '0')}
                                {' '}×{' '}
                                ${generalForm.price || '0'}
                            </span>
                        </div>

                        <div className="col-span-12 flex items-center justify-center gap-2 pt-2">
                            <span className="text-gray-500">−</span>
                            <span className="text-white font-semibold">{commissionPercentLabel}</span>
                            <span className="text-gray-500">=</span>
                            <span className="text-white font-bold text-lg">
                                {(() => {
                                    if (!isLimitedStock) return '—' // Cannot calculate net total for infinite stock
                                    const total = potentialRevenue || 0
                                    const net = total * (1 - commissionPercent)
                                    return formatMoney(net)
                                })()}
                            </span>
                            <span className="text-[#FF7939] font-bold text-lg">ARS</span>
                        </div>
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                        {potentialRevenue === null
                            ? 'Cupos ilimitados.'
                            : `Bruto: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(potentialRevenue)}.`}
                    </div>
                </div>
            </div>
        </div>
    )
}
