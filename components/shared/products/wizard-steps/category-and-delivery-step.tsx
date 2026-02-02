import React from 'react'
import { Zap, UtensilsCrossed, Unlock, Lock, Monitor, Users, Combine } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

// Reuse types from main file or define compatible ones
export type ProductType = 'workshop' | 'program' | 'document'
export type ProgramSubType = 'fitness' | 'nutrition'
export type DeliveryModality = 'online' | 'presencial' | 'hibrido'

interface GeneralFormState {
    is_public: boolean
    modality: DeliveryModality
    included_meet_credits: number
    [key: string]: any // For other fields we don't touch here
}

interface CategoryAndDeliveryStepProps {
    selectedType: ProductType
    selectedProgramType: ProgramSubType | null
    setSelectedProgramType: (type: ProgramSubType) => void
    setProductCategory: (category: any) => void
    generalForm: GeneralFormState
    onUpdateGeneralForm: (updates: Partial<GeneralFormState>) => void
}

const MODALITY_CHOICES = [
    { value: 'online', label: '100% Online', icon: Monitor, tone: 'text-blue-400' },
    { value: 'presencial', label: 'Presencial', icon: Users, tone: 'text-green-400' },
    { value: 'hibrido', label: 'Híbrido', icon: Combine, tone: 'text-purple-400' }
] as const

export function CategoryAndDeliveryStep({
    selectedType,
    selectedProgramType,
    setSelectedProgramType,
    setProductCategory,
    generalForm,
    onUpdateGeneralForm
}: CategoryAndDeliveryStepProps) {

    // Only render for Program or Document (Workshop has different flow usually, but based on main file logic)
    if (selectedType !== 'program' && selectedType !== 'document') return null

    return (
        <div className="space-y-4">
            {selectedType === 'program' && (
                <>
                    <h3 className="text-xl font-bold text-white mb-6">
                        ¿En qué categoría se enfoca tu producto?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { type: 'fitness' as ProgramSubType, label: 'Fitness', icon: Zap },
                            { type: 'nutrition' as ProgramSubType, label: 'Nutrición', icon: UtensilsCrossed }
                        ].map(({ type, label, icon: Icon }, idx) => (
                            <button
                                key={`${type}-${idx}`}
                                onClick={() => {
                                    setSelectedProgramType(type)
                                    setProductCategory(type === 'fitness' ? 'fitness' : 'nutricion')
                                }}
                                className={`p-3 rounded-lg border transition-all text-left flex items-center gap-2 ${selectedProgramType === type
                                    ? 'border-[#FF7939] bg-[#FF7939]/10'
                                    : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                                    }`}
                            >
                                <Icon className="h-5 w-5 text-[#FF7939]" />
                                <h4 className="text-sm font-semibold text-white">
                                    {label}
                                </h4>
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="mt-6 space-y-5">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black p-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {generalForm.is_public ? (
                                <Unlock className="h-4 w-4 text-[#FF7939]" />
                            ) : (
                                <Lock className="h-4 w-4 text-[#FF7939]" />
                            )}
                            <div className="text-sm font-semibold text-white">Visibilidad</div>
                        </div>
                        <div className="text-xs text-gray-400">
                            {generalForm.is_public
                                ? 'Visible en tu perfil y disponible para compra.'
                                : 'Privado: luego se comparte por link de invitación.'}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs ${generalForm.is_public ? 'text-white' : 'text-gray-400'}`}>
                            {generalForm.is_public ? 'Público' : 'Privado'}
                        </span>
                        <Switch
                            checked={generalForm.is_public}
                            onCheckedChange={(checked) => {
                                onUpdateGeneralForm({ is_public: checked })
                            }}
                        />
                    </div>
                </div>

                {/* Modalidad - Hidden for documents (always online) */}
                {selectedType !== 'document' && (
                    <div className="rounded-lg border border-white/10 bg-black p-4">
                        <div className="mb-3">
                            <div className="text-sm font-semibold text-white">Modalidad</div>
                            <div className="text-xs text-gray-400">Cómo lo recibe tu cliente.</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {MODALITY_CHOICES.map(({ value, label, icon: Icon, tone }, idx) => (
                                <button
                                    key={`${value}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                        onUpdateGeneralForm({ modality: value as DeliveryModality })
                                    }}
                                    className={`rounded-lg border px-3 py-3 text-left transition-all flex items-center gap-3 ${generalForm.modality === value
                                        ? 'border-[#FF7939] bg-[#FF7939]/10'
                                        : 'border-white/10 hover:border-[#FF7939]/50'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 text-[#FF7939]" />
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">{label}</div>
                                        <div className="text-xs text-gray-400">
                                            {value === 'online'
                                                ? 'Acceso desde Omnia.'
                                                : value === 'presencial'
                                                    ? 'Se realiza en persona.'
                                                    : 'Online + presencial.'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(selectedType === 'program' || selectedType === 'document') && (
                    <div className="rounded-lg border border-white/10 bg-black p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-white">Créditos de meet</div>
                                <div className="text-xs text-gray-400">Reuniones 1:1 incluidas por cliente.</div>
                            </div>
                            <Switch
                                checked={(generalForm.included_meet_credits || 0) > 0}
                                onCheckedChange={(checked) => {
                                    onUpdateGeneralForm({
                                        included_meet_credits: checked ? Math.max(generalForm.included_meet_credits || 1, 1) : 0
                                    })
                                }}
                            />
                        </div>

                        {(generalForm.included_meet_credits || 0) > 0 && (
                            <div className="mt-4">
                                <div className="text-xs text-gray-400 mb-1">Cantidad</div>
                                <input
                                    inputMode="numeric"
                                    value={String(generalForm.included_meet_credits || 0)}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '')
                                        const parsed = raw === '' ? 0 : Math.max(parseInt(raw, 10) || 0, 0)
                                        onUpdateGeneralForm({ included_meet_credits: parsed })
                                    }}
                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF7939]"
                                    placeholder="0"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
