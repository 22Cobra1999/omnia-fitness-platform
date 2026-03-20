import { useRef } from 'react'
import { User, Camera, Plus, Trash2 } from 'lucide-react'

interface ProfileImageSectionProps {
    previewImage: string | null
    onImageChange: (file: File) => void
    onRemoveImage?: () => void
}

export function ProfileImageSection({ previewImage, onImageChange, onRemoveImage }: ProfileImageSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
                <div 
                    key={previewImage || 'no-image'}
                    className="w-28 h-28 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-[#FF7939]/50 transition-all duration-300 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover opacity-90 transition-opacity" />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                            <User className="h-10 w-10 text-zinc-700" />
                            <Plus className="h-4 w-4 text-[#FF7939] absolute bottom-6" />
                        </div>
                    )}
                </div>

                {/* Overlay on hover */}
                {previewImage && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-none">
                        <Camera className="h-6 w-6 text-white/80" />
                    </div>
                )}

                {/* Remove button */}
                {previewImage && onRemoveImage && (
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage();
                        }}
                        className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all shadow-lg backdrop-blur-sm"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onClick={(e) => { (e.target as any).value = null }}
                onChange={(e) => e.target.files?.[0] && onImageChange(e.target.files[0])}
                className="hidden"
            />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black italic">Avatar OMNIA</p>
        </div>
    )
}
