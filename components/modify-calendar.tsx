"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Utensils, Plus } from "lucide-react"
import { format } from "date-fns"

interface Meal {
  id: string
  name: string
  time: string
}

interface ScheduledMeal extends Meal {
  date: Date
}

export function ModifyCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [scheduledMeals, setScheduledMeals] = useState<ScheduledMeal[]>([])

  const mealsForSelectedDate = scheduledMeals.filter((meal) => meal.date.toDateString() === date?.toDateString())

  const addMeal = () => {
    if (date) {
      const newMeal: ScheduledMeal = {
        id: Math.random().toString(36).substr(2, 9),
        name: "New Meal",
        time: "12:00",
        date: date,
      }
      setScheduledMeals([...scheduledMeals, newMeal])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{date ? format(date, "MMMM yyyy") : "Select a Date"}</CardTitle>
          </CardHeader>
          <CardContent>
            {mealsForSelectedDate.length > 0 ? (
              <ul className="space-y-2">
                {mealsForSelectedDate.map((meal) => (
                  <li key={meal.id} className="flex items-center space-x-2">
                    <Utensils className="h-4 w-4 text-gray-400" />
                    <span>{meal.time}</span>
                    <span>{meal.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No meals scheduled for this date.</p>
            )}
            <Button onClick={addMeal} className="mt-4 w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
