'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/supabase-client';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [bancoRecord, setBancoRecord] = useState<any>(null);
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
        let bancoData;
        
        if (preferenceId) {
          const { data } = await supabase
            .from('banco')
            .select('enrollment_id, amount_paid, payment_status, activity_id, client_id')
            .eq('mercadopago_preference_id', preferenceId)
            .maybeSingle();
          bancoData = data;
        }
        
        if (!bancoData && paymentId) {
          const { data } = await supabase
            .from('banco')
            .select('enrollment_id, amount_paid, payment_status, activity_id, client_id')
            .eq('mercadopago_payment_id', paymentId)
            .maybeSingle();
          bancoData = data;
        }

        // Guardar bancoRecord para usar en handleGoToActivity
        if (bancoData) {
          setBancoRecord(bancoData);
          
          // Si tenemos activity_id, redirigir a la página principal con parámetros para abrir modales
          if (bancoData.activity_id) {
            // Guardar en sessionStorage para que el modal de compra sepa qué actividad mostrar
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('last_purchase_activity_id', String(bancoData.activity_id));
              sessionStorage.setItem('show_purchase_success', 'true');
              sessionStorage.setItem('purchase_preference_id', preferenceId || '');
              sessionStorage.setItem('purchase_payment_id', paymentId || '');
            }
            
            // Redirigir a la página principal - el modal de compra detectará los parámetros
            router.push(`/?purchase_success=true&activity_id=${bancoData.activity_id}&preference_id=${preferenceId || ''}&payment_id=${paymentId || ''}`);
            return;
          }
        }

        // Si hay enrollment_id, obtener detalles del enrollment
        if (bancoData?.enrollment_id) {
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
            .eq('id', bancoData.enrollment_id)
            .single();

          if (enrollmentData) {
            setEnrollment(enrollmentData);
          }
        } else if (bancoData?.activity_id) {
          // Si no hay enrollment pero sí activity_id, obtener info de la actividad directamente
          const { data: activityData } = await supabase
            .from('activities')
            .select('id, title, image_url')
            .eq('id', bancoData.activity_id)
            .single();

          if (activityData) {
            setEnrollment({
              activity_id: activityData.id,
              activities: activityData
            });
          }
        }
      } catch (error) {
        console.error('Error obteniendo detalles del enrollment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [preferenceId, paymentId, router]);

  const handleGoToActivity = () => {
    // Limpiar sessionStorage si existe
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pending_payment');
    }
    
    if (enrollment?.activity_id) {
      router.push(`/activities/${enrollment.activity_id}`);
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
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                ¡Pago Exitoso!
              </h1>
              <p className="text-gray-400 mb-4">
                Tu pago ha sido procesado correctamente
              </p>
            </div>

            {enrollment && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-gray-800">
                <p className="text-sm text-gray-400 mb-2">Actividad adquirida:</p>
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

            <div className="space-y-3">
              <Button
                onClick={handleGoToActivity}
                className="w-full bg-[#FF7939] hover:bg-[#FF7939]/90 text-white"
                size="lg"
              >
                Ir a la Actividad
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-white/5"
              >
                Volver al Inicio
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
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

