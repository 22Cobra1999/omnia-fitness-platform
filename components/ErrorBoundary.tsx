'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
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
              ⚠️
            </div>
            
            <h2 style={{
              color: '#FF6A00',
              marginBottom: '16px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              Algo salió mal
            </h2>
            
            <p style={{
              color: '#ccc',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              La aplicación encontró un error inesperado. Esto puede ser temporal.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleRefresh}
                style={{
                  backgroundColor: '#FF6A00',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
              
              <button
                onClick={() => this.setState({ hasError: false })}
                style={{
                  backgroundColor: 'transparent',
                  color: '#FF6A00',
                  border: '1px solid #FF6A00',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6A00'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#FF6A00'
                }}
              >
                Intentar de nuevo
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'left'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  color: '#FF6A00',
                  fontWeight: 'bold'
                }}>
                  Detalles del error (desarrollo)
                </summary>
                <pre style={{
                  marginTop: '12px',
                  color: '#ff6b6b',
                  fontSize: '12px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary




































