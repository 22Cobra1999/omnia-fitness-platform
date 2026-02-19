import React from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    disabled: boolean
}

export const MessageInput: React.FC<MessageInputProps> = ({
    value,
    onChange,
    onSend,
    disabled,
}) => {
    return (
        <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            onSend()
                        }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#FF7939]"
                    disabled={disabled}
                />
                <Button
                    onClick={onSend}
                    disabled={!value.trim() || disabled}
                    className="bg-[#FF7939] hover:bg-[#E86A2D] text-white"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
