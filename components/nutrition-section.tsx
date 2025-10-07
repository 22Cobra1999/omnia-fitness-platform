"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GeometricBackground } from "@/components/geometric-background"
import { Utensils, Apple } from "lucide-react"
import Image from "next/image"

const nutritionStats = [
  { label: "Calories", current: 1850, target: 2200 },
  { label: "Protein", current: 120, target: 150 },
  { label: "Carbs", current: 200, target: 250 },
  { label: "Fats", current: 65, target: 80 },
]

const mealPlan = [
  {
    title: "Breakfast",
    image: "/meal-breakfast.jpg",
    calories: 450,
    protein: 25,
  },
  {
    title: "Lunch",
    image: "/meal-lunch.jpg",
    calories: 650,
    protein: 35,
  },
  {
    title: "Dinner",
    image: "/meal-dinner.jpg",
    calories: 550,
    protein: 30,
  },
]

export function NutritionSection() {
  return (
    <section className="relative bg-[#121212] text-white py-12">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nutrition Stats */}
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-6 w-6 text-[#FF7939]" />
                Daily Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nutritionStats.map((stat, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">{stat.label}</span>
                      <span className="text-[#FF7939]">
                        {stat.current} / {stat.target}
                      </span>
                    </div>
                    <Progress value={(stat.current / stat.target) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meal Plan */}
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-6 w-6 text-[#FF7939]" />
                Today's Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mealPlan.map((meal, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={meal.image}
                        alt={meal.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-semibold">{meal.title}</h3>
                        <p className="text-sm text-gray-300">
                          {meal.calories} cal • {meal.protein}g protein
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
