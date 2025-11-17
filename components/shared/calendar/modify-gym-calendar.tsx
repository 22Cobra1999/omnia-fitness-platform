"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface ScheduledGymSession {
  date: Date
  type: string
  name: string
}

export function ModifyGymCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledGymSession[]>([
    { date: new Date(), type: "Strength", name: "Upper Body Workout" },
    { date: new Date(), type: "Cardio", name: "HIIT Session" },
  ])
  const [selectedType, setSelectedType] = useState<string>("Strength")
  const [sessionName, setSessionName] = useState("")

  const addSession = () => {
    if (date && sessionName) {
      setScheduledSessions([...scheduledSessions, { date, type: selectedType, name: sessionName }])
      setSessionName("")
    }
  }

  return (
    <div className="space-y-4">
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Gym Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledSessions
            .filter((session) => session.date.toDateString() === date?.toDateString())
            .map((session, index) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <span>{session.name}</span>
                <span className="text-sm text-gray-500">{session.type}</span>
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
            <SelectItem value="Strength">Strength</SelectItem>
            <SelectItem value="Cardio">Cardio</SelectItem>
            <SelectItem value="Flexibility">Flexibility</SelectItem>
            <SelectItem value="Recovery">Recovery</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="text"
          placeholder="Session name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="flex-grow px-3 py-2 border rounded-md"
        />
        <Button onClick={addSession}>Add</Button>
      </div>
    </div>
  )
}
