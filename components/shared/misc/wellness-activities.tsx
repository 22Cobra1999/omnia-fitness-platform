import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SpaceIcon as Yoga, Brain, StretchVerticalIcon as Stretch } from "lucide-react"

const activities = [
  {
    name: "Yoga",
    icon: Yoga,
    color: "text-purple-400",
    progress: 60,
    lastSession: "2 days ago",
    recommendation: "Try a 30-minute Vinyasa flow today",
  },
  {
    name: "Mindfulness",
    icon: Brain,
    color: "text-blue-400",
    progress: 40,
    lastSession: "1 day ago",
    recommendation: "Practice a 10-minute guided meditation",
  },
  {
    name: "Stretching",
    icon: Stretch,
    color: "text-green-400",
    progress: 75,
    lastSession: "Today",
    recommendation: "Focus on lower body stretches for 15 minutes",
  },
]

export function WellnessActivities() {
  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <Card key={index} className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <activity.icon className={`w-6 h-6 ${activity.color}`} />
              <span>{activity.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Weekly goal progress:</p>
              <Progress value={activity.progress} className="h-2" />
              <p className="text-sm text-gray-400 mt-2">{activity.progress}% completed</p>
            </div>
            <p className="text-sm text-gray-400 mb-4">Last session: {activity.lastSession}</p>
            <p className="text-sm text-gray-400 mb-4">Recommendation: {activity.recommendation}</p>
            <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white">Start Session</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
