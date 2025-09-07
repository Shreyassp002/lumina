'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
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
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchUserAuctions = async () => {
      setIsLoading(true);
      try {
        const currentAuctionId = await publicClient.readContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: 'getCurrentAuctionId',
          args: [],
        });

        const count = Number(currentAuctionId || 0);
        if (!count) {
          setUserAuctions([]);
          return;
        }

        const ids = Array.from({ length: count }, (_, i) => i + 1);
        const auctions = await Promise.all(
          ids.map((id) =>
            publicClient
              .readContract({ address: LUMINA_AUCTION_ADDRESS, abi: LUMINA_AUCTION_ABI, functionName: 'auctions', args: [id] })
              .then((a) => ({ id, a }))
              .catch(() => null)
          )
        );

        const user = address.toLowerCase();
        const filtered = auctions
          .filter(Boolean)
          .map((entry) => {
            const a = entry.a;
            return {
              id: entry.id,
              tokenId: Number(a.tokenId),
              seller: a.seller,
              startPrice: a.startPrice,
              currentBid: a.currentBid,
              currentBidder: a.currentBidder,
              endTime: Number(a.endTime) * 1000,
              minIncrement: a.minIncrement,
              buyNowPrice: a.buyNowPrice && a.buyNowPrice > 0n ? a.buyNowPrice : null,
              active: a.active,
              settled: a.settled,
            };
          })
          .filter((x) => x.seller?.toLowerCase() === user);

        setUserAuctions(filtered);
      } catch (error) {
        console.error('Error fetching user auctions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAuctions();
  }, [address, publicClient]);

  return {
    auctions: userAuctions,
    isLoading,
  };
}

// Hook to get all active auctions
export function useAllAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const currentAuctionId = await publicClient.readContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: 'getCurrentAuctionId',
          args: [],
        });

        const count = Number(currentAuctionId || 0);
        if (!count) {
          setAuctions([]);
          return;
        }

        const ids = Array.from({ length: count }, (_, i) => i + 1);
        const rawAuctions = await Promise.all(
          ids.map((id) =>
            publicClient
              .readContract({ address: LUMINA_AUCTION_ADDRESS, abi: LUMINA_AUCTION_ABI, functionName: 'auctions', args: [id] })
              .then((a) => ({ id, a }))
              .catch(() => null)
          )
        );

        const bidsCounts = await Promise.all(
          ids.map((id) =>
            publicClient
              .readContract({ address: LUMINA_AUCTION_ADDRESS, abi: LUMINA_AUCTION_ABI, functionName: 'getAuctionBids', args: [id] })
              .then((b) => (Array.isArray(b) ? b.length : 0))
              .catch(() => 0)
          )
        );

        const auctionsParsed = rawAuctions
          .filter(Boolean)
          .map((entry, idx) => {
            const a = entry.a;
            return {
              id: entry.id,
              tokenId: Number(a.tokenId),
              seller: a.seller,
              startPrice: a.startPrice,
              currentBid: a.currentBid,
              currentBidder: a.currentBidder,
              endTime: Number(a.endTime) * 1000,
              minIncrement: a.minIncrement,
              buyNowPrice: a.buyNowPrice && a.buyNowPrice > 0n ? a.buyNowPrice : null,
              status: a.active ? 'active' : a.settled ? 'ended' : 'inactive',
              bidCount: bidsCounts[idx] || 0,
            };
          })
          .filter((x) => x.status !== 'inactive');

        setAuctions(auctionsParsed);
      } catch (e) {
        console.error('Failed loading auctions', e);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [publicClient]);

  return { auctions, isLoading };
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
