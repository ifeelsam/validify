"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, Loader2 } from "lucide-react"

export default function ProfileSetup() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    location: "",
    occupation: "",
    industries: [] as string[],
    surveyFrequency: "",
    emailNotifications: true,
    inAppNotifications: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "E-commerce",
    "Entertainment",
    "Manufacturing",
    "Real Estate",
    "Food & Beverage",
    "Travel & Tourism",
    "Automotive",
    "Fashion",
  ]

  const calculateProgress = () => {
    const fields = ["fullName", "email", "age", "location", "occupation", "surveyFrequency"]
    const completed = fields.filter((field) => formData[field as keyof typeof formData]).length
    const industriesCompleted = formData.industries.length > 0 ? 1 : 0
    return Math.round(((completed + industriesCompleted) / (fields.length + 1)) * 100)
  }

  const handleIndustryChange = (industry: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      industries: checked ? [...prev.industries, industry] : prev.industries.filter((i) => i !== industry),
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid"
    if (!formData.age) newErrors.age = "Age is required"
    else if (Number.parseInt(formData.age) < 13 || Number.parseInt(formData.age) > 120)
      newErrors.age = "Age must be between 13 and 120"
    if (!formData.location.trim()) newErrors.location = "Location is required"
    if (!formData.occupation.trim()) newErrors.occupation = "Occupation is required"
    if (formData.industries.length === 0) newErrors.industries = "Select at least one industry"
    if (!formData.surveyFrequency) newErrors.surveyFrequency = "Select survey frequency"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif]">
        <header className="border-b border-[#2F2F2F] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Validify</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-[#E5E5E5]">0x1234...5678</span>
            </div>
          </div>
        </header>

        <main className="max-w-[800px] mx-auto px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Profile Complete!</h1>
            <p className="text-[#E5E5E5] text-lg mb-8">
              Your profile has been successfully set up. You'll start receiving targeted validation surveys based on
              your preferences.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-[#2383E2] hover:bg-[#1a6bc7] text-white px-8 py-3 rounded-md transition-all duration-200 hover:scale-[0.98]"
            >
              Continue to Dashboard
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E5E5E5] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="border-b border-[#2F2F2F] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-[#E5E5E5] hover:text-white hover:bg-[#2F2F2F] transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
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
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress
            value={calculateProgress()}
            className="h-1 bg-[#2F2F2F] [&>div]:bg-[#2383E2] [&>div]:transition-all [&>div]:duration-300"
          />
          <p className="text-xs text-[#E5E5E5] mt-2">{calculateProgress()}% complete</p>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Validify</h1>
          <p className="text-[#E5E5E5] text-base">Set up your profile to receive targeted idea validation surveys</p>
        </div>

        {/* Profile Setup Form */}
        <form onSubmit={handleSubmit} className="bg-[#2F2F2F] rounded-md p-8 border border-[#404040] shadow-sm">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>

            <div className="grid gap-6">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-[#E5E5E5] mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="bg-[#191919] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] transition-all duration-200 h-10"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#E5E5E5] mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-[#191919] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] transition-all duration-200 h-10"
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="age" className="text-sm font-medium text-[#E5E5E5] mb-2 block">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="13"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                    className="bg-[#191919] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] transition-all duration-200 h-10"
                    placeholder="25"
                  />
                  {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-[#E5E5E5] mb-2 block">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="bg-[#191919] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] transition-all duration-200 h-10"
                    placeholder="City, Country"
                  />
                  {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="occupation" className="text-sm font-medium text-[#E5E5E5] mb-2 block">
                  Occupation
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
                  className="bg-[#191919] border-[#404040] text-white placeholder:text-[#888] focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] transition-all duration-200 h-10"
                  placeholder="Your current occupation"
                />
                {errors.occupation && <p className="text-red-400 text-sm mt-1">{errors.occupation}</p>}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>

            <div className="space-y-8">
              {/* Industry Interests */}
              <div>
                <Label className="text-sm font-medium text-[#E5E5E5] mb-4 block">Industry Interests</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {industries.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <Checkbox
                        id={industry}
                        checked={formData.industries.includes(industry)}
                        onCheckedChange={(checked) => handleIndustryChange(industry, checked as boolean)}
                        className="border-[#404040] data-[state=checked]:bg-[#2383E2] data-[state=checked]:border-[#2383E2] data-[state=checked]:text-white"
                      />
                      <Label
                        htmlFor={industry}
                        className="text-sm text-[#E5E5E5] cursor-pointer hover:text-white transition-colors duration-200"
                      >
                        {industry}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.industries && <p className="text-red-400 text-sm mt-2">{errors.industries}</p>}
              </div>

              {/* Survey Frequency */}
              <div>
                <Label className="text-sm font-medium text-[#E5E5E5] mb-4 block">Survey Frequency</Label>
                <RadioGroup
                  value={formData.surveyFrequency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, surveyFrequency: value }))}
                  className="space-y-3"
                >
                  {["Daily", "Weekly", "Monthly"].map((frequency) => (
                    <div key={frequency} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={frequency.toLowerCase()}
                        id={frequency}
                        className="border-[#404040] text-[#2383E2] data-[state=checked]:border-[#2383E2]"
                      />
                      <Label
                        htmlFor={frequency}
                        className="text-sm text-[#E5E5E5] cursor-pointer hover:text-white transition-colors duration-200"
                      >
                        {frequency}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.surveyFrequency && <p className="text-red-400 text-sm mt-2">{errors.surveyFrequency}</p>}
              </div>

              {/* Notification Preferences */}
              <div>
                <Label className="text-sm font-medium text-[#E5E5E5] mb-4 block">Notification Preferences</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#191919] rounded-md border border-[#404040]">
                    <Label htmlFor="email-notifications" className="text-sm text-[#E5E5E5]">
                      Email Notifications
                    </Label>
                    <Switch
                      id="email-notifications"
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, emailNotifications: checked }))}
                      className="data-[state=checked]:bg-[#2383E2]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#191919] rounded-md border border-[#404040]">
                    <Label htmlFor="app-notifications" className="text-sm text-[#E5E5E5]">
                      In-App Notifications
                    </Label>
                    <Switch
                      id="app-notifications"
                      checked={formData.inAppNotifications}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, inAppNotifications: checked }))}
                      className="data-[state=checked]:bg-[#2383E2]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || calculateProgress() < 100}
            className="w-full bg-[#2383E2] hover:bg-[#1a6bc7] text-white py-3 rounded-md transition-all duration-200 hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : (
              "Complete Profile Setup"
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
