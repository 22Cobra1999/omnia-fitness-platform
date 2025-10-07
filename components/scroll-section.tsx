"use client"

import type React from "react"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

interface ScrollSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollSection({ children, className = "", delay = 0 }: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [100, 0, 0, 100])

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 100 }}
      style={{ opacity, y }}
      transition={{
        duration: 1,
        delay,
        ease: [0.17, 0.55, 0.55, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
