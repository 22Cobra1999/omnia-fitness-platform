"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const suggestedSnacks = [
  { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.4 },
  { name: "Almonds (1oz)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Carrot Sticks", calories: 52, protein: 1.2, carbs: 12, fat: 0.3 },
  { name: "Protein Bar", calories: 200, protein: 20, carbs: 25, fat: 8 },
]

export function AddSnack() {
  const [selectedSnack, setSelectedSnack] = useState<(typeof suggestedSnacks)[0] | null>(null)

  return (
    <div className="space-y-4">
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle>Suggested Snacks</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {suggestedSnacks.map((snack, index) => (
              <Button
                key={index}
                variant={selectedSnack === snack ? "default" : "outline"}
                className="w-full mb-2 justify-between"
                onClick={() => setSelectedSnack(snack)}
              >
                <span>{snack.name}</span>
                <span>{snack.calories} cal</span>
              </Button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedSnack && (
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle>Nutritional Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Calories: +{selectedSnack.calories}</p>
            <p>Protein: +{selectedSnack.protein}g</p>
            <p>Carbs: +{selectedSnack.carbs}g</p>
            <p>Fat: +{selectedSnack.fat}g</p>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" disabled={!selectedSnack}>
        Add Snack
      </Button>
    </div>
  )
}
