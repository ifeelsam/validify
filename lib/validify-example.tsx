import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useValidifyStore } from './validify-store';
import { formatWeiToEth, parseEthToWei, validatePollParams, truncateAddress } from './validify-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Example component showing how to use the Validify store
export function ValidifyExample() {
  const { address, isConnected } = useAccount();
  const {
    // State
    currentUser,
    isRegistering,
    isCreatingPoll,
    isSubmittingFeedback,
    totalPolls,
    
    // Actions
    registerUser,
    createPoll,
    submitFeedback,
    getUserData,
    getPollDetails,
    calculatePollCost,
    refreshUserData,
    getTotalPolls,
  } = useValidifyStore();

  // Local state for forms
  const [profileHash, setProfileHash] = useState('');
  const [pollDataHash, setPollDataHash] = useState('');
  const [rewardPerFeedback, setRewardPerFeedback] = useState('');
  const [maxFeedbacks, setMaxFeedbacks] = useState('');
  const [pollCost, setPollCost] = useState<bigint | null>(null);

  // Load user data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      refreshUserData(address);
      getTotalPolls().then(count => console.log('Total polls:', count));
    }
  }, [isConnected, address, refreshUserData, getTotalPolls]);

  // Calculate poll cost when inputs change
  useEffect(() => {
    if (rewardPerFeedback && maxFeedbacks) {
      try {
        const rewardWei = parseEthToWei(rewardPerFeedback);
        const maxFeedbacksBigInt = BigInt(maxFeedbacks);
        const cost = rewardWei * maxFeedbacksBigInt;
        setPollCost(cost);
      } catch (error) {
        setPollCost(null);
      }
    } else {
      setPollCost(null);
    }
  }, [rewardPerFeedback, maxFeedbacks]);

  const handleRegisterUser = async () => {
    if (!profileHash.trim()) {
      alert('Please enter a profile IPFS hash');
      return;
    }

    try {
      const txHash = await registerUser(profileHash);
      console.log('Registration transaction:', txHash);
      alert('User registered successfully!');
      setProfileHash('');
      
      // Refresh user data
      if (address) {
        await refreshUserData(address);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Check console for details.');
    }
  };

  const handleCreatePoll = async () => {
    if (!pollDataHash.trim() || !rewardPerFeedback || !maxFeedbacks) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const rewardWei = parseEthToWei(rewardPerFeedback);
      const maxFeedbacksBigInt = BigInt(maxFeedbacks);

      // Validate parameters
      const validation = validatePollParams(rewardWei, maxFeedbacksBigInt);
      if (!validation.isValid) {
        alert('Validation errors:\n' + validation.errors.join('\n'));
        return;
      }

      const txHash = await createPoll(pollDataHash, rewardWei, maxFeedbacksBigInt);
      console.log('Poll creation transaction:', txHash);
      alert('Poll created successfully!');
      
      // Clear form
      setPollDataHash('');
      setRewardPerFeedback('');
      setMaxFeedbacks('');
      setPollCost(null);
    } catch (error) {
      console.error('Poll creation failed:', error);
      alert('Poll creation failed. Check console for details.');
    }
  };

  const handleSubmitFeedback = async (pollId: number) => {
    try {
      const txHash = await submitFeedback(pollId);
      console.log('Feedback submission transaction:', txHash);
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Feedback submission failed:', error);
      alert('Feedback submission failed. Check console for details.');
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Please connect your wallet to use Validify
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Validify Contract Interface</h1>
      
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Address:</strong> {truncateAddress(address || '')}</p>
            <p><strong>Registered:</strong> {currentUser?.isRegistered ? 'Yes' : 'No'}</p>
            {currentUser?.isRegistered && (
              <>
                <p><strong>Total Earned:</strong> {formatWeiToEth(currentUser.totalEarned)} ETH</p>
                <p><strong>Total Spent:</strong> {formatWeiToEth(currentUser.totalSpent)} ETH</p>
                <p><strong>Profile Hash:</strong> {currentUser.profileIPFSHash}</p>
              </>
            )}
            <p><strong>Total Polls:</strong> {totalPolls}</p>
          </div>
        </CardContent>
      </Card>

      {/* User Registration */}
      {!currentUser?.isRegistered && (
        <Card>
          <CardHeader>
            <CardTitle>Register User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Profile IPFS Hash (e.g., QmXXXXXX...)"
                value={profileHash}
                onChange={(e) => setProfileHash(e.target.value)}
              />
              <Button 
                onClick={handleRegisterUser}
                disabled={isRegistering}
                className="w-full"
              >
                {isRegistering ? 'Registering...' : 'Register User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poll Creation */}
      {currentUser?.isRegistered && (
        <Card>
          <CardHeader>
            <CardTitle>Create Poll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Poll Data IPFS Hash"
                value={pollDataHash}
                onChange={(e) => setPollDataHash(e.target.value)}
              />
              <Input
                placeholder="Reward per Feedback (ETH)"
                type="number"
                step="0.0001"
                value={rewardPerFeedback}
                onChange={(e) => setRewardPerFeedback(e.target.value)}
              />
              <Input
                placeholder="Maximum Feedbacks"
                type="number"
                value={maxFeedbacks}
                onChange={(e) => setMaxFeedbacks(e.target.value)}
              />
              {pollCost && (
                <p className="text-sm text-gray-600">
                  <strong>Total Cost:</strong> {formatWeiToEth(pollCost)} ETH
                </p>
              )}
              <Button 
                onClick={handleCreatePoll}
                disabled={isCreatingPoll}
                className="w-full"
              >
                {isCreatingPoll ? 'Creating Poll...' : 'Create Poll'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Feedback Submission */}
      {currentUser?.isRegistered && totalPolls > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Example: Submit feedback for poll #1
              </p>
              <Button 
                onClick={() => handleSubmitFeedback(1)}
                disabled={isSubmittingFeedback}
                className="w-full"
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback for Poll #1'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for easy access to user registration status
export function useUserRegistration() {
  const { address } = useAccount();
  const { currentUser, refreshUserData } = useValidifyStore();

  useEffect(() => {
    if (address) {
      refreshUserData(address);
    }
  }, [address, refreshUserData]);

  return {
    isRegistered: currentUser?.isRegistered || false,
    userData: currentUser,
    isLoading: !currentUser && !!address,
  };
}

// Hook for poll management
export function usePollManagement() {
  const {
    isCreatingPoll,
    createPoll,
    calculatePollCost,
    getMinimumRequirements,
  } = useValidifyStore();

  const [minimumRequirements, setMinimumRequirements] = useState<{
    minTotal: bigint;
    minPerFeedback: bigint;
  } | null>(null);

  useEffect(() => {
    getMinimumRequirements().then(setMinimumRequirements);
  }, [getMinimumRequirements]);

  return {
    isCreatingPoll,
    createPoll,
    calculatePollCost,
    minimumRequirements,
  };
} 