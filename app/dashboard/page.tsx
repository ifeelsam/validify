"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useValidifyStore } from '@/lib/validify-store'
import { useLocalPollsStore, LocalPoll } from '@/lib/local-polls-store'
import { fetchFromIPFS } from '@/lib/ipfs-utils'
import { formatWeiToEth, truncateAddress } from '@/lib/validify-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, Users, Clock, ChevronRight, ExternalLink, CheckCircle } from 'lucide-react'

interface PollMetadata {
  title: string;
  description: string;
  questions: string[];
  category: string;
  duration: number;
  createdAt: string;
  createdBy: string;
}

interface CombinedPoll {
  id: string;
  type: 'local' | 'blockchain';
  localData?: LocalPoll;
  blockchainData?: {
    id: number;
    metadata: PollMetadata | null;
    details: {
      creator: string;
      rewardPool: bigint;
      rewardPerFeedback: bigint;
      feedbacksReceived: bigint;
      maxFeedbacks: bigint;
      isActive: boolean;
    } | null;
  };
}

export default function Dashboard() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { refreshUserData, currentUser, getTotalPolls, getPollDetails, getPollDataHash } = useValidifyStore()
  const { getPollsByCreator, getAllPolls } = useLocalPollsStore()

  const [combinedPolls, setCombinedPolls] = useState<CombinedPoll[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isConnected && address) {
      const fetchData = async () => {
        await refreshUserData(address)
        await loadAllPolls()
      }
      
      fetchData()
    }
  }, [isConnected, address])

  const loadAllPolls = async () => {
    try {
      setIsLoading(true)

      const combined: CombinedPoll[] = []
      
      // Load local polls first (immediate display)
      if (address) {
        const localPolls = getPollsByCreator(address)
        localPolls.forEach(poll => {
          combined.push({
            id: poll.id,
            type: 'local',
            localData: poll
          })
        })
      }
      
      // Load blockchain polls (if user is registered)
      if (currentUser && currentUser.isRegistered) {
        try {
          const totalPollsCount = await getTotalPolls()
          
          for (let i = 1; i <= totalPollsCount; i++) {
            try {
              const details = await getPollDetails(i)
              const dataHash = await getPollDataHash(i)
              
              let metadata = null
              try {
                metadata = await fetchFromIPFS<PollMetadata>(dataHash)
              } catch (error) {
                console.error(`Failed to fetch metadata for poll ${i}:`, error)
              }
              
              // Check if this blockchain poll matches any local poll
              const matchingLocalIndex = combined.findIndex(p => 
                p.type === 'local' && 
                p.localData?.contractId === i
              )
              
              if (matchingLocalIndex >= 0) {
                // Update existing local poll with blockchain data
                combined[matchingLocalIndex].blockchainData = {
                  id: i,
                  metadata,
                  details
                }
              } else {
                // Add as new blockchain-only poll
                combined.push({
                  id: `blockchain_${i}`,
                  type: 'blockchain',
                  blockchainData: {
                    id: i,
                    metadata,
                    details
                  }
                })
              }
            } catch (error) {
              console.error(`Failed to load poll ${i}:`, error)
            }
          }
        } catch (error) {
          console.error('Failed to load blockchain polls:', error)
        }
      }
      
      // Sort by creation date (newest first)
      combined.sort((a, b) => {
        const dateA = a.localData?.createdAt || a.blockchainData?.metadata?.createdAt || '0'
        const dateB = b.localData?.createdAt || b.blockchainData?.metadata?.createdAt || '0'
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      
      setCombinedPolls(combined)
    } catch (error) {
      console.error('Failed to load polls:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateProgress = (received: bigint | number, max: bigint | number) => {
    const receivedNum = typeof received === 'bigint' ? Number(received) : received
    const maxNum = typeof max === 'bigint' ? Number(max) : max
    if (maxNum === 0) return 0
    return Math.min((receivedNum * 100) / maxNum, 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPollTitle = (poll: CombinedPoll) => {
    return poll.localData?.title || poll.blockchainData?.metadata?.title || `Poll #${poll.blockchainData?.id || 'Unknown'}`
  }

  const getPollDescription = (poll: CombinedPoll) => {
    return poll.localData?.description || poll.blockchainData?.metadata?.description || 'No description available'
  }

  const getPollDate = (poll: CombinedPoll) => {
    const dateString = poll.localData?.createdAt || poll.blockchainData?.metadata?.createdAt
    return dateString ? formatDate(dateString) : 'Unknown date'
  }

  const getPollStatus = (poll: CombinedPoll) => {
    if (poll.localData && !poll.localData.contractId) {
      return { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' }
    }
    if (poll.localData && poll.localData.contractId) {
      return { text: 'Confirmed', color: 'bg-green-500/20 text-green-500' }
    }
    if (poll.blockchainData?.details?.isActive) {
      return { text: 'Active', color: 'bg-[#2383E2]/20 text-[#2383E2]' }
    }
    return { text: 'Completed', color: 'bg-gray-500/20 text-gray-500' }
  }

  const getPollProgress = (poll: CombinedPoll) => {
    if (poll.localData) {
      const received = poll.localData.feedbacks.length
      const max = poll.localData.maxFeedbacks
      return { received, max, percentage: calculateProgress(received, max) }
    }
    if (poll.blockchainData?.details) {
      const received = poll.blockchainData.details.feedbacksReceived
      const max = poll.blockchainData.details.maxFeedbacks
      return { received: Number(received), max: Number(max), percentage: calculateProgress(received, max) }
    }
    return { received: 0, max: 0, percentage: 0 }
  }

  const getPollReward = (poll: CombinedPoll) => {
    if (poll.localData) {
      return formatWeiToEth(BigInt(poll.localData.rewardPerFeedback))
    }
    if (poll.blockchainData?.details) {
      return formatWeiToEth(poll.blockchainData.details.rewardPerFeedback)
    }
    return '0'
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#E5E5E5] p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center">Please connect your wallet to view your dashboard</p>
            <Button 
              className="w-full mt-4"
              onClick={() => router.push('/')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
    </div>
  )
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="border-b border-[#2F2F2F] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-white">Validify</h1>
            <nav className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-[#E5E5E5] hover:text-white"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/browse')}
                className="text-[#888] hover:text-white"
              >
                Browse Polls
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-[#E5E5E5]">
              {address ? truncateAddress(address) : '0x0000...0000'}
            </span>
                </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push('/browse')}
              variant="outline"
              className="border-[#404040] text-[#E5E5E5] hover:bg-[#2F2F2F]"
            >
              Browse Polls
            </Button>
            <Button 
              onClick={() => router.push('/create-poll')}
              className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Poll
            </Button>
          </div>
        </div>

        {/* Profile Setup Suggestion (non-blocking) */}
        {currentUser && !currentUser.isRegistered && (
          <Card className="bg-[#2F2F2F] border-[#404040] border-l-4 border-l-[#2383E2] mb-8">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Complete your profile for a better experience</p>
                <p className="text-sm text-[#888]">Set up your profile to get more relevant polls</p>
              </div>
              <Button
                onClick={() => router.push('/profile-setup')}
                variant="outline"
                className="border-[#2383E2] text-[#2383E2] hover:bg-[#2383E2]/10"
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#888]">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {formatWeiToEth(currentUser?.totalSpent || BigInt(0))} MON
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#888]">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {formatWeiToEth(currentUser?.totalEarned || BigInt(0))} MON
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#888]">Total Polls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{combinedPolls.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Polls List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Your Polls</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2383E2]"></div>
            </div>
          ) : combinedPolls.length > 0 ? (
            <div className="space-y-4">
              {combinedPolls.map(poll => {
                const status = getPollStatus(poll)
                const progress = getPollProgress(poll)
                
                return (
                  <Card key={poll.id} className="bg-[#2F2F2F] border-[#404040] hover:border-[#2383E2] transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-white">
                              {getPollTitle(poll)}
                            </CardTitle>
                            {poll.localData?.txHash && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                  </div>
                          <p className="text-sm text-[#888]">
                            {getPollDate(poll)}
                          </p>
                  </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.text}
                    </div>
                  </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#E5E5E5] line-clamp-2 mb-4">
                        {getPollDescription(poll)}
                      </p>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#888]" />
                      <span className="text-sm text-[#E5E5E5]">
                            {progress.received}/{progress.max} responses
                      </span>
                        </div>
                      <span className="text-sm text-[#888]">
                          {Math.round(progress.percentage)}%
                      </span>
                    </div>
                      
                    <Progress
                        value={progress.percentage} 
                        className="h-2 bg-[#404040] [&>div]:bg-[#2383E2]"
                      />
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#888]" />
                          <span className="text-sm text-[#888]">
                            {poll.localData?.duration || poll.blockchainData?.metadata?.duration || 'Unknown'} days
                          </span>
                        </div>
                        <div className="text-sm text-[#E5E5E5] font-medium">
                          {getPollReward(poll)} MON per response
                        </div>
                  </div>

                      {poll.localData?.txHash && (
                        <div className="mt-2 text-xs text-[#888]">
                          <span>Tx: {poll.localData.txHash.slice(0, 10)}...</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t border-[#404040] pt-4">
                      <div className="flex gap-2 ml-auto">
                        {poll.localData?.txHash && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#888] hover:text-white"
                            onClick={() => window.open(`https://explorer.monad.xyz/tx/${poll.localData?.txHash}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                  <Button
                          variant="ghost" 
                          className="text-[#2383E2] hover:bg-[#2383E2]/10"
                          onClick={() => router.push(`/polls/${poll.blockchainData?.id || poll.id}`)}
                  >
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="bg-[#2F2F2F] border-[#404040]">
              <CardContent className="py-12 text-center">
                <p className="text-[#888] mb-4">You haven't created any polls yet</p>
            <Button
                  onClick={() => router.push('/create-poll')}
                  className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
            >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Your First Poll
            </Button>
              </CardContent>
            </Card>
          )}
          </div>
      </main>
    </div>
  )
}
