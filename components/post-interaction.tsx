import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react"

export function PostInteraction({ post }: { post: Post }) {
  return (
    <div className="flex justify-between mt-4">
      <Button variant="ghost" size="icon">
        <MessageCircle className="h-5 w-5 text-gray-400" />
        <span className="ml-2 text-sm text-gray-400">{post.comments}</span>
      </Button>
      <Button variant="ghost" size="icon">
        <Repeat2 className="h-5 w-5 text-gray-400" />
        <span className="ml-2 text-sm text-gray-400">{post.reposts}</span>
      </Button>
      <Button variant="ghost" size="icon">
        <Heart className="h-5 w-5 text-gray-400" />
        <span className="ml-2 text-sm text-gray-400">{post.likes}</span>
      </Button>
      <Button variant="ghost" size="icon">
        <Share className="h-5 w-5 text-gray-400" />
      </Button>
    </div>
  )
}
