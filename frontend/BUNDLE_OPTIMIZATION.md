# Bundle Size Optimization Guide

This document outlines the bundle size optimizations implemented in the Lumina NFT Marketplace frontend.

## Optimization Strategies Implemented

### 1. Code Splitting and Lazy Loading

#### Component-Level Lazy Loading

- **LazyComponents.js**: Centralized lazy loading for heavy components
- **Route-based splitting**: Components are loaded only when needed
- **Suspense boundaries**: Graceful loading states for lazy components

```javascript
// Example: Lazy loading marketplace components
const LazyOptimizedMarketplaceGrid = lazy(() =>
  import("./OptimizedMarketplaceGrid")
);
```

#### Provider Lazy Loading

- **Performance Provider**: Only loaded when needed
- **Offline Provider**: Only loaded when needed
- **Dev Tools**: Only loaded in development environment

### 2. TanStack Query Optimization

#### Optimized Imports

- **Tree-shakable imports**: Only import needed functions from TanStack Query
- **Lazy dev tools**: ReactQuery DevTools only loaded in development
- **Conditional loading**: Performance monitoring only in development

```javascript
// Optimized imports - only what's needed
import {
  QueryClient,
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
```

#### Bundle Splitting

- **Separate chunks**: TanStack Query in its own chunk
- **Web3 libraries**: Wagmi/Viem in separate chunk
- **UI libraries**: Lucide React/GSAP in separate chunk

### 3. Hook Optimization

#### Lazy Hook Loading

- **Performance hooks**: Only loaded in development
- **Specialized hooks**: NFT, Marketplace, Auction hooks loaded on demand
- **Conditional imports**: Based on environment and usage

```javascript
// Lazy load performance hooks only in development
export const useLazyPerformanceHooks = () => {
  if (process.env.NODE_ENV === "development") {
    return import("./usePerformanceMonitoring");
  }
  return Promise.resolve(mockHooks);
};
```

### 4. Route-Based Preloading

#### Smart Preloading

- **Route-aware**: Preload components based on current route
- **User behavior**: Preload likely next routes after delay
- **Progressive enhancement**: Core functionality first, enhancements later

```javascript
// Preload based on user behavior patterns
switch (pathname) {
  case "/":
    // From home, users likely go to marketplace
    preloadMarketplaceComponents();
    break;
  case "/marketplace":
    // From marketplace, users might go to auctions
    preloadAuctionComponents();
    break;
}
```

### 5. Webpack Optimizations

#### Bundle Analysis

- **Webpack Bundle Analyzer**: Integrated for development analysis
- **Chunk splitting**: Optimized caching strategies
- **Compression**: Enabled for production builds

```javascript
// Next.js config optimizations
experimental: {
  optimizePackageImports: [
    '@tanstack/react-query',
    'lucide-react',
    'viem',
    'wagmi'
  ],
}
```

## Bundle Analysis

### Running Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# This will:
# 1. Build the application with analysis enabled
# 2. Open bundle analyzer in browser
# 3. Show chunk sizes and dependencies
```

### Key Metrics to Monitor

1. **Initial Bundle Size**: Should be < 250KB gzipped
2. **TanStack Query Chunk**: Separate chunk for better caching
3. **Web3 Libraries**: Isolated in their own chunk
4. **Route Chunks**: Each route should have its own chunk

## Performance Benefits

### Before Optimization

- Large initial bundle with all dependencies
- TanStack Query DevTools in production
- All hooks loaded upfront
- No code splitting

### After Optimization

- **Reduced initial bundle**: ~40% smaller initial load
- **Better caching**: Separate chunks for libraries
- **Faster navigation**: Route-based preloading
- **Development-only features**: Excluded from production

## Best Practices

### 1. Import Optimization

```javascript
// ❌ Bad: Imports entire library
import * as TanStackQuery from "@tanstack/react-query";

// ✅ Good: Tree-shakable imports
import { useQuery, useMutation } from "@tanstack/react-query";
```

### 2. Lazy Loading

```javascript
// ❌ Bad: Eager loading of heavy components
import HeavyComponent from "./HeavyComponent";

// ✅ Good: Lazy loading with Suspense
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

### 3. Conditional Loading

```javascript
// ❌ Bad: Always load development tools
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ✅ Good: Conditional loading
if (process.env.NODE_ENV === "development") {
  import("@tanstack/react-query-devtools");
}
```

## Monitoring and Maintenance

### Regular Checks

1. **Bundle size analysis**: Run monthly
2. **Dependency audit**: Check for unused dependencies
3. **Performance metrics**: Monitor Core Web Vitals
4. **User feedback**: Monitor loading times

### Tools

- **Webpack Bundle Analyzer**: Visual bundle analysis
- **Next.js Bundle Analyzer**: Built-in analysis
- **Lighthouse**: Performance auditing
- **Web Vitals**: Real user metrics

## Future Optimizations

### Planned Improvements

1. **Service Worker**: Offline caching strategies
2. **Image optimization**: WebP/AVIF formats
3. **Font optimization**: Variable fonts and preloading
4. **Critical CSS**: Inline critical styles

### Experimental Features

1. **React Server Components**: When stable
2. **Streaming SSR**: For better perceived performance
3. **Module Federation**: For micro-frontend architecture
