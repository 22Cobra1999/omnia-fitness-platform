import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostInteraction } from "@/components/post-interaction"

export function OmniaPublication({ post }: { post: Post }) {
  return (
    <Card className="bg-[#1E1E1E] border-none mb-4">
      <CardHeader className="flex flex-row items-start space-x-4 p-4">
        <Avatar>
          <AvatarImage src={post.user.avatar} />
          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-white">{post.user.name}</p>
              <p className="text-sm text-gray-400">@{post.user.username}</p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
          <p className="mt-2 text-white">{post.content}</p>
          <Button variant="outline" size="sm" className="mt-4">
            <BookOpen className="h-5 w-5 mr-2" />
            Learn More
          </Button>
          <div className="bg-[#2A2A2A] p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-white mb-2">Upcoming Event:</h4>
            <p className="text-gray-300 mb-2">Join our "Mindful Meditation" session this Friday at 7 PM EST.</p>
            <Button variant="outline" size="sm">
              <Calendar className="h-5 w-5 mr-2" />
              Add to Calendar
            </Button>
          </div>
          <PostInteraction post={post} />
        </div>
      </CardHeader>
    </Card>
  )
}
