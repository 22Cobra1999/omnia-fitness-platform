import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Play, MessageSquare, Calendar, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { PostInteraction } from "@/components/post-interaction"

export function CoachPublication({ post }: { post: Post }) {
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
              <Button variant="outline" size="sm">
                Subscribe
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-white">{post.content}</p>
          {post.image && (
            <div className="mt-2 rounded-lg overflow-hidden relative">
              <Image
                src={post.image || "/placeholder.svg"}
                alt="Coach content"
                width={600}
                height={300}
                className="w-full"
              />
              <Button className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 hover:bg-white/30">
                <Play className="h-8 w-8 text-white" />
              </Button>
            </div>
          )}
          <div className="flex justify-between mt-4">
            <Button variant="ghost" size="sm">
              <MessageSquare className="h-5 w-5 mr-2" />
              Direct Message
            </Button>
            <Button variant="ghost" size="sm">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Session
            </Button>
          </div>
          <PostInteraction post={post} />
        </div>
      </CardHeader>
    </Card>
  )
}
