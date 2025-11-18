'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preferenceId = searchParams.get('preference_id');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  const handleRetry = () => {
    // Reiniciar la página para limpiar el estado
    window.location.href = '/';
  };

  const handleGoHome = () => {
    // Reiniciar la página completamente
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1C1F] rounded-2xl p-8 shadow-xl border border-gray-800">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Pago No Completado
          </h1>
          <p className="text-gray-400 mb-4">
            La transacción no se confirmó. Por favor, intenta nuevamente.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400">
              {error === 'rejected' && 'El pago fue rechazado. Verifica los datos de tu tarjeta o método de pago.'}
              {error === 'cancelled' && 'La transacción fue cancelada. No se realizó ningún cargo.'}
              {error === 'expired' && 'El tiempo para completar el pago expiró.'}
              {!error.includes('rejected') && !error.includes('cancelled') && !error.includes('expired') && `Error: ${error}`}
            </p>
          </div>
        )}

        {status === 'cancelled' && !error && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-400">
              ⚠️ La transacción no se confirmó. No se realizó ningún cargo.
            </p>
          </div>
        )}

        {status && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-400">
              Estado: {status}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full bg-[#FF7939] hover:bg-[#FF7939]/90 text-white"
            size="lg"
          >
            <RefreshCw className="mr-2 w-4 h-4" />
            Intentar Nuevamente
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-white/5"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
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

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}

