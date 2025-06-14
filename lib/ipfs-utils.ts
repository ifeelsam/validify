import { PINATA_JWT, VITE_GATEWAY_URL } from './constants';

/**
 * Upload JSON data to IPFS via Pinata
 * @param jsonData Any JSON serializable data
 * @returns IPFS hash (CID)
 */
export async function uploadJsonToIPFS(jsonData: any): Promise<string> {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: `validify-${Date.now()}`
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('IPFS upload successful:', result);
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for a given hash
 * @param hash IPFS hash (CID)
 * @returns Full gateway URL
 */
export function getIpfsUrl(hash: string): string {
  return `https://${VITE_GATEWAY_URL}/ipfs/${hash}`;
}

/**
 * Fetch JSON data from IPFS
 * @param hash IPFS hash (CID)
 * @returns Parsed JSON data
 */
export async function fetchFromIPFS<T>(hash: string): Promise<T> {
  try {
    const url = getIpfsUrl(hash);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
} 