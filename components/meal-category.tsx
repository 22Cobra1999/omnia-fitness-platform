"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

interface MealOption {
  title: string
  calories: number
  image: string
  type: string
  videoUrl?: string
}

interface MealCategoryProps {
  title: string
  options: MealOption[]
  coachNote?: {
    title: string
    description: string
  }
  selectedDate: Date
  selectedMeals?: any
  onMealSelect?: any
}

export function MealCategory({
  title,
  options,
  coachNote,
  selectedDate,
  selectedMeals,
  onMealSelect,
}: MealCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-8">
      <Collapsible>
        <div className="flex justify-between items-center mb-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
              <h3 className="text-2xl font-bold text-white mr-2">{title}</h3>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <span className="text-gray-400">{format(selectedDate, "MMM dd, yyyy")}</span>
        </div>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-[#1E1E1E] overflow-hidden border-none hover:shadow-lg transition-shadow">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={option.image || "/placeholder.svg"}
                          alt={option.title}
                          fill
                          className="object-cover"
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
                          <span className="text-sm text-gray-400">{option.calories} Cal / Serving</span>
                          <span className="text-sm text-[#FF7939]">{option.type}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Coach's Note */}
            {coachNote && (
              <Card className="bg-[#1E1E1E]/50 border-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-[#FF7939]">Coach's Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="text-white font-medium mb-2">{coachNote.title}</h4>
                  <p className="text-sm text-gray-400">{coachNote.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
