// Contract address - replace with your deployed contract address
export const VALIDIFY_CONTRACT_ADDRESS = "0x087F004f5FEa82dc03b8D6Fb5B34c5F6745d3e93" as const;

// Minimum values from contract
export const MINIMUM_TOTAL_REWARD = BigInt("10000000001"); // 10 gwei + 1
export const MINIMUM_PER_FEEDBACK = BigInt("1000000000"); // 1 gwei

// Gas limits for different operations
export const GAS_LIMITS = {
  REGISTER_USER: BigInt(100000),
  CREATE_POLL: BigInt(150000),
  SUBMIT_FEEDBACK: BigInt(80000),
} as const; 

export const PINATA_JWT= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxMThiMzhjOC0yMDMwLTRiODUtYTZlMS05NDFkM2RjZTIyMTYiLCJlbWFpbCI6InJhbG9tYTE2ODFAZG93bmxvci5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYjBjZDQwMDk3NWNmMjQ5YzZlY2UiLCJzY29wZWRLZXlTZWNyZXQiOiJkOGNmOGExNmFhMTNmZTM0OTdiMmRhMTkwNDFkMTZhNThjODNlMGM4NGQwMjA0MjdiNDIwYjJjMzY3MTUxNTk1IiwiZXhwIjoxNzY4NjU5Mzk0fQ.xO1JnBeBMLpCr-253maJE1_jI3t2mKpuJ2zOzOM79gM";
export const VITE_GATEWAY_URL= "fuchsia-above-cricket-767.mypinata.cloud"
export const VITE_RPC_API_KEY= "0B9d9S5th5cr7IGb3tjSomBZVCw_4Zq1"