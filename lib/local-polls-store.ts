import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LocalPoll {
  id: string // Using string for local IDs to avoid conflicts
  contractId?: number // Will be set when blockchain transaction succeeds
  title: string
  description: string
  questions: string[]
  category: string
  duration: number
  rewardPool: string // Store as string to avoid BigInt serialization issues
  rewardPerFeedback: string
  maxFeedbacks: number
  creator: string
  createdAt: string
  isActive: boolean
  txHash?: string // Transaction hash from blockchain
  ipfsHash?: string // IPFS hash for metadata
  feedbacks: LocalFeedback[]
}

export interface LocalFeedback {
  id: string
  pollId: string
  pollContractId?: number
  respondent: string
  responses: string[]
  createdAt: string
  txHash?: string
  rewardAmount: string
}

interface LocalPollsState {
  polls: LocalPoll[]
  feedbacks: LocalFeedback[]
  
  // Poll actions
  addPoll: (poll: Omit<LocalPoll, 'id' | 'createdAt' | 'feedbacks'>) => string
  updatePollContractId: (localId: string, contractId: number, txHash: string) => void
  updatePollIpfsHash: (localId: string, ipfsHash: string) => void
  getPollById: (id: string) => LocalPoll | undefined
  getPollsByCreator: (creator: string) => LocalPoll[]
  getAllPolls: () => LocalPoll[]
  
  // Feedback actions
  addFeedback: (feedback: Omit<LocalFeedback, 'id' | 'createdAt'>) => string
  updateFeedbackTxHash: (feedbackId: string, txHash: string) => void
  getFeedbacksByPoll: (pollId: string) => LocalFeedback[]
  getFeedbacksByRespondent: (respondent: string) => LocalFeedback[]
  
  // Utility actions
  clearAllData: () => void
  
  // Demo/Mock data initialization
  initializeMockPolls: () => void
}

export const useLocalPollsStore = create<LocalPollsState>()(
  persist(
    (set, get) => ({
      polls: [],
      feedbacks: [],
      
      // Poll actions
      addPoll: (pollData) => {
        const id = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newPoll: LocalPoll = {
          ...pollData,
          id,
          createdAt: new Date().toISOString(),
          feedbacks: []
        }
        
        set((state) => ({
          polls: [...state.polls, newPoll]
        }))
        
        return id
      },
      
      updatePollContractId: (localId, contractId, txHash) => {
        set((state) => ({
          polls: state.polls.map(poll => 
            poll.id === localId 
              ? { ...poll, contractId, txHash }
              : poll
          )
        }))
      },
      
      updatePollIpfsHash: (localId, ipfsHash) => {
        set((state) => ({
          polls: state.polls.map(poll => 
            poll.id === localId 
              ? { ...poll, ipfsHash }
              : poll
          )
        }))
      },
      
      getPollById: (id) => {
        return get().polls.find(poll => poll.id === id)
      },
      
      getPollsByCreator: (creator) => {
        return get().polls.filter(poll => 
          poll.creator.toLowerCase() === creator.toLowerCase()
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      },
      
      getAllPolls: () => {
        return get().polls.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      },
      
      // Feedback actions
      addFeedback: (feedbackData) => {
        const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newFeedback: LocalFeedback = {
          ...feedbackData,
          id,
          createdAt: new Date().toISOString()
        }
        
        set((state) => ({
          feedbacks: [...state.feedbacks, newFeedback],
          polls: state.polls.map(poll => 
            poll.id === feedbackData.pollId
              ? { ...poll, feedbacks: [...poll.feedbacks, newFeedback] }
              : poll
          )
        }))
        
        return id
      },
      
      updateFeedbackTxHash: (feedbackId, txHash) => {
        set((state) => ({
          feedbacks: state.feedbacks.map(feedback => 
            feedback.id === feedbackId 
              ? { ...feedback, txHash }
              : feedback
          ),
          polls: state.polls.map(poll => ({
            ...poll,
            feedbacks: poll.feedbacks.map(feedback => 
              feedback.id === feedbackId 
                ? { ...feedback, txHash }
                : feedback
            )
          }))
        }))
      },
      
      getFeedbacksByPoll: (pollId) => {
        return get().feedbacks.filter(feedback => feedback.pollId === pollId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      },
      
      getFeedbacksByRespondent: (respondent) => {
        return get().feedbacks.filter(feedback => 
          feedback.respondent.toLowerCase() === respondent.toLowerCase()
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      },
      
      // Utility actions
      clearAllData: () => {
        set({ polls: [], feedbacks: [] })
      },
      
      // Demo/Mock data initialization
      initializeMockPolls: () => {
        const mockPolls: LocalPoll[] = [
          {
            id: 'mock_poll_1',
            contractId: 1,
            title: 'AI-Powered Task Management App Feedback',
            description: 'We\'re building an AI-powered task management application that learns from your work patterns and automatically prioritizes your tasks. We need your feedback on the core features and user experience to make it better.',
            questions: [
              'What features would you find most valuable in an AI task management app?',
              'How important is privacy when an AI system learns from your work patterns?',
              'What would make you switch from your current task management tool?',
              'How much would you be willing to pay monthly for an AI-powered productivity tool?'
            ],
            category: 'technology',
            duration: 14,
            rewardPool: '50000000000000000', // 0.05 ETH
            rewardPerFeedback: '10000000000000000', // 0.01 ETH
            maxFeedbacks: 5,
            creator: '0x1234567890123456789012345678901234567890',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            isActive: true,
            txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            ipfsHash: 'QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
            feedbacks: [
              {
                id: 'feedback_1',
                pollId: 'mock_poll_1',
                pollContractId: 1,
                respondent: '0x9876543210987654321098765432109876543210',
                responses: [
                  'Smart scheduling, automatic task prioritization, and integration with calendar apps would be most valuable.',
                  'Privacy is extremely important. I would need full control over what data is shared and stored.',
                  'Better AI insights, seamless integrations, and a cleaner interface than current tools.',
                  'Around $15-20 per month if it significantly improves my productivity.'
                ],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
                rewardAmount: '10000000000000000'
              }
            ]
          },
          {
            id: 'mock_poll_2',
            title: 'Sustainable Fashion Brand Concept',
            description: 'We\'re launching a sustainable fashion brand focused on eco-friendly materials and ethical manufacturing. Help us understand what consumers really want from sustainable fashion.',
            questions: [
              'What factors are most important when buying sustainable clothing?',
              'How much extra would you pay for truly sustainable fashion items?',
              'What sustainable materials or practices do you care about most?'
            ],
            category: 'business',
            duration: 10,
            rewardPool: '30000000000000000', // 0.03 ETH
            rewardPerFeedback: '5000000000000000', // 0.005 ETH
            maxFeedbacks: 6,
            creator: '0x2345678901234567890123456789012345678901',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            isActive: true,
            feedbacks: []
          },
          {
            id: 'mock_poll_3',
            title: 'Mobile App UI/UX Design Review',
            description: 'We\'ve designed a new mobile banking app interface and need feedback on the user experience, visual design, and overall usability before launch.',
            questions: [
              'What do you think about the overall visual design and color scheme?',
              'How intuitive do you find the navigation and menu structure?',
              'What features would you want to see prioritized on the main dashboard?',
              'Any concerns about security or trust with this interface design?'
            ],
            category: 'design',
            duration: 7,
            rewardPool: '40000000000000000', // 0.04 ETH
            rewardPerFeedback: '8000000000000000', // 0.008 ETH
            maxFeedbacks: 5,
            creator: '0x3456789012345678901234567890123456789012',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            isActive: true,
            feedbacks: [
              {
                id: 'feedback_2',
                pollId: 'mock_poll_3',
                respondent: '0x4567890123456789012345678901234567890123',
                responses: [
                  'The color scheme is modern and professional. I like the blue and white combination.',
                  'Navigation is quite intuitive, though the settings menu could be more prominent.',
                  'Account balance, recent transactions, and quick transfer options should be on main dashboard.',
                  'The interface looks trustworthy, but I\'d want to see more security indicators.'
                ],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                rewardAmount: '8000000000000000'
              }
            ]
          }
        ]

        set((state) => ({
          polls: [...state.polls, ...mockPolls.filter(mockPoll => 
            !state.polls.some(existingPoll => existingPoll.id === mockPoll.id)
          )]
        }))
      }
    }),
    {
      name: 'validify-local-polls',
      // Custom serialization to handle BigInt if needed
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
    }
  )
) 