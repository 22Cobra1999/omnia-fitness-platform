'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Smartphone, Instagram, Edit2, Loader2, Check, ChevronDown, Plus, XCircle, Flame } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
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
    const [isWaExpanded, setIsWaExpanded] = useState(false);
    const [isIgExpanded, setIsIgExpanded] = useState(false);
    const [showIgDisconnectModal, setShowIgDisconnectModal] = useState(false);

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
            toast.success('Cambios guardados');
            await loadSocialData();
            setIsModalOpen(false);
        } catch (error: any) {
            toast.error('Error: ' + error.message);
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
            setShowIgDisconnectModal(false);
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
            >
                <Edit2 className="w-4 h-4 text-white/40" />
            </button>
        );
    }

    return (
        <>
            <>
                {/* WHATSAPP */}
                <div className="bg-black border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] relative transition-all hover:border-[#FF7939]/30 group">
                    {socialData.whatsapp && (
                        <div className="absolute top-2 right-2">
                            <Flame className="w-3.5 h-3.5 text-[#FF7939] fill-[#FF7939]/20" />
                        </div>
                    )}
                    
                    <Smartphone className="w-6 h-6 text-[#FF7939] mb-1.5" />
                    <span className="text-[12px] font-medium text-white/50">WhatsApp</span>
                    
                    <button 
                        onClick={() => setIsWaExpanded(!isWaExpanded)}
                        className={`mt-1 p-1 transition-transform duration-300 ${isWaExpanded ? 'rotate-180' : ''}`}
                    >
                        <ChevronDown className="w-4 h-4 text-[#FF7939]/60" />
                    </button>

                    <AnimatePresence>
                        {isWaExpanded && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden w-full text-center flex flex-col items-center pt-1"
                            >
                                <span className="text-[10px] text-white/40 mb-2 truncate max-w-full px-2">
                                    {socialData.whatsapp || 'Sin configurar'}
                                </span>
                                <button 
                                    onClick={() => { setDraftData(socialData); setIsModalOpen(true); }}
                                    className="text-[9px] text-[#FF7939] font-bold uppercase"
                                >
                                    Editar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* INSTAGRAM */}
                <div className="bg-black border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] relative transition-all hover:border-[#FF7939]/30 group">
                    {socialData.has_instagram_token && (
                        <div className="absolute top-2 right-2">
                            <Flame className="w-3.5 h-3.5 text-[#FF7939] fill-[#FF7939]/20" />
                        </div>
                    )}
                    
                    <Instagram className="w-6 h-6 text-[#FF7939] mb-1.5" />
                    <span className="text-[12px] font-medium text-white/50">Instagram</span>

                    {!socialData.has_instagram_token && (
                        <a href="/api/auth/instagram" className="absolute top-2 right-2">
                            <Plus className="w-3.5 h-3.5 text-white/20" />
                        </a>
                    )}
                    
                    <button 
                        onClick={() => setIsIgExpanded(!isIgExpanded)}
                        className={`mt-1 p-1 transition-transform duration-300 ${isIgExpanded ? 'rotate-180' : ''}`}
                    >
                        <ChevronDown className="w-4 h-4 text-[#FF7939]/60" />
                    </button>

                    <AnimatePresence>
                        {isIgExpanded && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden w-full text-center flex flex-col items-center pt-1"
                            >
                                <span className="text-[10px] text-white/40 mb-2 truncate max-w-full px-2">
                                    {socialData.instagram_username ? `@${socialData.instagram_username.replace('@','')}` : (socialData.has_instagram_token ? 'Sincronizado' : 'Sin configurar')}
                                </span>
                                {socialData.has_instagram_token ? (
                                    <button 
                                        onClick={() => setShowIgDisconnectModal(true)}
                                        className="text-[9px] text-red-500/60 font-bold uppercase"
                                    >
                                        Desvincular
                                    </button>
                                ) : (
                                    <a href="/api/auth/instagram" className="text-[9px] text-[#FF7939] font-bold uppercase">
                                        Conectar
                                    </a>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </>

            <ConfirmationModal
                isOpen={showIgDisconnectModal}
                onClose={() => !disconnecting && setShowIgDisconnectModal(false)}
                onConfirm={handleDisconnectInstagram}
                title="Desvincular Instagram"
                description="¿Estás seguro de que quieres desvincular tu cuenta? Dejarás de recibir notificaciones y comentarios."
                confirmText={disconnecting ? "Desvinculando..." : "Desvincular"}
                cancelText="Cancelar"
                variant="destructive"
                isLoading={disconnecting}
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-black border border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Redes Sociales</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="text-xs uppercase text-white/30">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                value={draftData.whatsapp}
                                onChange={(e) => setDraftData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                className="bg-white/5 border-white/5 text-white h-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-xs uppercase text-white/30">Instagram (ID)</Label>
                            <Input
                                id="instagram"
                                value={draftData.instagram_username}
                                onChange={(e) => setDraftData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                className="bg-white/5 border-white/5 text-white h-9"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button onClick={handleSave} disabled={saving} className="w-full bg-[#FF7939] text-white py-2 rounded-lg text-sm font-bold">
                            {saving ? 'Guardando...' : 'Aplicar Cambios'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
