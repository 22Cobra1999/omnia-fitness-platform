import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Award, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function AccountOverview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#FF7939]" />
              <span>Your Coaches</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  name: "Alex Johnson",
                  specialty: "Strength Training",
                  subscription: "Premium Fitness",
                  avatar: "/placeholder.svg?height=64&width=64",
                },
                {
                  name: "Sarah Lee",
                  specialty: "Yoga and Flexibility",
                  subscription: "Wellness Complete",
                  avatar: "/placeholder.svg?height=64&width=64",
                },
                {
                  name: "Mike Chen",
                  specialty: "Cardio and HIIT",
                  subscription: "Performance Elite",
                  avatar: "/placeholder.svg?height=64&width=64",
                },
              ].map((coach, index) => (
                <div key={index} className="flex flex-col items-center text-center p-2">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage src={coach.avatar} alt={coach.name} />
                    <AvatarFallback className="text-lg">
                      {coach.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{coach.name}</p>
                  <p className="text-sm text-gray-400">{coach.specialty}</p>
                  <Badge className="mt-1 mb-2 bg-[#FF7939] text-white">{coach.subscription}</Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700">
                    <MessageCircle className="h-4 w-4 text-[#FF7939]" />
                    <span className="sr-only">Message {coach.name}</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#FF7939]" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                name: "Early Bird",
                description: "Completed morning workout 5 days in a row",
                progress: 80,
                xp: 250,
              },
              {
                name: "Step Master",
                description: "Reached 10,000 steps goal for 7 days",
                progress: 65,
                xp: 300,
              },
              {
                name: "Nutrition Pro",
                description: "Maintained balanced macros for 2 weeks",
                progress: 45,
                xp: 400,
              },
              {
                name: "Gym Warrior",
                description: "Completed 20 gym sessions this month",
                progress: 90,
                xp: 500,
              },
            ].map((achievement) => (
              <div key={achievement.name} className="p-4 rounded-lg bg-black/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{achievement.name}</h4>
                  <span className="text-xs font-semibold bg-[#FF7939] text-white px-2 py-1 rounded-full">
                    {achievement.xp} XP
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                <Progress value={achievement.progress} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
