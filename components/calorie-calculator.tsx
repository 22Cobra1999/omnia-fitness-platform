"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface Activity {
  name: string
  met: number
}

const activities: Activity[] = [
  { name: "Weightlifting (light effort)", met: 3.0 },
  { name: "Weightlifting (moderate effort)", met: 4.5 },
  { name: "Weightlifting (vigorous effort)", met: 6.0 },
  { name: "Circuit training (general)", met: 8.0 },
  { name: "Calisthenics (e.g., push-ups, sit-ups)", met: 5.75 }, // Average of 3.5 and 8.0
  { name: "Pilates", met: 3.0 },
  { name: "Stretching (yoga, light)", met: 2.5 },
  { name: "Stretching (yoga, vigorous)", met: 4.0 },
  { name: "Rowing machine (moderate)", met: 7.0 },
  { name: "Rowing machine (vigorous)", met: 12.0 },
  { name: "Elliptical trainer (moderate)", met: 5.0 },
  { name: "Elliptical trainer (vigorous)", met: 8.0 },
  { name: "Treadmill running (8 km/h)", met: 8.0 },
  { name: "Treadmill running (12 km/h)", met: 12.0 },
  { name: "Stationary cycling (light)", met: 4.0 },
  { name: "Stationary cycling (moderate)", met: 6.0 },
  { name: "Stationary cycling (vigorous)", met: 10.0 },
]

export function CalorieCalculator() {
  const [personalInfo, setPersonalInfo] = useLocalStorage("personalInfo", {
    weight: "",
    height: "",
  })
  const [weight, setWeight] = useState(personalInfo.weight || "")
  const [activity, setActivity] = useState<Activity | null>(null)
  const [duration, setDuration] = useState("")
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null)

  useEffect(() => {
    setWeight(personalInfo.weight || "")
  }, [personalInfo])

  const calculateCalories = () => {
    if (weight && activity && duration) {
      const weightInKg = Number.parseFloat(weight)
      const durationInHours = Number.parseFloat(duration) / 60 // Convert minutes to hours
      const calories = weightInKg * activity.met * durationInHours
      setCaloriesBurned(Math.round(calories))
    } else {
      setCaloriesBurned(null)
    }
  }

  return (
    <Card className="bg-[#1E1E1E] border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Calorie Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="weight" className="text-white">
            Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter your weight"
            className="bg-[#2A2A2A] text-white border-gray-600"
          />
        </div>
        <div>
          <Label htmlFor="activity" className="text-white">
            Activity
          </Label>
          <Select onValueChange={(value) => setActivity(activities.find((a) => a.name === value) || null)}>
            <SelectTrigger id="activity" className="bg-[#2A2A2A] text-white border-gray-600">
              <SelectValue placeholder="Select an activity" />
            </SelectTrigger>
            <SelectContent>
              {activities.map((activity) => (
                <SelectItem key={activity.name} value={activity.name}>
                  {activity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration" className="text-white">
            Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration"
            className="bg-[#2A2A2A] text-white border-gray-600"
          />
        </div>
        <Button onClick={calculateCalories} className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white">
          Calculate Calories Burned
        </Button>
        {caloriesBurned !== null && (
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-white">
              Estimated Calories Burned: <span className="text-[#FF7939]">{caloriesBurned}</span> kcal
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
