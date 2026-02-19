import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessagesHeaderProps {
    contactName: string | null
    contactAvatar: string | undefined
    onBack: () => void
}

export const MessagesHeader: React.FC<MessagesHeaderProps> = ({
    contactName,
    contactAvatar,
    onBack,
}) => {
    return (
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-white/10"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            {contactAvatar && (
                <div className="w-8 h-8 rounded-full bg-[#FF7939]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                        src={contactAvatar}
                        alt={contactName || 'Contacto'}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <h1 className="text-lg font-semibold">
                {contactName || 'Mensajes'}
            </h1>
        </div>
    )
}
