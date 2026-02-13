import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from '@/components/shared/video/video-player'
import { Play, ChevronLeft, ChevronRight } from "lucide-react"

interface FitnessVideoPlayerProps {
    currentVideoIndex: number | null
    myJourneyVideos: any[]
    isPlaying: boolean
    volume: number
    isMuted: boolean
    handlePreviousVideo: () => void
    handleNextVideo: () => void
    playMyJourney: () => void
}

export const FitnessVideoPlayer = ({
    currentVideoIndex,
    myJourneyVideos,
    isPlaying,
    volume,
    isMuted,
    handlePreviousVideo,
    handleNextVideo,
    playMyJourney
}: FitnessVideoPlayerProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 mb-6"
        >
            <div className="relative">
                {/* Orange frame with arrow */}
                <div className="absolute -top-6 left-1/2 bg-[#FF7939] text-white p-3.5 rounded-lg z-10 transform -translate-x-1/2 scale-90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-white">
                            <Play className="h-5 w-5 text-[#FF7939]" />
                        </div>
                        <h3 className="text-xl font-bold">Video Player</h3>
                    </div>
                    {/* Arrow extension */}
                    <div className="absolute left-1/2 bottom-0 w-5 h-5 bg-[#FF7939] transform rotate-45 translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Content container */}
                <div className="bg-black text-white rounded-lg p-6 pt-16">
                    <Card className="bg-[#1E1E1E] border-none shadow-xl">
                        <CardHeader className="pb-0" />
                        <CardContent>
                            {currentVideoIndex !== null && myJourneyVideos[currentVideoIndex] ? (
                                <VideoPlayer
                                    src={myJourneyVideos[currentVideoIndex].videoUrl || ""}
                                    title={myJourneyVideos[currentVideoIndex].title}
                                />
                            ) : (
                                <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
                                    No video selected
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-4 mb-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePreviousVideo}
                                    disabled={currentVideoIndex === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold">
                                        {currentVideoIndex !== null && myJourneyVideos[currentVideoIndex]
                                            ? myJourneyVideos[currentVideoIndex].title
                                            : "No video selected"}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {currentVideoIndex !== null && myJourneyVideos[currentVideoIndex]
                                            ? myJourneyVideos[currentVideoIndex].category
                                            : ""}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleNextVideo}
                                    disabled={currentVideoIndex === null || currentVideoIndex === myJourneyVideos.length - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button className="mt-2 w-full bg-[#FF7939] hover:bg-[#E66829]" onClick={playMyJourney}>
                                Play My Journey
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    )
}
