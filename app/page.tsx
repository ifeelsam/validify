"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Lightbulb, Users, Coins, Check, Loader2, Wallet } from "lucide-react"

export default function ValidifyLanding() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [heroTextVisible, setHeroTextVisible] = useState(false)
  const [subheadingVisible, setSubheadingVisible] = useState(false)
  const [featuresVisible, setFeaturesVisible] = useState(false)

  // Next.js router
  const router = useRouter()

  // Wagmi hooks
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()

  // Debug connectors
  useEffect(() => {
    console.log('Available connectors:', connectors.map(c => ({ 
      name: c.name, 
      id: c.id, 
      uid: c.uid,
      ready: c.ready,
      type: c.type 
    })))
  }, [connectors])

  const heroRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  // Typewriter effect for hero text
  const [heroText, setHeroText] = useState("")
  const fullHeroText = "Validate Your Ideas. Get Paid Feedback."

  // Stats animation
  const [statsAnimated, setStatsAnimated] = useState(false)
  const [ideasCount, setIdeasCount] = useState(0)
  const [providersCount, setProvidersCount] = useState(0)
  const [rewardsCount, setRewardsCount] = useState(0)

  // Redirect to profile setup when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // Small delay to show success state, then redirect
      const timer = setTimeout(() => {
        router.push('/profile-setup')
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected, address, router])

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Hero animations sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setHeroTextVisible(true), 300)
    const timer2 = setTimeout(() => setSubheadingVisible(true), 800)
    const timer3 = setTimeout(() => setFeaturesVisible(true), 1200)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  // Typewriter effect
  useEffect(() => {
    if (!heroTextVisible) return

    let index = 0
    const timer = setInterval(() => {
      if (index <= fullHeroText.length) {
        setHeroText(fullHeroText.slice(0, index))
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [heroTextVisible])

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Stats counter animation
  useEffect(() => {
    if (!statsAnimated) return

    const animateCounter = (setter: React.Dispatch<React.SetStateAction<number>>, target: number, duration: number) => {
      let start = 0
      const increment = target / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.floor(start))
        }
      }, 16)
    }

    animateCounter(setIdeasCount, 1000, 2000)
    animateCounter(setProvidersCount, 50000, 2500)
    animateCounter(setRewardsCount, 100000, 3000)
  }, [statsAnimated])

  // Stats intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsAnimated) {
            setStatsAnimated(true)
          }
        })
      },
      { threshold: 0.5 },
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [statsAnimated])

  const handleWalletConnect = (connector: any) => {
    connect({ connector })
  }

  const handleDisconnect = () => {
    disconnect()
    setShowWalletModal(false)
  }

  const getConnectorIcon = (connectorName: string) => {
    switch (connectorName.toLowerCase()) {
      case 'metamask':
        return "🦊"
      case 'walletconnect':
        return "🔗"
      case 'coinbase wallet':
        return "🔵"
      default:
        return "👛"
    }
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif] overflow-x-hidden">
      {/* Fixed Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#191919]/80 backdrop-blur-md border-b border-[#2F2F2F]" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white drop-shadow-sm">Validify</h1>
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#E5E5E5]">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="border-[#2383E2] text-[#2383E2] hover:bg-[#2383E2] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#2383E2]/20"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowWalletModal(true)}
              variant="outline"
              className="border-[#2383E2] text-[#2383E2] hover:bg-[#2383E2] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#2383E2]/20"
            >
              Get Started
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#191919] via-[#1a1a1a] to-[#191919]" />

        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#2383E2]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2383E2]/3 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Hero Headline with Typewriter Effect */}
          <h1
            className={`text-4xl md:text-6xl font-bold text-white mb-6 transition-all duration-800 ${
              heroTextVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {heroText}
            <span className="animate-pulse">|</span>
          </h1>

          {/* Subheading */}
          <p
            className={`text-lg md:text-2xl text-[#E5E5E5] mb-12 max-w-3xl mx-auto transition-all duration-800 delay-300 ${
              subheadingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Connect with your target audience, validate your ideas through surveys, and reward participants with crypto
            tokens
          </p>

          {/* Feature Points */}
          <div
            className={`grid md:grid-cols-3 gap-6 mb-12 transition-all duration-800 delay-600 ${
              featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {[
              { icon: "🎯", title: "Targeted Audience Matching", delay: "delay-0" },
              { icon: "💰", title: "Token-Incentivized Feedback", delay: "delay-200" },
              { icon: "⚡", title: "Real-time Validation Results", delay: "delay-400" },
            ].map((feature, index) => (
              <div
                key={index}
                className={`bg-[#2F2F2F] p-6 rounded-lg border border-[#404040] hover:border-[#2383E2]/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-lg hover:shadow-[#2383E2]/10 ${feature.delay}`}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-white font-semibold">{feature.title}</h3>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <Button
            onClick={() => setShowWalletModal(true)}
            className="bg-gradient-to-r from-[#2383E2] to-[#1a6bc7] hover:from-[#1a6bc7] hover:to-[#2383E2] text-white px-12 py-4 text-lg rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#2383E2]/30 animate-pulse"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16 animate-on-scroll opacity-0 translate-y-8 transition-all duration-800">
            How Validify Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Lightbulb,
                title: "Create Your Idea Poll",
                description: "Submit your idea with target audience criteria and token rewards",
                delay: "delay-0",
              },
              {
                icon: Users,
                title: "Get Matched Feedback",
                description: "Our algorithm matches your poll with relevant users who provide feedback",
                delay: "delay-200",
              },
              {
                icon: Coins,
                title: "Distribute Rewards",
                description: "Tokens are automatically distributed to feedback providers when polling ends",
                delay: "delay-400",
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 ${step.delay}`}
              >
                <div className="bg-[#2F2F2F] p-8 rounded-lg border border-[#404040] hover:border-[#2383E2]/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-lg hover:shadow-[#2383E2]/10 group">
                  <div className="w-16 h-16 bg-[#2383E2]/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#2383E2]/30 transition-colors duration-300">
                    <step.icon className="w-8 h-8 text-[#2383E2] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                  <p className="text-[#E5E5E5] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section ref={statsRef} className="py-24 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { count: ideasCount, suffix: "+", label: "Ideas Validated" },
              { count: providersCount, suffix: "+", label: "Feedback Providers" },
              { count: rewardsCount, suffix: "+", label: "Rewards Distributed", prefix: "$" },
            ].map((stat, index) => (
              <div key={index} className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.prefix}
                  {stat.count.toLocaleString()}
                  {stat.suffix}
                </div>
                <div className="text-[#E5E5E5] text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#191919] via-[#1a1a1a] to-[#191919]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 animate-on-scroll opacity-0 translate-y-8 transition-all duration-800">
            Ready to validate your next big idea?
          </h2>
          <Button
            onClick={() => setShowWalletModal(true)}
            className="bg-gradient-to-r from-[#2383E2] to-[#1a6bc7] hover:from-[#1a6bc7] hover:to-[#2383E2] text-white px-16 py-6 text-xl rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#2383E2]/40 animate-on-scroll opacity-0 translate-y-8"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Wallet Connection Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="bg-[#2F2F2F] border-[#404040] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center mb-6">
              {isConnected ? "Wallet Connected!" : "Connect Your Wallet"}
            </DialogTitle>
          </DialogHeader>

          {isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="text-[#E5E5E5] mb-4">Successfully connected to Monad Testnet!</p>
              <p className="text-sm text-[#888] mb-2">Address: {address?.slice(0, 20)}...</p>
              <p className="text-sm text-[#888]">Redirecting to profile setup...</p>
            </div>
          ) : (isConnecting || isPending) ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#2383E2]" />
              <p className="text-[#E5E5E5]">Connecting to wallet...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => handleWalletConnect(connector)}
                  className="w-full p-4 bg-[#191919] hover:bg-[#404040] border border-[#404040] hover:border-[#2383E2] rounded-lg transition-all duration-300 hover:scale-[1.02] flex items-center gap-4"
                >
                  <span className="text-2xl">{getConnectorIcon(connector.name)}</span>
                  <span className="font-medium">{connector.name}</span>
                  <Wallet className="w-5 h-5 ml-auto text-[#888]" />
                </button>
              ))}
              <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#404040]">
                <p className="text-sm text-[#888] text-center">
                  🌐 Connected to Monad Testnet
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
