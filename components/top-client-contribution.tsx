import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star, Trophy, MoreHorizontal } from "lucide-react"
import { PostInteraction } from "@/components/post-interaction"

export function TopClientContribution({ post }: { post: Post }) {
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
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-500 font-semibold">Top 50</span>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-white">{post.content}</p>
          <div className="mt-2 bg-[#2A2A2A] p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">My Routine:</h4>
            <ul className="list-disc list-inside text-gray-300">
              <li>Monday: Upper Body</li>
              <li>Wednesday: Lower Body</li>
              <li>Friday: Full Body HIIT</li>
              <li>Daily: 10k steps</li>
            </ul>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" size="sm">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Follow Journey
            </Button>
          </div>
          <PostInteraction post={post} />
        </div>
      </CardHeader>
    </Card>
  )
}
