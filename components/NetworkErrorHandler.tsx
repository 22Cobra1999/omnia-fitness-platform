'use client'

import { useEffect, useState } from 'react'

interface NetworkErrorHandlerProps {
  children: React.ReactNode
}

export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true)
  const [hasNetworkError, setHasNetworkError] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setHasNetworkError(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setHasNetworkError(true)
    }

    // Verificar estado inicial
    setIsOnline(navigator.onLine)

    // Agregar listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar conectividad cada 30 segundos
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        if (!response.ok) {
          setHasNetworkError(true)
        }
      } catch (error) {
        setHasNetworkError(true)
      }
    }

    const interval = setInterval(checkConnectivity, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!isOnline || hasNetworkError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #333',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            {!isOnline ? '📡' : '⚠️'}
          </div>
          
          <h2 style={{
            color: '#FF6A00',
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {!isOnline ? 'Sin conexión' : 'Error de red'}
          </h2>
          
          <p style={{
            color: '#ccc',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            {!isOnline 
              ? 'Verifica tu conexión a internet e intenta de nuevo.'
              : 'Hay un problema con la conexión al servidor. Intenta recargar la página.'
            }
          </p>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#FF6A00',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FF5B39'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6A00'
            }}
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default NetworkErrorHandler






























