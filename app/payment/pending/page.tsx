'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/supabase-client';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const preferenceId = searchParams.get('preference_id');
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    if (!preferenceId && !paymentId) {
      setLoading(false);
      return;
    }

    // Buscar el enrollment asociado a esta preferencia
    const fetchEnrollment = async () => {
      try {
        const supabase = createClient();
        
        // Buscar en banco por preference_id o payment_id
        let bancoRecord;
        
        if (preferenceId) {
          const { data } = await supabase
            .from('banco')
            .select('enrollment_id, amount_paid, payment_status, activity_id')
            .eq('mercadopago_preference_id', preferenceId)
            .maybeSingle();
          bancoRecord = data;
        }
        
        if (!bancoRecord && paymentId) {
          const { data } = await supabase
            .from('banco')
            .select('enrollment_id, amount_paid, payment_status, activity_id')
            .eq('mercadopago_payment_id', paymentId)
            .maybeSingle();
          bancoRecord = data;
        }

        if (bancoRecord?.enrollment_id) {
          // Obtener detalles del enrollment
          const { data: enrollmentData } = await supabase
            .from('activity_enrollments')
            .select(`
              id,
              activity_id,
              status,
              payment_status,
              activities (
                id,
                title,
                image_url
              )
            `)
            .eq('id', bancoRecord.enrollment_id)
            .single();

          if (enrollmentData) {
            setEnrollment(enrollmentData);
          }
        } else if (bancoRecord?.activity_id) {
          // Si hay activity_id pero no enrollment, el pago está pendiente
          const { data: activityData } = await supabase
            .from('activities')
            .select('id, title, image_url')
            .eq('id', bancoRecord.activity_id)
            .single();

          if (activityData) {
            setEnrollment({
              activities: activityData,
              status: 'pending'
            });
          }
        }
      } catch (error) {
        console.error('Error obteniendo detalles del pago pendiente:', error);
        setError('Error al verificar el estado del pago');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [preferenceId, paymentId]);

  const handleGoToActivity = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pending_payment');
    }
    
    if (enrollment?.activity_id || enrollment?.activities?.id) {
      router.push(`/activities/${enrollment.activity_id || enrollment.activities.id}`);
    } else {
      router.push('/activities');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1C1F] rounded-2xl p-8 shadow-xl border border-gray-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#FF7939] mb-4" />
            <p className="text-gray-400">Verificando pago...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-12 h-12 text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Pago Pendiente
              </h1>
              <p className="text-gray-400 mb-4">
                Tu pago está siendo procesado. Te notificaremos cuando se confirme.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {enrollment && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-gray-800">
                <p className="text-sm text-gray-400 mb-2">Actividad:</p>
                <p className="text-lg font-semibold text-white">
                  {enrollment.activities?.title || 'Actividad'}
                </p>
                {enrollment.activities?.image_url && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img
                      src={enrollment.activities.image_url}
                      alt={enrollment.activities.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">
                ℹ️ Los pagos pueden tardar unos minutos en procesarse. Si el pago se confirma, 
                recibirás una notificación y podrás acceder a la actividad.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoToActivity}
                className="w-full bg-[#FF7939] hover:bg-[#FF7939]/90 text-white"
                size="lg"
              >
                {enrollment ? 'Ver Actividad' : 'Ir a Actividades'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={() => router.push('/activities')}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-white/5"
              >
                Ver Todas las Actividades
              </Button>
            </div>

            {(preferenceId || paymentId) && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                {preferenceId && (
                  <p className="text-xs text-gray-500 text-center">
                    ID de Preferencia: {preferenceId}
                  </p>
                )}
                {paymentId && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    ID de Pago: {paymentId}
                  </p>
                )}
                {status && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Estado: {status}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}
