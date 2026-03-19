'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Smartphone, Instagram, Edit2, Loader2, Check, ChevronDown, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialConnectionsProps {
    showOnlyEdit?: boolean;
}

export function SocialConnections({ showOnlyEdit = false }: SocialConnectionsProps) {
    const { user } = useAuth();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [socialData, setSocialData] = useState({ whatsapp: '', instagram_username: '', has_instagram_token: false });
    const [draftData, setDraftData] = useState({ whatsapp: '', instagram_username: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
            console.error('Error loading social data:', e);
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
                    whatsapp: draftData.whatsapp,
                    instagram_username: draftData.instagram_username
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Cambios guardados correctamente');
            await loadSocialData();
            setIsModalOpen(false);
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnectInstagram = async () => {
        setDisconnecting(true);
        try {
            const response = await fetch('/api/auth/instagram/disconnect', { method: 'POST' });
            if (!response.ok) throw new Error('Falló la desconexión');
            toast.success('Instagram desvinculado');
            await loadSocialData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setDisconnecting(false);
        }
    };

    if (loading) return null;

    if (showOnlyEdit) {
        return (
            <button
                onClick={() => {
                    setDraftData(socialData);
                    setIsModalOpen(true);
                }}
                className="w-full h-full flex items-center justify-center"
                title="Editar perfiles sociales"
            >
                <Edit2 className="w-4 h-4" />
            </button>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                {/* WHATSAPP */}
                <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[140px] relative transition-all hover:border-white/10 group">
                    <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center mb-1 shadow-lg shadow-[#25D366]/20">
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[13px] font-semibold text-white/90">WhatsApp</span>
                    
                    <button 
                        onClick={() => setExpandedCard(expandedCard === 'wa' ? null : 'wa')}
                        className={`mt-2 p-1 transition-transform duration-300 ${expandedCard === 'wa' ? 'rotate-180' : ''}`}
                    >
                        <ChevronDown className="w-5 h-5 text-[#FF7939]" />
                    </button>

                    <AnimatePresence>
                        {expandedCard === 'wa' && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden w-full text-center flex flex-col items-center pt-2"
                            >
                                <span className="text-[11px] text-white/60 mb-2 truncate max-w-full italic px-2">
                                    {socialData.whatsapp || 'Sin configurar'}
                                </span>
                                <button 
                                    onClick={() => { setDraftData(socialData); setIsModalOpen(true); }}
                                    className="text-[10px] text-[#FF7939] font-bold uppercase tracking-wider"
                                >
                                    Configurar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* INSTAGRAM */}
                <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[140px] relative transition-all hover:border-white/10 group">
                    <div className="w-12 h-12 bg-gradient-to-tr from-[#f9ce67] via-[#e1306c] to-[#833ab4] rounded-xl flex items-center justify-center mb-1 shadow-lg shadow-pink-500/20">
                        <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[13px] font-semibold text-white/90">Instagram</span>

                    {!socialData.has_instagram_token && (
                        <a href="/api/auth/instagram" className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5 text-white/60" />
                        </a>
                    )}
                    {socialData.has_instagram_token && (
                        <div className="absolute top-3 right-3">
                            <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setExpandedCard(expandedCard === 'ig' ? null : 'ig')}
                        className={`mt-2 p-1 transition-transform duration-300 ${expandedCard === 'ig' ? 'rotate-180' : ''}`}
                    >
                        <ChevronDown className="w-5 h-5 text-[#FF7939]" />
                    </button>

                    <AnimatePresence>
                        {expandedCard === 'ig' && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden w-full text-center flex flex-col items-center pt-2"
                            >
                                <span className="text-[11px] text-white/60 mb-2 truncate max-w-full italic px-2">
                                    {socialData.instagram_username ? `@${socialData.instagram_username.replace('@','')}` : (socialData.has_instagram_token ? 'Configurado (API)' : 'Sin configurar')}
                                </span>
                                {socialData.has_instagram_token ? (
                                    <button 
                                        onClick={handleDisconnectInstagram}
                                        disabled={disconnecting}
                                        className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1"
                                    >
                                        {disconnecting ? '...' : <><XCircle className="w-3 h-3" /> Desvincular</>}
                                    </button>
                                ) : (
                                    <a href="/api/auth/instagram" className="text-[10px] text-[#FF7939] font-bold uppercase tracking-wider">
                                        Conectar API
                                    </a>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-xs uppercase text-gray-400 flex items-center gap-1">
                                <Instagram className="w-3 h-3" /> Usuario de Instagram (Manual)
                            </Label>
                            <Input
                                id="instagram"
                                placeholder="Ej: @tu_usuario"
                                value={draftData.instagram_username}
                                onChange={(e) => setDraftData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
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
        </>
    );
}
