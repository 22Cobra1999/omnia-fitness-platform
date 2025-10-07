"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface ScheduledWorkout {
  date: Date
  type: string
  name: string
}

export function ModifyFitnessCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([
    { date: new Date(), type: "Cardio", name: "Morning Run" },
    { date: new Date(), type: "Strength", name: "Evening Weightlifting" },
  ])
  const [selectedType, setSelectedType] = useState<string>("Cardio")
  const [workoutName, setWorkoutName] = useState("")

  const addWorkout = () => {
    if (date && workoutName) {
      setScheduledWorkouts([...scheduledWorkouts, { date, type: selectedType, name: workoutName }])
      setWorkoutName("")
    }
  }

  return (
    <div className="space-y-4">
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledWorkouts
            .filter((workout) => workout.date.toDateString() === date?.toDateString())
            .map((workout, index) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <span>{workout.name}</span>
                <span className="text-sm text-gray-500">{workout.type}</span>
              </div>
            ))}
        </CardContent>
      </Card>
      <div className="flex space-x-2">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cardio">Cardio</SelectItem>
            <SelectItem value="Strength">Strength</SelectItem>
            <SelectItem value="Flexibility">Flexibility</SelectItem>
            <SelectItem value="HIIT">HIIT</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="text"
          placeholder="Workout name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="flex-grow px-3 py-2 border rounded-md"
        />
        <Button onClick={addWorkout}>Add</Button>
      </div>
    </div>
  )
}
