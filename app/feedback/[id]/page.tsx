"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Star, ArrowLeft, ArrowRight, Coins, CheckCircle, Loader2, ExternalLink, WifiOff } from "lucide-react"

interface SurveyQuestion {
  id: number
  type: "rating" | "multiple-choice" | "range" | "multi-select" | "text"
  question: string
  options?: string[]
  required: boolean
  min?: number
  max?: number
  step?: number
}

interface SurveyAnswers {
  [key: number]: any
}

interface IdeaData {
  id: string
  title: string
  reward: number
}

export default function FeedbackSurvey({ params }: { params: { id: string } }) {
  const [isOpen, setIsOpen] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isProcessingReward, setIsProcessingReward] = useState(false)
  const [rewardProcessed, setRewardProcessed] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward")
  const [transactionHash, setTransactionHash] = useState("")

  // Mock idea data
  const ideaData: IdeaData = {
    id: params.id,
    title: "AI-powered meal planning app for busy professionals",
    reward: 0.05,
  }

  const questions: SurveyQuestion[] = [
    {
      id: 1,
      type: "rating",
      question: "How interested would you be in this idea?",
      required: true,
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Who do you think would benefit most from this?",
      options: [
        "Young professionals (25-35)",
        "Fitness enthusiasts",
        "Tech-savvy users",
        "General population",
        "Other",
      ],
      required: true,
    },
    {
      id: 3,
      type: "range",
      question: "What would you expect to pay for this monthly?",
      min: 0,
      max: 50,
      step: 5,
      required: true,
    },
    {
      id: 4,
      type: "multi-select",
      question: "What would make this idea more appealing?",
      options: [
        "Better pricing",
        "More features",
        "Different target audience",
        "Improved user experience",
        "Integration capabilities",
        "Other",
      ],
      required: false,
    },
    {
      id: 5,
      type: "text",
      question: "Any additional thoughts or suggestions?",
      required: false,
    },
  ]

  // Filter questions based on branching logic
  const getActiveQuestions = () => {
    let activeQuestions = [...questions]

    // If user rated 1-2 stars (not interested), skip to final question
    if (answers[1] && answers[1] <= 2) {
      activeQuestions = [questions[0], questions[4]] // Only rating and final feedback
    }

    return activeQuestions
  }

  const activeQuestions = getActiveQuestions()
  const totalQuestions = activeQuestions.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Auto-save answers
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`survey_${params.id}`, JSON.stringify(answers))
    }
  }, [answers, params.id])

  // Load saved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem(`survey_${params.id}`)
    if (saved) {
      setAnswers(JSON.parse(saved))
    }
  }, [params.id])

  const handleClose = () => {
    if (Object.keys(answers).length > 0 && !isCompleted) {
      if (confirm("Are you sure? Your progress will be lost.")) {
        localStorage.removeItem(`survey_${params.id}`)
        setIsOpen(false)
        window.history.back()
      }
    } else {
      setIsOpen(false)
      window.history.back()
    }
  }

  const handleAnswer = (questionId: number, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = async () => {
    const currentQ = activeQuestions[currentQuestion]

    // Auto-advance for certain question types
    if (currentQ.type === "rating" || currentQ.type === "multiple-choice") {
      setTimeout(() => {
        if (currentQuestion < totalQuestions - 1) {
          setAnimationDirection("forward")
          setCurrentQuestion(currentQuestion + 1)
        } else {
          handleSubmit()
        }
      }, 1000)
    } else {
      if (currentQuestion < totalQuestions - 1) {
        setAnimationDirection("forward")
        setCurrentQuestion(currentQuestion + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setAnimationDirection("backward")
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsSubmitting(false)
      setIsCompleted(true)

      // Process reward
      setIsProcessingReward(true)
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setTransactionHash("0xabcd1234...5678efgh")
      setIsProcessingReward(false)
      setRewardProcessed(true)

      // Clean up saved data
      localStorage.removeItem(`survey_${params.id}`)

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        setIsOpen(false)
        window.location.href = "/dashboard"
      }, 5000)
    } catch (error) {
      setIsSubmitting(false)
      alert("tx successful")
    }
  }

  const isCurrentQuestionAnswered = () => {
    const currentQ = activeQuestions[currentQuestion]
    const answer = answers[currentQ.id]

    if (!currentQ.required) return true

    switch (currentQ.type) {
      case "rating":
        return answer && answer > 0
      case "multiple-choice":
        return answer && answer.length > 0
      case "range":
        return answer !== undefined
      case "multi-select":
        return true // Not required
      case "text":
        return true // Not required
      default:
        return false
    }
  }

  const renderQuestion = () => {
    const question = activeQuestions[currentQuestion]
    const answer = answers[question.id]

    switch (question.type) {
      case "rating":
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-medium text-white mb-8">{question.question}</h2>
            <div className="flex justify-center items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleAnswer(question.id, star)}
                  className="group transition-transform duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 transition-all duration-300 ${
                      answer >= star
                        ? "fill-[#2383E2] text-[#2383E2] animate-pulse"
                        : "text-[#404040] hover:text-[#606060]"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-[#888] max-w-md mx-auto">
              <span>Not interested</span>
              <span>Very interested</span>
            </div>
          </div>
        )

      case "multiple-choice":
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-white text-center mb-8">{question.question}</h2>
            <RadioGroup
              value={answer}
              onValueChange={(value) => handleAnswer(question.id, value)}
              className="space-y-4 max-w-md mx-auto"
            >
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option}
                    id={option}
                    className="border-[#404040] text-[#2383E2] data-[state=checked]:border-[#2383E2]"
                  />
                  <Label
                    htmlFor={option}
                    className="text-[#E5E5E5] cursor-pointer hover:text-white transition-colors flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "range":
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-white text-center mb-8">{question.question}</h2>
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <span className="text-3xl font-bold text-white">${answer || question.min || 0}/month</span>
              </div>
              <Slider
                value={[answer || question.min || 0]}
                onValueChange={(value) => handleAnswer(question.id, value[0])}
                min={question.min}
                max={question.max}
                step={question.step}
                className="[&_[role=slider]]:bg-[#2383E2] [&_[role=slider]]:border-[#2383E2] [&_.bg-primary]:bg-[#2383E2]"
              />
              <div className="flex justify-between text-sm text-[#888]">
                <span>${question.min}</span>
                <span>${question.max}</span>
              </div>
            </div>
          </div>
        )

      case "multi-select":
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-white text-center mb-8">{question.question}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-3">
                  <Checkbox
                    id={option}
                    checked={answer?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const currentAnswers = answer || []
                      if (checked) {
                        handleAnswer(question.id, [...currentAnswers, option])
                      } else {
                        handleAnswer(
                          question.id,
                          currentAnswers.filter((a: string) => a !== option),
                        )
                      }
                    }}
                    className="border-[#404040] data-[state=checked]:bg-[#2383E2] data-[state=checked]:border-[#2383E2]"
                  />
                  <Label
                    htmlFor={option}
                    className="text-[#E5E5E5] cursor-pointer hover:text-white transition-colors flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      case "text":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-medium text-white mb-2">{question.question}</h2>
              <Badge variant="secondary" className="bg-[#404040] text-[#888]">
                Optional
              </Badge>
            </div>
            <div className="max-w-2xl mx-auto">
              <Textarea
                value={answer || ""}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="Share your honest feedback here... (optional)"
                className="bg-[#2F2F2F] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="text-right mt-2">
                <span className="text-xs text-[#888]">{(answer || "").length}/500 characters</span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderCompletionScreen = () => {
    if (isProcessingReward) {
      return (
        <div className="text-center space-y-8 py-16">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-[#2383E2]" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing your reward...</h2>
            <p className="text-[#888]">Confirming transaction on blockchain...</p>
          </div>
        </div>
      )
    }

    if (rewardProcessed) {
      return (
        <div className="text-center space-y-8 py-16">
          <div className="relative">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 animate-bounce" />
            <div className="absolute -top-2 -right-2 animate-ping">
              <Coins className="w-8 h-8 text-[#2383E2]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Thank you for your feedback!</h2>
            <div className="space-y-2">
              <p className="text-[#E5E5E5]">Your responses help validate ideas</p>
              <div className="flex items-center justify-center gap-2">
                <Coins className="w-5 h-5 text-[#2383E2]" />
                <span className="text-xl font-bold text-[#2383E2]">{ideaData.reward} USDC added to your wallet!</span>
              </div>
            </div>
          </div>
          {transactionHash && (
            <div className="bg-[#2F2F2F] rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-[#888] mb-2">Transaction Hash:</p>
              <button className="flex items-center gap-2 text-[#2383E2] hover:text-[#1a6bc7] transition-colors">
                <span className="font-mono text-sm">{transactionHash}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-sm text-[#888]">Redirecting to dashboard in 5 seconds...</p>
        </div>
      )
    }

    return (
      <div className="text-center space-y-8 py-16">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Thank you for your feedback!</h2>
          <div className="space-y-2">
            <p className="text-[#E5E5E5]">Your responses help validate ideas</p>
            <p className="text-[#888]">Reward: {ideaData.reward} USDC</p>
            <p className="text-[#888]">Processing time: ~30 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-none w-full h-full m-0 p-0 bg-[#191919] border-none rounded-none sm:rounded-t-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-[#2F2F2F] p-6 pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-[#888] hover:text-white hover:bg-[#2F2F2F] p-2"
            >
              <X className="w-5 h-5" />
            </Button>

            <DialogTitle className="text-center flex-1 mx-4">
              <div className="text-white font-medium truncate max-w-md mx-auto">{ideaData.title}</div>
            </DialogTitle>

            <Badge className="bg-[#2383E2]/20 text-[#2383E2] flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {ideaData.reward} USDC
            </Badge>
          </div>

          {!isCompleted && (
            <>
              <Progress
                value={progress}
                className="h-1 bg-[#2F2F2F] [&>div]:bg-[#2383E2] [&>div]:transition-all [&>div]:duration-500 mt-4"
              />
              <p className="text-center text-sm text-[#888] mt-2">
                Question {currentQuestion + 1} of {totalQuestions}
              </p>
            </>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isOnline && (
            <div className="bg-red-500/20 border border-red-500/30 p-3 m-6 rounded-lg flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">Connection lost. Please check your internet connection.</span>
            </div>
          )}

          <div className="min-h-[60vh] flex items-center justify-center p-6">
            {isCompleted ? (
              renderCompletionScreen()
            ) : (
              <div
                className={`w-full max-w-4xl transition-all duration-300 ${
                  animationDirection === "forward" ? "animate-in slide-in-from-left" : "animate-in slide-in-from-right"
                }`}
              >
                {renderQuestion()}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        {!isCompleted && (
          <div className="border-t border-[#2F2F2F] p-6 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentQuestion === 0}
              className="text-[#888] hover:text-white hover:bg-[#2F2F2F] disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered() || isSubmitting || !isOnline}
              className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white px-8 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestion === totalQuestions - 1 ? (
                "Submit"
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
