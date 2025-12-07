'use client';

import { useEffect } from 'react';

/**
 * Página intermedia que fuerza logout de Mercado Pago antes de autorizar
 * Esta página se abre en un popup y limpia la sesión antes de redirigir a autorización
 */
export default function MercadoPagoLogoutPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authUrl = params.get('auth_url');
    
    if (!authUrl) {
      console.error('No se proporcionó auth_url');
      window.close();
      return;
    }

    // Intentar múltiples métodos para limpiar la sesión de Mercado Pago
    const clearMercadoPagoSession = async () => {
      try {
        // Método 1: Intentar abrir logout en un iframe oculto
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = 'https://www.mercadopago.com.ar/logout';
        document.body.appendChild(iframe);
        
        // Método 2: Intentar limpiar cookies de Mercado Pago (si es posible)
        // Nota: Esto solo funciona para cookies del mismo dominio, pero lo intentamos
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('mercadopago') || name.includes('mp_')) {
            // Intentar eliminar cookie estableciendo fecha de expiración en el pasado
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.mercadopago.com.ar`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.mercadopago.com`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
        
        // Esperar un momento para que el logout se procese
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Remover iframe
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        
        // Redirigir a la URL de autorización
        window.location.href = decodeURIComponent(authUrl);
      } catch (error) {
        console.error('Error al limpiar sesión:', error);
        // Si hay error, simplemente redirigir a autorización
        window.location.href = decodeURIComponent(authUrl);
      }
    };

    clearMercadoPagoSession();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7939] mx-auto"></div>
        <p className="text-white text-sm">Preparando conexión con Mercado Pago...</p>
        <p className="text-gray-400 text-xs">Por favor espera</p>
      </div>
    </div>
  );
}

