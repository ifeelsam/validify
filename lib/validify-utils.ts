import { formatEther, parseEther } from "viem";
import { MINIMUM_TOTAL_REWARD, MINIMUM_PER_FEEDBACK } from "./constants";

/**
 * Format wei to ETH string with specified decimal places
 */
export function formatWeiToEth(wei: bigint, decimals: number = 4): string {
  return Number(formatEther(wei)).toFixed(decimals);
}

/**
 * Parse ETH string to wei
 */
export function parseEthToWei(eth: string): bigint {
  return parseEther(eth);
}

/**
 * Validate poll creation parameters
 */
export function validatePollParams(rewardPerFeedback: bigint, maxFeedbacks: bigint): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (rewardPerFeedback < MINIMUM_PER_FEEDBACK) {
    errors.push(`Reward per feedback must be at least ${formatWeiToEth(MINIMUM_PER_FEEDBACK)} ETH`);
  }

  if (maxFeedbacks <= BigInt(0)) {
    errors.push("Max feedbacks must be greater than 0");
  }

  const totalCost = rewardPerFeedback * maxFeedbacks;
  if (totalCost <= MINIMUM_TOTAL_REWARD) {
    errors.push(`Total reward pool must be greater than ${formatWeiToEth(MINIMUM_TOTAL_REWARD)} ETH`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate poll cost
 */
export function calculatePollCost(rewardPerFeedback: bigint, maxFeedbacks: bigint): bigint {
  return rewardPerFeedback * maxFeedbacks;
}

/**
 * Format poll status
 */
export function formatPollStatus(poll: {
  isActive: boolean;
  feedbacksReceived: bigint;
  maxFeedbacks: bigint;
}): string {
  if (!poll.isActive) {
    return "Completed";
  }
  
  if (poll.feedbacksReceived >= poll.maxFeedbacks) {
    return "Full";
  }
  
  return "Active";
}

/**
 * Calculate poll progress percentage
 */
export function calculatePollProgress(feedbacksReceived: bigint, maxFeedbacks: bigint): number {
  if (maxFeedbacks === BigInt(0)) return 0;
  return Math.min(Number((feedbacksReceived * BigInt(100)) / maxFeedbacks), 100);
}

/**
 * Validate IPFS hash format (basic validation)
 */
export function validateIPFSHash(hash: string): boolean {
  // Basic IPFS hash validation - should start with Qm and be 46 characters
  const ipfsRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  return ipfsRegex.test(hash);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Check if user can submit feedback
 */
export function canSubmitFeedback(poll: {
  isActive: boolean;
  feedbacksReceived: bigint;
  maxFeedbacks: bigint;
}, hasSubmitted: boolean): {
  canSubmit: boolean;
  reason?: string;
} {
  if (hasSubmitted) {
    return { canSubmit: false, reason: "Already submitted feedback" };
  }
  
  if (!poll.isActive) {
    return { canSubmit: false, reason: "Poll is not active" };
  }
  
  if (poll.feedbacksReceived >= poll.maxFeedbacks) {
    return { canSubmit: false, reason: "Maximum feedbacks reached" };
  }
  
  return { canSubmit: true };
}

/**
 * Generate poll summary
 */
export function generatePollSummary(poll: {
  rewardPool: bigint;
  rewardPerFeedback: bigint;
  feedbacksReceived: bigint;
  maxFeedbacks: bigint;
  isActive: boolean;
}): {
  totalReward: string;
  rewardPerFeedback: string;
  progress: number;
  status: string;
  remainingSlots: number;
} {
  return {
    totalReward: formatWeiToEth(poll.rewardPool),
    rewardPerFeedback: formatWeiToEth(poll.rewardPerFeedback),
    progress: calculatePollProgress(poll.feedbacksReceived, poll.maxFeedbacks),
    status: formatPollStatus(poll),
    remainingSlots: Number(poll.maxFeedbacks - poll.feedbacksReceived),
  };
} 