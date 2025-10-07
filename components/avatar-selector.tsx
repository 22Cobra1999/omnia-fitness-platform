"use client"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

const avatars = [
  {
    id: 1,
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6pVEQL6r47swgI8T6dOYYduz8lnxNb.png",
    style: "casual-1",
  },
  {
    id: 2,
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Nc5vI7i23KVrL4BCKItKA5UrvBGobS.png",
    style: "casual-2",
  },
]

interface AvatarSelectorProps {
  selectedAvatar: number
  onSelect: (id: number) => void
}

export function AvatarSelector({ selectedAvatar, onSelect }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {avatars.map((avatar) => (
        <motion.div key={avatar.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Card
            className={`relative cursor-pointer overflow-hidden border-2 transition-colors ${
              selectedAvatar === avatar.id ? "border-[#FF7939]" : "border-transparent hover:border-[#FF7939]/50"
            }`}
            onClick={() => onSelect(avatar.id)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-[3/4]">
                <img
                  src={avatar.src || "/placeholder.svg"}
                  alt={`Avatar style ${avatar.style}`}
                  className="w-full h-full object-cover"
                />
                {selectedAvatar === avatar.id && (
                  <div className="absolute top-2 right-2 bg-[#FF7939] rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
