"use client"

import { motion } from "framer-motion"
import { Check, User, Plus } from "lucide-react"

interface OnboardingStepRendererProps {
    step: any
    answers: any
    handleOptionSelect: (stepId: string, optionId: string) => void
    handleMultiSelect: (sectionId: string, optionId: string, max?: number) => void
    handleInputChange: (fieldId: string, value: any) => void
    avatarPreview: string | null
    setAvatarFile: (file: File) => void
    setAvatarPreview: (preview: string) => void
}

export function OnboardingStepRenderer({
    step,
    answers,
    handleOptionSelect,
    handleMultiSelect,
    handleInputChange,
    avatarPreview,
    setAvatarFile,
    setAvatarPreview
}: OnboardingStepRendererProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                <p className="text-gray-400 text-sm">{step.description}</p>
            </div>

            {/* OPCIONES TIPO CARD (Pasos normales) */}
            {!step.isMultiSection && !step.isProfileCompletion && step.options && (
                <div className="grid grid-cols-1 gap-3">
                    {step.options.map((option: any) => (
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
                            {option.icon && <span className="text-2xl">{option.icon}</span>}
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
        </div>
    )
}
