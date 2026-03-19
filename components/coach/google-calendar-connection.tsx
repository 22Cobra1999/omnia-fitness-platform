'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, Calendar, ExternalLink, Check } from 'lucide-react';
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
      <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:border-white/10 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Google Calendar</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/20 italic">No conectado</span>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-bold uppercase tracking-wider border border-orange-500/20 hover:bg-orange-500/20 transition-all"
          >
            {connecting ? '...' : 'Conectar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:border-white/10 group h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#FF7939]" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Google Calendar</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase">OK</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 gap-2">
        <p className="text-xs text-white/70 truncate flex-1 opacity-60">
          {credentials?.google_email || user?.email}
        </p>
        <button
          onClick={() => setShowDisconnectModal(true)}
          className="text-[9px] font-bold text-red-400 uppercase tracking-wider opacity-40 hover:opacity-100 transition-opacity"
        >
          Desvincular
        </button>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => !disconnecting && setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Desvincular Google Calendar"
        description="¿Estás seguro de que deseas desvincular tu cuenta de Google Calendar?"
        confirmText={disconnecting ? "..." : "Desvincular"}
        cancelText="Cancelar"
        variant="destructive"
        isLoading={disconnecting}
      />
    </div>
  );
}


