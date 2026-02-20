import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronLeft, ChevronRight, Trash, Play, Plus, ChevronsUpDown, Check } from "lucide-react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { cn } from '@/lib/utils/utils'
import type { VideoFile } from "../fitness-insights-data"

interface FitnessJourneyProps {
    selectedWeek: Date
    selectedDate: Date
    myJourneyVideos: VideoFile[]
    categoryInput: string
    categorySuggestions: string[]
    goToPreviousWeek: () => void
    goToNextWeek: () => void
    goToPreviousDay: () => void
    goToNextDay: () => void
    updateExercise: (id: string, field: keyof VideoFile, value: string | number) => void
    setCategoryInput: (val: string) => void
    setCategorySuggestions: React.Dispatch<React.SetStateAction<string[]>>
    formatRepsXSeries: (val: string) => string
    handlePlayVideo: (url: string, title: string) => void
    setMyJourneyVideos: React.Dispatch<React.SetStateAction<VideoFile[]>>
}

export const FitnessJourney = ({
    selectedWeek,
    selectedDate,
    myJourneyVideos,
    categoryInput,
    categorySuggestions,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    updateExercise,
    setCategoryInput,
    setCategorySuggestions,
    formatRepsXSeries,
    handlePlayVideo,
    setMyJourneyVideos
}: FitnessJourneyProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="col-span-12 mt-6"
        >
            <Card className="bg-[#1E1E1E] text-white shadow-2xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={goToPreviousWeek} className="p-0">
                                <ChevronLeft className="h-4 w-4 text-white" />
                            </Button>
                            <span className="text-white text-sm font-mitr font-bold">
                                {format(startOfWeek(selectedWeek), "MMM d")} - {format(endOfWeek(selectedWeek), "MMM d")}
                            </span>
                            <Button variant="ghost" size="sm" onClick={goToNextWeek} className="p-0">
                                <ChevronRight className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <h3 className="text-xl font-mitr font-bold text-[#FF7939]">{format(selectedDate, "EEEE")}</h3>
                            <Button variant="ghost" size="icon" onClick={goToNextDay}>
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center mt-2">
                        <CardTitle className="text-2xl font-mitr font-bold text-center">
                            My <span className="text-[#FF7939]">Fitness</span> Journey
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="max-h-[400px]">
                        {myJourneyVideos.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs">
                                        <th className="p-2">Time</th>
                                        <th className="p-2 w-48 text-center">Exercise</th>
                                        <th className="p-2 w-36 text-center">Category</th>
                                        <th className="p-2">Duration</th>
                                        <th className="p-2">Reps x Series</th>
                                        <th className="p-2">Calories</th>
                                        <th className="p-2">Note</th>
                                        <th className="p-2">Actions</th>
                                        <th className="p-2">Play</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {myJourneyVideos.map((video) => (
                                        <tr key={video.id} className="border-t border-gray-700">
                                            <td className="p-2">
                                                <Input
                                                    type="time"
                                                    value={video.time || ""}
                                                    onChange={(e) => updateExercise(video.id, "time", e.target.value)}
                                                    className="bg-transparent border-none"
                                                />
                                            </td>
                                            <td className="p-2 w-48">{video.title || ""}</td>
                                            <td className="p-2 w-36">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="w-full justify-between bg-transparent border-none"
                                                        >
                                                            {video.category || "Select category"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0">
                                                        <Command>
                                                            <CommandInput
                                                                placeholder="Search category..."
                                                                value={categoryInput}
                                                                onValueChange={setCategoryInput}
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="w-full justify-start"
                                                                        onClick={() => {
                                                                            if (categoryInput.trim() !== "") {
                                                                                setCategorySuggestions((prev) => [...prev, categoryInput])
                                                                                updateExercise(video.id, "category", categoryInput)
                                                                                setCategoryInput("")
                                                                            }
                                                                        }}
                                                                    >
                                                                        Add "{categoryInput}"
                                                                    </Button>
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {categorySuggestions.map((category) => (
                                                                        <CommandItem
                                                                            key={category}
                                                                            onSelect={() => {
                                                                                updateExercise(video.id, "category", category)
                                                                                setCategoryInput("")
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    video.category === category ? "opacity-100" : "opacity-0",
                                                                                )}
                                                                            />
                                                                            {category}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={video.duration || "0"}
                                                    onChange={(e) => updateExercise(video.id, "duration", e.target.value)}
                                                    className="bg-transparent border-none"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center">
                                                    <Input
                                                        value={video.repsXSeries ? video.repsXSeries.split("x")[0].trim() : "0"}
                                                        onChange={(e) => {
                                                            const newValue = formatRepsXSeries(
                                                                `${e.target.value || "0"} x ${video.repsXSeries ? video.repsXSeries.split("x")[1]?.trim() || "0" : "0"}`,
                                                            )
                                                            updateExercise(video.id, "repsXSeries", newValue)
                                                        }}
                                                        className="bg-transparent border-none w-12 text-center"
                                                    />
                                                    <span className="mx-1">x</span>
                                                    <Input
                                                        value={video.repsXSeries ? video.repsXSeries.split("x")[1]?.trim() || "0" : "0"}
                                                        onChange={(e) => {
                                                            const newValue = formatRepsXSeries(
                                                                `${video.repsXSeries ? video.repsXSeries.split("x")[0]?.trim() || "0" : "0"} x ${e.target.value || "0"}`,
                                                            )
                                                            updateExercise(video.id, "repsXSeries", newValue)
                                                        }}
                                                        className="bg-transparent border-none w-12 text-center"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    value={video.calories || 0}
                                                    onChange={(e) => updateExercise(video.id, "calories", Number(e.target.value))}
                                                    className="bg-transparent border-none"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={video.note || ""}
                                                    onChange={(e) => updateExercise(video.id, "note", e.target.value)}
                                                    className="bg-transparent border-none"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => {
                                                        const updatedVideos = myJourneyVideos.filter((v) => v.id !== video.id)
                                                        setMyJourneyVideos(updatedVideos)
                                                        localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updatedVideos))
                                                    }}
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </td>
                                            <td className="p-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handlePlayVideo(video.videoUrl || "/placeholder.mp4", video.title)}
                                                    className={`rounded-full w-8 h-8 flex items-center justify-center ${video.videoUrl ? "bg-[#FF7939] hover:bg-[#E66829]" : "bg-gray-600 hover:bg-gray-500"
                                                        } text-white`}
                                                >
                                                    <Play className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newExercise = {
                                            id: crypto.randomUUID(),
                                            time: format(new Date(), "HH:mm"),
                                            title: "Quick Add Exercise",
                                            category: "Other",
                                            duration: "0 min",
                                            repsXSeries: "0 x 0",
                                            calories: 0,
                                            note: "",
                                        }
                                        setMyJourneyVideos((prev) => {
                                            const updatedJourney = [...prev, newExercise]
                                            localStorage.setItem("fitnessJourneyVideos", JSON.stringify(updatedJourney))
                                            return updatedJourney
                                        })
                                    }}
                                    className="rounded-full bg-[#FF7939] hover:bg-[#E66829] w-12 h-12 flex items-center justify-center mb-4"
                                >
                                    <Plus className="w-6 h-6 text-white" />
                                </Button>
                                <p className="text-center text-gray-400">Add your first exercise to start your journey</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </motion.div>
    )
}
