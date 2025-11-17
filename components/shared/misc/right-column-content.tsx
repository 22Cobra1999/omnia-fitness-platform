"use client"

import { ExpertsPanel } from '@/components/shared/misc/experts-panel'
import { InformationPanel } from '@/components/shared/misc/information-panel'
import { GuidePanel } from '@/components/shared/misc/guide-panel'
import { Dumbbell, Zap, Beef, Apple, Activity, Dna } from "lucide-react"
import { motion } from "framer-motion"

const contentData = {
  gym: [
    {
      title: "Build It",
      description: "Combine methods from different instructors for a comprehensive workout.",
      cta: "Start Customizing",
      icon: Dumbbell,
    },
    {
      title: "Strength Training",
      description: "Focus on compound exercises like squats and deadlifts for overall strength.",
      cta: "Learn More",
      icon: Dumbbell,
    },
    {
      title: "Fat Burning",
      description: "Incorporate HIIT and cardio for effective weight loss.",
      cta: "View Workouts",
      icon: Zap,
    },
  ],
  nutrition: [
    {
      title: "Build It",
      description: "Customized nutrition planning and personal goal setting.",
      cta: "Start Planning",
      icon: Apple,
    },
    {
      title: "Energy Boost",
      description: "Focus on performance nutrition and natural energy optimization.",
      cta: "Boost Energy",
      icon: Zap,
    },
    {
      title: "Muscle Gain",
      description: "Protein-focused nutrition and meal timing strategies.",
      cta: "Gain Muscle",
      icon: Beef,
    },
  ],
  fitness: [
    {
      title: "Mind & Body",
      description: "Develop self-awareness and a balanced movement approach.",
      cta: "Start Journey",
      icon: Dna,
    },
    {
      title: "Cardio Focus",
      description: "Progressive cardio routines for endurance building.",
      cta: "Start Cardio",
      icon: Activity,
    },
    {
      title: "Flexibility",
      description: "Dynamic stretching and mobility work.",
      cta: "Get Flexible",
      icon: Activity,
    },
  ],
}

export function RightColumnContent({ tab }: { tab: "gym" | "nutrition" | "fitness" }) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { when: "afterChildren" },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  }

  return (
    <div className="space-y-8 pt-8">
      <motion.div
        key="overview"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <ExpertsPanel category={tab} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <InformationPanel category={tab} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GuidePanel category={tab} />
        </motion.div>
      </motion.div>
    </div>
  )
}
