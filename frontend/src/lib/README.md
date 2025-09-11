# Query Key Management System

This directory contains the centralized query key management system for the Lumina NFT Marketplace frontend. The system provides consistent query key generation, intelligent cache invalidation, and comprehensive cache management utilities.

## Overview

The query key management system addresses the following challenges:

- **Inconsistent query keys** across different components
- **Manual cache invalidation** leading to stale data
- **Redundant API calls** due to poor cache management
- **Difficult debugging** of cache-related issues

## Architecture

```
lib/
├── queryKeys.js          # Centralized query key factory
├── queryKeyUtils.js      # Cache management utilities
├── queryClient.js        # TanStack Query client configuration
├── queryKeyExamples.js   # Usage examples and patterns
└── __tests__/           # Comprehensive test suite
    ├── queryKeys.test.js
    └── queryKeyUtils.test.js
```

## Core Components

### 1. Query Key Factory (`queryKeys.js`)

Provides typed query key generation for all data types:

```javascript
import { queryKeyFactory } from "./lib/queryKeys";

// NFT queries
const nftKey = queryKeyFactory.nfts.byId("123");
// Result: ['nfts', 'byId', '123']

// Marketplace queries with filters
const listingsKey = queryKeyFactory.marketplace.listings(0, 20, {
  category: "art",
});
// Result: ['marketplace', 'listings', { offset: 0, limit: 20, category: 'art' }]

// User queries
const userKey = queryKeyFactory.user.profile("0x1234...");
// Result: ['user', 'profile', '0x1234...']
```

### 2. Cache Management Utilities (`queryKeyUtils.js`)

Provides comprehensive cache management:

```javascript
import { createQueryUtils } from "./lib/queryKeyUtils";

const queryClient = useQueryClient();
const queryUtils = createQueryUtils(queryClient);

// Invalidate related queries after transaction
await queryUtils.invalidation.invalidateOnTransaction("MARKETPLACE_BUY", {
  buyerAddress: "0x1234...",
  sellerAddress: "0x5678...",
  tokenId: "123",
});

// Prefetch user data for better UX
await queryUtils.prefetch.prefetchUserData("0x1234...");

// Clean up stale cache data
queryUtils.cache.removeStaleNFTMetadata();
```

### 3. Query Client Configuration (`queryClient.js`)

TanStack Query client with intelligent defaults:

```javascript
import { createQueryClientWithUtils } from "./lib/queryClient";

const queryClient = createQueryClientWithUtils();
// Query client now has utilities attached: queryClient.utils
```

## Key Features

### 🔑 Consistent Key Generation

All query keys follow a consistent pattern:

- `['nfts', 'byId', tokenId]` - Individual NFT data
- `['marketplace', 'listings', filters]` - Marketplace listings
- `['auctions', 'userAuctions', address]` - User's auctions
- `['user', 'profile', address]` - User profile data

### 🔄 Smart Cache Invalidation

Automatic invalidation based on transaction types:

- **NFT Mint**: Invalidates user data and platform stats
- **Marketplace Buy**: Invalidates buyer, seller, and marketplace data
- **Auction Bid**: Invalidates auction and user data
- **NFT Transfer**: Invalidates both sender and receiver data

### 🚀 Performance Optimization

- **Prefetching**: Preload likely-needed data
- **Cache Strategies**: Different cache times for different data types
- **Background Refetching**: Keep data fresh without blocking UI
- **Optimistic Updates**: Immediate UI updates with rollback on error

### 🛠 Developer Tools

- **Cache Statistics**: Monitor cache performance
- **Query Analysis**: Debug cache state and query patterns
- **Pattern Matching**: Find queries using flexible patterns
- **Cache Cleanup**: Remove stale data and prevent memory leaks

## Usage Patterns

### Basic Query Hook

```javascript
import { useQuery } from "@tanstack/react-query";
import { queryKeyFactory } from "./lib/queryKeys";

function useNFTData(tokenId) {
  return useQuery({
    queryKey: queryKeyFactory.nfts.byId(tokenId),
    queryFn: () => fetchNFTData(tokenId),
    enabled: !!tokenId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Mutation with Invalidation

```javascript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQueryUtils } from "./lib/queryKeyUtils";

function useListNFT() {
  const queryClient = useQueryClient();
  const queryUtils = createQueryUtils(queryClient);

  return useMutation({
    mutationFn: ({ tokenId, price }) => listNFTForSale(tokenId, price),
    onSuccess: (data, variables) => {
      queryUtils.invalidation.invalidateOnTransaction("MARKETPLACE_LIST", {
        userAddress: data.sellerAddress,
        tokenId: variables.tokenId,
      });
    },
  });
}
```

### Optimistic Updates

```javascript
function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, bidAmount }) => placeBid(auctionId, bidAmount),
    onMutate: async ({ auctionId, bidAmount, userAddress }) => {
      const auctionKey = queryKeyFactory.auctions.byId(auctionId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: auctionKey });

      // Snapshot previous value
      const previousAuction = queryClient.getQueryData(auctionKey);

      // Optimistically update
      queryClient.setQueryData(auctionKey, (old) => ({
        ...old,
        currentBid: bidAmount,
        currentBidder: userAddress,
      }));

      return { previousAuction, auctionKey };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAuction) {
        queryClient.setQueryData(context.auctionKey, context.previousAuction);
      }
    },
  });
}
```

## Cache Strategies

Different data types use different caching strategies:

| Data Type            | Stale Time | Cache Time | Reason             |
| -------------------- | ---------- | ---------- | ------------------ |
| NFT Metadata         | 24 hours   | 7 days     | Immutable data     |
| Marketplace Listings | 5 minutes  | 15 minutes | Moderate changes   |
| Auction Data         | 30 seconds | 2 minutes  | Frequent changes   |
| User Balances        | 10 seconds | 30 seconds | Real-time critical |
| Static Data          | 7 days     | 30 days    | Rarely changes     |

## Testing

The system includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test files
npm test queryKeys.test.js
npm test queryKeyUtils.test.js

# Run tests with coverage
npm test -- --coverage
```

## Migration Guide

### From Custom Hooks

**Before:**

```javascript
// Custom hook with manual state management
function useNFTData(tokenId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTData(tokenId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [tokenId]);

  return { data, loading };
}
```

**After:**

```javascript
// Using centralized query keys
function useNFTData(tokenId) {
  return useQuery({
    queryKey: queryKeyFactory.nfts.byId(tokenId),
    queryFn: () => fetchNFTData(tokenId),
    enabled: !!tokenId,
  });
}
```

### From Manual Invalidation

**Before:**

```javascript
// Manual event listeners
useEffect(() => {
  const handleUpdate = () => {
    // Manual refetch
    refetchNFTs();
    refetchListings();
  };

  window.addEventListener("marketplace:updated", handleUpdate);
  return () => window.removeEventListener("marketplace:updated", handleUpdate);
}, []);
```

**After:**

```javascript
// Automatic invalidation
const mutation = useMutation({
  mutationFn: listNFT,
  onSuccess: (data, variables) => {
    queryUtils.invalidation.invalidateOnTransaction("MARKETPLACE_LIST", {
      userAddress: data.sellerAddress,
      tokenId: variables.tokenId,
    });
  },
});
```

## Best Practices

### 1. Always Use Query Key Factory

```javascript
// ✅ Good
const key = queryKeyFactory.nfts.byId(tokenId);

// ❌ Bad
const key = ["nfts", tokenId];
```

### 2. Use Transaction-Based Invalidation

```javascript
// ✅ Good
queryUtils.invalidation.invalidateOnTransaction("MARKETPLACE_BUY", data);

// ❌ Bad
queryClient.invalidateQueries(["marketplace"]);
queryClient.invalidateQueries(["user"]);
queryClient.invalidateQueries(["nfts"]);
```

### 3. Implement Optimistic Updates

```javascript
// ✅ Good - Immediate UI feedback
onMutate: async (variables) => {
  // Cancel queries and update optimistically
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, optimisticUpdate);
  return { previous, queryKey };
},
```

### 4. Use Appropriate Cache Strategies

```javascript
// ✅ Good - Match cache time to data volatility
useQuery({
  queryKey: queryKeyFactory.nfts.metadata(tokenId),
  queryFn: fetchMetadata,
  staleTime: 24 * 60 * 60 * 1000, // 24 hours for immutable data
});

useQuery({
  queryKey: queryKeyFactory.auctions.byId(auctionId),
  queryFn: fetchAuction,
  staleTime: 30 * 1000, // 30 seconds for volatile data
});
```

## Troubleshooting

### Common Issues

1. **Stale Data**: Check if proper invalidation is set up after mutations
2. **Memory Leaks**: Use cache cleanup utilities for long-running applications
3. **Performance**: Monitor cache hit rates and adjust stale times
4. **Debugging**: Use query dev tools and cache statistics

### Debug Tools

```javascript
// Get cache statistics
const stats = queryUtils.cache.getCacheStats();
console.log("Cache stats:", stats);

// Find queries by pattern
const nftQueries = queryUtils.utils.findQueriesByPattern(["nfts", "*"]);
console.log("NFT queries:", nftQueries);

// Analyze cache state
const analysis = queryUtils.analyzeCacheState();
console.log("Cache analysis:", analysis);
```

## Contributing

When adding new query keys:

1. Add to appropriate key factory in `queryKeys.js`
2. Add invalidation logic in `queryKeyUtils.js`
3. Write tests for new functionality
4. Update examples and documentation
5. Consider cache strategy for new data type

## Performance Monitoring

The system provides built-in performance monitoring:

- Query response times
- Cache hit/miss rates
- Memory usage patterns
- Error rates by query type
- User experience metrics

Use these metrics to optimize cache strategies and improve application performance.
