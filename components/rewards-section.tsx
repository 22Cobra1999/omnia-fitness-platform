"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { OmniaCoinIcon } from "./omnia-coin-icon"
import { Trophy, Star, Beer, Pizza, Music, IceCream, Coffee, Settings } from "lucide-react"
import { AvatarSelector } from "./avatar-selector"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Activity {
  name: string
  coinsEarned: number
  icon: React.ElementType
}

interface LeisureActivity {
  name: string
  cost: number
  icon: React.ElementType
}

const activities: Activity[] = [
  { name: "30-Day Workout Streak", coinsEarned: 500, icon: Trophy },
  { name: "Weight Loss Goal Achieved", coinsEarned: 300, icon: Star },
  { name: "Marathon Completed", coinsEarned: 1000, icon: Trophy },
  { name: "Nutrition Plan Followed", coinsEarned: 200, icon: Star },
  { name: "Personal Best in Deadlift", coinsEarned: 150, icon: Trophy },
]

const leisureActivities: LeisureActivity[] = [
  { name: "Beer", cost: 50, icon: Beer },
  { name: "Pizza", cost: 100, icon: Pizza },
  { name: "Night Out", cost: 500, icon: Music },
  { name: "Ice Cream", cost: 75, icon: IceCream },
  { name: "Coffee", cost: 25, icon: Coffee },
]

export const RewardsSection: React.FC = () => {
  const [coins, setCoins] = useState(1500)
  const [level, setLevel] = useState(5)
  const [xp, setXp] = useState(75)
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [isCustomizing, setIsCustomizing] = useState(false)

  const purchaseLeisure = (cost: number) => {
    if (coins >= cost) {
      setCoins(coins - cost)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-600 to-blue-500 border-none shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-32 h-32">
                <img
                  src={`https://v0.blob.com/${selectedAvatar === 1 ? "ecmww" : "tcied"}.png`}
                  alt="Selected Avatar"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Your Avatar</h3>
                <div className="flex items-center space-x-2">
                  <OmniaCoinIcon className="w-6 h-6" />
                  <span className="text-xl font-semibold text-yellow-300">{coins}</span>
                </div>
              </div>
            </div>
            <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1E1E1E] border-none">
                <DialogHeader>
                  <DialogTitle>Customize Avatar</DialogTitle>
                </DialogHeader>
                <AvatarSelector
                  selectedAvatar={selectedAvatar}
                  onSelect={(id) => {
                    setSelectedAvatar(id)
                    setIsCustomizing(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white mb-1">
              <span>Level {level}</span>
              <span>{xp}/100 XP</span>
            </div>
            <Progress value={xp} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#2A2A2A] border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Top Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between bg-[#3A3A3A] p-3 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <activity.icon className="w-6 h-6 text-yellow-400" />
                  <span className="text-white">{activity.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <OmniaCoinIcon className="w-5 h-5" />
                  <span className="text-yellow-300">{activity.coinsEarned}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#2A2A2A] border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Leisure Store</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {leisureActivities.map((activity, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center space-y-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-[#3A3A3A] flex items-center justify-center">
                  <activity.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-sm">{activity.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => purchaseLeisure(activity.cost)}
                  disabled={coins < activity.cost}
                >
                  <OmniaCoinIcon className="w-4 h-4 mr-1" />
                  {activity.cost}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
