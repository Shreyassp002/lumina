"use client";

// Optimized imports for hooks - only import what's needed
// This file provides tree-shakable exports for better bundle optimization

// Core TanStack Query hooks (most commonly used)
export {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// Wagmi hooks - only import commonly used ones
export {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";

// Lazy load less common hooks
export const useLazyWagmiHooks = () => {
  return import("wagmi").then((module) => ({
    useBalance: module.useBalance,
    useBlockNumber: module.useBlockNumber,
    useChainId: module.useChainId,
    useConnect: module.useConnect,
    useDisconnect: module.useDisconnect,
    useSwitchChain: module.useSwitchChain,
    useWatchContractEvent: module.useWatchContractEvent,
  }));
};

// Performance monitoring hooks removed - no longer needed

// Lazy load offline hooks (only when needed)
export const useLazyOfflineHooks = () => {
  return import("./useNetworkStatus").then((module) => ({
    useNetworkStatus: module.useNetworkStatus,
  }));
};

// Lazy load specialized NFT hooks
export const useLazyNFTHooks = () => {
  return import("./useOptimizedNFT").then((module) => ({
    useNFTData: module.useNFTData,
    useUserNFTs: module.useUserNFTs,
    useUserCreatedNFTs: module.useUserCreatedNFTs,
    useBatchNFTData: module.useBatchNFTData,
    useProgressiveImage: module.useProgressiveImage,
    useCreatorProfile: module.useCreatorProfile,
    useMintNFT: module.useMintNFT,
    useUpdateCreatorProfile: module.useUpdateCreatorProfile,
  }));
};

// Lazy load marketplace hooks
export const useLazyMarketplaceHooks = () => {
  return import("./useOptimizedMarketplace").then((module) => ({
    useInfiniteMarketplaceListings: module.useInfiniteMarketplaceListings,
    useUserListings: module.useUserListings,
    useMarketplaceStats: module.useMarketplaceStats,
    useListNFT: module.useListNFT,
    useBuyNFT: module.useBuyNFT,
    useCancelListing: module.useCancelListing,
  }));
};

// Lazy load auction hooks
export const useLazyAuctionHooks = () => {
  return import("./useOptimizedAuction").then((module) => ({
    useOptimizedAllAuctions: module.useOptimizedAllAuctions,
    useOptimizedAuctionData: module.useOptimizedAuctionData,
    useOptimizedUserAuctions: module.useOptimizedUserAuctions,
    useCreateAuction: module.useCreateAuction,
    usePlaceBid: module.usePlaceBid,
    useSettleAuction: module.useSettleAuction,
  }));
};

// Preload functions for better UX
export const preloadNFTHooks = () => {
  import("./useOptimizedNFT");
};

export const preloadMarketplaceHooks = () => {
  import("./useOptimizedMarketplace");
};

export const preloadAuctionHooks = () => {
  import("./useOptimizedAuction");
};

// Utility function to preload hooks based on route
export const preloadHooksForRoute = (route) => {
  switch (route) {
    case "/marketplace":
      preloadMarketplaceHooks();
      preloadNFTHooks();
      break;
    case "/auctions":
      preloadAuctionHooks();
      preloadNFTHooks();
      break;
    case "/profile":
      preloadNFTHooks();
      preloadMarketplaceHooks();
      preloadAuctionHooks();
      break;
    case "/create":
      preloadNFTHooks();
      break;
    default:
      // Preload nothing for home page to keep it fast
      break;
  }
};
