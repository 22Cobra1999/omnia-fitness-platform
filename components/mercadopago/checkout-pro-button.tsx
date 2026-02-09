'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import {
  createCheckoutProPreference,
  redirectToMercadoPagoCheckout,
  getCheckoutProErrorMessage
} from '@/lib/mercadopago/checkout-pro';
import { useToast } from '@/hooks/shared/use-toast';

interface CheckoutProButtonProps {
  /** ID de la actividad a comprar */
  activityId: string | number;
  /** Precio de la actividad (para mostrar) */
  price?: number;
  /** Texto del botón */
  buttonText?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Callback cuando se inicia el proceso de pago */
  onPaymentStart?: () => void;
  /** Callback cuando hay un error */
  onError?: (error: string) => void;
  /** Tamaño del botón */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Variante del botón */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/**
 * Componente de botón para iniciar el checkout de Mercado Pago Checkout Pro
 * 
 * Este componente maneja la creación de la preferencia de pago y la redirección
 * al checkout de Mercado Pago.
 * 
 * @example
 * ```tsx
 * <CheckoutProButton
 *   activityId={123}
 *   price={10000}
 *   buttonText="Pagar con Mercado Pago"
 *   onPaymentStart={() => console.log('Iniciando pago...')}
 * />
 * ```
 */
export function CheckoutProButton({
  activityId,
  price,
  buttonText = 'Pagar con Mercado Pago',
  className = '',
  onPaymentStart,
  onError,
  size = 'default',
  variant = 'default',
}: CheckoutProButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    onPaymentStart?.();

    try {
      // Crear preferencia de pago
      const response = await createCheckoutProPreference(activityId);

      if (response.success && response.initPoint) {
        // Redirigir al checkout de Mercado Pago
        redirectToMercadoPagoCheckout(
          response.initPoint,
          activityId,
          response.preferenceId
        );
      } else {
        throw new Error(response.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error en Checkout Pro:', error);

      const errorMessage = getCheckoutProErrorMessage(error);

      // Mostrar toast de error
      toast({
        title: 'Error al procesar el pago',
        description: errorMessage,
        variant: 'destructive',
      });

      // Llamar callback de error si existe
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {buttonText}
          {price && ` - $${price.toLocaleString('es-AR')}`}
        </>
      )}
    </Button>
  );
}

/**
 * Componente de botón con manejo de errores mejorado
 * Muestra un mensaje de error inline si falla
 */
export function CheckoutProButtonWithError({
  activityId,
  price,
  buttonText = 'Pagar con Mercado Pago',
  className = '',
  onPaymentStart,
  size = 'default',
  variant = 'default',
}: Omit<CheckoutProButtonProps, 'onError'>) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <CheckoutProButton
        activityId={activityId}
        price={price}
        buttonText={buttonText}
        className={className}
        onPaymentStart={() => {
          setError(null);
          onPaymentStart?.();
        }}
        onError={(errorMessage) => {
          setError(errorMessage);
        }}
        size={size}
        variant={variant}
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

