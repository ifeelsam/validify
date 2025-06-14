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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Users, Clock, ChevronRight, Filter } from 'lucide-react'

interface PollMetadata {
  title: string;
  description: string;
  questions: string[];
  category: string;
  duration: number;
  createdAt: string;
  createdBy: string;
}

interface BrowsablePoll {
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

export default function BrowsePolls() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { refreshUserData, currentUser, getTotalPolls, getPollDetails, getPollDataHash } = useValidifyStore()
  const { getAllPolls, initializeMockPolls } = useLocalPollsStore()

  const [polls, setPolls] = useState<BrowsablePoll[]>([])
  const [filteredPolls, setFilteredPolls] = useState<BrowsablePoll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')

  useEffect(() => {
    // Initialize mock polls for demo
    initializeMockPolls()
    
    if (isConnected && address) {
      const fetchData = async () => {
        await refreshUserData(address)
        await loadAllPolls()
      }
      
      fetchData()
    } else {
      // Even without wallet connection, load local polls for demo
      loadAllPolls()
    }
  }, [isConnected, address])

  useEffect(() => {
    filterPolls()
  }, [polls, searchTerm, categoryFilter, statusFilter, address])

  const loadAllPolls = async () => {
    try {
      setIsLoading(true)
      
      const allPolls: BrowsablePoll[] = []
      
      // Load local polls from all users
      const localPolls = getAllPolls()
      localPolls.forEach(poll => {
        // Only include polls from other users
        if (address && poll.creator.toLowerCase() !== address.toLowerCase()) {
          allPolls.push({
            id: poll.id,
            type: 'local',
            localData: poll
          })
        }
      })
      
      // Load blockchain polls
      try {
        const totalPollsCount = await getTotalPolls()
        
        for (let i = 1; i <= totalPollsCount; i++) {
          try {
            const details = await getPollDetails(i)
            const dataHash = await getPollDataHash(i)
            
            // Skip polls created by current user
            if (address && details.creator.toLowerCase() === address.toLowerCase()) {
              continue
            }
            
            let metadata = null
            try {
              metadata = await fetchFromIPFS<PollMetadata>(dataHash)
            } catch (error) {
              console.error(`Failed to fetch metadata for poll ${i}:`, error)
            }
            
            // Check if this blockchain poll matches any local poll
            const matchingLocalIndex = allPolls.findIndex(p => 
              p.type === 'local' && 
              p.localData?.contractId === i
            )
            
            if (matchingLocalIndex >= 0) {
              // Update existing local poll with blockchain data
              allPolls[matchingLocalIndex].blockchainData = {
                id: i,
                metadata,
                details
              }
            } else {
              // Add as new blockchain-only poll
              allPolls.push({
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
      
      // Sort by creation date (newest first)
      allPolls.sort((a, b) => {
        const dateA = a.localData?.createdAt || a.blockchainData?.metadata?.createdAt || '0'
        const dateB = b.localData?.createdAt || b.blockchainData?.metadata?.createdAt || '0'
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      
      setPolls(allPolls)
    } catch (error) {
      console.error('Failed to load polls:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPolls = () => {
    let filtered = [...polls]

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(poll => {
        const title = poll.localData?.title || poll.blockchainData?.metadata?.title || ''
        const description = poll.localData?.description || poll.blockchainData?.metadata?.description || ''
        const category = poll.localData?.category || poll.blockchainData?.metadata?.category || ''
        
        return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               description.toLowerCase().includes(searchTerm.toLowerCase()) ||
               category.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(poll => {
        const category = poll.localData?.category || poll.blockchainData?.metadata?.category || ''
        return category.toLowerCase() === categoryFilter.toLowerCase()
      })
    }

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(poll => {
        if (poll.localData && poll.localData.contractId) {
          return poll.localData.isActive
        }
        if (poll.blockchainData?.details) {
          return poll.blockchainData.details.isActive
        }
        return poll.localData?.isActive || false
      })
    }

    setFilteredPolls(filtered)
  }

  const getPollTitle = (poll: BrowsablePoll) => {
    return poll.localData?.title || poll.blockchainData?.metadata?.title || `Poll #${poll.blockchainData?.id || 'Unknown'}`
  }

  const getPollDescription = (poll: BrowsablePoll) => {
    return poll.localData?.description || poll.blockchainData?.metadata?.description || 'No description available'
  }

  const getPollCategory = (poll: BrowsablePoll) => {
    return poll.localData?.category || poll.blockchainData?.metadata?.category || 'Other'
  }

  const getPollProgress = (poll: BrowsablePoll) => {
    if (poll.localData) {
      const received = poll.localData.feedbacks.length
      const max = poll.localData.maxFeedbacks
      return { received, max, percentage: max > 0 ? (received * 100) / max : 0 }
    }
    if (poll.blockchainData?.details) {
      const received = Number(poll.blockchainData.details.feedbacksReceived)
      const max = Number(poll.blockchainData.details.maxFeedbacks)
      return { received, max, percentage: max > 0 ? (received * 100) / max : 0 }
    }
    return { received: 0, max: 0, percentage: 0 }
  }

  const getPollReward = (poll: BrowsablePoll) => {
    if (poll.localData) {
      return formatWeiToEth(BigInt(poll.localData.rewardPerFeedback))
    }
    if (poll.blockchainData?.details) {
      return formatWeiToEth(poll.blockchainData.details.rewardPerFeedback)
    }
    return '0'
  }

  const getPollCreator = (poll: BrowsablePoll) => {
    const creator = poll.localData?.creator || poll.blockchainData?.details?.creator
    return creator ? truncateAddress(creator) : 'Unknown'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPollDate = (poll: BrowsablePoll) => {
    const dateString = poll.localData?.createdAt || poll.blockchainData?.metadata?.createdAt
    return dateString ? formatDate(dateString) : 'Unknown date'
  }

  if (!isConnected) {
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
                  className="text-[#888] hover:text-white"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/browse')}
                  className="text-[#E5E5E5] hover:text-white"
                >
                  Browse Polls
                </Button>
              </nav>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
            >
              Connect Wallet
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Discover Polls</h1>
              <p className="text-[#888]">Find interesting polls to participate in and earn rewards</p>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
            >
              Connect Wallet to Participate
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-[#2F2F2F] border-[#404040] mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888]" />
                    <Input
                      placeholder="Search polls..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#404040] border-[#555] text-white placeholder:text-[#888]"
                    />
                  </div>
                </div>
                
                <div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-[#404040] border-[#555] text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#404040] border-[#555]">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-[#404040] border-[#555] text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#404040] border-[#555]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="all">All Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-4">
            <p className="text-[#888] text-sm">
              {isLoading ? 'Loading...' : `${filteredPolls.length} polls found`}
            </p>
          </div>

          {/* Polls Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2383E2]"></div>
            </div>
          ) : filteredPolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolls.map(poll => {
                const progress = getPollProgress(poll)
                
                return (
                  <Card key={poll.id} className="bg-[#2F2F2F] border-[#404040] hover:border-[#2383E2] transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg line-clamp-2">
                            {getPollTitle(poll)}
                          </CardTitle>
                        </div>
                        <div className="px-2 py-1 rounded text-xs font-medium bg-[#2383E2]/20 text-[#2383E2] ml-2">
                          {getPollCategory(poll)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#888]">
                        <span>by {getPollCreator(poll)}</span>
                        <span>{getPollDate(poll)}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-[#E5E5E5] text-sm line-clamp-3 mb-4">
                        {getPollDescription(poll)}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#888]" />
                            <span className="text-[#E5E5E5]">
                              {progress.received}/{progress.max} responses
                            </span>
                          </div>
                          <span className="text-[#888]">
                            {Math.round(progress.percentage)}%
                          </span>
                        </div>
                        
                        <Progress 
                          value={Math.min(progress.percentage, 100)} 
                          className="h-2 bg-[#404040] [&>div]:bg-[#2383E2]"
                        />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#888]" />
                            <span className="text-sm text-[#888]">
                              {poll.localData?.duration || poll.blockchainData?.metadata?.duration || 'Unknown'} days
                            </span>
                          </div>
                          <div className="text-sm text-[#E5E5E5] font-medium">
                            {getPollReward(poll)} ETH
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-[#404040] pt-4">
                      <Button 
                        className="w-full bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
                        onClick={() => router.push(`/polls/${poll.blockchainData?.id || poll.id}`)}
                      >
                        Participate & Earn
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="bg-[#2F2F2F] border-[#404040]">
              <CardContent className="py-12 text-center">
                <Filter className="w-12 h-12 text-[#888] mx-auto mb-4" />
                <p className="text-[#888] mb-2">No polls found</p>
                <p className="text-sm text-[#666]">
                  Try adjusting your search criteria or check back later for new polls
                </p>
              </CardContent>
            </Card>
          )}
        </main>
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
                className="text-[#888] hover:text-white"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/browse')}
                className="text-[#E5E5E5] hover:text-white"
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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Discover Polls</h1>
            <p className="text-[#888]">Find interesting polls to participate in and earn rewards</p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-[#404040] text-[#E5E5E5] hover:bg-[#2F2F2F]"
          >
            My Dashboard
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-[#2F2F2F] border-[#404040] mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888]" />
                  <Input
                    placeholder="Search polls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#404040] border-[#555] text-white placeholder:text-[#888]"
                  />
                </div>
              </div>
              
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-[#404040] border-[#555] text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#404040] border-[#555]">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-[#404040] border-[#555] text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#404040] border-[#555]">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="all">All Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-[#888] text-sm">
            {isLoading ? 'Loading...' : `${filteredPolls.length} polls found`}
          </p>
        </div>

        {/* Polls Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2383E2]"></div>
          </div>
        ) : filteredPolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map(poll => {
              const progress = getPollProgress(poll)
              
              return (
                <Card key={poll.id} className="bg-[#2F2F2F] border-[#404040] hover:border-[#2383E2] transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg line-clamp-2">
                          {getPollTitle(poll)}
                        </CardTitle>
                      </div>
                      <div className="px-2 py-1 rounded text-xs font-medium bg-[#2383E2]/20 text-[#2383E2] ml-2">
                        {getPollCategory(poll)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#888]">
                      <span>by {getPollCreator(poll)}</span>
                      <span>{getPollDate(poll)}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-[#E5E5E5] text-sm line-clamp-3 mb-4">
                      {getPollDescription(poll)}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#888]" />
                          <span className="text-[#E5E5E5]">
                            {progress.received}/{progress.max} responses
                          </span>
                        </div>
                        <span className="text-[#888]">
                          {Math.round(progress.percentage)}%
                        </span>
                      </div>
                      
                      <Progress 
                        value={Math.min(progress.percentage, 100)} 
                        className="h-2 bg-[#404040] [&>div]:bg-[#2383E2]"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#888]" />
                          <span className="text-sm text-[#888]">
                            {poll.localData?.duration || poll.blockchainData?.metadata?.duration || 'Unknown'} days
                          </span>
                        </div>
                        <div className="text-sm text-[#E5E5E5] font-medium">
                          {getPollReward(poll)} ETH
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t border-[#404040] pt-4">
                    <Button 
                      className="w-full bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
                      onClick={() => router.push(`/polls/${poll.blockchainData?.id || poll.id}`)}
                    >
                      Participate & Earn
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardContent className="py-12 text-center">
              <Filter className="w-12 h-12 text-[#888] mx-auto mb-4" />
              <p className="text-[#888] mb-2">No polls found</p>
              <p className="text-sm text-[#666]">
                Try adjusting your search criteria or check back later for new polls
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 