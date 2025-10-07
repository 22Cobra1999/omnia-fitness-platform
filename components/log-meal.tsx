"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Barcode } from "lucide-react"

interface Food {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function LogMeal({ addMeal }: { addMeal: (meal: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [manualFood, setManualFood] = useState<Food>({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 })

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food)
    setShowManualAdd(false)
    setSearchTerm(food.name)
  }

  const handleManualFoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setManualFood((prev) => ({ ...prev, [name]: Number.parseInt(value) || 0 }))
  }

  const handleManualAdd = () => {
    if (manualFood.name.trim()) {
      handleFoodSelect(manualFood)
      setShowManualAdd(false)
      addMeal(manualFood.name)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search for a food..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button
          onClick={() => {
            /* Implement barcode scanning */
          }}
        >
          <Barcode className="w-4 h-4 mr-2" />
          Scan
        </Button>
      </div>

      {searchTerm.length > 2 && showManualAdd && (
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Add Food Manually</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Food name"
              name="name"
              value={manualFood.name}
              onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Calories"
              name="calories"
              value={manualFood.calories}
              onChange={handleManualFoodChange}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Protein"
              name="protein"
              value={manualFood.protein}
              onChange={handleManualFoodChange}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Carbs"
              name="carbs"
              value={manualFood.carbs}
              onChange={handleManualFoodChange}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Fat"
              name="fat"
              value={manualFood.fat}
              onChange={handleManualFoodChange}
              className="mb-2"
            />
            <Button onClick={handleManualAdd} className="w-full">
              Add Food
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedFood && (
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Nutritional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Calories: {selectedFood.calories}</p>
            <p>Protein: {selectedFood.protein}g</p>
            <p>Carbs: {selectedFood.carbs}g</p>
            <p>Fat: {selectedFood.fat}g</p>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" onClick={() => selectedFood && addMeal(selectedFood.name)}>
        Log Meal
      </Button>
    </div>
  )
}
