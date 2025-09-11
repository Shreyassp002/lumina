"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { LUMINA_NFT_ABI, LUMINA_NFT_ADDRESS } from "../../abi/luminaNft";
import { queryKeyFactory } from "../lib/queryKeys";
import { cacheStrategies } from "../lib/queryClientOptimized";
import { useState, useCallback, useEffect } from "react";
import {
  fetchMetadataWithFallback,
  normalizeNFTData,
  processBatch,
  retryWithBackoff,
} from "../lib/nftUtils";
// Simplified performance hooks - disabled for now
const getPerformanceHooks = async () => {
  return {
    useComponentPerformance: () => ({ recordInteraction: () => () => {} }),
    useInteractionTracking: () => ({ trackInteraction: (name, fn) => fn }),
  };
};

/**
 * Hook to get user's NFT balance with intelligent caching
 */
export function useUserNFTBalance(address) {
  return useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      ...cacheStrategies.userBalances,
    },
  });
}

/**
 * Hook to get individual NFT data with intelligent caching
 */
export function useNFTData(tokenId, options = {}) {
  const { enabled = true, includeMetadata = true } = options;
  const publicClient = usePublicClient();

  // Use lazy-loaded performance hooks
  const recordInteraction = async (name) => {
    if (process.env.NODE_ENV === "development") {
      const hooks = await getPerformanceHooks();
      return hooks
        .useComponentPerformance("useNFTData")
        .recordInteraction(name);
    }
    return () => {}; // No-op in production
  };

  return useQuery({
    queryKey: queryKeyFactory.nfts.byId(tokenId),
    queryFn: async () => {
      if (!tokenId || !publicClient) return null;

      const endInteraction = await recordInteraction("fetchNFTData");

      try {
        // Fetch all NFT data in parallel
        const [tokenURI, tokenData, owner] = await Promise.all([
          publicClient.readContract({
            address: LUMINA_NFT_ADDRESS,
            abi: LUMINA_NFT_ABI,
            functionName: "tokenURI",
            args: [tokenId],
          }),
          publicClient.readContract({
            address: LUMINA_NFT_ADDRESS,
            abi: LUMINA_NFT_ABI,
            functionName: "tokenData",
            args: [tokenId],
          }),
          publicClient.readContract({
            address: LUMINA_NFT_ADDRESS,
            abi: LUMINA_NFT_ABI,
            functionName: "ownerOf",
            args: [tokenId],
          }),
        ]);

        // Fetch metadata if requested
        let metadata = null;
        if (includeMetadata && tokenURI) {
          metadata = await fetchMetadataWithFallback(tokenURI);
        }

        const rawData = {
          tokenId: String(tokenId),
          tokenURI,
          tokenData,
          owner,
          metadata,
          imageUrl: metadata?.imageUrl || null,
          lastUpdated: Date.now(),
        };

        const result = normalizeNFTData(rawData);
        endInteraction();
        return result;
      } catch (error) {
        endInteraction();
        console.error(`Error fetching NFT data for token ${tokenId}:`, error);
        throw error;
      }
    },
    enabled: enabled && !!tokenId && !!publicClient,
    ...cacheStrategies.nftMetadata,
  });
}

/**
 * Hook to get NFT metadata with separate caching strategy
 */
export function useNFTMetadata(tokenURI, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeyFactory.metadata.ipfs(tokenURI),
    queryFn: () => fetchMetadataWithFallback(tokenURI),
    enabled: enabled && !!tokenURI,
    ...cacheStrategies.nftMetadata,
  });
}

/**
 * Hook to get user's owned NFTs with efficient batch fetching
 */
export function useUserNFTs(address, options = {}) {
  const { enabled = true, includeMetadata = true } = options;
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeyFactory.nfts.byOwner(address),
    queryFn: async () => {
      if (!address || !publicClient) return [];

      try {
        // Get current token counter
        const currentTokenId = await publicClient.readContract({
          address: LUMINA_NFT_ADDRESS,
          abi: LUMINA_NFT_ABI,
          functionName: "getCurrentTokenId",
          args: [],
        });

        console.log(`Current token ID for user NFTs: ${currentTokenId}`);

        if (!currentTokenId || Number(currentTokenId) === 0) {
          return [];
        }

        const tokenIds = Array.from(
          { length: Number(currentTokenId) },
          (_, idx) => idx + 1
        );

        // Batch fetch owners to find user's NFTs
        const owners = await processBatch(
          tokenIds,
          (id) =>
            publicClient
              .readContract({
                address: LUMINA_NFT_ADDRESS,
                abi: LUMINA_NFT_ABI,
                functionName: "ownerOf",
                args: [id],
              })
              .catch(() => null),
          10, // batch size
          50 // delay between batches
        );

        const ownedIds = tokenIds.filter(
          (id, i) =>
            owners[i] && owners[i].toLowerCase() === address.toLowerCase()
        );

        console.log(
          `Found ${ownedIds.length} owned NFTs for address ${address}:`,
          ownedIds
        );

        if (ownedIds.length === 0) {
          return [];
        }

        // Batch fetch token data and URIs for owned NFTs
        const [tokenDatas, tokenUris] = await Promise.all([
          processBatch(
            ownedIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "tokenData",
                  args: [id],
                })
                .catch(() => null),
            10,
            50
          ),
          processBatch(
            ownedIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "tokenURI",
                  args: [id],
                })
                .catch(() => null),
            10,
            50
          ),
        ]);

        // Fetch metadata if requested
        let metadataList = [];
        if (includeMetadata) {
          metadataList = await processBatch(
            tokenUris,
            (uri) => fetchMetadataWithFallback(uri),
            5, // smaller batch size for metadata
            100 // longer delay for IPFS
          );
        }

        // Combine all data and normalize
        const nfts = ownedIds.map((id, index) => {
          const rawData = {
            tokenId: String(id),
            owner: address,
            tokenData: tokenDatas[index],
            tokenURI: tokenUris[index],
            metadata: metadataList[index],
            imageUrl: metadataList[index]?.imageUrl || null,
            lastUpdated: Date.now(),
          };
          return normalizeNFTData(rawData);
        });

        return nfts.filter(Boolean); // Remove any null results
      } catch (error) {
        console.error("Error fetching user NFTs:", error);
        throw error;
      }
    },
    enabled: enabled && !!address && !!publicClient,
    ...cacheStrategies.userBalances,
    refetchOnReconnect: true,
  });
}

/**
 * Hook to get user's created NFTs with efficient batch fetching
 */
export function useUserCreatedNFTs(address, options = {}) {
  const { enabled = true, includeMetadata = true } = options;
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeyFactory.nfts.byCreator(address),
    queryFn: async () => {
      if (!address || !publicClient) return [];

      try {
        // Get current token counter
        const currentTokenId = await publicClient.readContract({
          address: LUMINA_NFT_ADDRESS,
          abi: LUMINA_NFT_ABI,
          functionName: "getCurrentTokenId",
          args: [],
        });

        if (!currentTokenId || Number(currentTokenId) === 0) {
          return [];
        }

        const tokenIds = Array.from(
          { length: Number(currentTokenId) },
          (_, idx) => idx + 1
        );

        // Batch fetch token data to find created NFTs
        const [tokenDatas, tokenUris] = await Promise.all([
          processBatch(
            tokenIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "tokenData",
                  args: [id],
                })
                .catch(() => null),
            10,
            50
          ),
          processBatch(
            tokenIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "tokenURI",
                  args: [id],
                })
                .catch(() => null),
            10,
            50
          ),
        ]);

        // Filter for NFTs created by the user
        const createdNFTs = tokenIds
          .map((id, i) => ({ id, data: tokenDatas[i], uri: tokenUris[i] }))
          .filter(
            (x) =>
              x.data &&
              x.data.creator &&
              x.data.creator.toLowerCase() === address.toLowerCase()
          );

        if (createdNFTs.length === 0) {
          return [];
        }

        // Fetch metadata if requested
        let metadataList = [];
        if (includeMetadata) {
          metadataList = await processBatch(
            createdNFTs.map((x) => x.uri),
            (uri) => fetchMetadataWithFallback(uri),
            5,
            100
          );
        }

        // Combine all data and normalize
        const nfts = createdNFTs.map((x, index) => {
          const rawData = {
            tokenId: String(x.id),
            owner: null, // Will be fetched separately if needed
            tokenData: x.data,
            tokenURI: x.uri,
            metadata: metadataList[index],
            imageUrl: metadataList[index]?.imageUrl || null,
            lastUpdated: Date.now(),
          };
          return normalizeNFTData(rawData);
        });

        return nfts.filter(Boolean);
      } catch (error) {
        console.error("Error fetching created NFTs:", error);
        throw error;
      }
    },
    enabled: enabled && !!address && !!publicClient,
    ...cacheStrategies.userBalances,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for batch NFT data fetching for collections and grids
 */
export function useBatchNFTData(tokenIds, options = {}) {
  const { enabled = true, includeMetadata = true, batchSize = 10 } = options;
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: queryKeyFactory.nfts.collection({ tokenIds, includeMetadata }),
    queryFn: async () => {
      if (!tokenIds || tokenIds.length === 0 || !publicClient) return [];

      try {
        // Fetch all data using batch processing
        const [tokenDatas, tokenUris, owners] = await Promise.all([
          processBatch(
            tokenIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "tokenData",
                  args: [id],
                })
                .catch(() => null),
            batchSize,
            50
          ),
          processBatch(
            tokenIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "tokenURI",
                  args: [id],
                })
                .catch(() => null),
            batchSize,
            50
          ),
          processBatch(
            tokenIds,
            (id) =>
              publicClient
                .readContract({
                  address: LUMINA_NFT_ADDRESS,
                  abi: LUMINA_NFT_ABI,
                  functionName: "ownerOf",
                  args: [id],
                })
                .catch(() => null),
            batchSize,
            50
          ),
        ]);

        // Fetch metadata if requested
        let metadataList = [];
        if (includeMetadata) {
          metadataList = await processBatch(
            tokenUris,
            (uri) => fetchMetadataWithFallback(uri),
            5,
            100
          );
        }

        // Combine all data and normalize
        const nfts = tokenIds.map((id, index) => {
          const rawData = {
            tokenId: String(id),
            owner: owners[index],
            tokenData: tokenDatas[index],
            tokenURI: tokenUris[index],
            metadata: metadataList[index],
            imageUrl: metadataList[index]?.imageUrl || null,
            lastUpdated: Date.now(),
          };
          return normalizeNFTData(rawData);
        });

        return nfts.filter(Boolean);
      } catch (error) {
        console.error("Error batch fetching NFT data:", error);
        throw error;
      }
    },
    enabled: enabled && !!tokenIds && tokenIds.length > 0 && !!publicClient,
    ...cacheStrategies.nftMetadata,
  });
}

/**
 * Hook for progressive image loading with placeholders
 */
export function useProgressiveImage(imageUrl, options = {}) {
  const { placeholder = null, enabled = true } = options;
  const [loadingState, setLoadingState] = useState("loading");
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  const loadImage = useCallback(() => {
    if (!imageUrl || !enabled) {
      setLoadingState("idle");
      return;
    }

    setLoadingState("loading");
    setCurrentSrc(placeholder);

    const img = new Image();

    img.onload = () => {
      setCurrentSrc(imageUrl);
      setLoadingState("loaded");
    };

    img.onerror = () => {
      setLoadingState("error");
      setCurrentSrc(placeholder);
    };

    img.src = imageUrl;
  }, [imageUrl, placeholder, enabled]);

  // Load image when URL changes
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return {
    src: currentSrc,
    isLoading: loadingState === "loading",
    isLoaded: loadingState === "loaded",
    isError: loadingState === "error",
    reload: loadImage,
  };
}

/**
 * Hook to get creator profile with caching
 */
export function useCreatorProfile(address, options = {}) {
  const { enabled = true } = options;

  return useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: "creatorProfiles",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
      ...cacheStrategies.nftMetadata,
    },
  });
}

/**
 * Hook to mint NFT with optimistic updates
 */
export function useMintNFT() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();

  // Use lazy-loaded performance hooks
  const trackInteraction = async (name, fn) => {
    if (process.env.NODE_ENV === "development") {
      const hooks = await getPerformanceHooks();
      return hooks.useInteractionTracking().trackInteraction(name, fn);
    }
    return fn; // Return function as-is in production
  };

  const mintNFT = async (metadataURI, royaltyBps, category) => {
    const trackedFunction = await trackInteraction(
      "mintNFT",
      async (metadataURI, royaltyBps, category) => {
        try {
          await writeContract({
            address: LUMINA_NFT_ADDRESS,
            abi: LUMINA_NFT_ABI,
            functionName: "mintNFT",
            args: [metadataURI, royaltyBps, category],
            value: 1000000000000000n, // 0.001 ETH mint fee
          });
        } catch (error) {
          console.error("Minting failed:", error);
          throw error;
        }
      }
    );
    return trackedFunction(metadataURI, royaltyBps, category);
  };

  // Invalidate relevant queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && hash) {
      // Invalidate platform stats and user data
      queryClient.invalidateQueries({
        queryKey: queryKeyFactory.platform.stats(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeyFactory.nfts.all() });
    }
  }, [isConfirmed, hash, queryClient]);

  return {
    mintNFT,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Main NFT data hook
// useNFTData is the primary export

/**
 * Hook to update creator profile with optimistic updates
 */
export function useUpdateCreatorProfile() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const queryClient = useQueryClient();

  const updateProfile = async (name, bio, socialLink) => {
    try {
      await writeContract({
        address: LUMINA_NFT_ADDRESS,
        abi: LUMINA_NFT_ABI,
        functionName: "updateCreatorProfile",
        args: [name, bio, socialLink],
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  };

  // Invalidate creator profile queries when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && hash) {
      queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.creatorProfile(),
      });
    }
  }, [isConfirmed, hash, queryClient]);

  return {
    updateProfile,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}
