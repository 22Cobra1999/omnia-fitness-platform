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
    const [socialData, setSocialData] = useState({ whatsapp: '', instagram_username: '' });
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
                .select('whatsapp, instagram_username')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                const loadedData = {
                    whatsapp: data.whatsapp?.toString() || '',
                    instagram_username: data.instagram_username || ''
                };
                setSocialData(loadedData);
                setDraftData(loadedData);
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

            setSocialData(draftData);
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
        <div className="bg-[#1A1C1F] rounded-2xl p-4 border border-white/5 relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Integraciones</h3>
                <button
                    onClick={() => {
                        setDraftData(socialData);
                        setIsModalOpen(true);
                    }}
                    className="flex justify-center items-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <Edit2 className="w-4 h-4 text-white/70" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-white">WhatsApp</span>
                    </div>
                    {socialData.whatsapp ? (
                        <span className="text-xs text-white/70 truncate">{socialData.whatsapp}</span>
                    ) : (
                        <span className="text-xs text-white/30 italic">No configurado</span>
                    )}
                </div>

                {/* Instagram */}
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className="text-sm font-medium text-white">Instagram</span>
                    </div>
                    {socialData.instagram_username ? (
                        <span className="text-xs text-white/70 truncate">{socialData.instagram_username}</span>
                    ) : (
                        <span className="text-xs text-white/30 italic">No configurado</span>
                    )}
                </div>
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
