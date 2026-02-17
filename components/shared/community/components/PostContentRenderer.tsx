import React from 'react'
import Image from "next/image"
import { Play, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopClientContribution } from '@/components/client/dashboard/top-client-contribution'
import { OmniaPublication } from '@/components/shared/community/omnia-publication'
import { LiveSession } from '@/components/shared/community/live-session'
import { Challenge } from '@/components/shared/community/challenge'
import { QASection } from '@/components/shared/community/qa-section'
import { SuccessStory } from '@/components/shared/community/success-story'
import { Post } from '../constants/mock-data'
import { FeedPostCard } from './FeedPostCard'

interface PostContentRendererProps {
    post: Post
    onSaveVideo?: (post: Post) => void
    setSelectedPost: React.Dispatch<React.SetStateAction<Post | null>>
    setIsSaveDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function PostContentRenderer({
    post,
    setSelectedPost,
    setIsSaveDialogOpen,
}: PostContentRendererProps) {
    switch (post.type) {
        case "coach":
        case "omnia":
            return <OmniaPublication post={post} />
        case "topClient":
            return <TopClientContribution post={post} />
        case "liveSession":
            return <LiveSession />
        case "challenge":
            return <Challenge />
        case "qa":
            return <QASection />
        case "successStory":
            return <SuccessStory />
        case "coachVideo":
        case "nutritionCoach":
            return (
                <FeedPostCard
                    post={post}
                    showSaveButton
                    onSaveClick={() => {
                        setSelectedPost(post)
                        setIsSaveDialogOpen(true)
                    }}
                >
                    <div className="mt-2 rounded-lg overflow-hidden relative">
                        <Image
                            src={post.thumbnail || "/placeholder.svg"}
                            alt="Video thumbnail"
                            width={600}
                            height={400}
                            className="w-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
                                <Play className="h-12 w-12" />
                            </Button>
                        </div>
                    </div>
                </FeedPostCard>
            )
        case "product":
            return (
                <FeedPostCard post={post}>
                    {post.image && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                            <Image
                                src={post.image || "/placeholder.svg"}
                                alt="Product image"
                                width={600}
                                height={400}
                                className="w-full"
                            />
                        </div>
                    )}
                    <div className="mt-4 bg-[#2A2A2A] p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="font-bold text-white text-lg">{post.product?.name}</h3>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-300">by</span>
                                    <span
                                        className={`ml-1 text-sm ${post.product?.isBrandOmnia ? "text-[#FF7939] font-semibold" : "text-gray-300"}`}
                                    >
                                        {post.product?.brand}
                                    </span>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-[#FF7939]">${post.product?.price.toFixed(2)}</span>
                        </div>
                        <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white mt-2">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Quick Purchase
                        </Button>
                    </div>
                </FeedPostCard>
            )
        default:
            return (
                <FeedPostCard post={post}>
                    {post.image && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                            <Image
                                src={post.image || "/placeholder.svg"}
                                alt="Post image"
                                width={600}
                                height={400}
                                className="w-full"
                            />
                        </div>
                    )}
                </FeedPostCard>
            )
    }
}
