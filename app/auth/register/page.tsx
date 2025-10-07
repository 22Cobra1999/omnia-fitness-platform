"use client"

import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = (searchParams.get("type") as "client" | "coach") || "client"

  const handleBackToHome = () => {
    router.push("/")
  }

  const handleRegisterSuccess = () => {
    router.push("/auth/login")
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#252525] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Botón de volver */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </motion.div>

          {/* Card del formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl border border-[#333]"
          >
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold bg-gradient-to-r from-[#FF7939] to-[#FFB56B] bg-clip-text text-transparent mb-2"
              >
                Crear Cuenta
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 text-sm"
              >
                Únete a la comunidad de OMNIA
              </motion.p>
            </div>

            <Tabs defaultValue={type} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#252525] border border-[#333]">
                <TabsTrigger 
                  value="client" 
                  asChild
                  className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white"
                >
                  <Link href="/auth/register?type=client">Cliente</Link>
                </TabsTrigger>
                <TabsTrigger 
                  value="coach" 
                  asChild
                  className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white"
                >
                  <Link href="/auth/register?type=coach">Coach</Link>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2 text-center mb-6"
                >
                  <h2 className="text-xl font-semibold text-white">Registro de Cliente</h2>
                  <p className="text-sm text-gray-400">Comienza tu viaje fitness hoy</p>
                </motion.div>
                <RegisterForm />
              </TabsContent>

              <TabsContent value="coach" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2 text-center mb-6"
                >
                  <h2 className="text-xl font-semibold text-white">Registro de Coach</h2>
                  <p className="text-sm text-gray-400">Comienza tu viaje como coach</p>
                </motion.div>
                <RegisterForm />
              </TabsContent>
            </Tabs>

            {/* Link para ir al login */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-6"
            >
              <Button
                variant="link"
                onClick={() => router.push("/auth/login")}
                className="text-sm text-gray-400 hover:text-[#FF7939] transition-colors duration-200"
              >
                ¿Ya tienes cuenta? Inicia sesión aquí
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AuthWrapper>
  )
}
