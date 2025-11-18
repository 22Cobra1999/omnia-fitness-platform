'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/supabase-client';

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const preferenceId = searchParams.get('preference_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Verificar el estado del pago periódicamente
    const checkPaymentStatus = async () => {
      if (!preferenceId) return;

      setChecking(true);
      try {
        const supabase = createClient();
        
        // Buscar en banco por preference_id
        const { data: bancoRecord } = await supabase
          .from('banco')
          .select('payment_status, mercadopago_status')
          .eq('mercadopago_preference_id', preferenceId)
          .maybeSingle();

        if (bancoRecord) {
          // Si el pago fue aprobado, redirigir a success
          if (bancoRecord.payment_status === 'completed' || bancoRecord.mercadopago_status === 'approved') {
            router.push(`/payment/success?preference_id=${preferenceId}&payment_id=${paymentId || ''}`);
            return;
          }
          
          // Si el pago fue rechazado, redirigir a failure
          if (bancoRecord.payment_status === 'failed' || bancoRecord.mercadopago_status === 'rejected') {
            router.push(`/payment/failure?preference_id=${preferenceId}&payment_id=${paymentId || ''}&status=rejected`);
            return;
          }
        }
      } catch (error) {
        console.error('Error verificando estado del pago:', error);
      } finally {
        setChecking(false);
      }
    };

    // Verificar inmediatamente
    checkPaymentStatus();

    // Verificar cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [preferenceId, paymentId, router]);

  const handleGoToActivities = () => {
    router.push('/activities');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1C1F] rounded-2xl p-8 shadow-xl border border-gray-800">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            {checking ? (
              <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
            ) : (
              <Clock className="w-12 h-12 text-yellow-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Pago Pendiente
          </h1>
          <p className="text-gray-400 mb-4">
            Estamos procesando tu pago. Esto puede tardar unos minutos.
          </p>
          <p className="text-sm text-gray-500">
            Te notificaremos cuando el pago sea confirmado.
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-400 text-center">
            ⏳ Tu pago está siendo procesado. Por favor, espera la confirmación.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGoToActivities}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-white/5"
          >
            <ArrowRight className="mr-2 w-4 h-4" />
            Volver a Actividades
          </Button>
        </div>

        {preferenceId && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              ID de Preferencia: {preferenceId}
            </p>
            {paymentId && (
              <p className="text-xs text-gray-500 text-center mt-1">
                ID de Pago: {paymentId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

