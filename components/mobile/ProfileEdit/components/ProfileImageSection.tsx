import { useRef } from 'react'
import { User, Camera } from 'lucide-react'

interface ProfileImageSectionProps {
    previewImage: string | null
    onImageChange: (file: File) => void
}

export function ProfileImageSection({ previewImage, onImageChange }: ProfileImageSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-[#FF7939]/50 transition-all duration-300">
                    {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover opacity-90 transition-opacity" />
                    ) : (
                        <User className="h-10 w-10 text-zinc-600" />
                    )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white/80" />
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onImageChange(e.target.files[0])}
                className="hidden"
            />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Foto de Perfil</p>
        </div>
    )
}
