import React from "react"
import Image from "next/image"
import { Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkoutOption {
    title: string
    calories: number
    image?: string
    type: string
    videoUrl?: string
}

interface TrackerWorkoutSectionProps {
    title: string
    options: WorkoutOption[]
    coachNote: {
        title: string
        description: string
    }
}

export function TrackerWorkoutSection({ title, options, coachNote }: TrackerWorkoutSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#FF7939] hover:text-[#FF7939]/80"
                    onClick={() => console.log(`Refreshing ${title} options`)}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Refresh Options
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {options.map((option, index) => (
                            <Card
                                key={index}
                                className="bg-[#1E1E1E] overflow-hidden border-none hover:shadow-lg transition-shadow"
                            >
                                <div className="relative aspect-[4/3]">
                                    <Image
                                        src={option.image || "/placeholder.svg"}
                                        alt={option.title}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                    {option.videoUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                            <Play className="w-12 h-12 text-white" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-white mb-2">{option.title}</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">{option.calories} Cal / Session</span>
                                        <span className="text-sm text-[#FF7939]">{option.type}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="bg-[#1E1E1E]/50 border-none">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-[#FF7939]">Coach's Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h4 className="text-white font-medium mb-2">{coachNote.title}</h4>
                        <p className="text-sm text-gray-400">{coachNote.description}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
