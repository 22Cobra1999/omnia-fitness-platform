import { motion } from "framer-motion"

// Shared Tracker Components
import { useTrackerState } from "./hooks/useTrackerState"
import { TrackerChartCard } from "./components/Tracker/TrackerChartCard"
import { TrackerInsightItem } from "./components/Tracker/TrackerInsightItem"
import { TrackerActionGrid } from "./components/Tracker/TrackerActionGrid"
import { TrackerWorkoutSection } from "./components/Tracker/TrackerWorkoutSection"

const sleepData = [
  { day: "Mon", hours: 7.5, quality: 85 },
  { day: "Tue", hours: 6.8, quality: 75 },
  { day: "Wed", hours: 7.2, quality: 82 },
  { day: "Thu", hours: 7.8, quality: 88 },
  { day: "Fri", hours: 7.1, quality: 78 },
  { day: "Sat", hours: 7.5, quality: 84 },
  { day: "Sun", hours: 7.3, quality: 80 },
]

const recoveryData = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 70 },
  { day: "Wed", value: 68 },
  { day: "Thu", value: 75 },
  { day: "Fri", value: 72 },
  { day: "Sat", value: 69 },
  { day: "Sun", value: 71 },
]

const strainData = [
  { day: "Mon", value: 12.5 },
  { day: "Tue", value: 14.2 },
  { day: "Wed", value: 10.8 },
  { day: "Thu", value: 15.5 },
  { day: "Fri", value: 13.7 },
  { day: "Sat", value: 11.3 },
  { day: "Sun", value: 9.6 },
]

const topActivities = [
  { name: "Running", duration: 120, calories: 450 },
  { name: "Cycling", duration: 90, calories: 350 },
  { name: "Swimming", duration: 60, calories: 300 },
]

const performanceMetrics = [
  { name: "Cardio", score: 75 },
  { name: "Strength", score: 65 },
  { name: "Flexibility", score: 45 },
]

const smartInsights = [
  {
    title: "Recovery Focus",
    description: "Your sleep quality has improved by 15%. Consider increasing workout intensity.",
    icon: Brain,
    color: "#FFB56B",
  },
  {
    title: "Strain Balance",
    description: "Current strain levels suggest room for additional cardio activities.",
    icon: Activity,
    color: "#FF7939",
  },
  {
    title: "Performance Trend",
    description: "Strength metrics showing consistent improvement over the past week.",
    icon: TrendingUp,
    color: "#FFD700",
  },
]

const workoutSections = [
  {
    title: "Morning",
    options: [
      {
        title: "Dynamic Warm-Up & HIIT",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/morning-hiit.mp4",
      },
      {
        title: "Yoga Flow",
        calories: 250,
        image: "/placeholder.svg?height=300&width=400",
        type: "Flexibility",
        videoUrl: "/videos/morning-yoga.mp4",
      },
      {
        title: "Bodyweight Circuit",
        calories: 350,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/morning-circuit.mp4",
      },
    ],
    coachNote: {
      title: "Morning Energy Activation",
      description:
        "Start with dynamic movements to wake up your body and boost metabolism. Focus on bodyweight exercises and mobility work.",
    },
  },
  {
    title: "Afternoon",
    options: [
      {
        title: "Strength Training",
        calories: 550,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/afternoon-strength.mp4",
      },
      {
        title: "Running Session",
        calories: 600,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/afternoon-running.mp4",
      },
      {
        title: "Swimming",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/afternoon-swimming.mp4",
      },
    ],
    coachNote: {
      title: "Peak Performance Window",
      description:
        "Your body temperature and muscle function are optimal during afternoon hours. Perfect time for high-intensity or strength work.",
    },
  },
  {
    title: "Evening",
    options: [
      {
        title: "Pilates Core Work",
        calories: 300,
        image: "/placeholder.svg?height=300&width=400",
        type: "Flexibility",
        videoUrl: "/videos/evening-pilates.mp4",
      },
      {
        title: "Light Cardio",
        calories: 250,
        image: "/placeholder.svg?height=300&width=400",
        type: "Cardio",
        videoUrl: "/videos/evening-cardio.mp4",
      },
      {
        title: "Mobility Flow",
        calories: 200,
        image: "/placeholder.svg?height=300&width=400",
        type: "Recovery",
        videoUrl: "/videos/evening-mobility.mp4",
      },
    ],
    coachNote: {
      title: "Evening Wind Down",
      description:
        "Focus on lower-intensity activities that won't interfere with sleep. Emphasize mobility and flexibility work.",
    },
  },
]

export function FitnessTracker() {
  const { timeframe, setTimeframe, openDialog, setOpenDialog } = useTrackerState()

  const quickActions = [
    { icon: Dumbbell, label: "Log Activity", color: "#FF7939" },
    { icon: MessageSquare, label: "Chat with Coach", color: "#FFB56B" },
    { icon: Calendar, label: "Modify Calendar", color: "#FFD700" },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Fitness Overview</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32 bg-secondary/50 border-none text-white">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-none text-white">
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrackerChartCard
          title="Sleep"
          icon={Moon}
          iconColor="text-blue-400"
          data={sleepData}
          mainDataKey="hours"
          secondaryDataKey="quality"
          mainLineColor="#8884d8"
          secondaryLineColor="#82ca9d"
          footerLabel="Last night's sleep quality"
          footerValue="7.5 hrs | 82%"
          progressValue={82}
        />
        <TrackerChartCard
          title="Recovery"
          icon={Heart}
          iconColor="text-red-400"
          data={recoveryData}
          mainDataKey="value"
          mainLineColor="#FF7939"
          footerLabel="Today's recovery score"
          footerValue="75%"
          progressValue={75}
        />
        <TrackerChartCard
          title="Strain"
          icon={Activity}
          iconColor="text-yellow-400"
          data={strainData}
          mainDataKey="value"
          mainLineColor="#FFD700"
          footerLabel="Today's strain"
          footerValue="13.7"
          progressValue={68}
        />
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrackerChartCard
          title="Top 3 Activities"
          icon={Activity}
          iconColor="text-[#FF7939]"
          data={topActivities}
          mainDataKey="duration"
          secondaryDataKey="calories"
          mainLineColor="#FF7939"
          secondaryLineColor="#FFB56B"
          footerLabel="Activities"
          footerValue={`${topActivities.length} programs`}
          progressValue={100}
          type="bar"
        />

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="text-white">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{metric.name}</span>
                    <span>{metric.score}%</span>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="text-white">Smart Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {smartInsights.map((insight, index) => (
              <TrackerInsightItem key={index} {...insight} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <TrackerActionGrid actions={quickActions} onActionClick={setOpenDialog} />

      {/* Activity Videos */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">DAY 1 - 2000 CAL</h2>
        {workoutSections.map((section, index) => (
          <TrackerWorkoutSection key={index} {...section} />
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === "Log Activity"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Log your fitness activity details here.</DialogDescription>
          </DialogHeader>
          {/* Log Activity content */}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Chat with Coach"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat with Your Fitness Coach</DialogTitle>
            <DialogDescription>Get personalized advice and guidance.</DialogDescription>
          </DialogHeader>
          <ChatWithFitnessCoach />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Modify Calendar"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Your Fitness Calendar</DialogTitle>
            <DialogDescription>Adjust your fitness schedule.</DialogDescription>
          </DialogHeader>
          <ModifyFitnessCalendar />
        </DialogContent>
      </Dialog>
    </div>
  )
}
