"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gift, Star, Trophy, Target, Calendar } from "lucide-react"

const weeklyGoals = [
  {
    title: "Complete 3 Workouts",
    discount: "5% OFF",
    progress: 66,
    icon: Trophy,
  },
  {
    title: "Log Meals for 5 Days",
    discount: "7% OFF",
    progress: 80,
    icon: Star,
  },
  {
    title: "Achieve 10,000 Steps Daily",
    discount: "10% OFF",
    progress: 50,
    icon: Target,
  },
]

const presetGoals = [
  {
    title: "Lose 5% Body Fat",
    discount: "15% OFF",
    progress: 60,
    icon: Trophy,
  },
  {
    title: "Run a 5K",
    discount: "20% OFF",
    progress: 40,
    icon: Target,
  },
]

const marketplaceRewards = [
  {
    title: "Premium Workout Gear",
    discount: "20% OFF",
    condition: "Complete 30 workouts",
    progress: 75,
    icon: Trophy,
  },
  {
    title: "Nutrition Bundle",
    discount: "15% OFF",
    condition: "Track meals for 14 days",
    progress: 60,
    icon: Star,
  },
  {
    title: "Recovery Essentials",
    discount: "25% OFF",
    condition: "Achieve 5 fitness goals",
    progress: 40,
    icon: Target,
  },
]

export function ClientRewards() {
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

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#FF7939]" />
            Marketplace Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketplaceRewards.map((reward, index) => (
              <Card key={index} className="bg-[#2A2A2A] border-none">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-[#FF7939] text-white">{reward.discount}</Badge>
                    <reward.icon className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">{reward.title}</h4>
                  <p className="text-sm text-gray-400 mb-4">{reward.condition}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">{reward.progress}%</span>
                    </div>
                    <Progress value={reward.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
