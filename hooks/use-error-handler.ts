'use client'

import { useEffect } from 'react'

export const useErrorHandler = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Mostrar notificación de error al usuario
      if (typeof window !== 'undefined') {
        showErrorNotification('Error de aplicación', 'Se produjo un error inesperado. Intenta recargar la página.')
      }
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      
      // Mostrar notificación de error al usuario
      if (typeof window !== 'undefined') {
        showErrorNotification('Error de aplicación', 'Se produjo un error inesperado. Intenta recargar la página.')
      }
    }

    const showErrorNotification = (title: string, message: string) => {
      // Crear notificación de error mejorada
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2a2a2a;
        color: white;
        padding: 20px;
        border-radius: 12px;
        border: 2px solid #FF6A00;
        border-left: 6px solid #FF6A00;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 400px;
        min-width: 300px;
        backdrop-filter: blur(10px);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">❌</span>
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #FF6A00;">${title}</h3>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            color: #999;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: color 0.2s ease;
          " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#999'">×</button>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #e5e5e5;">${message}</p>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="window.location.reload()" style="
            background: #FF6A00;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.backgroundColor='#FF5B39'; this.style.transform='translateY(-1px)'" onmouseout="this.style.backgroundColor='#FF6A00'; this.style.transform='translateY(0)'">🔄 Recargar</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: transparent;
            color: #999;
            border: 1px solid #444;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.backgroundColor='#444'; this.style.color='#fff'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#999'">Cerrar</button>
        </div>
      `
      
      document.body.appendChild(notification)
      
      // Animar entrada
      setTimeout(() => {
        notification.style.transform = 'translateX(0)'
        notification.style.opacity = '1'
      }, 10)
      
      // Auto-remover después de 15 segundos
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.transform = 'translateX(100%)'
          notification.style.opacity = '0'
          setTimeout(() => {
            if (notification.parentElement) {
              notification.remove()
            }
          }, 300)
        }
      }, 15000)
    }

    // Agregar listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])
}
