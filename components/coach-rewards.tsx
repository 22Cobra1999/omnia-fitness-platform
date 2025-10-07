import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gift, Star, Trophy, Target, Calendar, Users } from "lucide-react"

const weeklyGoals = [
  {
    title: "Maintain 90% Client Attendance",
    discount: "10% OFF",
    progress: 85,
    icon: Users,
  },
  {
    title: "Create 3 New Workout Plans",
    discount: "7% OFF",
    progress: 66,
    icon: Trophy,
  },
  {
    title: "Engage with 20 Clients",
    discount: "5% OFF",
    progress: 75,
    icon: Star,
  },
]

const presetGoals = [
  {
    title: "Reach 50 Active Clients",
    discount: "15% OFF",
    progress: 80,
    icon: Users,
  },
  {
    title: "Achieve 4.8 Star Rating",
    discount: "20% OFF",
    progress: 90,
    icon: Star,
  },
]

export function CoachRewards() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#FF7939]" />
            Weekly Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weeklyGoals.map((goal, index) => (
              <Card key={index} className="bg-[#2A2A2A] border-none">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-[#FF7939] text-white">{goal.discount}</Badge>
                    <goal.icon className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">{goal.title}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#FF7939]" />
            Preset Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presetGoals.map((goal, index) => (
              <Card key={index} className="bg-[#2A2A2A] border-none">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-[#FF7939] text-white">{goal.discount}</Badge>
                    <goal.icon className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">{goal.title}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing coach rewards content */}
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#FF7939]" />
            Marketplace Offers
          </CardTitle>
        </CardHeader>
        <CardContent>{/* Existing marketplace offers content */}</CardContent>
      </Card>
    </div>
  )
}
