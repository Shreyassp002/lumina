"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  LUMINA_MARKETPLACE_ABI,
  LUMINA_MARKETPLACE_ADDRESS,
} from "../../abi/luminaMarketplace";
import { queryKeys, cacheStrategies } from "../lib/queryClientOptimized";
import {
  invalidateMarketplaceQueries,
  setOptimisticData,
  batchInvalidateAfterTransaction,
} from "../lib/queryUtils";
import { useEffect } from "react";
// Simplified performance hooks - disabled for now
const getPerformanceHooks = async () => {
  return {
    useComponentPerformance: () => ({ recordInteraction: () => () => {} }),
    useInteractionTracking: () => ({ trackInteraction: (name, fn) => fn }),
  };
};

// Fetch function for marketplace listings with pagination
const fetchMarketplaceListings = async (
  publicClient,
  offset = 0,
  limit = 20
) => {
  try {
    const result = await publicClient.readContract({
      address: LUMINA_MARKETPLACE_ADDRESS,
      abi: LUMINA_MARKETPLACE_ABI,
      functionName: "getActiveListings",
      args: [offset, limit],
    });

    const [listingData, tokenIds] = result;

    if (
      listingData &&
      tokenIds &&
      Array.isArray(listingData) &&
      Array.isArray(tokenIds)
    ) {
      return listingData.map((listing, index) => ({
        ...listing,
        tokenId: listing.tokenId,
        listingId: tokenIds[index],
        priceWei:
          typeof listing.price === "bigint"
            ? listing.price
            : BigInt(String(listing.price)),
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching marketplace listings:", error);
    throw error;
  }
};

// Hook for infinite scroll marketplace listings with TanStack Query
export function useInfiniteMarketplaceListings(limit = 20) {
  const publicClient = usePublicClient();

  // Use lazy-loaded performance hooks
  const recordInteraction = async (name) => {
    if (process.env.NODE_ENV === "development") {
      const hooks = await getPerformanceHooks();
      return hooks
        .useComponentPerformance("useInfiniteMarketplaceListings")
        .recordInteraction(name);
    }
    return () => {}; // No-op in production
  };

  return useInfiniteQuery({
    queryKey: queryKeys.marketplace.listings(0, limit),
    queryFn: async ({ pageParam = 0 }) => {
      const endInteraction = await recordInteraction(
        "fetchMarketplaceListings"
      );
      try {
        const result = await fetchMarketplaceListings(
          publicClient,
          pageParam * limit,
          limit
        );
        endInteraction();
        return result;
      } catch (error) {
        endInteraction();
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < limit) {
        return undefined;
      }
      return allPages.length;
    },
    ...cacheStrategies.marketplaceListings,
    enabled: !!publicClient,
    refetchOnReconnect: true,
  });
}

// Hook for user's listings with intelligent caching
export function useUserListings(address) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeys.marketplace.userListings(address),
    queryFn: async () => {
      if (!address) return [];

      try {
        // Get all active listings and filter by user
        const allListings = await fetchMarketplaceListings(
          publicClient,
          0,
          20 // Further reduced limit to avoid contract rejection
        );
        return allListings.filter(
          (listing) => listing.seller.toLowerCase() === address.toLowerCase()
        );
      } catch (error) {
        console.error("Error fetching user listings:", error);
        throw error;
      }
    },
    ...cacheStrategies.marketplaceListings,
    enabled: !!address && !!publicClient,
    refetchOnReconnect: true,
  });
}

// Hook for marketplace statistics with longer cache
export function useMarketplaceStats() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeys.marketplace.stats(),
    queryFn: async () => {
      try {
        const [totalVolume, totalSales, activeCount] = await Promise.all([
          publicClient.readContract({
            address: LUMINA_MARKETPLACE_ADDRESS,
            abi: LUMINA_MARKETPLACE_ABI,
            functionName: "totalVolume",
          }),
          publicClient.readContract({
            address: LUMINA_MARKETPLACE_ADDRESS,
            abi: LUMINA_MARKETPLACE_ABI,
            functionName: "totalSales",
          }),
          publicClient.readContract({
            address: LUMINA_MARKETPLACE_ADDRESS,
            abi: LUMINA_MARKETPLACE_ABI,
            functionName: "getActiveListingsCount",
          }),
        ]);

        return {
          totalVolume,
          totalSales,
          activeListings: activeCount,
        };
      } catch (error) {
        console.error("Error fetching marketplace stats:", error);
        throw error;
      }
    },
    ...cacheStrategies.staticData, // Use longer cache for stats
    enabled: !!publicClient,
  });
}

// Hook for listing NFT with optimistic updates
export function useListNFT() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  // Use lazy-loaded performance hooks
  const trackInteraction = async (name, fn) => {
    if (process.env.NODE_ENV === "development") {
      const hooks = await getPerformanceHooks();
      return hooks.useInteractionTracking().trackInteraction(name, fn);
    }
    return fn; // Return function as-is in production
  };

  const mutation = useMutation({
    mutationFn: async ({ tokenId, price, userAddress }) => {
      const trackedFunction = await trackInteraction(
        "listNFT",
        async ({ tokenId, price, userAddress }) => {
          // Optimistic update - add the listing immediately to the cache
          const optimisticListing = {
            tokenId: BigInt(tokenId),
            price: BigInt(price),
            priceWei: BigInt(price),
            seller: userAddress,
            listingId: Date.now(), // Temporary ID
            isActive: true,
            isOptimistic: true, // Flag to identify optimistic updates
          };

          // Update infinite query cache optimistically
          queryClient.setQueryData(
            queryKeys.marketplace.listings(0, 20),
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                pages: oldData.pages.map((page, index) =>
                  index === 0 ? [optimisticListing, ...page] : page
                ),
              };
            }
          );

          // Update user listings cache optimistically
          queryClient.setQueryData(
            queryKeys.marketplace.userListings(userAddress),
            (oldData) =>
              oldData ? [optimisticListing, ...oldData] : [optimisticListing]
          );

          // Execute the actual transaction
          await writeContract({
            address: LUMINA_MARKETPLACE_ADDRESS,
            abi: LUMINA_MARKETPLACE_ABI,
            functionName: "listItem",
            args: [tokenId, price],
          });

          return { tokenId, price, userAddress };
        }
      );
      return trackedFunction({ tokenId, price, userAddress });
    },
    onSuccess: (data) => {
      // Transaction submitted successfully - the optimistic update stays
      console.log("Listing transaction submitted:", data);
    },
    onError: (error, variables) => {
      // Revert optimistic updates on error
      console.error("Listing failed, reverting optimistic updates:", error);

      // Remove optimistic listing from cache
      queryClient.setQueryData(
        queryKeys.marketplace.listings(0, 20),
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((listing) => !listing.isOptimistic)
            ),
          };
        }
      );

      queryClient.setQueryData(
        queryKeys.marketplace.userListings(variables.userAddress),
        (oldData) =>
          oldData ? oldData.filter((listing) => !listing.isOptimistic) : []
      );
    },
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      // Transaction confirmed - invalidate queries to get real data
      batchInvalidateAfterTransaction(queryClient, {
        userAddress: mutation.variables?.userAddress,
        tokenId: mutation.variables?.tokenId,
      });
    }
  }, [isConfirmed, queryClient, mutation.variables]);

  const listNFT = async (tokenId, price, userAddress) => {
    return mutation.mutate({ tokenId, price, userAddress });
  };

  return {
    listNFT,
    isPending: isPending || mutation.isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: mutation.error,
  };
}

// Hook for buying NFT with optimistic updates
export function useBuyNFT() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mutation = useMutation({
    mutationFn: async ({ listingId, price, userAddress }) => {
      // Optimistic update - remove the listing from cache immediately
      queryClient.setQueryData(
        queryKeys.marketplace.listings(0, 20),
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((listing) => listing.listingId !== listingId)
            ),
          };
        }
      );

      // Execute the actual transaction
      await writeContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: "buyItem",
        args: [listingId],
        value: price,
      });

      return { listingId, price, userAddress };
    },
    onError: (error, variables) => {
      // Revert optimistic updates on error
      console.error("Purchase failed, invalidating cache:", error);
      invalidateMarketplaceQueries(queryClient);
    },
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      // Transaction confirmed - invalidate all relevant queries
      batchInvalidateAfterTransaction(queryClient, {
        userAddress: mutation.variables?.userAddress,
      });
    }
  }, [isConfirmed, queryClient, mutation.variables]);

  const buyNFT = async (listingId, price, userAddress) => {
    return mutation.mutate({ listingId, price, userAddress });
  };

  return {
    buyNFT,
    isPending: isPending || mutation.isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: mutation.error,
  };
}

// Hook for canceling listing with optimistic updates
export function useCancelListing() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mutation = useMutation({
    mutationFn: async ({ listingId, userAddress }) => {
      // Optimistic update - remove the listing from cache immediately
      queryClient.setQueryData(
        queryKeys.marketplace.listings(0, 20),
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((listing) => listing.listingId !== listingId)
            ),
          };
        }
      );

      // Update user listings cache
      queryClient.setQueryData(
        queryKeys.marketplace.userListings(userAddress),
        (oldData) =>
          oldData
            ? oldData.filter((listing) => listing.listingId !== listingId)
            : []
      );

      // Execute the actual transaction
      await writeContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: "cancelListing",
        args: [listingId],
      });

      return { listingId, userAddress };
    },
    onError: (error) => {
      // Revert optimistic updates on error
      console.error("Cancel listing failed, invalidating cache:", error);
      invalidateMarketplaceQueries(queryClient);
    },
  });

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      // Transaction confirmed - invalidate queries to ensure consistency
      batchInvalidateAfterTransaction(queryClient, {
        userAddress: mutation.variables?.userAddress,
      });
    }
  }, [isConfirmed, queryClient, mutation.variables]);

  const cancelListing = async (listingId, userAddress) => {
    return mutation.mutate({ listingId, userAddress });
  };

  return {
    cancelListing,
    isPending: isPending || mutation.isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: mutation.error,
  };
}
