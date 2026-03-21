import React from 'react'
import { Play, X, ChevronLeft, Loader2, CheckCircle } from 'lucide-react'
import { ManualFormState } from '../types'

interface VideoSectionInternalProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
}

export function VideoSectionInternal({ formState, onChange }: VideoSectionInternalProps) {
    const [mode, setMode] = React.useState<'selection' | 'upload' | 'gallery'>('selection')
    const [videos, setVideos] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (mode === 'gallery' && videos.length === 0) {
            loadVideos()
        }
    }, [mode])

    const loadVideos = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/coach/storage-files')
            const data = await res.json()
            if (data.success) {
                setVideos(data.files.filter((f: any) => f.concept === 'video'))
            }
        } catch (error) {
            console.error('Error loading videos:', error)
        } finally {
            setLoading(false)
        }
    }

    if (mode === 'selection') {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setMode('upload')}
                        className="flex flex-col items-center justify-center p-8 bg-zinc-950/40 rounded-[1.5rem] border border-dashed border-zinc-800 hover:border-[#FF7939]/50 hover:bg-[#FF7939]/5 transition-all group gap-3"
                    >
                        <div className="p-3 bg-zinc-900 rounded-full shadow-inner group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 text-[#FF7939]" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Subir Video</span>
                        <span className="text-[7px] text-zinc-500 uppercase font-bold tracking-tighter">Desde Ordenador</span>
                    </button>
                    <button 
                        onClick={() => setMode('gallery')}
                        className="flex flex-col items-center justify-center p-8 bg-zinc-950/40 rounded-[1.5rem] border border-dashed border-zinc-800 hover:border-blue-400/50 hover:bg-blue-400/5 transition-all group gap-3"
                    >
                        <div className="p-3 bg-zinc-900 rounded-full shadow-inner group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Ver Galería</span>
                        <span className="text-[7px] text-zinc-500 uppercase font-bold tracking-tighter">Biblioteca Omnia</span>
                    </button>
                </div>

                {formState.video_url && (
                    <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                                <Play className="h-4 w-4 text-[#FF7939]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white uppercase italic truncate max-w-[140px]">Video Seleccionado</span>
                                <span className="text-[7px] text-zinc-500 truncate max-w-[140px] font-bold">{formState.video_url}</span>
                            </div>
                        </div>
                        <button onClick={() => {
                            onChange('video_url', '')
                            onChange('bunny_video_id', '')
                        }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-zinc-500">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>
        )
    }

    if (mode === 'upload') {
        return (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <button onClick={() => setMode('selection')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-2">
                    <ChevronLeft className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest italic">Volver</span>
                </button>
                <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-zinc-400 uppercase italic mb-4 tracking-widest text-center">Subir Video a la Biblioteca</p>
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            alert('Subiendo video: ' + file.name)
                        }}
                        className="w-full bg-zinc-900 border-white/10 rounded-xl p-4 text-[10px] text-zinc-500 font-bold uppercase cursor-pointer hover:border-[#FF7939]/30 transition-all shadow-inner"
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => setMode('selection')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeft className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest italic">Volver a Selección</span>
                </button>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{videos.length} Videos</span>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 opacity-50">
                    <Loader2 className="h-6 w-6 text-[#FF7939] animate-spin" />
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Cargando...</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto no-scrollbar pr-1 pb-10">
                    {videos.map((vid, idx) => {
                        const isSelected = formState.bunny_video_id === vid.fileId
                        const thumbnail = vid.url ? vid.url.replace('.mp4', '.jpg') : `https://vz-359f518e-49b.b-cdn.net/${vid.fileId}/thumbnail.jpg`
                        
                        return (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    onChange('bunny_video_id', vid.fileId)
                                    const url = vid.url || `https://iframe.mediadelivery.net/play/${vid.libraryId}/${vid.fileId}`
                                    onChange('video_url', url)
                                }}
                                className={`group relative aspect-video rounded-xl border transition-all cursor-pointer overflow-hidden shadow-2xl ${isSelected ? 'border-[#FF7939] ring-2 ring-[#FF7939]/20' : 'border-white/5 hover:border-white/20'}`}
                            >
                                <img 
                                    src={thumbnail} 
                                    alt={vid.fileName}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                />
                                
                                {/* Unified Play Icon Overlay - Large & Minimalist */}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                    <div className="p-4 bg-black/50 backdrop-blur-md rounded-full border border-white/10 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                        <Play className="h-6 w-6 fill-white text-white opacity-90 group-hover:opacity-100" />
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-3 right-3 p-1.5 bg-[#FF7939] rounded-full shadow-lg ring-4 ring-black/40 animate-in zoom-in">
                                        <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
