'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, DollarSign, User, ExternalLink, Check, ChevronDown, Plus, XCircle, Handshake } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MercadoPagoCredentials {
  oauth_authorized: boolean;
  mercadopago_user_id: string | null;
  oauth_authorized_at: string | null;
}

interface MercadoPagoUserInfo {
  id: number;
  nickname: string;
  email: string;
}

export function MercadoPagoConnection() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<MercadoPagoCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [userInfo, setUserInfo] = useState<MercadoPagoUserInfo | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) loadCredentials();
  }, [user?.id]);

  useEffect(() => {
    if (credentials?.oauth_authorized && credentials.mercadopago_user_id) loadUserInfo();
  }, [credentials?.oauth_authorized, credentials?.mercadopago_user_id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mp_auth') === 'success') {
      loadCredentials();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadCredentials = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('coach_mercadopago_credentials')
        .select('oauth_authorized, mercadopago_user_id, oauth_authorized_at')
        .eq('coach_id', user.id)
        .maybeSingle();
      setCredentials(data || { oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    if (!user?.id) return;
    try {
      setLoadingUserInfo(true);
      const response = await fetch('/api/mercadopago/user-info');
      const result = await response.json();
      if (response.ok && result.success) setUserInfo(result.user);
    } finally {
      setLoadingUserInfo(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) return;
    setConnecting(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/mercadopago/oauth/authorize?coach_id=${user.id}&return_url=true`);
      const { authUrl } = await response.json();
      if (authUrl) window.open(`${baseUrl}/mercadopago-logout?auth_url=${encodeURIComponent(authUrl)}`, 'MPAuth', 'width=600,height=700');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;
    setDisconnecting(true);
    try {
      const response = await fetch('/api/mercadopago/disconnect', { method: 'POST' });
      if (response.ok) {
        toast.success('Cuenta desvinculada');
        setCredentials({ oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
        setUserInfo(null);
        setShowDisconnectModal(false);
      }
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return null;

  const isConnected = credentials?.oauth_authorized === true;

  return (
    <>
      <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[140px] relative transition-all hover:border-white/10 group h-full">
        <div className="w-12 h-12 bg-[#009EE3] rounded-full flex items-center justify-center mb-1 shadow-lg shadow-[#009EE3]/20">
          <Handshake className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white/90">Mercado Pago</span>
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
                {isConnected ? (userInfo?.nickname || credentials?.mercadopago_user_id) : 'No conectado'}
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
        title="Desvincular Mercado Pago"
        description="¿Estás seguro?"
        confirmText={disconnecting ? "..." : "Desvincular"}
        cancelText="Cancelar"
        variant="destructive"
        isLoading={disconnecting}
      />
    </>
  );
}
