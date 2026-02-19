import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface Activity {
    id: number
    title: string
    price: number
    description?: string
    image_url?: string
    type?: string
    coach?: {
        id: string
        full_name: string
    }
    coach_id?: string
}

interface UsePurchaseActivityLogicProps {
    isOpen: boolean
    onClose: () => void
    activity: Activity | null
    onPurchaseComplete?: (enrollment: any) => void
    onTabChange?: (tab: string) => void
}

export function usePurchaseActivityLogic({
    isOpen,
    onClose,
    activity,
    onPurchaseComplete,
    onTabChange,
}: UsePurchaseActivityLogicProps) {
    const [paymentMethod, setPaymentMethod] = useState("mercadopago")
    const [notes, setNotes] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false)
    const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [transactionDetails, setTransactionDetails] = useState<{
        transactionId: string
        invoiceNumber: string
    } | null>(null)

    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (isOpen && activity) {
            console.log("Modal abierto para actividad:", activity)
            // Resetear estado cuando se abre el modal
            setIsComplete(false)
            setIsAlreadyEnrolled(false)
            setTransactionDetails(null)
            setNotes("")
            setPaymentMethod("mercadopago")
            setIsProcessing(false)
            setShowSuccessModal(false)

            // Verificar si el usuario ya está inscrito
            checkEnrollment()
        }
    }, [isOpen, activity])

    // Detectar si viene de Mercado Pago (success page)
    useEffect(() => {
        if (!isOpen) return;

        // Verificar parámetros de URL
        const preferenceId = searchParams?.get('preference_id')
        const paymentId = searchParams?.get('payment_id')
        const purchaseSuccess = searchParams?.get('purchase_success')
        const activityIdParam = searchParams?.get('activity_id')

        // Verificar sessionStorage también
        const showSuccess = typeof window !== 'undefined' && sessionStorage.getItem('show_purchase_success') === 'true';
        const storedActivityId = typeof window !== 'undefined' ? sessionStorage.getItem('last_purchase_activity_id') : null;
        const storedPreferenceId = typeof window !== 'undefined' ? sessionStorage.getItem('purchase_preference_id') : null;
        const storedPaymentId = typeof window !== 'undefined' ? sessionStorage.getItem('purchase_payment_id') : null;

        // Si hay indicadores de éxito de compra y el modal está abierto, mostrar modal de éxito
        if ((purchaseSuccess === 'true' || showSuccess) && (preferenceId || paymentId || storedPreferenceId || storedPaymentId)) {
            console.log('✅ Detectado retorno de Mercado Pago - mostrando modal de éxito')

            // Verificar que la actividad del modal coincida con la comprada
            const targetActivityId = activityIdParam || storedActivityId;
            if (!targetActivityId || (activity && String(activity.id) === String(targetActivityId))) {
                setShowSuccessModal(true)

                // Limpiar URL params y sessionStorage
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href)
                    url.searchParams.delete('purchase_success')
                    url.searchParams.delete('preference_id')
                    url.searchParams.delete('payment_id')
                    url.searchParams.delete('activity_id')
                    url.searchParams.delete('status')
                    window.history.replaceState({}, '', url.toString())

                    sessionStorage.removeItem('show_purchase_success')
                    sessionStorage.removeItem('last_purchase_activity_id')
                    sessionStorage.removeItem('purchase_preference_id')
                    sessionStorage.removeItem('purchase_payment_id')
                }
            }
        }
    }, [isOpen, searchParams, activity])

    const checkEnrollment = async () => {
        if (!activity) return

        setIsCheckingEnrollment(true)
        try {
            console.log("Verificando inscripción para actividad:", activity.id)

            const response = await fetch(`/api/check-enrollment?activityId=${activity.id}`)
            if (response.ok) {
                const data = await response.json()
                console.log("Resultado verificación:", data)

                // Permitir múltiples compras - solo informar si ya está inscrito
                if (data.isEnrolled) {
                    setIsAlreadyEnrolled(true)
                    toast({
                        title: "Ya tienes este producto",
                        description: "Ya has comprado esta actividad anteriormente. Puedes comprarla nuevamente si lo deseas.",
                        variant: "default",
                    })
                }
            }
        } catch (error) {
            console.error("Error al verificar inscripción:", error)
        } finally {
            setIsCheckingEnrollment(false)
        }
    }

    const handlePurchase = async () => {
        if (!activity) {
            console.error("No hay actividad seleccionada")
            return
        }

        setIsProcessing(true)
        console.log("Iniciando proceso de compra:", {
            activityId: activity.id,
            paymentMethod,
            notes,
        })

        try {
            toast({
                title: "Procesando compra",
                description: "Estamos procesando tu compra...",
            })

            const useMercadoPago = paymentMethod === 'mercadopago';

            if (useMercadoPago) {
                const { createCheckoutProPreference, redirectToMercadoPagoCheckout, getCheckoutProErrorMessage } = await import('@/lib/mercadopago/checkout-pro');

                try {
                    const response = await createCheckoutProPreference(activity.id);

                    if (response.success && response.initPoint) {
                        toast({
                            title: "Redirigiendo a Mercado Pago",
                            description: "Serás redirigido para completar el pago...",
                        });

                        redirectToMercadoPagoCheckout(
                            response.initPoint,
                            activity.id,
                            response.preferenceId
                        );
                        return;
                    } else {
                        throw new Error(response.error || 'Error desconocido');
                    }
                } catch (error: any) {
                    const errorMessage = getCheckoutProErrorMessage(error);
                    toast({
                        title: "Error al procesar el pago",
                        description: errorMessage,
                        variant: "destructive",
                    });
                    setIsProcessing(false);
                    return;
                }
            }

            const response = await fetch("/api/enrollments/direct", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    activityId: activity.id,
                    paymentMethod: paymentMethod,
                    notes: notes || "Compra desde la aplicación móvil",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text()
                let errorMessage = "No se pudo procesar la compra"
                try {
                    const errorData = JSON.parse(errorText)
                    errorMessage = errorData.error || errorMessage
                } catch (e) {
                    errorMessage = errorText.substring(0, 100)
                }
                throw new Error(errorMessage)
            }

            const result = await response.json()
            if (result.success) {
                setIsComplete(true)
                setTransactionDetails({
                    transactionId: result.transactionId || `TRX-${Date.now()}`,
                    invoiceNumber: result.invoiceNumber || `INV-${Date.now()}`,
                })

                toast({
                    title: "¡Compra exitosa!",
                    description: `Has adquirido "${activity.title}" correctamente.`,
                    variant: "default",
                })

                if (onPurchaseComplete && result.enrollmentId) {
                    onPurchaseComplete(result.enrollmentId)
                }

                setTimeout(() => {
                    try {
                        localStorage.setItem("return_to_activities", "true")
                        localStorage.setItem("purchased_activity_id", activity.id.toString())
                    } catch (e) {
                        console.error("Error al guardar en localStorage:", e)
                    }
                    onClose()
                    router.push(`/activities/${activity.id}`)
                }, 2000)
            } else {
                throw new Error(result.error || "Error desconocido en la compra")
            }
        } catch (error) {
            console.error("Error al procesar la compra:", error)
            const errorMessage = error instanceof Error ? error.message : "Error desconocido"

            if (errorMessage.includes("coach no ha configurado") || errorMessage.includes("requiresCoachSetup")) {
                toast({
                    title: "Coach no configurado",
                    description: "El coach no ha configurado Mercado Pago. Por favor, contacta al coach.",
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Error en la compra",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClose = () => {
        if (!isProcessing) {
            onClose()
        }
    }

    const handleGoToActivity = () => {
        if (activity) {
            if (typeof window !== 'undefined') {
                localStorage.setItem("openActivityId", activity.id.toString())
            }
            onClose()
            if (onTabChange) {
                onTabChange('activity');
            } else {
                router.push(`/`);
            }
        }
    }

    return {
        paymentMethod,
        setPaymentMethod,
        notes,
        setNotes,
        isProcessing,
        isComplete,
        isCheckingEnrollment,
        isAlreadyEnrolled,
        setIsAlreadyEnrolled,
        showSuccessModal,
        setShowSuccessModal,
        transactionDetails,
        searchParams,
        handlePurchase,
        handleClose,
        handleGoToActivity,
    }
}
