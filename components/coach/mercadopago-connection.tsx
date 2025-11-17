'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { CheckCircle2, XCircle, ExternalLink, Loader2, DollarSign, TrendingUp, Clock, CheckCircle, User, Mail, Unlink, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';

interface MercadoPagoCredentials {
  oauth_authorized: boolean;
  mercadopago_user_id: string | null;
  oauth_authorized_at: string | null;
}

interface PaymentStats {
  totalReceived: number;
  totalPending: number;
  completedPayments: number;
  pendingPayments: number;
}

interface MercadoPagoUserInfo {
  id: number;
  nickname: string;
  email: string;
  first_name?: string;
  last_name?: string;
  country_id?: string;
}

export function MercadoPagoConnection() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<MercadoPagoCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
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

  // Cargar estadísticas de pagos y info del usuario cuando esté conectado
  useEffect(() => {
    if (credentials?.oauth_authorized && credentials.mercadopago_user_id) {
      loadPaymentStats();
      loadUserInfo();
    }
  }, [credentials?.oauth_authorized, credentials?.mercadopago_user_id]);

  // Verificar si hay mensaje de éxito/error en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpAuth = params.get('mp_auth');
    
    if (mpAuth === 'success') {
      // Recargar credenciales
      loadCredentials();
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadCredentials = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_mercadopago_credentials')
        .select('oauth_authorized, mercadopago_user_id, oauth_authorized_at')
        .eq('coach_id', user.id)
        .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no existe

      if (error) {
        // PGRST116 = no rows returned (es normal si no hay credenciales aún)
        if (error.code === 'PGRST116') {
          setCredentials({ oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
          return;
        }
        
        // Error 406 = Not Acceptable (problema con RLS o tabla no existe)
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          console.error('Error 406: Problema con políticas RLS o tabla no existe. Verifica la migración:', error);
          // Aún así, establecer valores por defecto para que la UI funcione
          setCredentials({ oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
          return;
        }
        
        console.error('Error cargando credenciales:', error);
      }

      setCredentials(data || { oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
    } catch (error) {
      console.error('Error:', error);
      // En caso de error, establecer valores por defecto
      setCredentials({ oauth_authorized: false, mercadopago_user_id: null, oauth_authorized_at: null });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async () => {
    if (!user?.id || !credentials?.mercadopago_user_id) return;

    try {
      setLoadingStats(true);
      
      // Obtener pagos del coach desde la tabla banco
      // Buscar por coach_mercadopago_user_id o por actividades del coach
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', user.id);

      if (!activities || activities.length === 0) {
        setPaymentStats({
          totalReceived: 0,
          totalPending: 0,
          completedPayments: 0,
          pendingPayments: 0
        });
        return;
      }

      const activityIds = activities.map(a => a.id);

      // Obtener enrollments de estas actividades
      const { data: enrollments } = await supabase
        .from('activity_enrollments')
        .select('id')
        .in('activity_id', activityIds);

      if (!enrollments || enrollments.length === 0) {
        setPaymentStats({
          totalReceived: 0,
          totalPending: 0,
          completedPayments: 0,
          pendingPayments: 0
        });
        return;
      }

      const enrollmentIds = enrollments.map(e => e.id);

      // Obtener pagos de estos enrollments
      const { data: payments, error } = await supabase
        .from('banco')
        .select('seller_amount, payment_status, amount_paid')
        .in('enrollment_id', enrollmentIds)
        .or(`coach_mercadopago_user_id.eq.${credentials.mercadopago_user_id},coach_mercadopago_user_id.is.null`);

      if (error) {
        console.error('Error cargando estadísticas:', error);
        return;
      }

      // Calcular estadísticas
      const completed = payments?.filter(p => p.payment_status === 'completed') || [];
      const pending = payments?.filter(p => p.payment_status === 'pending') || [];

      const totalReceived = completed.reduce((sum, p) => sum + parseFloat(p.seller_amount?.toString() || p.amount_paid?.toString() || '0'), 0);
      const totalPending = pending.reduce((sum, p) => sum + parseFloat(p.seller_amount?.toString() || p.amount_paid?.toString() || '0'), 0);

      setPaymentStats({
        totalReceived,
        totalPending,
        completedPayments: completed.length,
        pendingPayments: pending.length
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingStats(false);
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
      } else {
        console.error('Error cargando info de usuario:', result.error);
      }
    } catch (error) {
      console.error('Error cargando info de usuario:', error);
    } finally {
      setLoadingUserInfo(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) return;

    setConnecting(true);
    try {
      // Redirigir a la URL de autorización OAuth
      window.location.href = `/api/mercadopago/oauth/authorize?coach_id=${user.id}`;
    } catch (error) {
      console.error('Error al conectar:', error);
      setConnecting(false);
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
        setPaymentStats(null);
        setShowDisconnectModal(false);
      } else {
        toast.error(result.error || 'Error al desvincular cuenta');
      }
    } catch (error) {
      console.error('Error al desvincular:', error);
      toast.error('Error al desvincular cuenta');
    } finally {
      setDisconnecting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-[#1A1C1F] rounded-2xl p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF7939]" />
        </div>
      </div>
    );
  }

  const isConnected = credentials?.oauth_authorized === true;

  return (
    <div className="bg-[#1A1C1F] rounded-2xl p-4 space-y-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>Cobros y Cuenta de Mercado Pago</span>
        {isConnected && (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        )}
      </h3>

      <div className="space-y-4">
        {/* Estado de Conexión */}
        {isConnected ? (
          <div className="space-y-4">
            {/* Información de la Cuenta Conectada */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    Cuenta Conectada
                  </span>
                </div>
              </div>
              
              {loadingUserInfo ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Cargando información...</span>
                </div>
              ) : userInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white font-medium">
                      {userInfo.first_name && userInfo.last_name 
                        ? `${userInfo.first_name} ${userInfo.last_name}`
                        : userInfo.nickname || 'Usuario de Mercado Pago'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{userInfo.email}</span>
                  </div>
                  {credentials.mercadopago_user_id && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400">
                        ID de Mercado Pago: <span className="text-gray-300 font-mono">{credentials.mercadopago_user_id}</span>
                      </p>
                      {credentials.oauth_authorized_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Conectado el {new Date(credentials.oauth_authorized_at).toLocaleDateString('es-AR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {credentials.mercadopago_user_id && (
                    <p className="text-xs text-gray-400">
                      ID: {credentials.mercadopago_user_id}
                    </p>
                  )}
                  {credentials.oauth_authorized_at && (
                    <p className="text-xs text-gray-400">
                      Conectado el {new Date(credentials.oauth_authorized_at).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
              )}

              {/* Botón de Desvincular */}
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-red-400 text-sm font-medium"
              >
                <Unlink className="w-4 h-4" />
                Desvincular Cuenta
              </button>
            </div>

            {/* Estadísticas de Cobros */}
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF7939]" />
              </div>
            ) : paymentStats && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Resumen de Cobros</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Total Recibido</span>
                    </div>
                    <p className="text-lg font-bold text-green-400">
                      {formatCurrency(paymentStats.totalReceived)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentStats.completedPayments} pago{paymentStats.completedPayments !== 1 ? 's' : ''} completado{paymentStats.completedPayments !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400">Pendientes</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-400">
                      {formatCurrency(paymentStats.totalPending)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentStats.pendingPayments} pago{paymentStats.pendingPayments !== 1 ? 's' : ''} pendiente{paymentStats.pendingPayments !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Información de Verificación */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-400 mb-1">
                    Verificación de Pagos
                  </p>
                  <p className="text-xs text-gray-400">
                    Los pagos se verifican automáticamente mediante webhooks de Mercado Pago. 
                    Recibirás notificaciones en tiempo real cuando se procesen tus cobros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">
                  No conectado
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Conecta tu cuenta de Mercado Pago para recibir pagos de tus actividades. 
                Los pagos se dividirán automáticamente entre OMNIA y tu cuenta.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-[#FF7939] hover:bg-[#E86A2D] text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Conectar con Mercado Pago
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Serás redirigido a Mercado Pago para autorizar a OMNIA. 
              Usa tus credenciales de prueba para testing.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Desvinculación */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => !disconnecting && setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Desvincular Cuenta de Mercado Pago"
        description="¿Estás seguro de que deseas desvincular tu cuenta de Mercado Pago? Podrás volver a vincularla en cualquier momento usando el mismo proceso de inicio de sesión."
        confirmText={disconnecting ? "Desvinculando..." : "Desvincular"}
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}






