"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Clock, Target, Users, LogOut, Settings, Coins, MessageSquare, Lightbulb } from "lucide-react"

interface IdeaCard {
  id: string
  title: string
  description: string
  reward: number
  timeRemaining: string
  targetAudience: string
  matchScore: number
  responses: number
  totalResponses: number
  estimatedTime: number
}

interface UserStats {
  feedbackGiven: number
  tokensEarned: number
  ideasCreated: number
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats>({ feedbackGiven: 0, tokensEarned: 0, ideasCreated: 0 })
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [userName, setUserName] = useState("Anonymous")
  const [walletAddress] = useState("0x1234...5678")

  // Simulate loading user data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)

      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Load user stats with animation
      const stats = { feedbackGiven: 24, tokensEarned: 12.5, ideasCreated: 3 }
      setUserStats(stats)

      // Load user name from profile
      setUserName("Alex Chen")

      // Load ideas
      const mockIdeas: IdeaCard[] = [
        {
          id: "1",
          title: "AI-powered meal planning app for busy professionals",
          description:
            "An app that creates personalized meal plans based on dietary preferences, schedule, and local grocery availability",
          reward: 0.8,
          timeRemaining: "2 days left",
          targetAudience: "Age 25-35, Tech professionals, Urban areas",
          matchScore: 95,
          responses: 12,
          totalResponses: 50,
          estimatedTime: 3,
        },
        {
          id: "2",
          title: "Sustainable packaging solution for e-commerce",
          description: "Biodegradable packaging materials that reduce shipping costs and environmental impact",
          reward: 1.2,
          timeRemaining: "5 days left",
          targetAudience: "E-commerce managers, Sustainability advocates",
          matchScore: 87,
          responses: 8,
          totalResponses: 30,
          estimatedTime: 4,
        },
        {
          id: "3",
          title: "Remote team collaboration workspace",
          description: "Virtual office environment with spatial audio and presence indicators for distributed teams",
          reward: 0.6,
          timeRemaining: "1 day left",
          targetAudience: "Remote workers, Team leads, Tech companies",
          matchScore: 92,
          responses: 28,
          totalResponses: 40,
          estimatedTime: 5,
        },
        {
          id: "4",
          title: "Personal finance tracker for freelancers",
          description:
            "Automated expense tracking and tax preparation tool specifically designed for gig economy workers",
          reward: 0.9,
          timeRemaining: "3 days left",
          targetAudience: "Freelancers, Gig workers, Self-employed",
          matchScore: 89,
          responses: 15,
          totalResponses: 35,
          estimatedTime: 3,
        },
        {
          id: "5",
          title: "Smart home energy optimization system",
          description: "IoT-based system that learns usage patterns and automatically optimizes energy consumption",
          reward: 1.5,
          timeRemaining: "4 days left",
          targetAudience: "Homeowners, Tech enthusiasts, Eco-conscious",
          matchScore: 78,
          responses: 6,
          totalResponses: 25,
          estimatedTime: 6,
        },
      ]

      setIdeas(mockIdeas)
      setIsLoading(false)
    }

    loadDashboardData()
  }, [])

  // Animated counter effect
  const [animatedStats, setAnimatedStats] = useState<UserStats>({ feedbackGiven: 0, tokensEarned: 0, ideasCreated: 0 })

  useEffect(() => {
    if (isLoading) return

    const animateCounter = (key: keyof UserStats, target: number) => {
      let current = 0
      const increment = target / 30
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setAnimatedStats((prev) => ({ ...prev, [key]: target }))
          clearInterval(timer)
        } else {
          setAnimatedStats((prev) => ({ ...prev, [key]: Math.floor(current * 10) / 10 }))
        }
      }, 50)
    }

    animateCounter("feedbackGiven", userStats.feedbackGiven)
    setTimeout(() => animateCounter("tokensEarned", userStats.tokensEarned), 200)
    setTimeout(() => animateCounter("ideasCreated", userStats.ideasCreated), 400)
  }, [isLoading, userStats])

  const handleDisconnectWallet = () => {
    localStorage.removeItem("walletConnected")
    window.location.href = "/"
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 75) return "bg-yellow-500"
    return "bg-orange-500"
  }

  const SkeletonCard = () => (
    <div className="bg-[#2F2F2F] border border-[#404040] rounded-lg p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-5 bg-[#404040] rounded w-3/4"></div>
        <div className="h-6 bg-[#404040] rounded w-16"></div>
      </div>
      <div className="h-4 bg-[#404040] rounded w-full mb-2"></div>
      <div className="h-4 bg-[#404040] rounded w-2/3 mb-4"></div>
      <div className="h-3 bg-[#404040] rounded w-1/2 mb-4"></div>
      <div className="h-2 bg-[#404040] rounded w-full mb-4"></div>
      <div className="h-10 bg-[#404040] rounded w-full"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif]">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#191919]/80 backdrop-blur-md border-b border-[#2F2F2F]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Validify</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 hover:bg-[#2F2F2F] transition-colors duration-200"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#2383E2] text-white text-sm">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{userName}</div>
                  <div className="text-xs text-[#888]">{walletAddress}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2F2F2F] border-[#404040] text-white w-56">
              <DropdownMenuItem className="hover:bg-[#404040] cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#404040]" />
              <DropdownMenuItem
                className="hover:bg-[#404040] cursor-pointer text-red-400 hover:text-red-300"
                onClick={handleDisconnectWallet}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back, {userName}</h1>
          <p className="text-[#E5E5E5] mb-6">Here are new ideas that match your interests</p>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#2F2F2F] border border-[#404040] rounded-lg p-4 hover:border-[#606060] transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2383E2]/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#2383E2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{animatedStats.feedbackGiven}</div>
                  <div className="text-sm text-[#888]">Feedback Given</div>
                </div>
              </div>
            </div>

            <div className="bg-[#2F2F2F] border border-[#404040] rounded-lg p-4 hover:border-[#606060] transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Coins className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{animatedStats.tokensEarned} USDC</div>
                  <div className="text-sm text-[#888]">Tokens Earned</div>
                </div>
              </div>
            </div>

            <div className="bg-[#2F2F2F] border border-[#404040] rounded-lg p-4 hover:border-[#606060] transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{animatedStats.ideasCreated}</div>
                  <div className="text-sm text-[#888]">Ideas Created</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Idea Card */}
          <div className="bg-[#2F2F2F] border-2 border-dashed border-[#4A4A4A] rounded-lg p-8 hover:border-[#2383E2] hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-[#2383E2]/10 cursor-pointer group">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2383E2]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#2383E2]/30 transition-colors duration-300">
                <Plus className="w-8 h-8 text-[#2383E2] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Have Your Own Idea?</h3>
              <p className="text-[#E5E5E5] mb-6 leading-relaxed">
                Create a validation poll and get feedback from your target audience
              </p>
              <Button
                variant="outline"
                className="border-[#2383E2] text-[#2383E2] hover:bg-[#2383E2] hover:text-white transition-all duration-200"
                onClick={() => (window.location.href = "/create-poll")}
              >
                Create Poll
              </Button>
            </div>
          </div>

          {/* Idea Cards */}
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)
            : ideas.map((idea, index) => (
                <div
                  key={idea.id}
                  className="bg-[#2F2F2F] border border-[#404040] rounded-lg p-6 hover:border-[#606060] hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white leading-tight flex-1 mr-3">{idea.title}</h3>
                    <Badge className="bg-[#2383E2]/20 text-[#2383E2] hover:bg-[#2383E2]/30 flex items-center gap-1 shrink-0">
                      <Coins className="w-3 h-3" />
                      {idea.reward} USDC
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-[#E5E5E5] text-sm mb-4 leading-relaxed line-clamp-2">{idea.description}</p>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-[#888]" />
                    <span className="text-sm text-[#888]">{idea.timeRemaining}</span>
                  </div>

                  {/* Targeting Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-[#888]" />
                      <span className="text-sm text-[#E5E5E5]">{idea.targetAudience}</span>
                    </div>
                    <Badge className={`${getMatchScoreColor(idea.matchScore)} text-white text-xs`}>
                      {idea.matchScore}% match
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#E5E5E5]">
                        {idea.responses}/{idea.totalResponses} responses
                      </span>
                      <span className="text-sm text-[#888]">
                        {Math.round((idea.responses / idea.totalResponses) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(idea.responses / idea.totalResponses) * 100}
                      className="h-2 bg-[#404040] [&>div]:bg-[#2383E2] [&>div]:transition-all [&>div]:duration-500"
                    />
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full bg-[#2383E2] hover:bg-[#1a6bc7] text-white transition-all duration-200 hover:scale-[0.98] group-hover:shadow-lg"
                    onClick={() => (window.location.href = `/feedback/${idea.id}`)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Give Feedback
                  </Button>
                  <p className="text-xs text-[#888] text-center mt-2">~{idea.estimatedTime} minutes</p>
                </div>
              ))}
        </div>

        {/* Empty State (if no ideas) */}
        {!isLoading && ideas.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#2F2F2F] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-12 h-12 text-[#888]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No new ideas match your preferences right now</h3>
            <p className="text-[#888] mb-6">Check back later or adjust your profile settings</p>
            <Button
              variant="outline"
              className="border-[#2383E2] text-[#2383E2] hover:bg-[#2383E2] hover:text-white"
              onClick={() => (window.location.href = "/profile-setup")}
            >
              Update Preferences
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
