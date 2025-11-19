'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/supabase-client';
import { CheckCircle2, Loader2, Unlink, DollarSign, Clock, TrendingUp, Printer, FileText, Download, Eye, X, ChevronDown } from 'lucide-react';
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
  username?: string;
}

interface BillingData {
  totalIncome: number;
  totalCommission: number;
  planFee: number;
  earnings: number;
  invoices: Array<{
    id: string;
    date: string;
    concept: string;
    amount: number;
    commission: number;
    sellerAmount: number;
  }>;
  planSubscriptions?: Array<{
    id: string;
    date: string;
    planType: string;
    amount: number;
  }>;
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
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      loadCredentials();
    }
  }, [user?.id]);

  useEffect(() => {
    if (credentials?.oauth_authorized && credentials.mercadopago_user_id) {
      loadPaymentStats();
      loadUserInfo();
      loadBilling();
    }
  }, [credentials?.oauth_authorized, credentials?.mercadopago_user_id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpAuth = params.get('mp_auth');
    
    if (mpAuth === 'success') {
      loadCredentials();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Cerrar menú de exportar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

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

  const loadPaymentStats = async () => {
    if (!user?.id || !credentials?.mercadopago_user_id) return;

    try {
      setLoadingStats(true);
      
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

      const { data: payments, error } = await supabase
        .from('banco')
        .select('seller_amount, payment_status, amount_paid')
        .in('enrollment_id', enrollmentIds)
        .or(`coach_mercadopago_user_id.eq.${credentials.mercadopago_user_id},coach_mercadopago_user_id.is.null`);

      if (error) {
        console.error('Error cargando estadísticas:', error);
        return;
      }

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
      }
    } catch (error: any) {
      console.error('Error cargando info de usuario:', error);
    } finally {
      setLoadingUserInfo(false);
    }
  };

  const loadBilling = async () => {
    if (!user?.id) return;

    try {
      setLoadingBilling(true);
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      
      const response = await fetch(`/api/coach/billing?month=${year}-${month}&year=${year}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setBillingData(result);
      }
    } catch (error) {
      console.error('Error cargando facturación:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) return;

    setConnecting(true);
    try {
      // Usar el endpoint intermedio que construye la URL de Mercado Pago
      // y redirige correctamente. Abrir en la misma ventana para que funcione.
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const authUrl = `${baseUrl}/api/mercadopago/oauth/authorize?coach_id=${user.id}`;
      
      // Abrir directamente en la misma ventana para que la redirección funcione correctamente
      // Esto asegura que Mercado Pago se abra y el usuario pueda loguearse
      window.location.href = authUrl;
      
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
        setPaymentStats(null);
        setBillingData(null);
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

  const handleExportSales = async (format: 'excel' | 'pdf') => {
    setShowExportMenu(false);
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      
      const url = `/api/coach/export-sales?format=${format}&month=${month}&year=${year}`;
      
      if (format === 'excel') {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `ventas_${month}_${year}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('Archivo descargado correctamente');
      } else {
        toast.info('Exportación a PDF próximamente disponible');
      }
    } catch (error) {
      console.error('Error exportando ventas:', error);
      toast.error('Error al exportar ventas');
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
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6">
        <div className="text-center space-y-4">
          <p className="text-white/80">Conecta tu cuenta de Mercado Pago para recibir pagos</p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-[#FF7939] hover:bg-[#E86A2D] text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            {connecting ? 'Conectando...' : 'Conectar con Mercado Pago'}
          </button>
          
          {/* Ayuda para cuentas de prueba */}
          <div className="mt-4 p-3 bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-lg text-left">
            <p className="text-xs text-white/70 font-medium mb-2">💡 ¿Usando cuenta de prueba?</p>
            <p className="text-xs text-white/60 leading-relaxed">
              Si Mercado Pago te pide verificar por email:
              <br />
              • <strong>Primero intenta</strong>: Últimos 6 dígitos del User ID
              <br />
              • <strong>Si no funciona</strong>: Últimos 6 dígitos del Access Token de producción
              <br />
              <span className="text-[#FF7939] mt-1 block">Ejemplo: ronaldinho (2995219181) → 5219181</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Frame de Mercado Pago y Resumen de Cobros - Dos columnas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Frame de Mercado Pago - Izquierda */}
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4">
          {/* Header simplificado */}
          <div className="mb-4">
            <h3 className="text-white font-semibold text-sm mb-2">Mercado Pago</h3>
            {loadingUserInfo ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-[#FFE600]" />
                <span className="text-xs text-white/50">Cargando...</span>
              </div>
            ) : userInfo && (userInfo.nickname || userInfo.username) ? (
              <span className="text-xs text-white/90 block truncate font-medium">
                {userInfo.nickname || userInfo.username}
              </span>
            ) : null}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            {isConnected ? (
              <>
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  className="flex items-center justify-center flex-1 h-9 bg-white hover:bg-white/90 text-black font-medium rounded-lg transition-colors"
                >
                  Desvincular
                </button>
                <a
                  href="https://www.mercadopago.com.ar/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center flex-1 h-9 bg-[#FFE600] hover:bg-[#FFD600] text-black font-medium rounded-lg transition-colors"
                >
                  Ir a Mercado Pago
                </a>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center justify-center flex-1 h-9 bg-[#FFE600] hover:bg-[#FFD600] text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Conectando...
                  </>
                ) : (
                  'Conectar a Mercado Pago'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Resumen de Cobros - Derecha */}
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Resumen de Cobros</h3>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[#FFE600]" />
            </div>
          ) : paymentStats ? (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-[#FFE600]/20 border border-[#FFE600]/40 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#FFE600]" />
                  <span className="text-xs text-white font-medium">Total Recibido</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(paymentStats.totalReceived)}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  {paymentStats.completedPayments} pago{paymentStats.completedPayments !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-2.5 bg-white/10 border border-white/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs text-white font-medium">Pendientes</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(paymentStats.totalPending)}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  {paymentStats.pendingPayments} pago{paymentStats.pendingPayments !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-xs">No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Botón de exportar - Solo ícono con menú */}
      <div className="flex justify-end">
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center justify-center w-10 h-10 bg-[#FFE600] hover:bg-[#FFD600] text-black rounded-xl transition-colors"
            title="Exportar ventas"
          >
            <Printer className="w-5 h-5" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 bottom-full mb-2 backdrop-blur-xl bg-black/80 border border-white/10 rounded-lg p-2 shadow-xl z-50 min-w-[140px]">
              <button
                onClick={() => handleExportSales('excel')}
                className="w-full flex items-center gap-2 px-3 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-colors text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Exportar Excel
              </button>
              <button
                onClick={() => handleExportSales('pdf')}
                className="w-full flex items-center gap-2 px-3 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-colors text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar PDF
              </button>
            </div>
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
