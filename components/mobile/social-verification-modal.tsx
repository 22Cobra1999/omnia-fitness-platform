"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  X, 
  Instagram, 
  MessageCircle, 
  Linkedin,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  Trash2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

type SocialPlatform = "instagram" | "whatsapp" | "linkedin"

interface SocialVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  platform: SocialPlatform
  currentValue?: string
  onSuccess: (platform: SocialPlatform, value: string) => void
}

export function SocialVerificationModal({ 
  isOpen, 
  onClose, 
  platform, 
  currentValue,
  onSuccess 
}: SocialVerificationModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"input" | "verification" | "success">("input")
  const [value, setValue] = useState(currentValue || "")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const platformConfig = {
    instagram: {
      title: "Conectar Instagram",
      placeholder: "@tuusuario",
      icon: Instagram,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20"
    },
    whatsapp: {
      title: "Verificar WhatsApp",
      placeholder: "+5491112345678",
      icon: MessageCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    linkedin: {
      title: "Conectar LinkedIn",
      placeholder: "https://linkedin.com/in/tuperfil",
      icon: Linkedin,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    }
  }

  const config = platformConfig[platform]
  const IconComponent = config.icon

  const handleSubmit = async () => {
    if (platform === "instagram") {
      // Flujo OAuth profesional para Instagram
      setIsLoading(true)
      
      try {
        const response = await fetch("/api/coach/connect-instagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "initiate_oauth" })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al iniciar autenticación")
        }

        if (data.simulated) {
          // Para desarrollo, mostrar modal simulado
          toast({
            title: "Modo Desarrollo",
            description: "Redirigiendo a Instagram (simulado)",
          })
          
          // Simular redirección
          setTimeout(() => {
            onSuccess(platform, "usuario_instagram_simulado")
            setStep("success")
          }, 2000)
        } else {
          // Redirección real a Instagram OAuth
          window.location.href = data.auth_url
        }

      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al conectar Instagram",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Flujo normal para WhatsApp y LinkedIn
    if (!value.trim()) {
      toast({
        title: "Error",
        description: `Por favor ingresa tu ${platform}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let response: Response

      if (platform === "whatsapp") {
        response = await fetch("/api/coach/verify-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            phone_number: value, 
            action: "send_code" 
          })
        })
      } else if (platform === "linkedin") {
        response = await fetch("/api/coach/connect-linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            linkedin_url: value, 
            action: "send_verification" 
          })
        })
      } else {
        throw new Error("Plataforma no soportada")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al conectar")
      }

      if (platform === "whatsapp") {
        setStep("verification")
        setCountdown(600) // 10 minutos
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else if (platform === "linkedin") {
        toast({
          title: "Verificación iniciada",
          description: `Agrega el código "${data.verification_code}" a tu perfil de LinkedIn y luego haz clic en "Verificar"`,
        })
        setStep("verification")
        setCountdown(1800) // 30 minutos
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }

    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al conectar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de verificación",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let response: Response

      if (platform === "whatsapp") {
        response = await fetch("/api/coach/verify-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            phone_number: value, 
            action: "verify_code",
            verification_code: verificationCode
          })
        })
      } else if (platform === "linkedin") {
        response = await fetch("/api/coach/connect-linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            linkedin_url: value, 
            action: "verify_profile"
          })
        })
      } else {
        throw new Error("Plataforma no soportada")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al verificar")
      }

      onSuccess(platform, value)
      setStep("success")
      toast({
        title: "¡Verificado!",
        description: `${platform === "whatsapp" ? "WhatsApp" : "LinkedIn"} verificado exitosamente`,
      })

    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al verificar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep("input")
    setValue(currentValue || "")
    setVerificationCode("")
    setCountdown(0)
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-[#1A1A1A] rounded-2xl w-full max-w-md border ${config.borderColor} max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${config.color}`} />
                </div>
                <h2 className="text-xl font-bold text-white">{config.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {step === "input" && (
                <>
                  {platform === "instagram" ? (
                    // Interfaz profesional para Instagram OAuth
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-4">
                          <Instagram className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Conectar con Instagram
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Conecta tu cuenta de Instagram de forma segura usando la autenticación oficial
                        </p>
                      </div>

                      <div className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-400">Autenticación segura</span>
                        </div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-blue-400">Solo lectura de perfil</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-purple-400">Verificación automática</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-4">
                          Al continuar, serás redirigido a Instagram para autorizar la conexión
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={handleClose}
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            <>
                              <Instagram className="h-4 w-4 mr-2" />
                              Conectar con Instagram
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Interfaz normal para WhatsApp y LinkedIn
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          {platform === "whatsapp" && "Número de WhatsApp"}
                          {platform === "linkedin" && "URL de LinkedIn"}
                        </label>
                        <Input
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={config.placeholder}
                          className="bg-[#2A2A2A] border-gray-600 text-white"
                        />
                      </div>
                      
                      {platform === "whatsapp" && (
                        <p className="text-sm text-gray-400">
                          Incluye el código de país (ej: +5491112345678)
                        </p>
                      )}
                      
                      {platform === "linkedin" && (
                        <p className="text-sm text-gray-400">
                          Debe ser un perfil personal o de empresa válido
                        </p>
                      )}

                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={handleClose}
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className={`flex-1 ${config.bgColor} ${config.color} border ${config.borderColor} hover:opacity-80`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            "Conectar"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === "verification" && (
                <>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`inline-flex p-3 rounded-full ${config.bgColor} mb-4`}>
                        <MessageCircle className={`h-8 w-8 ${config.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {platform === "whatsapp" && "Código enviado"}
                        {platform === "linkedin" && "Código generado"}
                      </h3>
                      <p className="text-gray-400 mb-4">
                        {platform === "whatsapp" && "Revisa tu WhatsApp para el código de verificación"}
                        {platform === "linkedin" && "Agrega el código a tu perfil de LinkedIn"}
                      </p>
                      
                      {countdown > 0 && (
                        <div className="text-sm text-orange-400 mb-4">
                          Expira en: {formatTime(countdown)}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Código de verificación
                      </label>
                      <Input
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="bg-[#2A2A2A] border-gray-600 text-white text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep("input")}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Atrás
                    </Button>
                    <Button
                      onClick={handleVerifyCode}
                      disabled={isLoading || countdown === 0}
                      className={`flex-1 ${config.bgColor} ${config.color} border ${config.borderColor} hover:opacity-80`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        "Verificar"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {step === "success" && (
                <>
                  <div className="text-center space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-green-500/10">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      ¡Conectado exitosamente!
                    </h3>
                    <p className="text-gray-400">
                      Tu {platform} ha sido verificado y conectado a tu perfil.
                    </p>
                  </div>

                  <Button
                    onClick={handleClose}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    Continuar
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
