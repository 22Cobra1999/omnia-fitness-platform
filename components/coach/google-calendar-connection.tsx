'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, Calendar, ExternalLink, Check, ChevronDown, Plus, XCircle, Flame } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleCalendarCredentials {
  coach_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  google_email?: string | null;
}

export function GoogleCalendarConnection() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<GoogleCalendarCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) loadCredentials();
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_calendar_auth') === 'success') {
      toast.success('Google Calendar conectado');
      loadCredentials();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadCredentials = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data } = await supabase.from('google_oauth_tokens').select('*').eq('coach_id', user.id).maybeSingle();
      setCredentials(data || null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) return;
    setConnecting(true);
    window.location.href = `${window.location.origin}/api/google/oauth/authorize?coach_id=${user.id}`;
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;
    setDisconnecting(true);
    try {
      const response = await fetch('/api/google/calendar/disconnect', { method: 'POST' });
      if (response.ok) {
        toast.success('Google Calendar desvinculado');
        setCredentials(null);
        setShowDisconnectModal(false);
      }
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return null;

  const isConnected = !!credentials;

  return (
    <>
      <div className="bg-black border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] relative transition-all hover:border-[#FF7939]/30 group h-full">
        {isConnected && (
            <div className="absolute top-2 right-2">
                <Flame className="w-3.5 h-3.5 text-[#FF7939] fill-[#FF7939]/20" />
            </div>
        )}
        
        <Calendar className="w-6 h-6 text-[#FF7939] mb-1.5" />
        <span className="text-[12px] font-medium text-white/50">Google Calendar</span>

        {!isConnected && (
          <button onClick={handleConnect} className="absolute top-2 right-2">
            <Plus className="w-3.5 h-3.5 text-white/20" />
          </button>
        )}
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-1 p-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <ChevronDown className="w-4 h-4 text-[#FF7939]/60" />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden w-full text-center flex flex-col items-center pt-1"
            >
              <span className="text-[10px] text-white/40 mb-2 truncate max-w-full px-2">
                {isConnected ? (credentials?.google_email || user?.email) : 'No conectado'}
              </span>
              {isConnected ? (
                <button 
                  onClick={() => setShowDisconnectModal(true)}
                  className="text-[9px] text-red-500/60 font-bold uppercase"
                >
                  Desvincular
                </button>
              ) : (
                <button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="text-[9px] text-[#FF7939] font-bold uppercase"
                >
                  {connecting ? '...' : 'Conectar'}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => !disconnecting && setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Desvincular Calendar"
        description="¿Estás seguro?"
        confirmText={disconnecting ? "..." : "Desvincular"}
        cancelText="Cancelar"
        variant="destructive"
        isLoading={disconnecting}
      />
    </>
  );
}
