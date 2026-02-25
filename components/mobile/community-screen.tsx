"use client"

import React from "react"
import { OmniaShowcase } from "@/components/shared/community/OmniaShowcase"
import { MotionValue } from "framer-motion"

interface CommunityScreenProps {
  scrollY?: MotionValue<number>
}

export function CommunityScreen({ scrollY }: CommunityScreenProps) {
  return (
    <div className="min-h-screen bg-black">
      <OmniaShowcase scrollY={scrollY} />
    </div>
  )
}
