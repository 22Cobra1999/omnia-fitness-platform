import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function Challenge() {
  return (
    <Card className="bg-[#1E1E1E] border-none mb-4">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Weekly Challenge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold text-white mb-2">30-Day Plank Challenge</h3>
        <p className="text-gray-300 mb-4">
          Improve your core strength by participating in our 30-day plank challenge. Start with 30 seconds and work your
          way up!
        </p>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>15/30 days</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            <span className="text-gray-300">1,234 participants</span>
          </div>
          <Button variant="default" size="sm" className="bg-[#FF7939] hover:bg-[#E66829] text-white">
            Join Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
