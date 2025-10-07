import { Card, CardContent } from "@/components/ui/card"
import { Flame, Droplet, Scale, Activity, Trophy, Calendar, Dumbbell, Apple } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function DashboardScreen() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">OMNIA</h1>
        <div className="bg-[#FF7939] text-white px-3 py-1 rounded-full text-xs">MVP</div>
      </div>

      <h2 className="text-xl font-semibold text-white">Today's Overview</h2>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="p-2 rounded-full bg-[#FF7939]/10 mb-2">
              <Flame className="h-5 w-5 text-[#FF7939]" />
            </div>
            <span className="text-lg font-bold text-white">1,850</span>
            <span className="text-xs text-gray-400">Calories</span>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="p-2 rounded-full bg-[#60A5FA]/10 mb-2">
              <Droplet className="h-5 w-5 text-[#60A5FA]" />
            </div>
            <span className="text-lg font-bold text-white">1.2L</span>
            <span className="text-xs text-gray-400">Water</span>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="p-2 rounded-full bg-[#FFB56B]/10 mb-2">
              <Scale className="h-5 w-5 text-[#FFB56B]" />
            </div>
            <span className="text-lg font-bold text-white">75.2kg</span>
            <span className="text-xs text-gray-400">Weight</span>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="p-2 rounded-full bg-[#4ADE80]/10 mb-2">
              <Activity className="h-5 w-5 text-[#4ADE80]" />
            </div>
            <span className="text-lg font-bold text-white">8,540</span>
            <span className="text-xs text-gray-400">Steps</span>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold text-white">Today's Plan</h2>

      <Card className="bg-[#1E1E1E] border-none">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-[#FF7939]/10 mr-3">
                <Dumbbell className="h-5 w-5 text-[#FF7939]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Upper Body Workout</h3>
                <p className="text-xs text-gray-400">10:00 AM • 45 min</p>
              </div>
            </div>
            <div className="bg-[#FF7939] text-white px-2 py-1 rounded text-xs">Start</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-[#60A5FA]/10 mr-3">
                <Apple className="h-5 w-5 text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Lunch</h3>
                <p className="text-xs text-gray-400">1:00 PM • High Protein</p>
              </div>
            </div>
            <div className="bg-[#60A5FA] text-white px-2 py-1 rounded text-xs">View</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-[#4ADE80]/10 mr-3">
                <Calendar className="h-5 w-5 text-[#4ADE80]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Coach Meeting</h3>
                <p className="text-xs text-gray-400">5:30 PM • 30 min</p>
              </div>
            </div>
            <div className="bg-[#4ADE80] text-white px-2 py-1 rounded text-xs">Join</div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold text-white">Weekly Progress</h2>

      <Card className="bg-[#1E1E1E] border-none">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Trophy className="h-4 w-4 text-[#FFB56B] mr-2" />
                <span className="text-sm text-white">Workout Goal</span>
              </div>
              <span className="text-sm text-white">4/5 days</span>
            </div>
            <Progress value={80} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Flame className="h-4 w-4 text-[#FF7939] mr-2" />
                <span className="text-sm text-white">Calorie Goal</span>
              </div>
              <span className="text-sm text-white">1850/2000 kcal</span>
            </div>
            <Progress value={92.5} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Droplet className="h-4 w-4 text-[#60A5FA] mr-2" />
                <span className="text-sm text-white">Water Goal</span>
              </div>
              <span className="text-sm text-white">1.2/2.0 L</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
