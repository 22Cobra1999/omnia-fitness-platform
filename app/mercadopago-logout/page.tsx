'use client';

import { useEffect, useState } from 'react';

/**
 * Página intermedia que aísla la sesión de Mercado Pago usando un iframe con sandbox
 * Esto intenta crear una sesión independiente sin cookies compartidas
 */
export default function MercadoPagoLogoutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authUrl = params.get('auth_url');
    
    if (!authUrl) {
      console.error('No se proporcionó auth_url');
      setError('URL de autorización no proporcionada');
      setLoading(false);
      return;
    }

    // Intentar abrir la autorización en un iframe con sandbox para aislar cookies
    // Si esto no funciona, redirigir directamente
    const openIsolatedAuth = () => {
      try {
        // Crear un iframe con sandbox que aísle las cookies
        // El sandbox permite scripts pero aísla el contexto
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.zIndex = '9999';
        iframe.style.backgroundColor = 'white';
        
        // Intentar usar sandbox para aislar cookies (puede no funcionar en todos los navegadores)
        // Si el navegador no soporta sandbox o bloquea el iframe, redirigir directamente
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation');
        iframe.src = decodeURIComponent(authUrl);
        
        // Intentar agregar el iframe
        document.body.appendChild(iframe);
        
        // Monitorear si el iframe carga correctamente
        iframe.onload = () => {
          setLoading(false);
        };
        
        iframe.onerror = () => {
          // Si el iframe falla, redirigir directamente
          document.body.removeChild(iframe);
          window.location.href = decodeURIComponent(authUrl);
        };
        
        // Timeout: si después de 3 segundos no carga, redirigir directamente
        setTimeout(() => {
          if (loading) {
            if (iframe.parentNode) {
              document.body.removeChild(iframe);
            }
            window.location.href = decodeURIComponent(authUrl);
          }
        }, 3000);
        
      } catch (error) {
        console.error('Error al crear iframe aislado:', error);
        // Si hay error, redirigir directamente
        window.location.href = decodeURIComponent(authUrl);
      }
    };

    openIsolatedAuth();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-[#FF7939] text-white rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center space-y-4">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7939] mx-auto"></div>
            <p className="text-white text-sm">Preparando conexión con Mercado Pago...</p>
            <p className="text-gray-400 text-xs">Por favor espera</p>
          </>
        )}
      </div>
    </div>
  );
}

