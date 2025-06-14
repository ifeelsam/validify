"use client"

import { useEffect } from 'react'
import { useLocalPollsStore } from '@/lib/local-polls-store'

export function DemoInitializer() {
  const { initializeMockPolls } = useLocalPollsStore()

  useEffect(() => {
    // Initialize mock polls for demo on app startup
    initializeMockPolls()
  }, [initializeMockPolls])

  return null // This component doesn't render anything
} 