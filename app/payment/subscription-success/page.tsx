'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/supabase-client';

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);

  const preApprovalId = searchParams.get('preapproval_id');
  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        setLoading(true);

        // Si no hay preapproval_id, verificar por payment_id
        if (!preApprovalId && paymentId) {
          // Intentar obtener la suscripción desde el webhook o directamente
          console.log('Verificando suscripción por payment_id:', paymentId);
        }

        if (preApprovalId) {
          console.log('Verificando suscripción:', preApprovalId);

          const supabase = createClient();
          
          // Obtener el usuario actual
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            setError('No estás autenticado');
            setLoading(false);
            return;
          }

          // Buscar el plan asociado a esta suscripción
          const { data: planData, error: planError } = await supabase
            .from('planes_uso_coach')
            .select('*')
            .eq('mercadopago_subscription_id', preApprovalId)
            .eq('coach_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (planError) {
            console.error('Error obteniendo plan:', planError);
            setError('Error al verificar tu suscripción. Por favor, contacta con soporte.');
            setLoading(false);
            return;
          }

          if (planData) {
            setPlan(planData);
            setSuccess(true);
          } else {
            // Si no encontramos el plan, puede que el webhook aún no lo haya procesado
            // Esperar un poco y reintentar
            setTimeout(async () => {
              const { data: retryPlan } = await supabase
                .from('planes_uso_coach')
                .select('*')
                .eq('mercadopago_subscription_id', preApprovalId)
                .eq('coach_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (retryPlan) {
                setPlan(retryPlan);
                setSuccess(true);
              } else {
                setError('Suscripción no encontrada. El webhook puede estar procesando el pago. Por favor, espera unos minutos y verifica tu plan.');
              }
              setLoading(false);
            }, 3000);
            return;
          }
        } else if (status) {
          // Si solo hay status, verificar si es exitoso
          if (status === 'approved' || status === 'authorized') {
            setSuccess(true);
          } else {
            setError(`Estado del pago: ${status}`);
          }
        } else {
          setError('No se recibieron parámetros de confirmación');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error verificando suscripción:', error);
        setError('Error al verificar tu suscripción. Por favor, contacta con soporte.');
        setLoading(false);
      }
    };

    verifySubscription();
  }, [preApprovalId, paymentId, status]);

  const handleGoToProfile = () => {
    router.push('/?tab=profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1C1F] rounded-2xl p-8 shadow-xl border border-gray-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#FF7939] mb-4" />
            <p className="text-gray-400">Verificando suscripción...</p>
          </div>
        ) : error ? (
          <>
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Error al verificar suscripción
              </h2>
              <p className="text-gray-400 text-center mb-6">{error}</p>
              <Button
                onClick={handleGoToProfile}
                className="w-full bg-[#FF7939] hover:bg-[#FF8C42] text-white"
              >
                Ir a Mi Perfil
              </Button>
            </div>
          </>
        ) : success ? (
          <>
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                ¡Suscripción activada exitosamente!
              </h2>
              {plan && (
                <div className="w-full mt-4 p-4 bg-[#0A0A0A] rounded-lg border border-gray-800">
                  <p className="text-sm text-gray-400 mb-1">Plan activo</p>
                  <p className="text-lg font-bold text-white capitalize">{plan.plan_type}</p>
                  {plan.storage_limit_gb && (
                    <p className="text-sm text-gray-400 mt-2">
                      Almacenamiento: {plan.storage_limit_gb} GB
                    </p>
                  )}
                </div>
              )}
              <p className="text-gray-400 text-center mt-6 mb-6">
                Tu suscripción ha sido activada y se renovará automáticamente cada mes.
              </p>
              <Button
                onClick={handleGoToProfile}
                className="w-full bg-[#FF7939] hover:bg-[#FF8C42] text-white"
              >
                Ir a Mi Perfil
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-400">Procesando información...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1C1F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF7939]" />
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

