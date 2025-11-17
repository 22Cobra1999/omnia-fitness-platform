"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Infinity, Sun, Wheat } from "lucide-react"

export function SubscriptionTiers() {
  const tiers = [
    {
      name: "Omnia Essentia",
      tagline: "The Foundation of Your Journey",
      description:
        "Begin your path with essential tools designed for newcomers seeking core functionality and simplicity.",
      price: "$9.99",
      features: [
        "Access to basic workout library",
        "Simple progress tracking",
        "Community forum access",
        "Basic nutrition guidelines",
        "Limited customization options",
        "Standard support",
      ],
      colors: {
        primary: "#8B7355", // Earthy brown
        secondary: "#556B2F", // Olive green
        accent: "#D2B48C", // Tan
        text: "#2F4F4F", // Dark slate
      },
      icon: Wheat,
      pitch:
        "Perfect for those beginning their fitness journey. Omnia Essentia provides the fundamental tools you need to establish healthy habits without overwhelming complexity.",
      typography: {
        fontFamily: "Serif",
        weight: "Regular",
      },
      buttonStyle: "outline",
    },
    {
      name: "Omnia Lumen",
      tagline: "Illuminate Your Potential",
      description:
        "Elevate your experience with advanced features, personalized guidance, and priority access to exclusive content.",
      price: "$19.99",
      features: [
        "All Essentia features",
        "Advanced workout customization",
        "Detailed analytics and insights",
        "Personalized nutrition plans",
        "Priority customer support",
        "Exclusive educational content",
        "Goal-specific training programs",
        "Progress sharing capabilities",
      ],
      colors: {
        primary: "#FFD700", // Gold
        secondary: "#FFFFE0", // Light yellow
        accent: "#FFA500", // Orange
        text: "#8B4513", // Saddle brown
      },
      icon: Sun,
      pitch:
        "Designed for dedicated fitness enthusiasts ready to take their journey to the next level. Omnia Lumen illuminates your path with personalized guidance and advanced tools for optimal results.",
      typography: {
        fontFamily: "Sans-serif",
        weight: "Medium",
      },
      buttonStyle: "default",
      highlighted: true,
    },
    {
      name: "Omnia Infinitum",
      tagline: "Limitless Possibilities Await",
      description:
        "Experience the ultimate in personalization, exclusivity, and support with our premium tier designed for those who accept no limits.",
      price: "$29.99",
      features: [
        "All Lumen features",
        "Unlimited workout customization",
        "AI-powered recommendations",
        "VIP early access to new features",
        "Dedicated personal coach",
        "Exclusive VIP events and webinars",
        "Premium content library",
        "Advanced performance analytics",
        "Custom meal planning",
        "Priority scheduling",
      ],
      colors: {
        primary: "#663399", // Rebecca Purple
        secondary: "#C0C0C0", // Silver
        accent: "#301934", // Dark purple
        text: "#E6E6FA", // Lavender
      },
      icon: Infinity,
      pitch:
        "For the elite fitness enthusiast who demands the absolute best. Omnia Infinitum removes all boundaries, offering unlimited resources and personalized support to achieve extraordinary results.",
      typography: {
        fontFamily: "Sans-serif",
        weight: "Bold",
      },
      buttonStyle: "default",
    },
  ]

  return (
    <div className="py-24 bg-gradient-to-b from-[#1E1E1E] to-[#121212]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF7939] to-[#FFD700]">
            Choose Your Omnia Experience
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Select the tier that aligns with your ambitions and unlock your full potential
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative overflow-hidden border-none transition-transform duration-300 hover:-translate-y-2 ${
                tier.highlighted ? "shadow-[0_0_30px_rgba(255,215,0,0.3)]" : "shadow-xl"
              }`}
              style={{
                background: `linear-gradient(135deg, ${tier.colors.primary}22 0%, ${tier.colors.secondary}22 100%)`,
              }}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[#FF7939] text-white text-xs font-bold px-3 py-1 transform rotate-45 translate-x-[30%] translate-y-[90%] shadow-md">
                    POPULAR
                  </div>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-center mb-4">
                  <div
                    className="p-3 rounded-full"
                    style={{
                      backgroundColor: `${tier.colors.primary}33`,
                      color: tier.colors.primary,
                    }}
                  >
                    <tier.icon className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center" style={{ color: tier.colors.primary }}>
                  {tier.name}
                </CardTitle>
                <div className="text-center mt-1 font-medium text-gray-400">{tier.tagline}</div>
                <div className="text-3xl font-bold text-center mt-4" style={{ color: tier.colors.primary }}>
                  {tier.price}
                  <span className="text-sm text-gray-400">/month</span>
                </div>
              </CardHeader>

              <CardContent>
                <CardDescription className="text-gray-400 text-center mb-6">{tier.description}</CardDescription>

                <div className="space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: tier.colors.primary }} />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-8 p-4 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${tier.colors.primary}15`,
                    borderLeft: `3px solid ${tier.colors.primary}`,
                  }}
                >
                  <p className="text-gray-300">{tier.pitch}</p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.buttonStyle === "outline" ? "outline" : "default"}
                  style={
                    tier.buttonStyle === "outline"
                      ? {
                          borderColor: tier.colors.primary,
                          color: tier.colors.primary,
                        }
                      : {
                          backgroundColor: tier.colors.primary,
                          color: tier.colors.secondary,
                        }
                  }
                >
                  Choose {tier.name.split(" ")[1]}
                </Button>
              </CardFooter>

              <div className="px-6 pb-6 text-xs text-gray-500">
                <p className="text-center">
                  Typography: {tier.typography.fontFamily}, {tier.typography.weight}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tier.colors.primary }}></div>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tier.colors.secondary }}></div>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tier.colors.accent }}></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
