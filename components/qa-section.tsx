import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function QASection() {
  return (
    <Card className="bg-[#1E1E1E] border-none mb-4">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-green-500" />
          Q&A Section
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-white font-semibold mb-2">
              Q: What's the best way to stay motivated during a fitness journey?
            </p>
            <div className="flex items-start space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>FC</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-gray-300 text-sm">
                  Set small, achievable goals and celebrate each milestone. Also, find a workout buddy or join a
                  community for support and accountability.
                </p>
                <div className="flex items-center mt-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="text-xs">42</span>
                  </Button>
                  <span className="text-xs text-gray-400 ml-2">Fitness Coach, 2h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4">
          Ask a Question
        </Button>
      </CardContent>
    </Card>
  )
}
