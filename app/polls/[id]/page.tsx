"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useValidifyStore } from '@/lib/validify-store'
import { useLocalPollsStore, LocalPoll, LocalFeedback } from '@/lib/local-polls-store'
import { fetchFromIPFS } from '@/lib/ipfs-utils'
import { formatWeiToEth, truncateAddress } from '@/lib/validify-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Users, Clock, ExternalLink, CheckCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

interface PollMetadata {
  title: string;
  description: string;
  questions: string[];
  category: string;
  duration: number;
  createdAt: string;
  createdBy: string;
}

interface CombinedPollData {
  id: string;
  type: 'local' | 'blockchain' | 'combined';
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

export default function PollDetails() {
  const router = useRouter()
  const params = useParams()
  const { address, isConnected } = useAccount()
  const { getPollDetails, getPollDataHash, submitFeedback } = useValidifyStore()
  const { getPollById, getAllPolls, addFeedback, updateFeedbackTxHash, initializeMockPolls } = useLocalPollsStore()

  const [pollData, setPollData] = useState<CombinedPollData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [responses, setResponses] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Initialize mock polls for demo
    initializeMockPolls()
    
    if (params.id) {
      loadPollData(params.id as string)
    }
  }, [params.id])

  const loadPollData = async (pollId: string) => {
    try {
      setIsLoading(true)
      
      // Check if it's a local poll ID
      const localPoll = getPollById(pollId)
      
      if (localPoll) {
        // It's a local poll
        const combined: CombinedPollData = {
          id: pollId,
          type: localPoll.contractId ? 'combined' : 'local',
          localData: localPoll
        }
        
        // If it has a contract ID, try to load blockchain data too
        if (localPoll.contractId) {
          try {
            const details = await getPollDetails(localPoll.contractId)
            const dataHash = await getPollDataHash(localPoll.contractId)
            
            let metadata = null
            try {
              metadata = await fetchFromIPFS<PollMetadata>(dataHash)
            } catch (error) {
              console.error('Failed to fetch metadata:', error)
            }
            
            combined.blockchainData = {
              id: localPoll.contractId,
              metadata,
              details
            }
          } catch (error) {
            console.error('Failed to load blockchain data:', error)
          }
        }
        
        setPollData(combined)
        initializeResponses(combined)
      } else {
        // Try to parse as blockchain poll ID
        const blockchainId = parseInt(pollId.replace('blockchain_', ''))
        
        if (!isNaN(blockchainId)) {
          try {
            const details = await getPollDetails(blockchainId)
            const dataHash = await getPollDataHash(blockchainId)
            
            let metadata = null
            try {
              metadata = await fetchFromIPFS<PollMetadata>(dataHash)
            } catch (error) {
              console.error('Failed to fetch metadata:', error)
            }
            
            const combined: CombinedPollData = {
              id: pollId,
              type: 'blockchain',
              blockchainData: {
                id: blockchainId,
                metadata,
                details
              }
            }
            
            setPollData(combined)
            initializeResponses(combined)
          } catch (error) {
            console.error('Failed to load blockchain poll:', error)
            toast.error('Poll not found')
            router.push('/dashboard')
          }
        } else {
          toast.error('Invalid poll ID')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error loading poll:', error)
      toast.error('Failed to load poll')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeResponses = (poll: CombinedPollData) => {
    const questions = poll.localData?.questions || poll.blockchainData?.metadata?.questions || []
    setResponses(new Array(questions.length).fill(''))
  }

  const updateResponse = (index: number, value: string) => {
    setResponses(prev => prev.map((response, i) => i === index ? value : response))
  }

  const handleSubmitFeedback = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to submit feedback')
      return
    }

    if (!pollData) {
      toast.error('Poll data not loaded')
      return
    }

    if (responses.some(r => !r.trim())) {
      toast.error('Please answer all questions')
      return
    }

    setIsSubmitting(true)

    try {
      // Add feedback to local store immediately
      const localFeedbackId = addFeedback({
        pollId: pollData.id,
        pollContractId: pollData.blockchainData?.id,
        respondent: address,
        responses: responses.filter(r => r.trim()),
        rewardAmount: pollData.localData?.rewardPerFeedback || 
                     pollData.blockchainData?.details?.rewardPerFeedback.toString() || '0'
      })

      toast.success('Feedback submitted locally!')

      // If there's blockchain data, submit to blockchain too
      if (pollData.blockchainData?.id) {
        try {
          toast.info('Submitting to blockchain...')
          const txHash = await submitFeedback(pollData.blockchainData.id)
          updateFeedbackTxHash(localFeedbackId, txHash)
          toast.success(`Transaction submitted! Hash: ${txHash.slice(0, 10)}...`)
        } catch (error) {
          console.error('Blockchain submission failed:', error)
          toast.error('Blockchain submission failed, but feedback saved locally')
        }
      }

      // Refresh poll data to show updated feedback count
      await loadPollData(pollData.id)
      
      // Clear responses
      setResponses(new Array(responses.length).fill(''))
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPollTitle = () => {
    return pollData?.localData?.title || 
           pollData?.blockchainData?.metadata?.title || 
           `Poll #${pollData?.blockchainData?.id || 'Unknown'}`
  }

  const getPollDescription = () => {
    return pollData?.localData?.description || 
           pollData?.blockchainData?.metadata?.description || 
           'No description available'
  }

  const getPollQuestions = () => {
    return pollData?.localData?.questions || 
           pollData?.blockchainData?.metadata?.questions || 
           []
  }

  const getPollProgress = () => {
    if (pollData?.localData) {
      const received = pollData.localData.feedbacks.length
      const max = pollData.localData.maxFeedbacks
      return { received, max, percentage: max > 0 ? (received * 100) / max : 0 }
    }
    if (pollData?.blockchainData?.details) {
      const received = Number(pollData.blockchainData.details.feedbacksReceived)
      const max = Number(pollData.blockchainData.details.maxFeedbacks)
      return { received, max, percentage: max > 0 ? (received * 100) / max : 0 }
    }
    return { received: 0, max: 0, percentage: 0 }
  }

  const getPollReward = () => {
    if (pollData?.localData) {
      return formatWeiToEth(BigInt(pollData.localData.rewardPerFeedback))
    }
    if (pollData?.blockchainData?.details) {
      return formatWeiToEth(pollData.blockchainData.details.rewardPerFeedback)
    }
    return '0'
  }

  const getPollStatus = () => {
    if (pollData?.localData && !pollData.localData.contractId) {
      return { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' }
    }
    if (pollData?.localData && pollData.localData.contractId) {
      return { text: 'Confirmed', color: 'bg-green-500/20 text-green-500' }
    }
    if (pollData?.blockchainData?.details?.isActive) {
      return { text: 'Active', color: 'bg-[#2383E2]/20 text-[#2383E2]' }
    }
    return { text: 'Completed', color: 'bg-gray-500/20 text-gray-500' }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOwner = () => {
    if (!address) return false
    const creator = pollData?.localData?.creator || pollData?.blockchainData?.details?.creator
    return creator?.toLowerCase() === address.toLowerCase()
  }

  const canVote = () => {
    if (isOwner()) return false
    const status = getPollStatus()
    return status.text === 'Active' || status.text === 'Confirmed'
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif]">
        {/* Header */}
        <header className="border-b border-[#2F2F2F] px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
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
                  className="text-[#888] hover:text-white"
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

        {/* Demo Banner */}
        <div className="bg-[#2383E2]/10 border-b border-[#2383E2]/20 px-6 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#2383E2] text-sm">
              Connect your wallet to participate in polls and earn rewards!
            </p>
          </div>
        </div>

        {/* Continue with poll loading... */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2383E2]"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <Card className="bg-[#2F2F2F] border-[#404040]">
              <CardContent className="pt-6 text-center">
                <p className="text-white mb-4">Loading poll data...</p>
                <p className="text-[#888] text-sm mb-6">
                  Connect your wallet to participate in polls and earn rewards.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
                  >
                    Connect Wallet
                  </Button>
                  <Button 
                    onClick={() => router.push('/browse')}
                    variant="outline"
                    className="border-[#404040] text-[#E5E5E5] hover:bg-[#2F2F2F]"
                  >
                    Browse More Polls
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#E5E5E5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2383E2]"></div>
      </div>
    )
  }

  if (!pollData) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#E5E5E5] p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center">Poll not found</p>
            <Button 
              className="w-full mt-4"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = getPollStatus()
  const progress = getPollProgress()
  const questions = getPollQuestions()

  return (
    <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="border-b border-[#2F2F2F] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Poll Header */}
        <Card className="bg-[#2F2F2F] border-[#404040] mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-white text-2xl">
                    {getPollTitle()}
                  </CardTitle>
                  {pollData.localData?.txHash && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className="text-[#888] text-sm">
                  Created {pollData.localData?.createdAt ? formatDate(pollData.localData.createdAt) : 
                          pollData.blockchainData?.metadata?.createdAt ? formatDate(pollData.blockchainData.metadata.createdAt) : 
                          'Unknown date'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded text-sm font-medium ${status.color}`}>
                {status.text}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-[#E5E5E5] mb-6">
              {getPollDescription()}
            </p>
            
            {/* Poll Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#888]" />
                <span className="text-sm text-[#E5E5E5]">
                  {progress.received}/{progress.max} responses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#888]" />
                <span className="text-sm text-[#E5E5E5]">
                  {pollData.localData?.duration || pollData.blockchainData?.metadata?.duration || 'Unknown'} days
                </span>
              </div>
              <div className="text-sm text-[#E5E5E5] font-medium">
                {getPollReward()} ETH per response
              </div>
            </div>
            
            <Progress 
              value={Math.min(progress.percentage, 100)} 
              className="h-3 bg-[#404040] [&>div]:bg-[#2383E2]"
            />
            
            {pollData.localData?.txHash && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-[#888]">Transaction:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#2383E2] hover:text-white p-0 h-auto"
                  onClick={() => window.open(`https://explorer.monad.xyz/tx/${pollData.localData?.txHash}`, '_blank')}
                >
                  {pollData.localData.txHash.slice(0, 10)}...{pollData.localData.txHash.slice(-8)}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voting Section */}
        {canVote() && (
          <Card className="bg-[#2F2F2F] border-[#404040] mb-8">
            <CardHeader>
              <CardTitle className="text-white">Submit Your Feedback</CardTitle>
              <p className="text-[#888] text-sm">
                Answer all questions to earn {getPollReward()} ETH
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <div key={index}>
                  <Label className="text-[#E5E5E5] mb-2 block">
                    Question {index + 1}: {question}
                  </Label>
                  <Textarea
                    value={responses[index] || ''}
                    onChange={(e) => updateResponse(index, e.target.value)}
                    placeholder="Enter your response..."
                    className="bg-[#404040] border-[#555] text-white placeholder:text-[#888] min-h-[100px]"
                  />
                </div>
              ))}
              
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || responses.some(r => !r.trim())}
                className="w-full bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Voting Section for Non-Connected Users */}
        {!isConnected && pollData && (
          <Card className="bg-[#2F2F2F] border-[#404040] mb-8">
            <CardHeader>
              <CardTitle className="text-white">Submit Your Feedback</CardTitle>
              <p className="text-[#888] text-sm">
                Connect your wallet to participate and earn {getPollReward()} ETH
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <div key={index}>
                  <Label className="text-[#E5E5E5] mb-2 block">
                    Question {index + 1}: {question}
                  </Label>
                  <Textarea
                    value={responses[index] || ''}
                    onChange={(e) => updateResponse(index, e.target.value)}
                    placeholder="Connect your wallet to participate..."
                    disabled
                    className="bg-[#404040] border-[#555] text-white placeholder:text-[#888] min-h-[100px] opacity-60"
                  />
                </div>
              ))}
              
              <Button
                onClick={() => router.push('/')}
                className="w-full bg-[#2383E2] hover:bg-[#1a6bc7] text-white"
              >
                Connect Wallet to Participate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Owner Message */}
        {isOwner() && (
          <Card className="bg-[#2F2F2F] border-[#404040] border-l-4 border-l-[#2383E2] mb-8">
            <CardContent className="py-4">
              <p className="text-white font-medium">You are the owner of this poll</p>
              <p className="text-sm text-[#888]">You cannot vote on your own poll</p>
            </CardContent>
          </Card>
        )}

        {/* Poll Inactive Message */}
        {!canVote() && !isOwner() && (
          <Card className="bg-[#2F2F2F] border-[#404040] mb-8">
            <CardContent className="py-4 text-center">
              <p className="text-[#888]">This poll is not currently accepting responses</p>
            </CardContent>
          </Card>
        )}

        {/* Responses Section */}
        {pollData.localData?.feedbacks && pollData.localData.feedbacks.length > 0 && (
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader>
              <CardTitle className="text-white">Recent Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pollData.localData.feedbacks.slice(0, 5).map((feedback, index) => (
                  <div key={feedback.id} className="border-b border-[#404040] pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#888]">
                        {truncateAddress(feedback.respondent)}
                      </span>
                      <span className="text-xs text-[#888]">
                        {formatDate(feedback.createdAt)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {feedback.responses.map((response, responseIndex) => (
                        <div key={responseIndex}>
                          <p className="text-xs text-[#888]">Q{responseIndex + 1}:</p>
                          <p className="text-sm text-[#E5E5E5]">{response}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 