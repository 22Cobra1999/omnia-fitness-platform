"use client"

import { BookOpen, ShoppingCart, MessageCircle, Users, FileText as DocumentIcon, Printer, Clock, Activity } from "lucide-react"
import { CoachPersonalInfoSection } from "@/components/shared/coach/coach-personal-info-section"
import { CoachStats } from "@/components/coach/coach-stats"
import { PlanManagement } from "@/components/coach/plan-management"
import { MercadoPagoConnection } from "@/components/coach/mercadopago-connection"
import { GoogleCalendarConnection } from "@/components/coach/google-calendar-connection"
import { SocialConnections } from "@/components/coach/social-connections"

interface CoachProfileViewProps {
    logic: any
}

export function CoachProfileView({ logic }: CoachProfileViewProps) {
    const {
        coachProfile,
        salesData,
        earningsData,
        recentActivities,
        handleDownloadInvoice,
        handleEditSection
    } = logic

    return (
        <div className="space-y-6">
            {/* Header del perfil para Coach */}
            <CoachPersonalInfoSection
                coach={coachProfile ? {
                    ...coachProfile,
                    rating: coachProfile?.rating,
                    total_sales: Number.isFinite(Number(coachProfile?.total_sales)) ? Number(coachProfile?.total_sales) : 0
                } : {} as any}
                variant="profile"
                showEditButton={true}
                onEditClick={() => handleEditSection("profile")}
                showStreak={true}
                streakCount={6}
            />

            {/* Barra segmentada de tipos de ventas (Diseño de Pastillas Separadas) */}
            <div className="bg-black border border-white/5 rounded-[40px] p-8 relative">
                <button
                    onClick={handleDownloadInvoice}
                    className="absolute top-8 right-8 flex items-center justify-center hover:opacity-80 transition-opacity"
                    title="Descargar factura"
                >
                    <Printer className="w-5 h-5 text-white/40" />
                </button>

                <div className="mb-8">
                    <div className="text-center">
                        <p className="text-[52px] font-black text-[#FF7939] leading-none mb-4 tracking-tighter italic">
                            ${earningsData.earnings.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                                BRUTA: ${earningsData.totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                                SUSCRIPCIÓN: -${earningsData.planFee.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5 mb-8"></div>

                <div className="mb-10">
                    {(() => {
                        const values = Object.values(salesData || {}) as any[]
                        const total = values.reduce((a, b) => a + (Number(b) || 0), 0)
                        const denom = Math.max(total, 1)

                        if (total <= 0) {
                            return <div className="flex rounded-full overflow-hidden h-3 bg-white/5" />
                        }

                        // Calcular porcentajes reales considerando gaps
                        const pProgs = ((Number(salesData.programs) || 0) / denom) * 100
                        const pTalleres = ((Number(salesData.workshops) || 0) / denom) * 100
                        const pDocs = ((Number(salesData.documents) || 0) / denom) * 100
                        const pConsul = ((Number(salesData.consultations) || 0) / denom) * 100
                        const pOthers = ((Number(salesData.others) || 0) / denom) * 100

                        return (
                            <div className="flex gap-2 h-4 w-full">
                                {pProgs > 0 && (
                                    <div
                                        className="bg-[#FF7939] rounded-full flex items-center justify-center text-white text-[8px] font-black italic shadow-[0_0_15px_-3px_rgba(255,121,57,0.4)]"
                                        style={{ width: `${pProgs}%` }}
                                    >
                                        {pProgs > 15 && `${Math.round(salesData.programs / 1000)}k`}
                                    </div>
                                )}
                                {pTalleres > 0 && (
                                    <div
                                        className="bg-[#FFD1A6] rounded-full flex items-center justify-center text-[#121212] text-[8px] font-black italic"
                                        style={{ width: `${pTalleres}%` }}
                                    >
                                        {pTalleres > 15 && `${Math.round(salesData.workshops / 1000)}k`}
                                    </div>
                                )}
                                {pDocs > 0 && (
                                    <div
                                        className="bg-[#FF9FC4] rounded-full flex items-center justify-center text-white text-[8px] font-black italic shadow-[0_0_15px_-3px_rgba(255,159,196,0.3)]"
                                        style={{ width: `${pDocs}%` }}
                                    >
                                        {pDocs > 15 && `${Math.round(salesData.documents / 1000)}k`}
                                    </div>
                                )}
                                {pConsul > 0 && (
                                    <div
                                        className="bg-white rounded-full flex items-center justify-center text-[#121212] text-[8px] font-black italic shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)]"
                                        style={{ width: `${pConsul}%` }}
                                    >
                                        {pConsul > 15 && `${Math.round(salesData.consultations / 1000)}k`}
                                    </div>
                                )}
                                {pOthers > 0 && (
                                    <div
                                        className="bg-[#5A5A5A] rounded-full flex items-center justify-center text-white text-[8px] font-black italic"
                                        style={{ width: `${pOthers}%` }}
                                    >
                                        {pOthers > 15 && `${Math.round(salesData.others / 1000)}k`}
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </div>

                <div className="grid grid-cols-4 gap-4 px-2">
                    <div className="flex flex-col items-center gap-3">
                        <BookOpen className="h-6 w-6 text-[#FF7939]/40" strokeWidth={1.5} />
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">PROGS</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <Users className="h-6 w-6 text-[#FFD1A6]/40" strokeWidth={1.5} />
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">TALLERES</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <DocumentIcon className="h-6 w-6 text-[#FF9FC4]/40" strokeWidth={1.5} />
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">DOCS</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <MessageCircle className="h-6 w-6 text-white/40" strokeWidth={1.5} />
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">CONSUL</span>
                    </div>
                </div>
            </div>

            <div className="bg-black border border-white/5 rounded-2xl p-4">
                <CoachStats />
            </div>

            <div className="bg-black border border-white/5 rounded-2xl p-4">
                <h3 className="text-lg font-semibold mb-4">Movimientos Recientes</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentActivities.length > 0 ? (
                        recentActivities.map((activity: any) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl">
                                <div className="flex-shrink-0 mt-1">
                                    {activity.type === 'sale' && <ShoppingCart className="h-4 w-4 text-[#FF7939]" />}
                                    {activity.type === 'consultation' && <MessageCircle className="h-4 w-4 text-[#FF7939]" />}
                                    {activity.type === 'client' && <Users className="h-4 w-4 text-[#FF7939]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                                    <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                                    {activity.amount && <p className="text-xs text-[#FF7939] font-medium mt-1">{activity.amount}</p>}
                                </div>
                                <div className="flex-shrink-0">
                                    <Clock className="h-3 w-3 text-gray-500" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">No hay movimientos recientes</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <PlanManagement />
                
            {/* Integrations */}
            <div className="mt-6 px-1">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[18px] font-bold text-white/90 tracking-tight">Integraciones</h3>
                    <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                        <SocialConnections showOnlyEdit={true} />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <SocialConnections />
                    <MercadoPagoConnection />
                    <GoogleCalendarConnection />
                </div>
            </div>
            </div>
        </div>
    )
}
