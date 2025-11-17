"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExpertsPanelProps {
  category: string
}

const allExperts = {
  gym: [
    { name: "Phil Heath", specialty: "7x Mr. Olympia", avatar: "/phil-heath.jpg" },
    { name: "Mike Mentzer", specialty: "High Intensity Training", avatar: "/mike-mentzer.jpg" },
    { name: "Arnold Schwarzenegger", specialty: "Classic Bodybuilding", avatar: "/arnold.jpg" },
    { name: "Ronnie Coleman", specialty: "8x Mr. Olympia", avatar: "/ronnie-coleman.jpg" },
    { name: "Dorian Yates", specialty: "6x Mr. Olympia", avatar: "/dorian-yates.jpg" },
    { name: "Jay Cutler", specialty: "4x Mr. Olympia", avatar: "/jay-cutler.jpg" },
    { name: "Flex Wheeler", specialty: "IFBB Pro", avatar: "/flex-wheeler.jpg" },
    { name: "Lee Haney", specialty: "8x Mr. Olympia", avatar: "/lee-haney.jpg" },
    { name: "Frank Zane", specialty: "3x Mr. Olympia", avatar: "/frank-zane.jpg" },
  ],
  nutrition: [
    { name: "Emily Brown", specialty: "Sports Nutrition", avatar: "/emily-brown.jpg" },
    { name: "David Lee", specialty: "Diet Planning", avatar: "/david-lee.jpg" },
    { name: "Sarah Wilson", specialty: "Meal Prep", avatar: "/sarah-wilson.jpg" },
    { name: "Michael Johnson", specialty: "Macronutrient Balance", avatar: "/michael-johnson.jpg" },
    { name: "Lisa Chen", specialty: "Nutritional Biochemistry", avatar: "/lisa-chen.jpg" },
    { name: "Robert Smith", specialty: "Performance Nutrition", avatar: "/robert-smith.jpg" },
    { name: "Jessica Taylor", specialty: "Dietary Supplements", avatar: "/jessica-taylor.jpg" },
    { name: "Daniel Brown", specialty: "Plant-based Nutrition", avatar: "/daniel-brown.jpg" },
    { name: "Olivia Martinez", specialty: "Nutrition for Weight Loss", avatar: "/olivia-martinez.jpg" },
  ],
  fitness: [
    { name: "Alex Turner", specialty: "Yoga", avatar: "/alex-turner.jpg" },
    { name: "Olivia Parker", specialty: "Pilates", avatar: "/olivia-parker.jpg" },
    { name: "Chris Evans", specialty: "HIIT", avatar: "/chris-evans.jpg" },
    { name: "Emma Watson", specialty: "Functional Training", avatar: "/emma-watson.jpg" },
    { name: "Ryan Reynolds", specialty: "Strength and Conditioning", avatar: "/ryan-reynolds.jpg" },
    { name: "Natalie Portman", specialty: "Ballet Fitness", avatar: "/natalie-portman.jpg" },
    { name: "Tom Hardy", specialty: "Mixed Martial Arts", avatar: "/tom-hardy.jpg" },
    { name: "Scarlett Johansson", specialty: "Bodyweight Training", avatar: "/scarlett-johansson.jpg" },
    { name: "Chris Hemsworth", specialty: "Functional Strength", avatar: "/chris-hemsworth.jpg" },
  ],
}

export function ExpertsPanel({ category }: ExpertsPanelProps) {
  const [experts, setExperts] = useState(allExperts[category as keyof typeof allExperts].slice(0, 3))

  const refreshExperts = () => {
    const shuffled = [...allExperts[category as keyof typeof allExperts]].sort(() => 0.5 - Math.random())
    setExperts(shuffled.slice(0, 3))
  }

  return (
    <Card className="bg-[#1E1E1E] border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Experts</CardTitle>
        <Button variant="ghost" size="sm" onClick={refreshExperts}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {experts.map((expert, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={expert.avatar} alt={expert.name} className="grayscale" />
              <AvatarFallback>{expert.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{expert.name}</h3>
              <p className="text-xs text-gray-400">{expert.specialty}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
