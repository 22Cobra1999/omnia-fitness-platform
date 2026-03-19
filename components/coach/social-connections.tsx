'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Smartphone, Instagram, Edit2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SocialConnections() {
    const { user } = useAuth();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [socialData, setSocialData] = useState({ whatsapp: '', instagram_username: '', has_instagram_token: false });
    const [draftData, setDraftData] = useState({ whatsapp: '', instagram_username: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadSocialData();
        }
    }, [user?.id]);

    const loadSocialData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('coaches')
                .select('whatsapp, instagram_username, instagram_access_token')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                const loadedData = {
                    whatsapp: data.whatsapp?.toString() || '',
                    instagram_username: data.instagram_username || '',
                    has_instagram_token: !!data.instagram_access_token
                };
                setSocialData(loadedData);
                setDraftData({
                    whatsapp: loadedData.whatsapp,
                    instagram_username: loadedData.instagram_username
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('coaches')
                .update({
                    whatsapp: draftData.whatsapp ? Number(draftData.whatsapp) : null,
                    instagram_username: draftData.instagram_username || null
                })
                .eq('id', user.id);

            if (error) throw error;

            setSocialData({
                ...draftData,
                has_instagram_token: socialData.has_instagram_token
            });
            setIsModalOpen(false);
            toast.success('Redes sociales actualizadas correctamente');
        } catch (error) {
            toast.error('Error al guardar las redes sociales');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4 bg-[#1A1C1F] rounded-2xl border border-white/5">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF7939]" />
            </div>
        );
    }

    return (
        <div className="relative group/social">
            {/* Botón de edición flotante sutil */}
            <button
                onClick={() => {
                    setDraftData(socialData);
                    setIsModalOpen(true);
                }}
                className="absolute -top-6 right-0 p-1 opacity-20 group-hover/social:opacity-100 transition-opacity hover:text-white"
                title="Editar perfiles sociales"
            >
                <Edit2 className="w-3 h-3" />
            </button>

            <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:border-white/10 relative">
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">WhatsApp</span>
                    </div>
                    {socialData.whatsapp ? (
                        <span className="text-sm font-medium text-white/90 truncate">{socialData.whatsapp}</span>
                    ) : (
                        <span className="text-xs text-white/20 italic">No configurado</span>
                    )}
                </div>

                {/* Instagram Manual */}
                <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:border-white/10">
                    <div className="flex items-center gap-2">
                        <Instagram className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Instagram</span>
                    </div>
                    {socialData.instagram_username ? (
                        <span className="text-sm font-medium text-white/90 truncate">@{socialData.instagram_username.replace('@', '')}</span>
                    ) : (
                        <span className="text-xs text-white/20 italic">No configurado</span>
                    )}
                </div>

                {/* BOTÓN CONEXIÓN OFICIAL DIRECTO */}
                <a 
                    href="/api/auth/instagram"
                    className={`col-span-2 flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                        socialData.has_instagram_token 
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                        : 'bg-white/5 border-white/5 hover:border-pink-500/20 text-white'
                    }`}
                    onClick={(e) => {
                        if (socialData.has_instagram_token) e.preventDefault();
                    }}
                >
                    <div className="flex items-center gap-3">
                        <Instagram className={`w-4 h-4 ${socialData.has_instagram_token ? 'text-emerald-400' : 'text-pink-500'}`} />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Conector API</span>
                            <span className="text-[10px] opacity-40 mt-0.5">
                                {socialData.has_instagram_token ? 'Sincronizado' : 'Conexión oficial requerida'}
                            </span>
                        </div>
                    </div>
                    {socialData.has_instagram_token ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-[9px] font-bold text-emerald-400 uppercase">OK</span>
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-lg bg-pink-500/10 text-pink-500 text-[9px] font-bold uppercase tracking-wider border border-pink-500/20">Conectar</div>
                    )}
                </a>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-[#1A1C1F] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Manejar Integraciones</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="text-xs uppercase text-gray-400 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> Número de WhatsApp
                            </Label>
                            <Input
                                id="whatsapp"
                                type="tel"
                                placeholder="Ej: +5411..."
                                value={draftData.whatsapp}
                                onChange={(e) => setDraftData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-xs uppercase text-gray-400 flex items-center gap-1">
                                <Instagram className="w-3 h-3" /> Usuario de Instagram
                            </Label>
                            <Input
                                id="instagram"
                                placeholder="Ej: @tu_usuario"
                                value={draftData.instagram_username}
                                onChange={(e) => setDraftData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF7939] hover:bg-[#FF8C42] text-white transition-colors text-sm font-medium"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Guardar
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
