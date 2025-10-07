"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from "recharts"
import { motion } from "framer-motion"
import { Star } from "lucide-react"

export function DailyStats({ stat }) {
  const maxValue = Math.max(...stat.weekData.map((d) => d.value))
  const prevWeekValue = stat.prevWeekData ? stat.prevWeekData[stat.prevWeekData.length - 1].value : 0
  const currentValue = stat.weekData[stat.weekData.length - 1].value
  const percentageChange = prevWeekValue ? (((currentValue - prevWeekValue) / prevWeekValue) * 100).toFixed(1) : 0

  return (
    <Card className="bg-[#1E1E1E] border-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
            <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
          </div>
          <Badge
            variant="outline"
            className={`${percentageChange >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
          >
            {percentageChange >= 0 ? "+" : ""}
            {percentageChange}%
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-400">{stat.name}</p>
          <div className="flex items-end space-x-2">
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <span className="text-sm text-gray-400">{stat.unit}</span>
          </div>
        </div>
        <div className="h-24 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stat.weekData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E1E1E",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill={stat.color} radius={[2, 2, 0, 0]}>
                {stat.weekData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value === maxValue ? stat.color : `${stat.color}40`}>
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="30%"
                      fill={stat.color}
                      fillOpacity={0.2}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                    {entry.value === maxValue && (
                      <motion.g
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <circle cx="50%" cy="30%" r="20%" fill="#FFD700" />
                        <Star x="40%" y="20%" width="20%" height="20%" fill="#FF7939" />
                      </motion.g>
                    )}
                    <text
                      x="50%"
                      y="85%"
                      textAnchor="middle"
                      fill={stat.color}
                      fontSize="10"
                      fontWeight="bold"
                      style={{ filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.5))" }}
                    >
                      {entry.day}
                    </text>
                  </Cell>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {stat.goal && (
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-400">{stat.goal}</span>
            </div>
            <Progress
              value={(stat.value / stat.goal) * 100}
              className="h-1"
              style={
                {
                  "--progress-background": stat.color,
                } as React.CSSProperties
              }
            />
          </div>
        )}
        {stat.status && <p className="text-sm text-gray-400 mt-2">{stat.status}</p>}
      </CardContent>
    </Card>
  )
}
