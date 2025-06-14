// Contract address - replace with your deployed contract address
export const VALIDIFY_CONTRACT_ADDRESS = "0xA1e21D77cE54b14D9B7133EBB26dd41e514A0aA0" as const;

// Minimum values from contract
export const MINIMUM_TOTAL_REWARD = BigInt("10000000001"); // 10 gwei + 1
export const MINIMUM_PER_FEEDBACK = BigInt("1000000000"); // 1 gwei

// Gas limits for different operations
export const GAS_LIMITS = {
  REGISTER_USER: BigInt(100000),
  CREATE_POLL: BigInt(150000),
  SUBMIT_FEEDBACK: BigInt(80000),
} as const; 