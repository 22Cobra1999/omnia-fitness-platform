"use client"

import { BookOpen, ShoppingCart, MessageCircle, Users, FileText as DocumentIcon, Printer, Clock, Activity } from "lucide-react"
import { CoachPersonalInfoSection } from "@/components/shared/coach/coach-personal-info-section"
import { CoachStats } from "@/components/coach/coach-stats"
import { PlanManagement } from "@/components/coach/plan-management"
import { MercadoPagoConnection } from "@/components/coach/mercadopago-connection"
import { GoogleCalendarConnection } from "@/components/coach/google-calendar-connection"

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

            {/* Barra segmentada de tipos de ventas */}
            <div className="bg-[#1A1C1F] rounded-2xl p-4 relative">
                <button
                    onClick={handleDownloadInvoice}
                    className="absolute top-4 right-4 flex items-center justify-center hover:opacity-80 transition-opacity"
                    title="Descargar factura"
                >
                    <Printer className="w-4 h-4 text-[#FF7939]" />
                </button>

                <div className="mb-4">
                    <div className="text-center">
                        <p className="text-3xl font-semibold text-[#FF7939] mb-1">
                            ${earningsData.earnings.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">
                            Ganancia Bruta: ${earningsData.totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Suscripción: -${earningsData.planFee.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>

                <div className="h-px bg-[#2A2C2E] mb-4"></div>

                <div className="mb-3">
                    {(() => {
                        const values = Object.values(salesData || {}) as any[]
                        const total = values.reduce((a, b) => a + (Number(b) || 0), 0)
                        const denom = Math.max(total, 1)

                        if (total <= 0) {
                            return <div className="flex rounded-xl overflow-hidden h-8 bg-white/10" />
                        }

                        return (
                            <div className="flex rounded-xl overflow-hidden h-8">
                                <div
                                    className="bg-[#FF6A00] flex items-center justify-center text-white text-xs font-medium"
                                    style={{ width: `${((Number(salesData.programs) || 0) / denom) * 100}%` }}
                                >
                                    {salesData.programs > 0 && `${Math.round(salesData.programs / 1000)}k`}
                                </div>
                                <div
                                    className="bg-[#FFD1A6] flex items-center justify-center text-[#121212] text-xs font-medium"
                                    style={{ width: `${((Number(salesData.workshops) || 0) / denom) * 100}%` }}
                                >
                                    {salesData.workshops > 0 && `${Math.round(salesData.workshops / 1000)}k`}
                                </div>
                                <div
                                    className="bg-[#FF9FC4] flex items-center justify-center text-white text-xs font-medium"
                                    style={{ width: `${((Number(salesData.documents) || 0) / denom) * 100}%` }}
                                >
                                    {salesData.documents > 0 && `${Math.round(salesData.documents / 1000)}k`}
                                </div>
                                <div
                                    className="bg-white flex items-center justify-center text-[#121212] text-xs font-medium"
                                    style={{ width: `${((Number(salesData.consultations) || 0) / denom) * 100}%` }}
                                >
                                    {salesData.consultations > 0 && `${Math.round(salesData.consultations / 1000)}k`}
                                </div>
                            </div>
                        )
                    })()}
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex flex-col items-center">
                        <BookOpen className="h-4 w-4 text-[#FF6A00] mb-1" />
                        <span className="text-gray-400 text-center">Programas</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Users className="h-4 w-4 text-[#FFD1A6] mb-1" />
                        <span className="text-gray-400 text-center">Talleres</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <DocumentIcon className="h-4 w-4 text-[#FF9FC4] mb-1" />
                        <span className="text-gray-400 text-center">Documentos</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <MessageCircle className="h-4 w-4 text-white mb-1" />
                        <span className="text-gray-400 text-center">Consultas</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#1A1C1F] rounded-2xl p-4">
                <CoachStats />
            </div>

            <div className="bg-[#1A1C1F] rounded-2xl p-4">
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
                <div className="flex gap-3">
                    <div className="flex-1 min-w-0"><MercadoPagoConnection /></div>
                    <div className="flex-1 min-w-0"><GoogleCalendarConnection /></div>
                </div>
            </div>
        </div>
    )
}
