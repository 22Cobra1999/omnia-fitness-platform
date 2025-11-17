"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GeometricBackground } from '@/components/shared/misc/geometric-background'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const performanceData = [
  { time: "00:00", value: 65 },
  { time: "04:00", value: 75 },
  { time: "08:00", value: 85 },
  { time: "12:00", value: 78 },
  { time: "16:00", value: 88 },
  { time: "20:00", value: 92 },
  { time: "23:59", value: 82 },
]

export function FitnessTracking() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-semibold text-center mb-16 text-gradient">Track Your Progress</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-white">Daily Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Recovery</span>
                    <span className="text-[#4ADE80]">87%</span>
                  </div>
                  <div className="h-2 relative bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#4ADE80] w-[87%] rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sleep Quality</span>
                    <span className="text-[#60A5FA]">79%</span>
                  </div>
                  <div className="h-2 relative bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#60A5FA] w-[79%] rounded-full" />
                  </div>
                </div>
              </div>

              <div className="aspect-square relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">14.2</div>
                    <div className="text-sm text-gray-400">Effort Score</div>
                  </div>
                </div>
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" className="fill-none stroke-gray-800" strokeWidth="5%" />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="fill-none stroke-[#4ADE80]"
                    strokeWidth="5%"
                    strokeDasharray="282.7433388230814"
                    strokeDashoffset="70.68583470577035"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-white">Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                  <XAxis dataKey="time" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#4ADE80" strokeWidth={2} dot={{ fill: "#4ADE80" }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily Goal Progress</span>
                    <span className="text-[#4ADE80]">82%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4ADE80] rounded-full" style={{ width: `${82}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
