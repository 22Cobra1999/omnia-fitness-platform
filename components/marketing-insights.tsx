"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", value: 400 },
  { month: "Feb", value: 600 },
  { month: "Mar", value: 800 },
  { month: "Apr", value: 1000 },
  { month: "May", value: 1400 },
  { month: "Jun", value: 2000 },
]

export function MarketingInsights() {
  return (
    <div className="relative min-h-screen bg-[#121212] p-8">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dotted Lines */}
        <svg className="absolute top-20 left-20" width="200" height="200">
          <line
            x1="0"
            y1="0"
            x2="200"
            y2="200"
            stroke="#333"
            strokeWidth="1"
            strokeDasharray="5,5"
            className="opacity-50"
          />
        </svg>
        <svg className="absolute bottom-20 right-20" width="200" height="200">
          <line
            x1="200"
            y1="0"
            x2="0"
            y2="200"
            stroke="#333"
            strokeWidth="1"
            strokeDasharray="5,5"
            className="opacity-50"
          />
        </svg>

        {/* Decorative Circles */}
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 rounded-full bg-[#FF7939]/10"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-[#FF7939]/5" />

        {/* Small Dots */}
        <div className="absolute top-40 left-1/4 w-2 h-2 rounded-full bg-[#FF7939]" />
        <div className="absolute top-60 right-1/3 w-2 h-2 rounded-full bg-black" />
        <div className="absolute bottom-40 right-1/4 w-2 h-2 rounded-full bg-[#FF7939]" />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 grid gap-8 max-w-6xl mx-auto">
        {/* Title Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <Card className="bg-[#1E1E1E] border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white">Digital Marketing Starter Guide</CardTitle>
            </CardHeader>
          </Card>
          {/* Connecting Line */}
          <svg className="absolute -bottom-8 left-1/2 transform -translate-x-1/2" width="2" height="40">
            <line x1="1" y1="0" x2="1" y2="40" stroke="#333" strokeDasharray="4,4" />
          </svg>
        </motion.div>

        {/* Main Content Cards */}
        <div className="grid grid-cols-2 gap-8">
          {/* Background Card */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-black">Background</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                <p>Learn how digital marketing strategies can transform your business growth and online presence.</p>
              </CardContent>
            </Card>
            {/* Connecting Line */}
            <svg className="absolute -right-4 top-1/2 transform -translate-y-1/2" width="40" height="2">
              <line x1="0" y1="1" x2="40" y2="1" stroke="#333" strokeDasharray="4,4" />
            </svg>
          </motion.div>

          {/* Key Highlights Card */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <Card className="bg-[#FF7939] text-white">
              <CardHeader>
                <CardTitle>Key Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E1E1E",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={{ fill: "#fff" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Card */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="col-span-2">
            <Card className="bg-black text-white">
              <CardContent className="p-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
                    <p className="text-gray-400">Transform your digital presence today.</p>
                  </div>
                  <motion.button
                    className="px-6 py-3 bg-[#FF7939] rounded-lg text-white font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FF7939]" />
          <div className="w-2 h-2 rounded-full bg-white" />
          <div className="w-2 h-2 rounded-full bg-[#FF7939]" />
        </div>
      </div>
    </div>
  )
}
