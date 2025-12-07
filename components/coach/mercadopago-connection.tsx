'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, DollarSign, User, ExternalLink } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';

interface MercadoPagoCredentials {
  oauth_authorized: boolean;
  mercadopago_user_id: string | null;
  oauth_authorized_at: string | null;
}

interface MercadoPagoUserInfo {
  id: number;
  nickname: string;
  email: string;
  first_name?: string;
  last_name?: string;
  country_id?: string;
  username?: string;
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
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      loadCredentials();
    }
  }, [user?.id]);

  useEffect(() => {
    if (credentials?.oauth_authorized && credentials.mercadopago_user_id) {
      loadUserInfo();
    }
  }, [credentials?.oauth_authorized, credentials?.mercadopago_user_id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpAuth = params.get('mp_auth');
    
    if (mpAuth === 'success') {
      loadCredentials();
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Escuchar mensajes del popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MP_AUTH_SUCCESS') {
        loadCredentials();
        setConnecting(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  const loadCredentials = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_mercadopago_credentials')
        .select('oauth_authorized, mercadopago_user_id, oauth_authorized_at')
        .eq('coach_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando credenciales:', error);
      }

      setCredentials(data || { oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
    } catch (error) {
      console.error('Error:', error);
      setCredentials({ oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
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

      if (response.ok && result.success) {
        setUserInfo(result.user);
      }
    } catch (error: any) {
      console.error('Error cargando info de usuario:', error);
    } finally {
      setLoadingUserInfo(false);
    }
  };


  const handleConnect = async () => {
    if (!user?.id) return;

    setConnecting(true);
    try {
      // Usar el endpoint intermedio que construye la URL de Mercado Pago
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const authUrl = `${baseUrl}/api/mercadopago/oauth/authorize?coach_id=${user.id}`;
      
      // Abrir en una nueva ventana para evitar que use cookies de sesión existentes
      // Esto fuerza a Mercado Pago a mostrar la pantalla de login
      const popup = window.open(
        authUrl,
        'MercadoPagoAuth',
        'width=600,height=700,scrollbars=yes,resizable=yes,noopener,noreferrer'
      );
      
      // Si el popup fue bloqueado, usar redirección normal
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback: redirigir en la misma ventana
        window.location.href = authUrl;
        return;
      }
      
      // Monitorear cuando se cierre la ventana o cuando se complete la autorización
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            setConnecting(false);
            // Recargar credenciales después de que se cierre la ventana
            setTimeout(() => {
              loadCredentials();
            }, 1000);
          } else {
            // Verificar si la ventana fue redirigida a nuestro callback
            try {
              const popupUrl = popup.location.href;
              if (popupUrl.includes('/api/mercadopago/oauth/callback')) {
                clearInterval(checkClosed);
                popup.close();
                setConnecting(false);
                // Recargar credenciales
                setTimeout(() => {
                  loadCredentials();
                }, 500);
              }
            } catch (e) {
              // Cross-origin error, ignorar
            }
          }
        } catch (e) {
          // Error al acceder a popup, puede ser cross-origin
        }
      }, 500);
      
      // Timeout de seguridad: cerrar después de 5 minutos
      setTimeout(() => {
        clearInterval(checkClosed);
        if (popup && !popup.closed) {
          popup.close();
        }
        setConnecting(false);
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Error al conectar:', error);
      setConnecting(false);
      toast.error('Error al iniciar la conexión con Mercado Pago');
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    setDisconnecting(true);
    try {
      const response = await fetch('/api/mercadopago/disconnect', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Cuenta desvinculada correctamente');
        setCredentials({ oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
        setUserInfo(null);
        setShowDisconnectModal(false);
        await loadCredentials();
      } else {
        toast.error(result.error || 'Error al desvincular cuenta');
      }
    } catch (error: any) {
      console.error('Error al desvincular:', error);
      toast.error(`Error al desvincular cuenta: ${error.message || 'Error desconocido'}`);
    } finally {
      setDisconnecting(false);
    }
  };


  const getPlanName = (planType: string) => {
    const names: Record<string, string> = {
      free: 'Free',
      basico: 'Básico',
      black: 'Black',
      premium: 'Premium'
    };
    return names[planType] || planType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF7939]" />
      </div>
    );
  }

  const isConnected = credentials?.oauth_authorized === true;

  if (!isConnected) {
    return (
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-white/70">Conecta tu cuenta de Mercado Pago para recibir pagos</p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-[#FF7939]/80 hover:bg-[#FF7939] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {connecting ? 'Conectando...' : 'Conectar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full">
      {/* Frame de Mercado Pago - Más alto */}
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-3 h-full flex flex-col">
          {/* Header con ícono y nombre de usuario */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <DollarSign className="w-4 h-4 text-[#FF7939] flex-shrink-0" />
              <h3 className="text-white font-medium text-sm">Mercado Pago</h3>
            </div>
            {loadingUserInfo && (
              <Loader2 className="w-3 h-3 animate-spin text-[#FF7939] flex-shrink-0" />
            )}
          </div>

          {/* Nombre del usuario con icono de persona - Solo muestra el nombre, sin ID */}
          {isConnected && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5 flex-1">
              <User className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
              {userInfo && (userInfo.nickname || userInfo.username) && (
                <p className="text-xs text-white/80 truncate">
                  {userInfo.nickname || userInfo.username}
                </p>
              )}
            </div>
          )}

          {/* Botones de acción minimalistas */}
          <div className="flex gap-2 items-center mt-auto">
            {isConnected ? (
              <>
                <a
                  href="https://www.mercadopago.com.ar/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 h-6 px-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs rounded-md transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  className="flex items-center justify-center h-6 px-2.5 text-[#FF7939] hover:text-[#FF8C42] text-xs transition-colors"
                >
                  Desvincular
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center justify-center gap-1.5 flex-1 h-7 bg-[#FF7939]/80 hover:bg-[#FF7939] text-white text-xs rounded-md transition-colors disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  'Conectar'
                )}
              </button>
            )}
          </div>
        </div>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => !disconnecting && setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Desvincular Cuenta"
        description="¿Estás seguro de que deseas desvincular tu cuenta de Mercado Pago?"
        confirmText={disconnecting ? "Desvinculando..." : "Desvincular"}
        cancelText="Cancelar"
        variant="destructive"
        isLoading={disconnecting}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 121, 57, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 121, 57, 0.7);
        }
      `}</style>
    </div>
  );
}
