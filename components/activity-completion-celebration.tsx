"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Flame, Trophy, Star, ChevronRight } from "lucide-react"

interface ActivityCompletionCelebrationProps {
  isVisible: boolean
  activityName: string
  activityType: "fitness" | "nutrition"
  onContinue: () => void
  onClose: () => void
}

export function ActivityCompletionCelebration({
  isVisible,
  activityName,
  activityType,
  onContinue,
  onClose,
}: ActivityCompletionCelebrationProps) {
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowFireworks(true)
      const timer = setTimeout(() => setShowFireworks(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 text-white border-none max-w-md mx-auto">
        <div className="text-center py-8 relative overflow-hidden">
          {/* Animated background elements */}
          {showFireworks && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-ping"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + (i % 2) * 30}%`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                >
                  <Star className="h-4 w-4 text-yellow-300" />
                </div>
              ))}
            </div>
          )}

          {/* Main content */}
          <div className="relative z-10">
            <div className="mb-6">
              <div className="bg-white/20 rounded-full p-6 inline-block mb-4">
                <Flame className="h-16 w-16 text-white animate-bounce" />
              </div>
              <h2 className="text-3xl font-bold mb-2">¡Increíble!</h2>
              <p className="text-white/90 text-lg">Has completado</p>
            </div>

            <div className="bg-white/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-2">{activityName}</h3>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-300" />
                <span className="text-sm">
                  {activityType === "fitness" ? "Ejercicio completado" : "Comida registrada"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Cerrar
              </Button>
              <Button onClick={onContinue} className="flex-1 bg-white text-orange-500 hover:bg-white/90">
                Continuar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
