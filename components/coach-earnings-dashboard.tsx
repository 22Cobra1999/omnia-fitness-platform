"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DollarSign, Users, TrendingUp, ShoppingBag, Gift, Clock, Activity } from "lucide-react"

const earningsData = [
  { month: "Jan", earnings: 2500, clients: 15, sessions: 45 },
  { month: "Feb", earnings: 3200, clients: 18, sessions: 52 },
  { month: "Mar", earnings: 2800, clients: 16, sessions: 48 },
  { month: "Apr", earnings: 3800, clients: 22, sessions: 65 },
  { month: "May", earnings: 4200, clients: 25, sessions: 75 },
  { month: "Jun", earnings: 4500, clients: 28, sessions: 84 },
]

const revenueStreams = [
  { name: "Personal Training", value: 60 },
  { name: "Group Classes", value: 20 },
  { name: "Online Programs", value: 15 },
  { name: "Product Sales", value: 5 },
]

const marketplaceOffers = [
  {
    title: "Premium Equipment Bundle",
    discount: "25% OFF",
    condition: "Complete 50 training sessions",
    progress: 80,
  },
  {
    title: "Nutrition Supplements Pack",
    discount: "30% OFF",
    condition: "Maintain 20 active clients for 3 months",
    progress: 65,
  },
  {
    title: "Digital Course Creation Tools",
    discount: "50% OFF",
    condition: "Generate $5000 in monthly revenue",
    progress: 90,
  },
]

const COLORS = ["#FF7939", "#FFB56B", "#FFD700", "#4ADE80"]

export function CoachEarningsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-full bg-[#FF7939]/10">
                <DollarSign className="h-6 w-6 text-[#FF7939]" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                +12.5%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mt-4">$4,500</h3>
            <p className="text-sm text-gray-400">Monthly Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-full bg-[#FFB56B]/10">
                <Users className="h-6 w-6 text-[#FFB56B]" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                +8.3%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mt-4">28</h3>
            <p className="text-sm text-gray-400">Active Clients</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-full bg-[#FFD700]/10">
                <Clock className="h-6 w-6 text-[#FFD700]" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                +15.2%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mt-4">84</h3>
            <p className="text-sm text-gray-400">Monthly Sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-full bg-[#4ADE80]/10">
                <Activity className="h-6 w-6 text-[#4ADE80]" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                95%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mt-4">4.8/5</h3>
            <p className="text-sm text-gray-400">Client Satisfaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1E1E1E] border-none md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#FF7939]" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="earnings" stroke="#FF7939" strokeWidth={2} dot={{ fill: "#FF7939" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#FF7939]" />
              Revenue Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueStreams}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueStreams.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "none",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {revenueStreams.map((stream, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-gray-400">
                    {stream.name} ({stream.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#FF7939]" />
            Marketplace Offers & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketplaceOffers.map((offer, index) => (
              <Card key={index} className="bg-[#2A2A2A] border-none">
                <CardContent className="p-4">
                  <Badge className="bg-[#FF7939] text-white mb-2">{offer.discount}</Badge>
                  <h4 className="font-semibold text-white mb-2">{offer.title}</h4>
                  <p className="text-sm text-gray-400 mb-4">{offer.condition}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">{offer.progress}%</span>
                    </div>
                    <Progress value={offer.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
