'use client'

import { useState, useEffect } from 'react'

interface ErrorNotificationProps {
  title: string
  message: string
  type?: 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
  showRefresh?: boolean
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  title,
  message,
  type = 'error',
  duration = 10000,
  onClose,
  showRefresh = true
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Esperar a que termine la animación
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          borderColor: '#f59e0b',
          icon: '⚠️',
          bgColor: '#451a03',
          textColor: '#fbbf24'
        }
      case 'info':
        return {
          borderColor: '#3b82f6',
          icon: 'ℹ️',
          bgColor: '#1e3a8a',
          textColor: '#60a5fa'
        }
      default: // error
        return {
          borderColor: '#FF6A00',
          icon: '❌',
          bgColor: '#2a1a0a',
          textColor: '#FF6A00'
        }
    }
  }

  const styles = getTypeStyles()

  if (!isVisible) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#2a2a2a',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        border: `2px solid ${styles.borderColor}`,
        borderLeft: `6px solid ${styles.borderColor}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        maxWidth: '400px',
        minWidth: '300px',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>{styles.icon}</span>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 'bold',
            color: styles.textColor
          }}>
            {title}
          </h3>
        </div>
        
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#fff'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#999'
          }}
        >
          ×
        </button>
      </div>

      {/* Message */}
      <p style={{
        margin: '0 0 16px 0',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#e5e5e5'
      }}>
        {message}
      </p>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: styles.borderColor,
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = styles.textColor
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = styles.borderColor
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            🔄 Recargar
          </button>
        )}
        
        <button
          onClick={handleClose}
          style={{
            backgroundColor: 'transparent',
            color: '#999',
            border: '1px solid #444',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#444'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#999'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default ErrorNotification





































