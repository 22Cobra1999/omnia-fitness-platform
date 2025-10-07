"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { throttledLog } from '@/lib/log-throttler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Usar throttled logging para evitar spam de logs
    const errorKey = `error-boundary-${error.name}-${error.message.slice(0, 50)}`
    throttledLog.error(errorKey, '🚨 Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Aquí podrías enviar el error a un servicio como Sentry
      throttledLog.error('production-error', 'Production error logged', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1E1E1E] rounded-2xl p-8 text-center border border-gray-700">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              ¡Ups! Algo salió mal
            </h1>
            
            <p className="text-gray-400 mb-6 leading-relaxed">
              La aplicación encontró un error inesperado. No te preocupes, esto es temporal.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                  Detalles del error (desarrollo)
                </summary>
                <div className="bg-gray-800 rounded-lg p-3 text-xs text-red-400 font-mono overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full bg-[#FF7939] hover:bg-[#FF6B00] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Intentar de nuevo</span>
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800 py-3 rounded-xl flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Ir al inicio</span>
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Si el problema persiste, por favor contacta al soporte técnico.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para manejar errores en componentes funcionales
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: string) => {
    const errorKey = `use-error-handler-${error.name}-${error.message.slice(0, 30)}`
    throttledLog.error(errorKey, '🚨 Error capturado', {
      error: error.message,
      stack: error.stack,
      context: errorInfo
    })
    
    // Aquí podrías enviar el error a un servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      // Enviar a Sentry, LogRocket, etc.
      throttledLog.error('production-error-handler', 'Production error logged', {
        message: error.message,
        stack: error.stack,
        context: errorInfo
      })
    }
  }

  return { handleError }
}

// Componente wrapper para manejar errores asíncronos
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  const { handleError } = useErrorHandler()

  React.useEffect(() => {
    // Capturar errores no manejados
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      throttledLog.error('unhandled-rejection', '🚨 Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      })
      handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'Unhandled promise rejection'
      )
    }

    const handleGlobalError = (event: ErrorEvent) => {
      throttledLog.error('global-error', '🚨 Global error', {
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
      handleError(event.error || new Error(event.message), 'Global error')
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleGlobalError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleGlobalError)
    }
  }, [handleError])

  return <ErrorBoundary>{children}</ErrorBoundary>
}