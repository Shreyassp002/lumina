"use client";

import { lazy, Suspense } from "react";

// Loading component for lazy-loaded components
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-green-200/70">{message}</p>
    </div>
  </div>
);

// Lazy load marketplace components (heavy with TanStack Query)
export const LazyOptimizedMarketplaceGrid = lazy(() =>
  import("./OptimizedMarketplaceGrid").then((module) => ({
    default: module.default,
  }))
);

export const LazyMarketplaceDebug = lazy(() =>
  import("./MarketplaceDebug").then((module) => ({
    default: module.default,
  }))
);

// Lazy load NFT components
export const LazyOptimizedNFTGrid = lazy(() =>
  import("./OptimizedNFTGrid").then((module) => ({
    default: module.default,
  }))
);

export const LazyNFTCard = lazy(() =>
  import("./NFTCard").then((module) => ({
    default: module.default,
  }))
);

// Lazy load auction components
export const LazyAuctionCard = lazy(() =>
  import("./AuctionCard").then((module) => ({
    default: module.default,
  }))
);

export const LazyAuctionsDebug = lazy(() =>
  import("./AuctionsDebug").then((module) => ({
    default: module.default,
  }))
);

// Performance and offline components removed - no longer needed

export const LazyOfflineIndicator = lazy(() =>
  import("./OfflineIndicator").then((module) => ({
    default: module.default,
  }))
);

// Lazy load modal components (only needed when opened)
export const LazyNFTActionModal = lazy(() =>
  import("./NFTActionModal").then((module) => ({
    default: module.default,
  }))
);

// Higher-order component to wrap lazy components with Suspense
export const withLazyLoading = (LazyComponent, loadingMessage) => {
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

// Pre-configured lazy components with appropriate loading messages
export const MarketplaceGrid = withLazyLoading(
  LazyOptimizedMarketplaceGrid,
  "Loading marketplace..."
);

export const MarketplaceDebug = withLazyLoading(
  LazyMarketplaceDebug,
  "Loading debug info..."
);

export const NFTGrid = withLazyLoading(LazyOptimizedNFTGrid, "Loading NFTs...");

export const NFTCard = withLazyLoading(LazyNFTCard, "Loading NFT...");

export const AuctionCard = withLazyLoading(
  LazyAuctionCard,
  "Loading auction..."
);

export const AuctionsDebug = withLazyLoading(
  LazyAuctionsDebug,
  "Loading debug info..."
);

// Performance and offline components removed

export const OfflineIndicator = withLazyLoading(
  LazyOfflineIndicator,
  "Loading offline indicator..."
);

export const NFTActionModal = withLazyLoading(
  LazyNFTActionModal,
  "Loading modal..."
);

// Preload functions for critical components
export const preloadMarketplaceComponents = () => {
  // Preload marketplace components when user is likely to navigate there
  import("./OptimizedMarketplaceGrid");
  import("./MarketplaceDebug");
};

export const preloadAuctionComponents = () => {
  // Preload auction components when user is likely to navigate there
  import("./AuctionCard");
  import("./AuctionsDebug");
};

export const preloadNFTComponents = () => {
  // Preload NFT components when user is likely to need them
  import("./OptimizedNFTGrid");
  import("./NFTCard");
};

// Performance and offline preload functions removed
