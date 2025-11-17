import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, Users, Star, Trophy, Target, Video } from "lucide-react"
import { RewardsSection } from "./rewards-section"
import { ClientRewards } from "./client-rewards"
import { CoachRewards } from "./coach-rewards"

const rewardCategories = [
  {
    title: "Referral Rewards",
    icon: Users,
    description: "Earn points for inviting friends and colleagues to join OMNIA.",
    clientExample: "100 points for each referral, redeemable for discounts.",
    coachExample: "Cash bonus or premium features after 3 referrals.",
  },
  {
    title: "Affiliate Links",
    icon: Gift,
    description: "Coaches earn commissions on marketplace sales through unique codes.",
    example: "10% commission on fitness equipment or apparel sales.",
  },
  {
    title: "Active User Rewards",
    icon: Star,
    description: "Bonuses for maintaining an active presence on the platform.",
    clientExample: "Discounts after completing 5 programs with different coaches.",
    coachExample: "Bonuses at 10, 25, and 50 active clients.",
  },
  {
    title: "Fitness Completion",
    icon: Trophy,
    description: "Earn points for reaching fitness milestones and goals.",
    example: "50 points for every 10 workouts completed.",
  },
  {
    title: "Challenges",
    icon: Target,
    description: "Participate in weekly and monthly themed challenges.",
    example: "Exclusive badges and discounts for challenge winners.",
  },
  {
    title: "Content Creation",
    icon: Video,
    description: "Earn points by sharing workout content and tips.",
    example: "10 points per post, bonus for high engagement.",
  },
  {
    title: "Weekly Goals",
    icon: Target,
    description: "Earn discounts by completing weekly fitness and coaching goals.",
    clientExample: "5% off next purchase for completing 3 workouts this week.",
    coachExample: "10% off marketplace items for maintaining 90% client attendance.",
  },
]

export function RewardSystemDesign() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-10 text-gradient">Reward System Design</h2>
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">For Clients</TabsTrigger>
          <TabsTrigger value="coaches">For Coaches</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rewardCategories.map((category, index) => (
              <Card key={index} className="bg-[#1E1E1E] border-none shadow-custom-lg">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <category.icon className="h-6 w-6 text-[#FF7939]" />
                    <CardTitle className="text-white">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{category.description}</p>
                  <Badge variant="secondary" className="bg-[#FF7939] text-white">
                    {category.example || category.clientExample}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="clients">
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-white">Client Rewards Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RewardsSection />
              <ClientRewards />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="coaches">
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-white">Coach Rewards Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CoachRewards />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Active Clients</p>
                    <Progress value={80} className="h-2" />
                    <p className="text-sm text-gray-300 mt-1">40 / 50 for next bonus</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Content Engagement</p>
                    <Progress value={60} className="h-2" />
                    <p className="text-sm text-gray-300 mt-1">60% engagement rate</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Affiliate Performance</h3>
                <p className="text-sm text-gray-300 mb-2">Total Earnings: $1,250</p>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between text-gray-300">
                    <span>Fitness Equipment</span>
                    <Badge variant="secondary" className="bg-[#FF7939] text-white">
                      $750
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between text-gray-300">
                    <span>Nutrition Products</span>
                    <Badge variant="secondary" className="bg-[#FF7939] text-white">
                      $500
                    </Badge>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Upcoming Milestones</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <Star className="h-4 w-4 mr-2 text-[#FF7939]" />
                    <span>5 more referrals for premium feature access</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Trophy className="h-4 w-4 mr-2 text-[#FF7939]" />
                    <span>10 more active clients for cash bonus</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
