import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "./wagmi";
import { monadTestnet } from "./wagmi";
import contractAbi from "./contract-abi.json";
import { VALIDIFY_CONTRACT_ADDRESS, GAS_LIMITS } from "./constants";
import type { Address } from "viem";

// Types based on the contract
export interface User {
  totalEarned: bigint;
  totalSpent: bigint;
  profileIPFSHash: string;
  isRegistered: boolean;
}

export interface Poll {
  creator: Address;
  rewardPool: bigint;
  rewardPerFeedback: bigint;
  pollDataHash: string;
  feedbacksReceived: bigint;
  maxFeedbacks: bigint;
  isActive: boolean;
}

export interface PollDetails {
  creator: Address;
  rewardPool: bigint;
  rewardPerFeedback: bigint;
  feedbacksReceived: bigint;
  maxFeedbacks: bigint;
  isActive: boolean;
}

interface ValidifyState {
  // Loading states
  isLoading: boolean;
  isRegistering: boolean;
  isCreatingPoll: boolean;
  isSubmittingFeedback: boolean;
  
  // Data
  currentUser: User | null;
  polls: Map<number, Poll>;
  totalPolls: number;
  
  // Actions
  setLoading: (loading: boolean) => void;
  
  // Contract interactions
  registerUser: (profileIPFSHash: string) => Promise<string>;
  createPoll: (pollDataHash: string, rewardPerFeedback: bigint, maxFeedbacks: bigint) => Promise<string>;
  submitFeedback: (pollId: number) => Promise<string>;
  
  // Read functions
  getUserData: (userAddress: Address) => Promise<User>;
  getPollDetails: (pollId: number) => Promise<PollDetails>;
  getPollDataHash: (pollId: number) => Promise<string>;
  getUserProfileHash: (userAddress: Address) => Promise<string>;
  hasUserSubmittedFeedback: (pollId: number, userAddress: Address) => Promise<boolean>;
  calculatePollCost: (rewardPerFeedback: bigint, maxFeedbacks: bigint) => Promise<bigint>;
  getMinimumRequirements: () => Promise<{ minTotal: bigint; minPerFeedback: bigint }>;
  getTotalPolls: () => Promise<number>;
  
  // Utility functions
  refreshUserData: (userAddress: Address) => Promise<void>;
  refreshPollData: (pollId: number) => Promise<void>;
  clearStore: () => void;
}

export const useValidifyStore = create<ValidifyState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isLoading: false,
      isRegistering: false,
      isCreatingPoll: false,
      isSubmittingFeedback: false,
      currentUser: null,
      polls: new Map(),
      totalPolls: 0,

      // Basic setters
      setLoading: (loading) => set({ isLoading: loading }),

      // Contract write functions
      registerUser: async (profileIPFSHash: string) => {
        set({ isRegistering: true });
        try {
          const result = await writeContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "registerUser",
            args: [profileIPFSHash],
            chainId: monadTestnet.id,
            gas: GAS_LIMITS.REGISTER_USER,
          });
          
          console.log("User registration result:", result);
          return result;
        } catch (error) {
          console.error("Error registering user:", error);
          throw error;
        } finally {
          set({ isRegistering: false });
        }
      },

      createPoll: async (pollDataHash: string, rewardPerFeedback: bigint, maxFeedbacks: bigint) => {
        set({ isCreatingPoll: true });
        try {
          // Calculate the total cost
          const totalCost = rewardPerFeedback * maxFeedbacks;
          
          const result = await writeContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "createPoll",
            args: [pollDataHash, rewardPerFeedback, maxFeedbacks],
            value: totalCost,
            chainId: monadTestnet.id,
            gas: GAS_LIMITS.CREATE_POLL,
          });
          
          console.log("Poll creation result:", result);
          
          // Refresh total polls count
          const newTotalPolls = await get().getTotalPolls();
          set({ totalPolls: newTotalPolls });
          
          return result;
        } catch (error) {
          console.error("Error creating poll:", error);
          throw error;
        } finally {
          set({ isCreatingPoll: false });
        }
      },

      submitFeedback: async (pollId: number) => {
        set({ isSubmittingFeedback: true });
        try {
          const result = await writeContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "submitFeedback",
            args: [BigInt(pollId)],
            chainId: monadTestnet.id,
            gas: GAS_LIMITS.SUBMIT_FEEDBACK,
          });
          
          console.log("Feedback submission result:", result);
          
          // Refresh poll data
          await get().refreshPollData(pollId);
          
          return result;
        } catch (error) {
          console.error("Error submitting feedback:", error);
          throw error;
        } finally {
          set({ isSubmittingFeedback: false });
        }
      },

      // Contract read functions
      getUserData: async (userAddress: Address) => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "users",
            args: [userAddress],
            chainId: monadTestnet.id,
          }) as [bigint, bigint, string, boolean];

          return {
            totalEarned: result[0],
            totalSpent: result[1],
            profileIPFSHash: result[2],
            isRegistered: result[3],
          };
        } catch (error) {
          console.error("Error getting user data:", error);
          throw error;
        }
      },

      getPollDetails: async (pollId: number) => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "getPollDetails",
            args: [BigInt(pollId)],
            chainId: monadTestnet.id,
          }) as [Address, bigint, bigint, bigint, bigint, boolean];

          return {
            creator: result[0],
            rewardPool: result[1],
            rewardPerFeedback: result[2],
            feedbacksReceived: result[3],
            maxFeedbacks: result[4],
            isActive: result[5],
          };
        } catch (error) {
          console.error("Error getting poll details:", error);
          throw error;
        }
      },

      getPollDataHash: async (pollId: number) => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "getPollDataHash",
            args: [BigInt(pollId)],
            chainId: monadTestnet.id,
          }) as string;

          return result;
        } catch (error) {
          console.error("Error getting poll data hash:", error);
          throw error;
        }
      },

      getUserProfileHash: async (userAddress: Address) => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "getUserProfileHash",
            args: [userAddress],
            chainId: monadTestnet.id,
          }) as string;

          return result;
        } catch (error) {
          console.error("Error getting user profile hash:", error);
          throw error;
        }
      },

      hasUserSubmittedFeedback: async (pollId: number, userAddress: Address) => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "hasUserSubmittedFeedback",
            args: [BigInt(pollId), userAddress],
            chainId: monadTestnet.id,
          }) as boolean;

          return result;
        } catch (error) {
          console.error("Error checking feedback submission:", error);
          throw error;
        }
      },

      calculatePollCost: async (rewardPerFeedback: bigint, maxFeedbacks: bigint) => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "calculatePollCost",
            args: [rewardPerFeedback, maxFeedbacks],
            chainId: monadTestnet.id,
          }) as bigint;

          return result;
        } catch (error) {
          console.error("Error calculating poll cost:", error);
          throw error;
        }
      },

      getMinimumRequirements: async () => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "getMinimumRequirements",
            chainId: monadTestnet.id,
          }) as [bigint, bigint];

          return {
            minTotal: result[0],
            minPerFeedback: result[1],
          };
        } catch (error) {
          console.error("Error getting minimum requirements:", error);
          throw error;
        }
      },

      getTotalPolls: async () => {
        try {
          const result = await readContract(config, {
            abi: contractAbi,
            address: VALIDIFY_CONTRACT_ADDRESS,
            functionName: "totalPolls",
            chainId: monadTestnet.id,
          }) as bigint;

          return Number(result);
        } catch (error) {
          console.error("Error getting total polls:", error);
          throw error;
        }
      },

      // Utility functions
      refreshUserData: async (userAddress: Address) => {
        try {
          const userData = await get().getUserData(userAddress);
          set({ currentUser: userData });
        } catch (error) {
          console.error("Error refreshing user data:", error);
          throw error;
        }
      },

      refreshPollData: async (pollId: number) => {
        try {
          const pollDetails = await get().getPollDetails(pollId);
          const pollDataHash = await get().getPollDataHash(pollId);
          
          const pollData: Poll = {
            creator: pollDetails.creator,
            rewardPool: pollDetails.rewardPool,
            rewardPerFeedback: pollDetails.rewardPerFeedback,
            pollDataHash,
            feedbacksReceived: pollDetails.feedbacksReceived,
            maxFeedbacks: pollDetails.maxFeedbacks,
            isActive: pollDetails.isActive,
          };

          set((state) => ({
            polls: new Map(state.polls.set(pollId, pollData)),
          }));
        } catch (error) {
          console.error("Error refreshing poll data:", error);
          throw error;
        }
      },

      clearStore: () => {
        set({
          isLoading: false,
          isRegistering: false,
          isCreatingPoll: false,
          isSubmittingFeedback: false,
          currentUser: null,
          polls: new Map(),
          totalPolls: 0,
        });
      },
    }),
    {
      name: "Validify Store",
      enabled: true,
    }
  )
); 