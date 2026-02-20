import React from "react"
import { MessageCircle, Calendar as CalendarIcon } from "lucide-react"
import Image from "next/image"
import { CoachPersonalInfoSection } from "@/components/shared/coach/coach-personal-info-section"

interface CoachProfileHeaderProps {
    coach: {
        id: string
        name: string
        avatar_url?: string
        location?: string
        bio?: string
        specialization?: string
        certifications?: string[]
        rating?: number
    }
    totalSales: number | null
    onClose: () => void
}

export const CoachProfileHeader: React.FC<CoachProfileHeaderProps> = ({
    coach,
    totalSales,
    onClose,
}) => {
    return (
        <div className="relative">
            {/* Imagen de fondo difuminada */}
            {coach.avatar_url && (
                <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                    <Image src={coach.avatar_url} alt={coach.name} fill className="object-cover blur-sm scale-110" />
                    <div className="absolute inset-0 bg-black/60" />
                </div>
            )}

            {/* Contenido del header */}
            <div className="relative z-10">
                <CoachPersonalInfoSection
                    coach={{
                        name: coach.name,
                        full_name: coach.name,
                        avatar_url: coach.avatar_url,
                        location: coach.location,
                        bio: coach.bio,
                        specialization: coach.specialization,
                        certifications: coach.certifications,
                        certifications_count: coach.certifications?.length,
                        rating: coach.rating,
                        total_sales: totalSales,
                    }}
                    variant="modal"
                    showStreak={true}
                    streakCount={6}
                    leftAction={
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                const chatIntent = {
                                    coachId: coach.id,
                                    coachName: coach.name,
                                    coachAvatar: coach.avatar_url,
                                }
                                localStorage.setItem("startChatWithCoach", JSON.stringify(chatIntent))
                                window.dispatchEvent(
                                    new CustomEvent("navigateToTab", {
                                        detail: { tab: "messages" },
                                    }),
                                )
                                onClose()
                            }}
                            className="relative z-50 cursor-pointer pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                        >
                            <MessageCircle className="w-6 h-6 group-hover:text-[#FF7939] transition-colors" />
                        </button>
                    }
                    rightAction={
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                const meetContext = {
                                    coachId: coach.id,
                                    source: "profile_button",
                                }
                                localStorage.setItem("scheduleMeetContext", JSON.stringify(meetContext))
                                sessionStorage.setItem("scheduleMeetIntent", "1")
                                window.dispatchEvent(
                                    new CustomEvent("navigateToTab", {
                                        detail: { tab: "calendar" },
                                    }),
                                )
                                onClose()
                            }}
                            className="relative z-50 cursor-pointer pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                        >
                            <CalendarIcon className="w-6 h-6 group-hover:text-[#FF7939] transition-colors" />
                        </button>
                    }
                />
            </div>
        </div>
    )
}
