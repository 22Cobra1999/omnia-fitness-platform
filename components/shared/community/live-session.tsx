import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Calendar } from "lucide-react"
import Image from "next/image"

export function LiveSession() {
  return (
    <Card className="bg-[#1E1E1E] border-none mb-4">
      <CardHeader>
        <CardTitle className="text-white">Upcoming Live Session</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Image
            src="/placeholder.svg?height=200&width=400"
            alt="Live session thumbnail"
            width={400}
            height={200}
            className="w-full rounded-lg"
          />
          <Button className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 hover:bg-white/30">
            <Play className="h-8 w-8 text-white" />
          </Button>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Nutrition Myths Debunked</h3>
        <p className="text-gray-300 mb-4">
          Join our expert nutritionist as we tackle common nutrition myths and provide evidence-based advice for your
          fitness journey.
        </p>
        <div className="flex justify-between">
          <Button variant="outline" size="sm">
            <Calendar className="h-5 w-5 mr-2" />
            Add to Calendar
          </Button>
          <Button variant="default" size="sm" className="bg-[#FF7939] hover:bg-[#E66829] text-white">
            Join Live
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
