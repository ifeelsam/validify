"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Users, Clock, Coins, Target, CheckCircle, AlertCircle, Loader2, RefreshCw, X } from "lucide-react"

interface FormData {
  ideaDescription: string
  ageRange: [number, number]
  locations: string[]
  industries: string[]
  experienceLevel: string
  tokenAmount: string
  duration: string
  targetResponses: string
}

interface ValidationErrors {
  [key: string]: string
}

export default function CreatePoll() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [walletBalance] = useState(2.45)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [formData, setFormData] = useState<FormData>({
    ideaDescription: "",
    ageRange: [25, 45],
    locations: [],
    industries: [],
    experienceLevel: "",
    tokenAmount: "0.50",
    duration: "1week",
    targetResponses: "50",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Marketing",
    "E-commerce",
    "Manufacturing",
    "Real Estate",
    "Food & Beverage",
    "Travel & Tourism",
    "Automotive",
    "Fashion",
  ]

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "India",
    "Japan",
    "Brazil",
    "Mexico",
  ]

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft()
    }, 30000)

    return () => clearInterval(interval)
  }, [formData])

  const saveDraft = async () => {
    setIsDraftSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLastSaved(new Date())
    setIsDraftSaving(false)
  }

  const calculateEstimatedReach = () => {
    let baseReach = 10000
    if (formData.locations.length > 0) baseReach *= 0.3
    if (formData.industries.length > 0) baseReach *= 0.25
    if (formData.experienceLevel) baseReach *= 0.4
    return Math.floor(baseReach)
  }

  const calculateTotalCost = () => {
    const tokenAmount = Number.parseFloat(formData.tokenAmount) || 0
    const responses = Number.parseInt(formData.targetResponses) || 0
    return tokenAmount * responses
  }

  const calculatePerParticipant = () => {
    const totalCost = calculateTotalCost()
    const responses = Number.parseInt(formData.targetResponses) || 1
    return (totalCost / responses).toFixed(3)
  }

  const getEndDate = () => {
    const now = new Date()
    const durationMap = {
      "1day": 1,
      "3days": 3,
      "1week": 7,
      "2weeks": 14,
    }
    const days = durationMap[formData.duration as keyof typeof durationMap] || 7
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const validateStep = (step: number) => {
    const newErrors: ValidationErrors = {}

    switch (step) {
      case 1:
        if (!formData.ideaDescription.trim()) {
          newErrors.ideaDescription = "Idea description is required"
        } else if (formData.ideaDescription.length < 20) {
          newErrors.ideaDescription = "Description should be at least 20 characters"
        }
        break
      case 2:
        if (formData.industries.length === 0) {
          newErrors.industries = "Select at least one industry"
        }
        break
      case 3:
        const tokenAmount = Number.parseFloat(formData.tokenAmount)
        if (!tokenAmount || tokenAmount < 0.01) {
          newErrors.tokenAmount = "Minimum token amount is 0.01 USDC"
        }
        if (calculateTotalCost() > walletBalance) {
          newErrors.tokenAmount = "Insufficient wallet balance"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleLocationAdd = (location: string) => {
    if (!formData.locations.includes(location)) {
      setFormData((prev) => ({
        ...prev,
        locations: [...prev.locations, location],
      }))
    }
  }

  const handleLocationRemove = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== location),
    }))
  }

  const handleIndustryChange = (industry: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      industries: checked ? [...prev.industries, industry] : prev.industries.filter((i) => i !== industry),
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)
    // Simulate poll creation
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsSubmitting(false)

    // Redirect to success page or dashboard
    window.location.href = "/dashboard"
  }

  const getStepProgress = () => {
    return (currentStep / 4) * 100
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#E5E5E5] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="border-b border-[#2F2F2F] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
              className="text-[#E5E5E5] hover:text-white hover:bg-[#2F2F2F] transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-white">Validify</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-[#E5E5E5]">0x1234...5678</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[800px] mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Poll</h1>
          <p className="text-[#E5E5E5]">Validate your idea with targeted feedback and token rewards</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#E5E5E5]">Step {currentStep} of 4</span>
            <div className="flex items-center gap-2 text-xs text-[#888]">
              {isDraftSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving draft...
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Saved {lastSaved.toLocaleTimeString()}
                </>
              ) : null}
            </div>
          </div>
          <Progress value={getStepProgress()} className="h-1 bg-[#2F2F2F] [&>div]:bg-[#2383E2]" />
        </div>

        {/* Form Steps */}
        <div className="bg-[#2F2F2F] rounded-lg p-8 border border-[#404040]">
          {/* Step 1: Your Idea */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">1. Describe Your Idea</h2>
                <div>
                  <Label htmlFor="ideaDescription" className="text-[#E5E5E5] mb-2 block">
                    Idea Description *
                  </Label>
                  <Textarea
                    id="ideaDescription"
                    value={formData.ideaDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ideaDescription: e.target.value }))}
                    placeholder="Describe your idea in one compelling sentence..."
                    className="bg-[#121212] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] transition-all duration-200 min-h-[120px] resize-none"
                    maxLength={280}
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.ideaDescription && <p className="text-red-400 text-sm">{errors.ideaDescription}</p>}
                    <span
                      className={`text-xs ml-auto ${
                        formData.ideaDescription.length > 250
                          ? "text-red-400"
                          : formData.ideaDescription.length > 200
                            ? "text-yellow-400"
                            : "text-[#888]"
                      }`}
                    >
                      {formData.ideaDescription.length}/280 characters
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Audience */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-white mb-6">2. Define Your Target Audience</h2>

              {/* Age Range */}
              <div>
                <Label className="text-[#E5E5E5] mb-4 block">Age Range</Label>
                <div className="px-4">
                  <Slider
                    value={formData.ageRange}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ageRange: value as [number, number] }))}
                    min={18}
                    max={65}
                    step={1}
                    className="[&_[role=slider]]:bg-[#2383E2] [&_[role=slider]]:border-[#2383E2]"
                  />
                  <div className="flex justify-between text-sm text-[#888] mt-2">
                    <span>18 years</span>
                    <span className="text-white font-medium">
                      {formData.ageRange[0]} - {formData.ageRange[1]} years
                    </span>
                    <span>65 years</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-[#E5E5E5] mb-4 block">Location (Optional)</Label>
                <Select onValueChange={handleLocationAdd}>
                  <SelectTrigger className="bg-[#121212] border-[#404040] text-white">
                    <SelectValue placeholder="Select countries/regions" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2F2F2F] border-[#404040] text-white">
                    {countries
                      .filter((country) => !formData.locations.includes(country))
                      .map((country) => (
                        <SelectItem key={country} value={country} className="hover:bg-[#404040]">
                          {country}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.locations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.locations.map((location) => (
                      <Badge
                        key={location}
                        variant="secondary"
                        className="bg-[#404040] text-white hover:bg-[#505050] pr-1"
                      >
                        {location}
                        <button
                          onClick={() => handleLocationRemove(location)}
                          className="ml-2 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Industry/Profession */}
              <div>
                <Label className="text-[#E5E5E5] mb-4 block">Industry/Profession *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {industries.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <Checkbox
                        id={industry}
                        checked={formData.industries.includes(industry)}
                        onCheckedChange={(checked) => handleIndustryChange(industry, checked as boolean)}
                        className="border-[#404040] data-[state=checked]:bg-[#2383E2] data-[state=checked]:border-[#2383E2]"
                      />
                      <Label htmlFor={industry} className="text-sm text-[#E5E5E5] cursor-pointer">
                        {industry}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.industries && <p className="text-red-400 text-sm mt-2">{errors.industries}</p>}
              </div>

              {/* Experience Level */}
              <div>
                <Label className="text-[#E5E5E5] mb-4 block">Experience Level</Label>
                <RadioGroup
                  value={formData.experienceLevel}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, experienceLevel: value }))}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {["Beginner", "Intermediate", "Expert", "Mixed"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={level.toLowerCase()}
                        id={level}
                        className="border-[#404040] text-[#2383E2]"
                      />
                      <Label htmlFor={level} className="text-sm text-[#E5E5E5] cursor-pointer">
                        {level}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Audience Estimate */}
              <div className="bg-[#121212] rounded-lg p-4 border border-[#404040]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      Estimated reach: ~{calculateEstimatedReach().toLocaleString()} users
                    </p>
                    <p className="text-sm text-green-400">High precision match</p>
                  </div>
                  <Target className="w-8 h-8 text-[#2383E2]" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Poll Settings */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-white mb-6">3. Configure Poll Settings</h2>

              {/* Token Amount */}
              <div>
                <Label htmlFor="tokenAmount" className="text-[#E5E5E5] mb-2 block">
                  Token Amount per Response (USDC) *
                </Label>
                <div className="relative">
                  <Input
                    id="tokenAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.tokenAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tokenAmount: e.target.value }))}
                    className="bg-[#121212] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] pl-12"
                    placeholder="0.50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#888]">USDC</div>
                </div>
                {errors.tokenAmount && <p className="text-red-400 text-sm mt-1">{errors.tokenAmount}</p>}
                <p className="text-sm text-[#888] mt-2">
                  {formData.tokenAmount && formData.targetResponses
                    ? `${formData.tokenAmount} USDC ÷ ${formData.targetResponses} responses = ${calculatePerParticipant()} USDC per participant`
                    : "Total amount will be split equally among participants"}
                </p>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-[#E5E5E5] mb-2 block">Poll Duration</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger className="bg-[#121212] border-[#404040] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2F2F2F] border-[#404040] text-white">
                    <SelectItem value="1day">1 Day</SelectItem>
                    <SelectItem value="3days">3 Days</SelectItem>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="2weeks">2 Weeks</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-[#888] mt-2">Poll will end on {getEndDate()}</p>
              </div>

              {/* Target Responses */}
              <div>
                <Label htmlFor="targetResponses" className="text-[#E5E5E5] mb-2 block">
                  Target Responses
                </Label>
                <Input
                  id="targetResponses"
                  type="number"
                  min="10"
                  max="500"
                  value={formData.targetResponses}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetResponses: e.target.value }))}
                  className="bg-[#121212] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2]"
                />
              </div>

              {/* Cost Summary */}
              <div className="bg-[#121212] rounded-lg p-4 border border-[#404040]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Total Cost</span>
                  <span className="text-2xl font-bold text-white">{calculateTotalCost().toFixed(2)} USDC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#888]">Your Balance</span>
                  <div className="flex items-center gap-2">
                    <span className={walletBalance >= calculateTotalCost() ? "text-green-400" : "text-red-400"}>
                      {walletBalance.toFixed(2)} USDC
                    </span>
                    <Button variant="ghost" size="sm" className="p-1 h-auto">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-white mb-6">4. Preview Your Poll</h2>

              {/* Live Preview */}
              <div className="bg-[#121212] rounded-lg p-6 border border-[#404040]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white leading-tight flex-1 mr-3">
                    {formData.ideaDescription || "Your idea description will appear here"}
                  </h3>
                  <Badge className="bg-[#2383E2]/20 text-[#2383E2] flex items-center gap-1 shrink-0">
                    <Coins className="w-3 h-3" />
                    {formData.tokenAmount} USDC
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[#888]" />
                  <span className="text-sm text-[#888]">
                    {formData.duration === "1day"
                      ? "1 day left"
                      : formData.duration === "3days"
                        ? "3 days left"
                        : formData.duration === "1week"
                          ? "1 week left"
                          : "2 weeks left"}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#888]" />
                    <span className="text-sm text-[#E5E5E5]">
                      Age {formData.ageRange[0]}-{formData.ageRange[1]}
                      {formData.industries.length > 0 && `, ${formData.industries.slice(0, 2).join(", ")}`}
                      {formData.industries.length > 2 && ` +${formData.industries.length - 2} more`}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#E5E5E5]">0/{formData.targetResponses} responses</span>
                    <span className="text-sm text-[#888]">0%</span>
                  </div>
                  <Progress value={0} className="h-2 bg-[#404040] [&>div]:bg-[#2383E2]" />
                </div>

                <Button disabled className="w-full bg-[#404040] text-[#888] cursor-not-allowed">
                  <Users className="w-4 h-4 mr-2" />
                  Give Feedback (Preview)
                </Button>
                <p className="text-xs text-[#888] text-center mt-2">~3 minutes</p>
              </div>

              {/* Smart Suggestions */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-blue-400 font-medium">Suggestion</p>
                    <p className="text-sm text-[#E5E5E5]">
                      Consider adding more specific details about your target market to get higher quality feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-[#E5E5E5] hover:text-white hover:bg-[#2F2F2F]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={saveDraft}
              className="border-[#404040] text-[#E5E5E5] hover:bg-[#2F2F2F]"
            >
              Save Draft
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white px-8">
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || calculateTotalCost() > walletBalance}
                className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white px-8 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Poll...
                  </>
                ) : (
                  "Create Poll"
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2F2F2F]/95 backdrop-blur-md border-t border-[#404040] px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#888]">Step {currentStep} of 4</span>
            <Progress value={getStepProgress()} className="w-32 h-1 bg-[#404040] [&>div]:bg-[#2383E2]" />
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-medium text-white">Total Cost: {calculateTotalCost().toFixed(2)} USDC</div>
              <div className="text-xs text-[#888]">Balance: {walletBalance.toFixed(2)} USDC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding to account for fixed bar */}
      <div className="h-20"></div>
    </div>
  )
}
