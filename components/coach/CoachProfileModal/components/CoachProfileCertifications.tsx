import React from "react"
import { GraduationCap } from "lucide-react"

interface CoachProfileCertificationsProps {
    certifications: string[]
}

export const CoachProfileCertifications: React.FC<CoachProfileCertificationsProps> = ({
    certifications,
}) => {
    if (!certifications || certifications.length === 0) return null

    return (
        <div className="text-center mb-4 px-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <GraduationCap className="w-4 h-4 text-[#FF7939]" />
                {certifications.map((cert, index) => {
                    const certName = cert.split("/").pop()?.replace(/\.(pdf|PDF)$/, "") || cert
                    return (
                        <span
                            key={index}
                            className="text-white/70 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10"
                        >
                            {certName}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}
