"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

const phrases = [
  { text: "Your Personal Health", className: "text-4xl md:text-6xl font-light" },
  { text: "Revolution Starts", className: "text-4xl md:text-6xl font-semibold" },
  { text: "Where fitness meets social media", className: "text-xl md:text-3xl font-light" },
]

const features = [
  {
    title: "Web Dashboard",
    description: "Access your personalized fitness hub",
    image: "/web-dashboard.jpg",
  },
  {
    title: "Marketplace",
    description: "Shop premium fitness products and services",
    image: "/marketplace.jpg",
  },
  {
    title: "Social Feed",
    description: "Connect with a vibrant fitness community",
    image: "/social-feed.jpg",
  },
]

const trackers = [
  {
    title: "Nutrition Tracker",
    description: "Monitor your daily intake, track macros, and plan meals for optimal health.",
  },
  {
    title: "Fitness Tracker",
    description: "Log workouts, track progress, and analyze performance metrics over time.",
  },
  {
    title: "Gym Tracker",
    description: "Record weights, sets, and reps for strength training and muscle building.",
  },
]

const dynamicWords = [
  "Nutrition",
  "Fitness",
  "Training",
  "Swimming",
  "Cycling",
  "Yoga",
  "Strength",
  "Wellness",
  "Cardio",
  "Mindfulness",
  "Endurance",
  "Flexibility",
]

export function Hero() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [showAppPreview, setShowAppPreview] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  useEffect(() => {
    if (currentPhraseIndex < phrases.length - 1) {
      const timer = setTimeout(() => {
        setCurrentPhraseIndex(currentPhraseIndex + 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentPhraseIndex])

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % dynamicWords.length)
    }, 3000) // Change word every 3 seconds

    return () => clearInterval(wordInterval)
  }, [])

  const handleGetStarted = () => {
    setShowAppPreview(true)
  }

  return (
    <div className="relative min-h-screen bg-[#121212] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 50% 50%, rgba(255,184,0,0.15) 0%, rgba(255,121,57,0.1) 50%, rgba(0,0,0,0) 100%)",
              "radial-gradient(circle at 60% 40%, rgba(255,184,0,0.15) 0%, rgba(255,121,57,0.1) 50%, rgba(0,0,0,0) 100%)",
              "radial-gradient(circle at 40% 60%, rgba(255,184,0,0.15) 0%, rgba(255,121,57,0.1) 50%, rgba(0,0,0,0) 100%)",
              "radial-gradient(circle at 50% 50%, rgba(255,184,0,0.15) 0%, rgba(255,121,57,0.1) 50%, rgba(0,0,0,0) 100%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={{
                background: `radial-gradient(circle at ${50 + i * 20}% ${50 + i * 20}%, rgba(255,184,0,0.1) 0%, rgba(255,121,57,0.05) 30%, rgba(0,0,0,0) 70%)`,
              }}
              animate={{
                background: [
                  `radial-gradient(circle at ${50 + i * 20}% ${50 + i * 20}%, rgba(255,184,0,0.1) 0%, rgba(255,121,57,0.05) 30%, rgba(0,0,0,0) 70%)`,
                  `radial-gradient(circle at ${30 - i * 10}% ${70 + i * 10}%, rgba(255,184,0,0.1) 0%, rgba(255,121,57,0.05) 30%, rgba(0,0,0,0) 70%)`,
                  `radial-gradient(circle at ${70 + i * 10}% ${30 - i * 10}%, rgba(255,184,0,0.1) 0%, rgba(255,121,57,0.05) 30%, rgba(0,0,0,0) 70%)`,
                  `radial-gradient(circle at ${50 + i * 20}% ${50 + i * 20}%, rgba(255,184,0,0.1) 0%, rgba(255,121,57,0.05) 30%, rgba(0,0,0,0) 70%)`,
                ],
              }}
              transition={{
                duration: 15,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 2,
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {!showAppPreview ? (
          <motion.div
            key="landing"
            className="flex flex-col items-center justify-center min-h-screen relative z-10"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.h1
              className="text-6xl md:text-9xl font-bold mb-8 font-mitr"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                background: `linear-gradient(
                  45deg,
                  #FF7939 10%,
                  #FFB56B 20%,
                  #FF7939 30%,
                  #FFD700 40%,
                  #FF7939 50%,
                  #FFB56B 60%,
                  #FF7939 70%,
                  #FFD700 80%,
                  #FF7939 90%
                )`,
                backgroundSize: "200% auto",
                color: "transparent",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                textShadow: "0 0 20px rgba(255,121,57,0.5)",
              }}
            >
              OMNIA
            </motion.h1>
            <div className="h-32 mb-8 text-center">
              {phrases.map((phrase, index) => (
                <AnimatePresence key={phrase.text}>
                  {currentPhraseIndex >= index && (
                    <motion.div
                      className={`${phrase.className} font-mitr`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      {index === 1 ? (
                        <span>
                          {phrase.text} <span className="text-[#FF7939]">Here</span>
                        </span>
                      ) : (
                        phrase.text
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              className="mt-12"
            >
              <Button
                className="bg-[#FF7939] hover:bg-[#E66829] text-white px-10 py-6 text-2xl rounded-full shadow-[0_0_20px_rgba(255,121,57,0.3)] hover:shadow-[0_0_30px_rgba(255,121,57,0.5)] transition-all duration-300 font-mitr"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="app-preview"
            className="flex flex-col items-center justify-center min-h-screen relative z-10 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-3 text-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="font-mitr text-gradient-omnia">OMNIA</span> Experience
            </motion.h2>
            <div className="text-4xl font-light mb-6 text-center flex flex-wrap justify-center items-center">
              <span className="mr-2">Revolutionize Your</span>
              <div className="changing-word-container">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    className="text-orange-500 font-bold changing-word"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    {dynamicWords[currentWordIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
            <div className="w-full max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  className="relative overflow-hidden rounded-xl shadow-lg"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Image
                    src="/trackers.jpg"
                    alt="OMNIA Trackers"
                    width={600}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 flex flex-col justify-end">
                    <h3 className="text-2xl font-bold mb-2 text-white">Trackers</h3>
                    <p className="text-gray-200">Comprehensive tracking for your fitness journey</p>
                  </div>
                </motion.div>
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  {trackers.map((tracker, index) => (
                    <motion.div
                      key={tracker.title}
                      className="bg-[#1E1E1E] p-3 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    >
                      <h4 className="text-xl font-semibold mb-2 text-[#FF7939]">{tracker.title}</h4>
                      <p className="text-gray-300">{tracker.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="relative overflow-hidden rounded-xl shadow-lg h-[calc(100vh-24rem)]"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  >
                    <Image src={feature.image} alt={feature.title} layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 flex flex-col justify-end">
                      <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
                      <p className="text-gray-200">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              className="mt-8 space-y-4 text-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <h3 className="text-3xl font-bold mb-4">Elevate Your Fitness Journey</h3>
              <ul className="space-y-4 text-xl">
                <motion.li className="flex items-center justify-center space-x-2" whileHover={{ scale: 1.05 }}>
                  <CheckCircle className="text-[#FF7939]" />
                  <span>Connect with elite health professionals</span>
                </motion.li>
                <motion.li className="flex items-center justify-center space-x-2" whileHover={{ scale: 1.05 }}>
                  <CheckCircle className="text-[#FF7939]" />
                  <span>Access tailored, cutting-edge content</span>
                </motion.li>
                <motion.li className="flex items-center justify-center space-x-2" whileHover={{ scale: 1.05 }}>
                  <CheckCircle className="text-[#FF7939]" />
                  <span>Revolutionize your wellness trajectory</span>
                </motion.li>
              </ul>
              <div className="flex space-x-4 justify-center">
                <Link href="/auth/register?type=client">
                  <Button className="bg-[#FF7939] hover:bg-[#E66829] text-white px-6 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-mitr flex items-center">
                    Start Your Journey
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/register?type=coach">
                  <Button className="bg-transparent border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939] hover:text-white px-6 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-mitr flex items-center">
                    Start Coaching
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
