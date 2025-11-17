"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { startActivity } from "@/app/actions/start-activity"
import { useToast } from '@/hooks/shared/use-toast'
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase/supabase-client'

interface StartActivityButtonProps {
  activityId: number
  hasStarted?: boolean
  startDate?: string | null
}

export function StartActivityButton({ activityId, hasStarted: propHasStarted, startDate: propStartDate }: StartActivityButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [hasStarted, setHasStarted] = useState(propHasStarted || false)
  const [startDate, setStartDate] = useState<string | null>(propStartDate || null)
  const [loading, setLoading] = useState(true)
  const [showStartOptions, setShowStartOptions] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Función para obtener el próximo lunes
  const getNextMonday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday
  }
  
  // Verificar si hoy es un día recomendado para empezar (lunes)
  const isRecommendedStartDay = () => {
    const today = new Date()
    return today.getDay() === 1 // Lunes
  }

  // Verificar estado del enrollment
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        const { data: enrollment } = await supabase
          .from("activity_enrollments")
          .select("start_date")
          .eq("activity_id", activityId)
          .eq("client_id", user.id)
          .maybeSingle()

        setHasStarted(!!enrollment?.start_date)
        setStartDate(enrollment?.start_date || null)
      } catch (error) {
        console.error("Error checking enrollment status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkEnrollmentStatus()
  }, [activityId])

  const handleStartActivity = async (startToday = true) => {
    setIsPending(true)
    const result = await startActivity(activityId)
    setIsPending(false)

    if (result.success) {
      setHasStarted(true)
      setStartDate(new Date().toISOString())
      toast({
        title: "¡Éxito!",
        description: result.message,
        variant: "default",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }
  
  const handleStartToday = () => {
    setShowStartOptions(false)
    handleStartActivity(true)
  }
  
  const handleWaitForMonday = () => {
    setShowStartOptions(false)
    // Aquí podrías implementar una lógica para programar el inicio para el próximo lunes
    // Por ahora, solo cerramos el modal
    toast({
      title: "Programa programado",
      description: "Te recordaremos cuando llegue el momento de comenzar.",
      variant: "default",
    })
  }

  if (loading) {
    return (
      <Button disabled className="w-full bg-gray-400 text-white">
        Cargando...
      </Button>
    )
  }

  if (hasStarted) {
    return null; // No mostrar nada cuando el programa ya está iniciado
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <AlertDialog>
      <AlertDialogTrigger asChild>
        <button 
          className="w-full"
          disabled={isPending}
          style={{
            background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C42 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 24px',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(255, 106, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            opacity: isPending ? 0.7 : 1,
            transform: isPending ? 'scale(0.98)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 106, 0, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 106, 0, 0.3)';
            }
          }}
        >
          {isPending ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid #FFFFFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Iniciando...
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                ▶
              </div>
              Empezar Actividad
            </div>
          )}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent 
        style={{
          background: 'rgba(15, 16, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 106, 0, 0.2)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <AlertDialogHeader style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C42 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px'
          }}>
            🚀
          </div>
          <AlertDialogTitle style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            marginBottom: '8px'
          }}>
            {isRecommendedStartDay() ? '¿Estás listo para comenzar?' : '¿Cuándo quieres empezar?'}
          </AlertDialogTitle>
          <AlertDialogDescription style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {isRecommendedStartDay() ? (
              <>
                ¡Perfecto! Hoy es <strong style={{ color: '#FF6A00' }}>lunes</strong>, el día ideal para comenzar tu programa.
                <br /><br />
                Esto marcará <strong style={{ color: '#FF6A00' }}>hoy</strong> como el <strong style={{ color: '#FF6A00' }}>Día 1</strong> de tu programa.
                <br /><br />
                Una vez iniciado, no podrás cambiar esta fecha.
              </>
            ) : (
              <>
                El programa está diseñado para empezar los <strong style={{ color: '#FF6A00' }}>lunes</strong>.
                <br /><br />
                Puedes empezar <strong style={{ color: '#FF6A00' }}>hoy</strong> y perder el primer día, o esperar al próximo lunes ({getNextMonday().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}).
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          marginTop: '24px',
          flexDirection: isRecommendedStartDay() ? 'row' : 'column'
        }}>
          <AlertDialogCancel 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Cancelar
          </AlertDialogCancel>
          
          {isRecommendedStartDay() ? (
            <AlertDialogAction 
              onClick={handleStartActivity} 
              disabled={isPending}
              style={{
                background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C42 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '120px',
                opacity: isPending ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(255, 106, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isPending) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 106, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 106, 0, 0.3)';
                }
              }}
            >
              {isPending ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Confirmando...
                </div>
              ) : (
                'Comenzar Ahora'
              )}
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogAction 
                onClick={handleStartToday} 
                disabled={isPending}
                style={{
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C42 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '140px',
                  opacity: isPending ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(255, 106, 0, 0.3)',
                  marginBottom: '8px'
                }}
              >
                Empezar Hoy (Perder Día 1)
              </AlertDialogAction>
              
              <AlertDialogAction 
                onClick={handleWaitForMonday} 
                disabled={isPending}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '140px',
                  opacity: isPending ? 0.7 : 1
                }}
              >
                Esperar al Lunes
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
