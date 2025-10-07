"use client"

import { useState, useEffect } from "react"
import {
  Clock,
  ChefHat,
  Dumbbell,
  Video,
  Users,
  X,
  CalendarIcon,
  ArrowLeft,
  ArrowRight,
  Search,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

// Define the ScheduledItem type
interface ScheduledItem {
  id: string
  itemId: string
  itemType: "video" | "subscription"
  title: string
  date: string
  time: string
  duration: string
  scheduled: boolean
  clientName?: string
  clientAvatar?: string
  type?: "fitness" | "nutrition"
  format?: string
  startingSoon?: boolean
  status?: string
}

export function CoachCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([])
  const [showAddSessionModal, setShowAddSessionModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [newSession, setNewSession] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    duration: "60 min",
    type: "fitness" as "fitness" | "nutrition",
    format: "1:1",
    clientName: "",
    isRecurring: false,
    recurringType: "weekly",
    recurringCount: 4,
    notes: "",
    sendReminder: true,
    reminderTime: "1 hour",
  })

  // Optimizar la carga inicial y añadir mejor manejo de estados de carga

  // Añadir un estado de carga
  const [isLoading, setIsLoading] = useState(true)

  // Modificar el useEffect para incluir un mejor manejo de carga
  useEffect(() => {
    // Simular un tiempo de carga para mostrar el estado de carga
    const loadData = async () => {
      setIsLoading(true)
      // Pequeño retraso para asegurar que el estado de carga se muestre
      await new Promise((resolve) => setTimeout(resolve, 300))
      setIsLoading(false)
    }

    loadData()
  }, [currentWeekStart])

  // Function to get the start of the week (Sunday)
  function getWeekStart(date: Date) {
    const newDate = new Date(date)
    const day = newDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    newDate.setDate(newDate.getDate() - day) // Go to the start of the week (Sunday)
    return newDate
  }

  // Function to format date as "MMM D"
  function formatDate(date: Date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Function to get week range string
  function getWeekRangeString() {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(endDate.getDate() + 6)
    return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`
  }

  // Function to navigate to previous week
  function goToPreviousWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  // Function to navigate to next week
  function goToNextWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  // Function to go to current week
  function goToCurrentWeek() {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Optimizar la función getWeekDates para mejorar el rendimiento
  // Reemplazar la función getWeekDates actual con esta versión optimizada:
  function getWeekDates() {
    // Usar memoización para evitar recálculos innecesarios
    const dates = []
    const startDate = new Date(currentWeekStart)

    // Pre-calcular la fecha una vez y luego clonarla
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  // Check if date is today
  function isToday(date: Date) {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Format day name
  function formatDayName(date: Date) {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  // Sample scheduled events - more comprehensive data
  const sampleEvents = [
    {
      id: "e1",
      itemId: "1",
      itemType: "subscription",
      title: "Strength Training",
      clientName: "John Smith",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      time: "5:00 PM",
      date: "2025-04-19",
      duration: "60 min",
      type: "fitness",
      format: "1:1",
      scheduled: true,
      startingSoon: true,
    },
    {
      id: "e2",
      itemId: "2",
      itemType: "subscription",
      title: "Nutrition Consultation",
      clientName: "Emma Johnson",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      time: "10:00 AM",
      date: "2025-04-20",
      duration: "30 min",
      type: "nutrition",
      format: "1:1",
      scheduled: true,
      startingSoon: false,
    },
    {
      id: "v1",
      itemId: "v1",
      itemType: "video",
      title: "Group HIIT Class",
      clientName: "Multiple Clients (8)",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      time: "8:00 AM",
      date: "2025-04-21",
      duration: "45 min",
      type: "fitness",
      format: "group",
      scheduled: true,
      startingSoon: false,
    },
  ]

  // Combine sample events with scheduled items for demo purposes
  const allScheduledItems = [...sampleEvents, ...scheduledItems]

  // Filter events based on active filter and current week
  const filteredEvents = allScheduledItems
    .filter((event) => activeFilter === "all" || event.type === activeFilter)
    .filter((event) => {
      // Check if event is in the current week
      const eventDate = new Date(event.date)
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      return eventDate >= currentWeekStart && eventDate <= weekEnd
    })

  // Group events by date
  const groupedEvents = filteredEvents.reduce(
    (groups, event) => {
      const dateKey = new Date(event.date).toDateString()

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
      return groups
    },
    {} as Record<string, typeof filteredEvents>,
  )

  // Function to render type icon
  const renderTypeIcon = (type?: string) => {
    switch (type) {
      case "nutrition":
        return <ChefHat className="h-4 w-4 text-[#FF7939]" />
      case "fitness":
        return <Dumbbell className="h-4 w-4 text-[#FF7939]" />
      default:
        return null
    }
  }

  // Function to render format icon
  const renderFormatIcon = (format?: string, itemType?: string) => {
    if (itemType === "video") {
      return <Video className="h-4 w-4 text-gray-400" />
    }

    switch (format) {
      case "1:1":
        return <Users className="h-4 w-4 text-gray-400" />
      case "group":
        return <Users className="h-4 w-4 text-gray-400" />
      case "video":
        return <Video className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  // Function to format date for display
  function formatDateForDisplay(date: Date) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    }
  }

  // Function to handle adding a new session
  const handleAddSession = () => {
    const newId = Math.random().toString(36).substring(2, 11)
    const newScheduledItem: ScheduledItem = {
      id: newId,
      itemId: newId,
      itemType: "subscription",
      title: newSession.title,
      date: newSession.date,
      time: newSession.time,
      duration: newSession.duration,
      clientName: newSession.clientName || "Available Slot",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      type: newSession.type,
      format: newSession.format,
      scheduled: true,
      startingSoon: false,
    }

    setScheduledItems([...scheduledItems, newScheduledItem])

    // If recurring, add additional sessions
    if (newSession.isRecurring) {
      const baseDate = new Date(newSession.date)
      const additionalSessions = []

      for (let i = 1; i <= newSession.recurringCount; i++) {
        const nextDate = new Date(baseDate)

        if (newSession.recurringType === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7 * i)
        } else if (newSession.recurringType === "biweekly") {
          nextDate.setDate(nextDate.getDate() + 14 * i)
        } else if (newSession.recurringType === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + i)
        }

        additionalSessions.push({
          ...newScheduledItem,
          id: Math.random().toString(36).substring(2, 11),
          itemId: Math.random().toString(36).substring(2, 11),
          date: nextDate.toISOString().split("T")[0],
        })
      }

      setScheduledItems((prev) => [...prev, ...additionalSessions])
    }

    // Reset form and close modal
    setNewSession({
      title: "",
      date: new Date().toISOString().split("T")[0],
      time: "12:00",
      duration: "60 min",
      type: "fitness",
      format: "1:1",
      clientName: "",
      isRecurring: false,
      recurringType: "weekly",
      recurringCount: 4,
      notes: "",
      sendReminder: true,
      reminderTime: "1 hour",
    })
    setShowAddSessionModal(false)
  }

  // Get week dates
  const weekDates = getWeekDates()

  // Count sessions per day for the week view
  const sessionsPerDay = weekDates.map((date) => {
    const dateKey = date.toDateString()
    return groupedEvents[dateKey]?.length || 0
  })

  // Añadir este código justo antes del return principal:
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto pb-20">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-[#FF7939]" />
            <h1 className="text-xl font-bold text-white">Coach Schedule</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#FF7939] mb-4" />
          <p className="text-gray-400 animate-pulse">Cargando tu calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto pb-20">
      {/* App header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-[#FF7939]" />
          <h1 className="text-xl font-bold text-white">Coach Schedule</h1>
        </div>

        <div className="flex space-x-3">
          <button
            className="text-gray-400 bg-[#1E1E1E] px-3 py-1.5 rounded-full text-sm font-medium"
            onClick={goToCurrentWeek}
          >
            Today
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="px-4 mb-2">
        <div className="flex justify-between items-center mb-4">
          <button className="p-2 rounded-full hover:bg-[#1E1E1E]" onClick={goToPreviousWeek}>
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>

          <h2 className="text-base font-medium">{getWeekRangeString()}</h2>

          <button className="p-2 rounded-full hover:bg-[#1E1E1E]" onClick={goToNextWeek}>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Week days */}
        <div className="flex justify-between mb-4">
          {weekDates.map((date, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs text-gray-400 mb-1">{formatDayName(date)}</div>
              <div
                className={`
                  w-10 h-10 flex items-center justify-center rounded-full text-sm
                  ${isToday(date) ? "bg-[#FF7939] text-white" : "text-white"}
                `}
              >
                {date.getDate()}
              </div>
              {sessionsPerDay[index] > 0 && (
                <div className="mt-1 flex space-x-0.5">
                  {sessionsPerDay[index] > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939]"></div>}
                  {sessionsPerDay[index] > 1 && <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939]"></div>}
                  {sessionsPerDay[index] > 2 && <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939]"></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick filters */}
      <div className="px-4 mb-4">
        <div className="flex flex-col">
          <div className="relative flex-1 mr-4 mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search client..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7939]"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                activeFilter === "all" ? "bg-[#FF7939] text-white" : "bg-[#1E1E1E] text-gray-300"
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All Sessions
            </button>
            <button
              className={`flex items-center px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                activeFilter === "fitness" ? "bg-[#FF7939] text-white" : "bg-[#1E1E1E] text-gray-300"
              }`}
              onClick={() => setActiveFilter("fitness")}
            >
              <Dumbbell className="h-4 w-4 mr-1.5" />
              Fitness
            </button>
            <button
              className={`flex items-center px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                activeFilter === "nutrition" ? "bg-[#FF7939] text-white" : "bg-[#1E1E1E] text-gray-300"
              }`}
              onClick={() => setActiveFilter("nutrition")}
            >
              <ChefHat className="h-4 w-4 mr-1.5" />
              Nutrition
            </button>
            <button
              className={`flex items-center px-4 py-2 rounded-full text-sm whitespace-nowrap bg-[#1E1E1E] text-gray-300`}
            >
              <Users className="h-4 w-4 mr-1.5" />
              1:1 Sessions
            </button>
            <button
              className={`flex items-center px-4 py-2 rounded-full text-sm whitespace-nowrap bg-[#1E1E1E] text-gray-300`}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Group Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Timeline view */}
      <div className="px-4">
        {Object.entries(groupedEvents).map(([dateKey, events]) => {
          const date = new Date(dateKey)
          return (
            <div key={dateKey} className="mb-6">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-medium">{formatDateForDisplay(date)}</h3>
                <div className="ml-3 h-px bg-gray-800 flex-grow"></div>
              </div>

              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`
                      bg-[#1E1E1E] rounded-lg p-4 border-l-4 relative
                      ${event.type === "fitness" ? "border-blue-500" : "border-[#FF7939]"}
                      ${event.status === "completed" ? "opacity-70" : ""}
                      ${editingSession === event.id ? "ring-2 ring-[#FF7939]" : ""}
                    `}
                  >
                    {/* Edit menu */}
                    {editingSession === event.id && (
                      <div className="absolute right-2 top-12 bg-[#2A2A2A] rounded-lg shadow-lg p-2 z-10">
                        <button
                          className="flex items-center w-full text-left px-3 py-2 hover:bg-[#333333] rounded"
                          onClick={() => setEditingSession(null)}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          className="flex items-center w-full text-left px-3 py-2 hover:bg-[#333333] rounded text-red-500"
                          onClick={() => setEditingSession(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          <span>Cancel Session</span>
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center">
                          {renderTypeIcon(event.type)}
                          <h4 className="text-md font-medium ml-2">{event.title}</h4>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-300">
                            {event.time} • {event.duration}
                          </span>
                          <div className="mx-2 text-gray-600">•</div>
                          <div className="flex items-center">
                            {renderFormatIcon(event.format, event.itemType)}
                            <span className="text-sm text-gray-300 ml-1">
                              {event.format === "group" ? "Group" : event.format || "Session"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="text-gray-400 hover:bg-[#2A2A2A] p-1 rounded-full"
                        onClick={() => setEditingSession(editingSession === event.id ? null : event.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="19" cy="12" r="1"></circle>
                          <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={event.clientAvatar || "/placeholder.svg"}
                            alt={event.clientName || "Client"}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm">{event.clientName}</span>
                      </div>

                      <div className="flex items-center">
                        {event.startingSoon && (
                          <button className="ml-3 bg-[#FF7939] text-white px-3 py-1 rounded-full text-sm">Start</button>
                        )}

                        <button className="ml-3 border border-gray-600 text-white px-3 py-1 rounded-full text-sm">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state if no events */}
      {Object.keys(groupedEvents).length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No sessions scheduled</h3>
          <p className="text-gray-400 mb-6">
            You don't have any sessions scheduled for this week that match your filters.
          </p>
          <button
            className="bg-[#FF7939] text-white px-4 py-2 rounded-full"
            onClick={() => setShowAddSessionModal(true)}
          >
            Add Availability
          </button>
        </div>
      )}

      {/* Add Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] rounded-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-medium">Add Availability</h3>
              <button onClick={() => setShowAddSessionModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Session Title</label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Enter session title"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Duration and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                  <select
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                    className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="15 min">15 minutes</option>
                    <option value="30 min">30 minutes</option>
                    <option value="45 min">45 minutes</option>
                    <option value="60 min">60 minutes</option>
                    <option value="90 min">90 minutes</option>
                    <option value="120 min">120 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <div className="flex space-x-2">
                    <button
                      className={`flex-1 flex items-center justify-center py-2 rounded-lg ${
                        newSession.type === "fitness" ? "bg-[#FF7939] text-white" : "bg-[#2A2A2A] text-gray-300"
                      }`}
                      onClick={() => setNewSession({ ...newSession, type: "fitness" })}
                    >
                      <Dumbbell className="h-4 w-4 mr-1.5" />
                      Fitness
                    </button>
                    <button
                      className={`flex-1 flex items-center justify-center py-2 rounded-lg ${
                        newSession.type === "nutrition" ? "bg-[#FF7939] text-white" : "bg-[#2A2A2A] text-gray-300"
                      }`}
                      onClick={() => setNewSession({ ...newSession, type: "nutrition" })}
                    >
                      <ChefHat className="h-4 w-4 mr-1.5" />
                      Nutrition
                    </button>
                  </div>
                </div>
              </div>

              {/* Format and Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Format</label>
                  <select
                    value={newSession.format}
                    onChange={(e) => setNewSession({ ...newSession, format: e.target.value })}
                    className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="1:1">1:1 Session</option>
                    <option value="group">Group Session</option>
                    <option value="video">Video Call</option>
                    <option value="in-person">In-Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Client (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newSession.clientName}
                      onChange={(e) => setNewSession({ ...newSession, clientName: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 pl-8 text-white"
                      placeholder="Leave empty for open slot"
                    />
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Recurring Options */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-400">Recurring Availability</label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={newSession.isRecurring}
                      onChange={(e) => setNewSession({ ...newSession, isRecurring: e.target.checked })}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                        newSession.isRecurring ? "bg-[#FF7939]" : "bg-gray-600"
                      }`}
                    ></label>
                  </div>
                </div>

                {newSession.isRecurring && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Repeat</label>
                      <select
                        value={newSession.recurringType}
                        onChange={(e) => setNewSession({ ...newSession, recurringType: e.target.value })}
                        className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Occurrences</label>
                      <select
                        value={newSession.recurringCount}
                        onChange={(e) =>
                          setNewSession({ ...newSession, recurringCount: Number.parseInt(e.target.value) })
                        }
                        className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((num) => (
                          <option key={num} value={num}>
                            {num} times
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Session Notes</label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white h-20"
                  placeholder="Add notes about this session..."
                ></textarea>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Session Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 pl-8 text-white"
                    placeholder="Enter price"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-800 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white"
                onClick={() => setShowAddSessionModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#FF7939] text-white"
                onClick={handleAddSession}
                disabled={!newSession.title}
              >
                Add Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating action button */}
      <div className="fixed bottom-24 right-4">
        <button
          className="bg-[#FF7939] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          onClick={() => setShowAddSessionModal(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}
