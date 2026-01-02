'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, Calendar, ExternalLink } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';

interface GoogleCalendarCredentials {
  coach_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
  google_email?: string | null;
  created_at: string;
  updated_at: string;
}

export function GoogleCalendarConnection() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<GoogleCalendarCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      loadCredentials();
    }
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleAuth = params.get('google_calendar_auth');
    
    if (googleAuth === 'success') {
      toast.success('Google Calendar conectado exitosamente');
      loadCredentials();
      // Limpiar parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (googleAuth === 'error') {
      const error = params.get('error');
      const details = params.get('details');
      
      let errorMessage = 'Error al conectar Google Calendar';
      
      if (error === 'missing_params') {
        errorMessage = 'Faltan parámetros en la respuesta de Google. Verifica que el redirect URI esté configurado en Google Cloud Console.';
      } else if (error === 'token_exchange_failed') {
        errorMessage = 'Error al intercambiar el código de autorización. Verifica las credenciales.';
        if (details) {
          errorMessage += ` Detalles: ${details}`;
        }
      } else if (error === 'config_error') {
        errorMessage = 'Error de configuración. Verifica las variables de entorno.';
      } else if (error === 'db_error') {
        errorMessage = 'Error al guardar las credenciales en la base de datos.';
        if (details) {
          errorMessage += ` Detalles: ${details}`;
        }
      } else if (error) {
        errorMessage = `Error: ${error}`;
        if (details) {
          errorMessage += ` (${details})`;
        }
      }
      
      console.error('❌ [GoogleCalendarConnection] Error:', { error, details });
      toast.error(errorMessage);
      // Limpiar parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadCredentials = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('coach_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando credenciales:', error);
      }

      setCredentials(data || null);
    } catch (error) {
      console.error('Error:', error);
      setCredentials(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) return;

    setConnecting(true);
    try {
      // Abrir en la misma ventana para que la redirección funcione correctamente
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const authUrl = `${baseUrl}/api/google/oauth/authorize?coach_id=${user.id}`;
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error al conectar:', error);
      setConnecting(false);
      toast.error('Error al iniciar la conexión con Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    setDisconnecting(true);
    try {
      const response = await fetch('/api/google/calendar/disconnect', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Google Calendar desvinculado correctamente');
        setCredentials(null);
        setShowDisconnectModal(false);
        await loadCredentials();
      } else {
        toast.error(result.error || 'Error al desvincular Google Calendar');
      }
    } catch (error: any) {
      console.error('Error al desvincular:', error);
      toast.error(`Error al desvincular Google Calendar: ${error.message || 'Error desconocido'}`);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF7939]" />
      </div>
    );
  }

  const isConnected = !!credentials;

  if (!isConnected) {
    return (
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-[#FF7939] flex-shrink-0" />
            <h3 className="text-white font-medium text-sm">Google Calendar</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-[11px] text-white/60">No conectado</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="h-7 px-3 bg-[#FF7939]/80 hover:bg-[#FF7939] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {connecting ? 'Conectando...' : 'Conectar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full">
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-3 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-[#FF7939] flex-shrink-0" />
            <h3 className="text-white font-medium text-sm">Google Calendar</h3>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] text-white/80">Conectado</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 h-7 w-7 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs rounded-md transition-colors flex-shrink-0"
            aria-label="Ir a Google Calendar"
          >
            <ExternalLink className="w-3 h-3" />
          </a>

          <p className="text-xs text-white/80 truncate flex-1 min-w-0">
            {credentials?.google_email || user?.email || '—'}
          </p>

          <button
            onClick={() => setShowDisconnectModal(true)}
            className="text-[#FF7939] hover:text-[#FF8C42] text-[13px] font-semibold transition-colors flex-shrink-0"
          >
            Desvincular
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => !disconnecting && setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Desvincular Google Calendar"
        description="¿Estás seguro de que deseas desvincular tu cuenta de Google Calendar? Los eventos no se sincronizarán automáticamente."
        confirmText={disconnecting ? "Desvinculando..." : "Desvincular"}
        cancelText="Cancelar"
        variant="destructive"
        isLoading={disconnecting}
      />
    </div>
  );
}


