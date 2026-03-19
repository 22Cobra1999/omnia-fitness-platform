'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, Calendar, ExternalLink, Check, ChevronDown, Plus, XCircle } from 'lucide-react';
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
    } else if (params.get('google_calendar_auth') === 'error') {
      const error = params.get('error');
      const details = params.get('details');
      let errorMessage = 'Error al conectar Google Calendar';
      if (error) {
        errorMessage = `Error: ${error}`;
        if (details) {
          errorMessage += ` (${details})`;
        }
      }
      toast.error(errorMessage);
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
      } else {
        const result = await response.json();
        toast.error(result.error || 'Error al desvincular Google Calendar');
      }
    } catch (error: any) {
      console.error('Error al desvincular:', error);
      toast.error(`Error al desvincular Google Calendar: ${error.message || 'Error desconocido'}`);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return null;

  const isConnected = !!credentials;

  return (
    <>
      <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[140px] relative transition-all hover:border-white/10 group h-full">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-1 shadow-lg overflow-hidden p-2">
          <svg viewBox="0 0 24 24" className="w-full h-full">
              <path d="M19 3h-1V1h-2v2H8V1H6v3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="#4285F4"/>
              <path d="M5 5h14v4H5z" fill="#34A853"/>
              <path d="M19 3h-1V1h-2v2H8V1H6v3H5c-1.11 0-2 .9-2 2v3h18V5c0-1.1-.9-2-2-2z" fill="#EA4335"/>
              <path d="M12 11h5v5h-5z" fill="#FBBC05"/>
          </svg>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white/90">Google Calendar</span>
          {isConnected && <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />}
        </div>

        {!isConnected && (
          <button onClick={handleConnect} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Plus className="w-3.5 h-3.5 text-white/60" />
          </button>
        )}
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-2 p-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <ChevronDown className="w-5 h-5 text-[#FF7939]" />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden w-full text-center flex flex-col items-center pt-2"
            >
              <span className="text-[11px] text-white/60 mb-2 truncate max-w-full italic px-2">
                {isConnected ? (credentials?.google_email || user?.email) : 'No conectado'}
              </span>
              {isConnected ? (
                <button 
                  onClick={() => setShowDisconnectModal(true)}
                  className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" /> Desvincular
                </button>
              ) : (
                <button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="text-[10px] text-[#FF7939] font-bold uppercase tracking-wider"
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
