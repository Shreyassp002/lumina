"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import {
  LUMINA_AUCTION_ABI,
  LUMINA_AUCTION_ADDRESS,
} from "../../abi/luminaAuction";
import { queryKeyFactory } from "../lib/queryKeys";
import { cacheStrategies } from "../lib/queryClient";
import {
  invalidateAuctionQueries,
  batchInvalidateAfterTransaction,
  setOptimisticData,
} from "../lib/queryUtils";
import { useState, useEffect, useCallback } from "react";
// Performance monitoring hooks removed

// Hook to get auction count with TanStack Query
export function useOptimizedAuctionCount() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeyFactory.auctions.count(),
    queryFn: async () => {
      const count = await publicClient.readContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: "getCurrentAuctionId",
      });
      return Number(count || 0);
    },
    ...cacheStrategies.auctionData,
  });
}

// Hook to get individual auction data with real-time updates
export function useOptimizedAuctionData(auctionId) {
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  // Performance monitoring removed

  const query = useQuery({
    queryKey: queryKeyFactory.auctions.byId(auctionId),
    queryFn: async () => {
      if (!auctionId) return null;

      const endInteraction = recordInteraction("fetchAuctionData");

      try {
        const [auction, bids] = await Promise.all([
          publicClient.readContract({
            address: LUMINA_AUCTION_ADDRESS,
            abi: LUMINA_AUCTION_ABI,
            functionName: "auctions",
            args: [auctionId],
          }),
          publicClient
            .readContract({
              address: LUMINA_AUCTION_ADDRESS,
              abi: LUMINA_AUCTION_ABI,
              functionName: "getAuctionBids",
              args: [auctionId],
            })
            .catch(() => []),
        ]);

        // Normalize auction data structure
        const normalizedAuction = {
          id: auctionId,
          tokenId: Number(auction.tokenId),
          seller: auction.seller,
          startPrice: auction.startPrice,
          currentBid: auction.currentBid,
          currentBidder: auction.currentBidder,
          startTime: Number(auction.startTime) * 1000,
          endTime: Number(auction.endTime) * 1000,
          minIncrement: auction.minIncrement,
          buyNowPrice:
            auction.buyNowPrice && auction.buyNowPrice > 0n
              ? auction.buyNowPrice
              : null,
          active: auction.active,
          settled: auction.settled,
          status:
            auction.active && Date.now() < Number(auction.endTime) * 1000
              ? "active"
              : auction.settled
              ? "ended"
              : "inactive",
          bidCount: Array.isArray(bids) ? bids.length : 0,
          lastUpdated: Date.now(),
        };

        endInteraction();
        return normalizedAuction;
      } catch (error) {
        endInteraction();
        throw error;
      }
    },
    enabled: !!auctionId,
    ...cacheStrategies.auctionData,
  });

  // Watch for real-time auction events
  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "BidPlaced",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (Number(log.args.auctionId) === Number(auctionId)) {
          // Invalidate auction data when new bid is placed
          queryClient.invalidateQueries({
            queryKey: queryKeyFactory.auctions.byId(auctionId),
          });
        }
      });
    },
  });

  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "AuctionSettled",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (Number(log.args.auctionId) === Number(auctionId)) {
          // Invalidate auction data when auction is settled
          queryClient.invalidateQueries({
            queryKey: queryKeyFactory.auctions.byId(auctionId),
          });
        }
      });
    },
  });

  return query;
}

// Hook to get all active auctions with real-time updates
export function useOptimizedAllAuctions() {
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeyFactory.auctions.active(),
    queryFn: async () => {
      try {
        const currentAuctionId = await publicClient.readContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "getCurrentAuctionId",
        });

        const count = Number(currentAuctionId || 0);
        if (!count) return [];

        const ids = Array.from({ length: count }, (_, i) => i + 1);

        // Fetch auctions and bid counts in parallel
        const [rawAuctions, bidsCounts] = await Promise.all([
          Promise.all(
            ids.map((id) =>
              publicClient
                .readContract({
                  address: LUMINA_AUCTION_ADDRESS,
                  abi: LUMINA_AUCTION_ABI,
                  functionName: "auctions",
                  args: [id],
                })
                .then((a) => ({ id, a }))
                .catch(() => null)
            )
          ),
          Promise.all(
            ids.map((id) =>
              publicClient
                .readContract({
                  address: LUMINA_AUCTION_ADDRESS,
                  abi: LUMINA_AUCTION_ABI,
                  functionName: "getAuctionBids",
                  args: [id],
                })
                .then((b) => (Array.isArray(b) ? b.length : 0))
                .catch(() => 0)
            )
          ),
        ]);

        // Normalize and filter auctions
        const normalizedAuctions = rawAuctions
          .filter(Boolean)
          .map((entry, idx) => {
            const a = entry.a;
            const endTimeSec = Number(a.endTime);
            const nowActive = a.active && Date.now() < endTimeSec * 1000;

            return {
              id: entry.id,
              tokenId: Number(a.tokenId),
              seller: a.seller,
              startPrice: a.startPrice,
              currentBid: a.currentBid,
              currentBidder: a.currentBidder,
              startTime: Number(a.startTime) * 1000,
              endTime: endTimeSec * 1000,
              minIncrement: a.minIncrement,
              buyNowPrice:
                a.buyNowPrice && a.buyNowPrice > 0n ? a.buyNowPrice : null,
              active: a.active,
              settled: a.settled,
              status: nowActive ? "active" : a.settled ? "ended" : "inactive",
              bidCount: bidsCounts[idx] || 0,
              lastUpdated: Date.now(),
            };
          })
          .filter((auction) => auction.status !== "inactive");

        return normalizedAuctions;
      } catch (error) {
        console.error("Failed loading auctions:", error);
        return [];
      }
    },
    ...cacheStrategies.auctionData,
  });

  // Watch for real-time auction events to invalidate all auctions
  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "AuctionCreated",
    onLogs: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.active(),
      });
    },
  });

  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "BidPlaced",
    onLogs: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.active(),
      });
    },
  });

  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "AuctionSettled",
    onLogs: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.active(),
      });
    },
  });

  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "AuctionCanceled",
    onLogs: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.active(),
      });
    },
  });

  return query;
}

// Hook to get user's auctions with real-time updates
export function useOptimizedUserAuctions(address) {
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeyFactory.auctions.userAuctions(address),
    queryFn: async () => {
      if (!address) return [];

      try {
        const currentAuctionId = await publicClient.readContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "getCurrentAuctionId",
        });

        const count = Number(currentAuctionId || 0);
        if (!count) return [];

        const ids = Array.from({ length: count }, (_, i) => i + 1);
        const auctions = await Promise.all(
          ids.map((id) =>
            publicClient
              .readContract({
                address: LUMINA_AUCTION_ADDRESS,
                abi: LUMINA_AUCTION_ABI,
                functionName: "auctions",
                args: [id],
              })
              .then((a) => ({ id, a }))
              .catch(() => null)
          )
        );

        const userAddress = address.toLowerCase();
        const userAuctions = auctions
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
              buyNowPrice:
                a.buyNowPrice && a.buyNowPrice > 0n ? a.buyNowPrice : null,
              active: a.active,
              settled: a.settled,
              status:
                a.active && Date.now() < Number(a.endTime) * 1000
                  ? "active"
                  : a.settled
                  ? "ended"
                  : "inactive",
              lastUpdated: Date.now(),
            };
          })
          .filter((auction) => auction.seller?.toLowerCase() === userAddress);

        return userAuctions;
      } catch (error) {
        console.error("Error fetching user auctions:", error);
        return [];
      }
    },
    enabled: !!address,
    ...cacheStrategies.auctionData,
  });

  // Watch for events that affect user's auctions
  useWatchContractEvent({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    eventName: "AuctionCreated",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args.seller?.toLowerCase() === address?.toLowerCase()) {
          queryClient.invalidateQueries({
            queryKey: queryKeyFactory.auctions.userAuctions(address),
          });
        }
      });
    },
  });

  return query;
}

// Hook to create auction with optimistic updates
export function useOptimizedCreateAuction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();

  const createAuction = useCallback(
    async (
      tokenId,
      startPrice,
      duration,
      minIncrement,
      auctionType,
      buyNowPrice
    ) => {
      try {
        await writeContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "createAuction",
          args: [
            tokenId,
            startPrice,
            duration,
            minIncrement,
            auctionType,
            buyNowPrice || 0,
          ],
        });
      } catch (error) {
        console.error("Create auction failed:", error);
        throw error;
      }
    },
    [writeContract]
  );

  // Invalidate queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      invalidateAuctionQueries(queryClient);
    }
  }, [isConfirmed, queryClient]);

  return {
    createAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to place bid with optimistic updates
export function useOptimizedPlaceBid() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();
  // Performance monitoring removed

  const placeBid = useCallback(
    trackInteraction("placeBid", async (auctionId, bidAmount) => {
      try {
        // Optimistic update - immediately update the auction data
        setOptimisticData(
          queryClient,
          queryKeyFactory.auctions.byId(auctionId),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              currentBid: bidAmount,
              bidCount: oldData.bidCount + 1,
              lastUpdated: Date.now(),
            };
          }
        );

        await writeContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "placeBid",
          args: [auctionId],
          value: bidAmount,
        });
      } catch (error) {
        // Rollback optimistic update on error
        queryClient.invalidateQueries({
          queryKey: queryKeyFactory.auctions.byId(auctionId),
        });
        console.error("Place bid failed:", error);
        throw error;
      }
    }),
    [writeContract, queryClient, trackInteraction]
  );

  // Invalidate queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      invalidateAuctionQueries(queryClient);
    }
  }, [isConfirmed, queryClient]);

  return {
    placeBid,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to buy now with optimistic updates
export function useOptimizedBuyNow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();

  const buyNow = useCallback(
    async (auctionId, buyNowPrice) => {
      try {
        // Optimistic update - mark auction as ended
        setOptimisticData(
          queryClient,
          queryKeyFactory.auctions.byId(auctionId),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              status: "ended",
              settled: true,
              lastUpdated: Date.now(),
            };
          }
        );

        await writeContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "buyNow",
          args: [auctionId],
          value: buyNowPrice,
        });
      } catch (error) {
        // Rollback optimistic update on error
        queryClient.invalidateQueries({
          queryKey: queryKeyFactory.auctions.byId(auctionId),
        });
        console.error("Buy now failed:", error);
        throw error;
      }
    },
    [writeContract, queryClient]
  );

  // Invalidate queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      invalidateAuctionQueries(queryClient);
    }
  }, [isConfirmed, queryClient]);

  return {
    buyNow,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to settle auction
export function useOptimizedSettleAuction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();

  const settleAuction = useCallback(
    async (auctionId) => {
      try {
        await writeContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "settleAuction",
          args: [auctionId],
        });
      } catch (error) {
        console.error("Settle auction failed:", error);
        throw error;
      }
    },
    [writeContract]
  );

  // Invalidate queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      invalidateAuctionQueries(queryClient);
    }
  }, [isConfirmed, queryClient]);

  return {
    settleAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to cancel auction
export function useOptimizedCancelAuction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();

  const cancelAuction = useCallback(
    async (auctionId) => {
      try {
        await writeContract({
          address: LUMINA_AUCTION_ADDRESS,
          abi: LUMINA_AUCTION_ABI,
          functionName: "cancelAuction",
          args: [auctionId],
        });
      } catch (error) {
        console.error("Cancel auction failed:", error);
        throw error;
      }
    },
    [writeContract]
  );

  // Invalidate queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      invalidateAuctionQueries(queryClient);
    }
  }, [isConfirmed, queryClient]);

  return {
    cancelAuction,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook for countdown timer that syncs with cached auction data
export function useAuctionCountdown(auction) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!auction?.endTime) {
      setTimeLeft("");
      setIsEnded(true);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const timeDiff = auction.endTime - now;

      if (timeDiff <= 0) {
        setTimeLeft("Ended");
        setIsEnded(true);
        return;
      }

      setIsEnded(false);

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction?.endTime]);

  return { timeLeft, isEnded };
}
