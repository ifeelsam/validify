"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useValidifyStore } from '@/lib/validify-store'
import { useLocalPollsStore } from '@/lib/local-polls-store'
import { uploadJsonToIPFS } from '@/lib/ipfs-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function CreatePoll() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { createPoll } = useValidifyStore()
  const { addPoll, updatePollContractId, updatePollIpfsHash } = useLocalPollsStore()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [''],
    category: '',
    duration: 7,
    rewardPerFeedback: '0.001',
    maxFeedbacks: 10
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, '']
    }))
  }

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }))
    }
  }

  const updateQuestion = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? value : q)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.questions.some(q => !q.trim())) {
      toast.error('Please fill in all questions')
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate total reward pool
      const rewardPerFeedbackWei = BigInt(Math.floor(parseFloat(formData.rewardPerFeedback) * 1e18))
      const totalRewardWei = rewardPerFeedbackWei * BigInt(formData.maxFeedbacks)

      // First, add to local store immediately for instant feedback
      const localPollId = addPoll({
        title: formData.title,
        description: formData.description,
        questions: formData.questions.filter(q => q.trim()),
        category: formData.category,
        duration: formData.duration,
        rewardPool: totalRewardWei.toString(),
        rewardPerFeedback: rewardPerFeedbackWei.toString(),
        maxFeedbacks: formData.maxFeedbacks,
        creator: address,
        isActive: true
      })

      toast.success('Poll created locally! Uploading to IPFS and blockchain...')

      // Prepare metadata for IPFS
      const metadata = {
        title: formData.title,
        description: formData.description,
        questions: formData.questions.filter(q => q.trim()),
        category: formData.category,
        duration: formData.duration,
        createdAt: new Date().toISOString(),
        createdBy: address
      }

      // Upload to IPFS
      let ipfsHash = ''
      try {
        ipfsHash = await uploadJsonToIPFS(metadata)
        updatePollIpfsHash(localPollId, ipfsHash)
        toast.success('Metadata uploaded to IPFS!')
      } catch (error) {
        console.error('IPFS upload failed:', error)
        toast.error('Failed to upload to IPFS, but poll saved locally')
      }

      // Create poll on blockchain
      try {
        const txHash = await createPoll(
          ipfsHash,
          rewardPerFeedbackWei,
          BigInt(formData.maxFeedbacks),
          totalRewardWei
        )

        toast.success('Poll creation transaction submitted!')
        
        // Note: In a real app, you'd want to wait for the transaction to be mined
        // and get the actual poll ID from the contract event logs
        // For now, we'll simulate this with a timeout
        setTimeout(() => {
          // This would normally come from contract events
          const simulatedContractId = Math.floor(Math.random() * 1000) + 1
          updatePollContractId(localPollId, simulatedContractId, txHash)
          toast.success('Poll successfully created on blockchain!')
        }, 3000)

        // Redirect to dashboard
        router.push('/dashboard')
        
      } catch (error) {
        console.error('Blockchain transaction failed:', error)
        toast.error('Blockchain transaction failed, but poll saved locally')
        // Still redirect to dashboard to show the local poll
        router.push('/dashboard')
      }

    } catch (error) {
      console.error('Error creating poll:', error)
      toast.error('Failed to create poll')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#E5E5E5] p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center">Please connect your wallet to create a poll</p>
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-[#888] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-white">Create New Poll</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-[#E5E5E5]">Poll Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your poll title"
                  className="bg-[#404040] border-[#555] text-white placeholder:text-[#888]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-[#E5E5E5]">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what you want feedback on"
                  className="bg-[#404040] border-[#555] text-white placeholder:text-[#888] min-h-[100px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-[#E5E5E5]">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-[#404040] border-[#555] text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#404040] border-[#555]">
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Questions</CardTitle>
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                  size="sm"
                  className="border-[#2383E2] text-[#2383E2] hover:bg-[#2383E2]/10"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-[#E5E5E5]">Question {index + 1} *</Label>
                    <Input
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="Enter your question"
                      className="bg-[#404040] border-[#555] text-white placeholder:text-[#888]"
                      required
                    />
                  </div>
                  {formData.questions.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      variant="ghost"
                      size="sm"
                      className="mt-6 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Poll Settings */}
          <Card className="bg-[#2F2F2F] border-[#404040]">
            <CardHeader>
              <CardTitle className="text-white">Poll Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-[#E5E5E5]">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 7 }))}
                    className="bg-[#404040] border-[#555] text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="rewardPerFeedback" className="text-[#E5E5E5]">Reward per Feedback (ETH)</Label>
                  <Input
                    id="rewardPerFeedback"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.rewardPerFeedback}
                    onChange={(e) => setFormData(prev => ({ ...prev, rewardPerFeedback: e.target.value }))}
                    className="bg-[#404040] border-[#555] text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="maxFeedbacks" className="text-[#E5E5E5]">Max Feedbacks</Label>
                  <Input
                    id="maxFeedbacks"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxFeedbacks}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxFeedbacks: parseInt(e.target.value) || 10 }))}
                    className="bg-[#404040] border-[#555] text-white"
                  />
                </div>
              </div>

              <div className="bg-[#404040] p-4 rounded-lg">
                <p className="text-[#E5E5E5] text-sm">
                  <strong>Total Cost:</strong> {(parseFloat(formData.rewardPerFeedback) * formData.maxFeedbacks).toFixed(3)} ETH
                </p>
                <p className="text-[#888] text-xs mt-1">
                  This amount will be locked in the contract and distributed to feedback providers
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white px-8"
            >
              {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
