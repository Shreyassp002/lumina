'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LUMINA_AUCTION_ABI, LUMINA_AUCTION_ADDRESS } from '../../abi/luminaAuction';
import { useState, useEffect } from 'react';

// Hook to get auction count
export function useAuctionCount() {
  return useReadContract({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    functionName: 'getAuctionCount',
  });
}

// Hook to get auction data
export function useAuctionData(auctionId) {
  const { data: auction, isLoading } = useReadContract({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    functionName: 'auctions',
    args: auctionId ? [auctionId] : undefined,
    query: {
      enabled: !!auctionId,
    },
  });

  return {
    auction,
    isLoading,
  };
}

// Hook to get user's auctions
export function useUserAuctions(address) {
  const [userAuctions, setUserAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchUserAuctions = async () => {
      setIsLoading(true);
      try {
        // Get auction count first
        const { data: auctionCount } = await fetch('/api/contracts/getAuctionCount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contractAddress: LUMINA_AUCTION_ADDRESS
          }),
        });

        if (auctionCount) {
          const auctions = [];
          for (let i = 1; i <= auctionCount; i++) {
            try {
              const { data: auction } = await fetch('/api/contracts/getAuction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  contractAddress: LUMINA_AUCTION_ADDRESS,
                  auctionId: i
                }),
              });

              if (auction && auction.seller.toLowerCase() === address.toLowerCase()) {
                auctions.push({
                  id: i,
                  ...auction,
                });
              }
            } catch (error) {
              console.error(`Error fetching auction ${i}:`, error);
            }
          }
          setUserAuctions(auctions);
        }
      } catch (error) {
        console.error('Error fetching user auctions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAuctions();
  }, [address]);

  return {
    auctions: userAuctions,
    isLoading,
  };
}

// Hook to create auction
export function useCreateAuction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createAuction = async (tokenId, startPrice, duration, minIncrement, auctionType, buyNowPrice) => {
    try {
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'createAuction',
        args: [tokenId, startPrice, duration, minIncrement, auctionType, buyNowPrice || 0],
      });
    } catch (error) {
      console.error('Create auction failed:', error);
      throw error;
    }
  };

  return {
    createAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to place bid
export function usePlaceBid() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBid = async (auctionId, bidAmount) => {
    try {
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'placeBid',
        args: [auctionId],
        value: bidAmount,
      });
    } catch (error) {
      console.error('Place bid failed:', error);
      throw error;
    }
  };

  return {
    placeBid,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to buy now
export function useBuyNow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const buyNow = async (auctionId, buyNowPrice) => {
    try {
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'buyNow',
        args: [auctionId],
        value: buyNowPrice,
      });
    } catch (error) {
      console.error('Buy now failed:', error);
      throw error;
    }
  };

  return {
    buyNow,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to settle auction
export function useSettleAuction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const settleAuction = async (auctionId) => {
    try {
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'settleAuction',
        args: [auctionId],
      });
    } catch (error) {
      console.error('Settle auction failed:', error);
      throw error;
    }
  };

  return {
    settleAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to cancel auction
export function useCancelAuction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelAuction = async (auctionId) => {
    try {
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'cancelAuction',
        args: [auctionId],
      });
    } catch (error) {
      console.error('Cancel auction failed:', error);
      throw error;
    }
  };

  return {
    cancelAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to withdraw funds
export function useWithdraw() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = async () => {
    try {
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'withdraw',
      });
    } catch (error) {
      console.error('Withdraw failed:', error);
      throw error;
    }
  };

  return {
    withdraw,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}
