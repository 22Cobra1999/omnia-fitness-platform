import { motion } from "framer-motion"

// Shared Tracker Components
import { useTrackerState } from "./hooks/useTrackerState"
import { TrackerChartCard } from "./components/Tracker/TrackerChartCard"
import { TrackerInsightItem } from "./components/Tracker/TrackerInsightItem"
import { TrackerActionGrid } from "./components/Tracker/TrackerActionGrid"
import { TrackerWorkoutSection } from "./components/Tracker/TrackerWorkoutSection"

const strengthData = [
  { day: "Mon", value: 85 },
  { day: "Tue", value: 90 },
  { day: "Wed", value: 88 },
  { day: "Thu", value: 95 },
  { day: "Fri", value: 92 },
  { day: "Sat", value: 89 },
  { day: "Sun", value: 91 },
]

const powerData = [
  { day: "Mon", value: 75 },
  { day: "Tue", value: 80 },
  { day: "Wed", value: 78 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 82 },
  { day: "Sat", value: 79 },
  { day: "Sun", value: 81 },
]

const enduranceData = [
  { day: "Mon", value: 70 },
  { day: "Tue", value: 72 },
  { day: "Wed", value: 68 },
  { day: "Thu", value: 75 },
  { day: "Fri", value: 73 },
  { day: "Sat", value: 71 },
  { day: "Sun", value: 74 },
]

const topExercises = [
  { name: "Bench Press", weight: 225, reps: 8, calories: 120 },
  { name: "Squats", weight: 315, reps: 6, calories: 150 },
  { name: "Deadlifts", weight: 405, reps: 5, calories: 180 },
]

const performanceMetrics = [
  { name: "Strength", score: 85 },
  { name: "Power", score: 75 },
  { name: "Endurance", score: 70 },
]

const smartInsights = [
  {
    title: "New PR Alert",
    description: "You've set a new personal record on bench press. Great job pushing your limits!",
    icon: TrendingUp,
    color: "#FFB56B",
  },
  {
    title: "Recovery Needed",
    description: "Your recent leg day was intense. Focus on rest and protein intake for optimal recovery.",
    icon: Weight,
    color: "#FF7939",
  },
  {
    title: "Workout Streak",
    description: "You've maintained a consistent 5-day workout streak. Keep up the great work!",
    icon: Zap,
    color: "#FFD700",
  },
]

const workoutSections = [
  {
    title: "Strength Training",
    options: [
      {
        title: "Upper Body Power",
        calories: 450,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/upper-body-power.mp4",
      },
      {
        title: "Lower Body Strength",
        calories: 500,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/lower-body-strength.mp4",
      },
      {
        title: "Full Body Compound",
        calories: 550,
        image: "/placeholder.svg?height=300&width=400",
        type: "Strength",
        videoUrl: "/videos/full-body-compound.mp4",
      },
    ],
    coachNote: {
      title: "Progressive Overload Focus",
      description:
        "This week, we're emphasizing progressive overload. Aim to increase either weight or reps in your key lifts.",
    },
  },
  {
    title: "Hypertrophy",
    options: [
      {
        title: "Chest and Triceps",
        calories: 400,
        image: "/placeholder.svg?height=300&width=400",
        type: "Hypertrophy",
        videoUrl: "/videos/chest-triceps.mp4",
      },
      {
        title: "Back and Biceps",
        calories: 420,
        image: "/placeholder.svg?height=300&width=400",
        type: "Hypertrophy",
        videoUrl: "/videos/back-biceps.mp4",
      },
      {
        title: "Leg Hypertrophy",
        calories: 480,
        image: "/placeholder.svg?height=300&width=400",
        type: "Hypertrophy",
        videoUrl: "/videos/leg-hypertrophy.mp4",
      },
    ],
    coachNote: {
      title: "Mind-Muscle Connection",
      description:
        "For these hypertrophy sessions, focus on the mind-muscle connection. Slow down your reps and feel the targeted muscles working.",
    },
  },
  {
    title: "Functional Fitness",
    options: [
      {
        title: "HIIT with Weights",
        calories: 350,
        image: "/placeholder.svg?height=300&width=400",
        type: "Functional",
        videoUrl: "/videos/hiit-weights.mp4",
      },
      {
        title: "Core and Stability",
        calories: 300,
        image: "/placeholder.svg?height=300&width=400",
        type: "Functional",
        videoUrl: "/videos/core-stability.mp4",
      },
      {
        title: "Olympic Lifting Basics",
        calories: 400,
        image: "/placeholder.svg?height=300&width=400",
        type: "Functional",
        videoUrl: "/videos/olympic-lifting.mp4",
      },
    ],
    coachNote: {
      title: "Functional Strength",
      description:
        "These workouts improve your overall athleticism. Focus on form and controlled movements for the best results.",
    },
  },
]

export function GymTracker() {
  const { timeframe, setTimeframe, openDialog, setOpenDialog } = useTrackerState()

  const quickActions = [
    { icon: Dumbbell, label: "Log Workout", color: "#FF7939" },
    { icon: MessageSquare, label: "Chat with Coach", color: "#FFB56B" },
    { icon: Calendar, label: "Modify Calendar", color: "#FFD700" },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gym Performance Overview</h2>
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
          title="Strength"
          icon={Dumbbell}
          iconColor="text-blue-400"
          data={strengthData}
          mainDataKey="value"
          mainLineColor="#8884d8"
          footerLabel="Today's strength score"
          footerValue="91%"
          progressValue={91}
        />
        <TrackerChartCard
          title="Power"
          icon={Zap}
          iconColor="text-yellow-400"
          data={powerData}
          mainDataKey="value"
          mainLineColor="#FFD700"
          footerLabel="Today's power score"
          footerValue="81%"
          progressValue={81}
        />
        <TrackerChartCard
          title="Endurance"
          icon={Clock}
          iconColor="text-green-400"
          data={enduranceData}
          mainDataKey="value"
          mainLineColor="#4ADE80"
          footerLabel="Today's endurance score"
          footerValue="74%"
          progressValue={74}
        />
      </div>

      {/* Gym Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrackerChartCard
          title="Top 3 Lifts"
          icon={Dumbbell}
          iconColor="text-[#FF7939]"
          data={topExercises}
          mainDataKey="weight"
          secondaryDataKey="calories"
          mainLineColor="#FF7939"
          secondaryLineColor="#FFB56B"
          footerLabel="Top Lifts"
          footerValue={`${topExercises.length} PRs tracked`}
          progressValue={100}
          type="bar"
        />

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
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
          <CardTitle className="text-white">Gym Insights</CardTitle>
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

      {/* Workout Videos */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">DAY 1 - PUSH DAY</h2>
        {workoutSections.map((section, index) => (
          <TrackerWorkoutSection key={index} {...section} />
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === "Log Workout"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
            <DialogDescription>Log your gym workout details here.</DialogDescription>
          </DialogHeader>
          {/* Log Workout content */}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Chat with Coach"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat with Your Gym Coach</DialogTitle>
            <DialogDescription>Get personalized advice and guidance for your gym workouts.</DialogDescription>
          </DialogHeader>
          <ChatWithGymCoach />
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "Modify Calendar"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Your Gym Calendar</DialogTitle>
            <DialogDescription>Adjust your gym workout schedule.</DialogDescription>
          </DialogHeader>
          <ModifyGymCalendar />
        </DialogContent>
      </Dialog>
    </div>
  )
}
