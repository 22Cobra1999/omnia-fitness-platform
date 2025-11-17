import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

export function SuccessStory() {
  return (
    <Card className="bg-[#1E1E1E] border-none mb-4">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          Success Story
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg?height=48&width=48" />
            <AvatarFallback>SS</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">Sarah's Transformation</h3>
            <p className="text-gray-400">Lost 30 lbs in 6 months</p>
          </div>
        </div>
        <p className="text-gray-300 mb-4">
          "OMNIA's personalized approach and supportive community helped me achieve my fitness goals. I've never felt
          better!"
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Image
            src="/placeholder.svg?height=150&width=150"
            alt="Before"
            width={150}
            height={150}
            className="rounded-lg"
          />
          <Image
            src="/placeholder.svg?height=150&width=150"
            alt="After"
            width={150}
            height={150}
            className="rounded-lg"
          />
        </div>
        <Button variant="outline" size="sm" className="w-full">
          Read Full Story
        </Button>
      </CardContent>
    </Card>
  )
}
