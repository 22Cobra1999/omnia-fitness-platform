import React from 'react'
import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, BookmarkPlus } from "lucide-react"
import { PostInteraction } from '@/components/shared/community/post-interaction'
import { Post } from '../constants/mock-data'

interface FeedPostCardProps {
    post: Post
    onSaveClick?: () => void
    showSaveButton?: boolean
    children?: React.ReactNode
}

export function FeedPostCard({ post, onSaveClick, showSaveButton, children }: FeedPostCardProps) {
    return (
        <Card className="bg-[#1E1E1E] border-none mb-4 overflow-hidden">
            <CardHeader className="flex flex-row items-start space-x-4 p-4">
                <Avatar>
                    <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{post.user.name}</p>
                            <p className="text-sm text-gray-400 truncate">@{post.user.username}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {showSaveButton ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onSaveClick}
                                    className="hover:bg-white/5"
                                >
                                    <BookmarkPlus className="h-5 w-5 text-gray-400" />
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" className="hover:bg-white/5">
                                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-white leading-relaxed">{post.content}</p>
                    {children}
                    <div className="mt-4">
                        <PostInteraction post={post} />
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}
