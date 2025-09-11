# Performance Monitoring and Analytics Implementation

This document describes the comprehensive performance monitoring and analytics system implemented for the Lumina NFT Marketplace frontend.

## Overview

The performance monitoring system provides real-time tracking of:

- Query performance metrics
- Cache hit/miss rates
- Error rates by query type
- User experience metrics (loading times, interactions)
- Memory usage monitoring
- Network request performance

## Architecture

### Core Components

1. **PerformanceMonitor** (`src/lib/performanceMonitor.js`)

   - Central metrics collection and storage
   - Automatic performance observer integration
   - Memory monitoring capabilities
   - Data export functionality

2. **Performance Hooks** (`src/hooks/usePerformanceMonitoring.js`)

   - React hooks for component-level performance tracking
   - Integration with TanStack Query for automatic query monitoring
   - User interaction tracking utilities

3. **Performance Provider** (`src/providers/PerformanceProvider.js`)

   - Context provider for performance monitoring
   - Performance dashboard integration
   - Development performance indicator

4. **Performance Dashboard** (`src/components/PerformanceDashboard.js`)
   - Real-time performance metrics visualization
   - Query performance breakdown
   - Error analytics and reporting

## Features Implemented

### 1. Query Performance Tracking

- **Automatic Integration**: All optimized hooks (`useOptimizedNFT`, `useOptimizedMarketplace`, `useOptimizedAuction`) automatically track performance
- **Metrics Collected**:
  - Query duration (min, max, average)
  - Success/error rates
  - Cache hit/miss ratios
  - Call frequency

```javascript
// Example: Automatic tracking in useNFTData
const { recordInteraction } = useComponentPerformance("useNFTData");

const query = useQuery({
  queryKey: queryKeyFactory.nfts.byId(tokenId),
  queryFn: async () => {
    const endInteraction = recordInteraction("fetchNFTData");
    try {
      const result = await fetchNFTData();
      endInteraction();
      return result;
    } catch (error) {
      endInteraction();
      throw error;
    }
  },
});
```

### 2. Cache Hit/Miss Rate Monitoring

- **Real-time Tracking**: Monitors TanStack Query cache efficiency
- **Per-Query Analysis**: Individual cache performance for different query types
- **Overall Metrics**: Application-wide cache hit rate calculation

### 3. Error Rate Tracking

- **Categorized Errors**: Network, RPC, IPFS, and user rejection errors
- **Query-Specific Rates**: Error rates per query type (NFTs, marketplace, auctions)
- **Error History**: Last 5 error messages per error type
- **Automatic Classification**: Errors are automatically categorized based on error messages

### 4. User Experience Metrics

- **Component Loading Times**: Automatic tracking of component render times
- **Interaction Response Times**: User action performance (bids, listings, purchases)
- **Page Load Performance**: Integration with browser Performance API

```javascript
// Example: Component performance tracking
export function OptimizedNFTGrid() {
  useComponentPerformance("OptimizedNFTGrid");
  // Component automatically tracks loading time
}

// Example: Interaction tracking
const { trackInteraction } = useInteractionTracking();
const mintNFT = trackInteraction("mintNFT", async (metadata) => {
  // Automatically tracks interaction duration
  await writeContract({ ... });
});
```

### 5. Memory Usage Monitoring

- **Automatic Collection**: Periodic memory usage snapshots
- **Heap Size Tracking**: Used, total, and limit memory metrics
- **Memory Leak Detection**: Historical memory usage patterns

### 6. Network Request Performance

- **Response Time Tracking**: Average response times for API calls
- **Failure Rate Monitoring**: Network request success/failure rates
- **Performance Observer Integration**: Automatic network timing collection

## Performance Dashboard

### Features

1. **Overview Tab**:

   - Cache hit rate
   - Error rate
   - Average response time
   - Memory usage visualization

2. **Queries Tab**:

   - Per-query performance metrics
   - Filterable by query type
   - Cache efficiency breakdown

3. **Errors Tab**:
   - Error breakdown by type
   - Recent error messages
   - Error rate trends

### Access

- **Keyboard Shortcut**: `Ctrl/Cmd + Shift + P`
- **Development Indicator**: Small performance widget in development mode
- **Programmatic Access**: Via `usePerformance()` hook

## Integration with Optimized Hooks

### Automatic Query Monitoring

The performance monitoring system is automatically integrated with all optimized hooks:

```javascript
// useOptimizedNFT.js
import {
  useComponentPerformance,
  useInteractionTracking,
} from "./usePerformanceMonitoring";

export function useNFTData(tokenId) {
  const { recordInteraction } = useComponentPerformance("useNFTData");
  // Automatic performance tracking for all queries
}

export function useMintNFT() {
  const { trackInteraction } = useInteractionTracking();
  const mintNFT = trackInteraction("mintNFT", async (metadata) => {
    // Automatic interaction time tracking
  });
}
```

### TanStack Query Integration

The system automatically monitors all TanStack Query operations:

```javascript
// Automatic query cache monitoring
const queryCache = queryClient.getQueryCache();
queryCache.build = function (client, options, state) {
  const query = originalBuild(client, options, state);

  // Override fetch to track performance
  query.fetch = async function (options, fetchOptions) {
    const startTime = performance.now();
    try {
      const result = await originalFetch(options, fetchOptions);
      const duration = performance.now() - startTime;
      performanceMonitor.recordQueryPerformance(
        queryKey,
        duration,
        true,
        isCacheHit
      );
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordQueryPerformance(
        queryKey,
        duration,
        false,
        false
      );
      performanceMonitor.recordError(errorType, queryKey, error);
      throw error;
    }
  };
};
```

## Data Export and Analysis

### Export Functionality

```javascript
const { exportMetrics, clearMetrics, getMetricsData } = usePerformanceExport();

// Export metrics as JSON file
exportMetrics(); // Downloads performance-metrics-YYYY-MM-DD.json

// Get raw metrics data
const data = getMetricsData();

// Clear all metrics
clearMetrics();
```

### Exported Data Structure

```javascript
{
  timestamp: 1234567890,
  uptime: 300000,
  summary: {
    cacheHitRate: 85.5,
    errorRate: 2.1,
    averageResponseTime: 250,
    totalQueries: 150,
    totalErrors: 3,
    memoryUsage: { used: 45, total: 100, limit: 2048 }
  },
  queries: {
    "nfts:byId:1": {
      totalCalls: 5,
      averageDuration: 200,
      successCount: 5,
      errorCount: 0,
      cacheHits: 3,
      cacheMisses: 2
    }
  },
  cache: {
    hits: 127,
    misses: 23,
    totalRequests: 150
  },
  errors: {
    "network:marketplace:listings": {
      count: 2,
      lastOccurred: 1234567890,
      errorMessages: [...]
    }
  },
  userExperience: {
    loadingTimes: [...],
    interactionTimes: [...],
    pageLoadTimes: [...]
  },
  memory: [...],
  network: {
    totalRequests: 150,
    failedRequests: 3,
    averageResponseTime: 250,
    responseTimeHistory: [...]
  }
}
```

## Performance Optimizations

### Intelligent Caching

- **Different Cache Strategies**: NFT metadata (24h), marketplace listings (5min), auctions (30s)
- **Background Refetching**: Critical data refreshed automatically
- **Cache Warming**: Preload frequently accessed data

### Memory Management

- **Limited History**: Metrics history is capped to prevent memory leaks
- **Efficient Storage**: Uses Maps and optimized data structures
- **Automatic Cleanup**: Old metrics are automatically pruned

### Minimal Performance Impact

- **Conditional Execution**: Can be disabled in production if needed
- **Efficient Recording**: Minimal overhead for metric collection
- **Batched Operations**: Multiple metrics updates are batched

## Testing

### Unit Tests

- **Core Functionality**: `src/lib/__tests__/performanceMonitor.test.js`
- **Integration Tests**: `src/lib/__tests__/performanceIntegration.test.js`
- **Hook Tests**: `src/hooks/__tests__/usePerformanceMonitoring.test.jsx`

### Test Coverage

- Query performance tracking
- Cache hit/miss rate calculation
- Error categorization and tracking
- Memory monitoring
- Data export functionality
- Component performance tracking

## Usage Examples

### Basic Usage

```javascript
// In your component
import { useComponentPerformance } from "../hooks/usePerformanceMonitoring";

export function MyComponent() {
  useComponentPerformance("MyComponent");
  // Component loading time is automatically tracked

  return <div>My Component</div>;
}
```

### Advanced Usage

```javascript
// Custom interaction tracking
import { useInteractionTracking } from "../hooks/usePerformanceMonitoring";

export function useCustomAction() {
  const { trackInteraction } = useInteractionTracking();

  const performAction = trackInteraction("customAction", async (data) => {
    // Your async action here
    const result = await api.call(data);
    return result;
  });

  return { performAction };
}
```

### Dashboard Integration

```javascript
// Access performance context
import { usePerformance } from "../providers/PerformanceProvider";

export function MyComponent() {
  const { toggleDashboard, getMetrics } = usePerformance();

  const handleShowMetrics = () => {
    toggleDashboard();
  };

  return <button onClick={handleShowMetrics}>Show Performance Metrics</button>;
}
```

## Configuration

### Environment Variables

```javascript
// Disable in production if needed
const isEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_PERFORMANCE_MONITORING === "true";

performanceMonitor.setEnabled(isEnabled);
```

### Custom Configuration

```javascript
// Custom cache strategies
const customCacheStrategies = {
  nftMetadata: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
  },
  marketplaceListings: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
};
```

## Best Practices

1. **Monitor Key Metrics**: Focus on cache hit rates, error rates, and response times
2. **Regular Analysis**: Export and analyze metrics regularly to identify trends
3. **Performance Budgets**: Set thresholds for acceptable performance metrics
4. **Error Investigation**: Use error breakdown to identify and fix common issues
5. **Memory Monitoring**: Watch for memory leaks in long-running sessions

## Future Enhancements

1. **Real-time Alerts**: Notifications when performance thresholds are exceeded
2. **Historical Trends**: Long-term performance trend analysis
3. **A/B Testing Integration**: Performance comparison between different implementations
4. **Custom Metrics**: Allow applications to define custom performance metrics
5. **Performance Budgets**: Automated warnings when performance budgets are exceeded

## Conclusion

The performance monitoring and analytics system provides comprehensive insights into the Lumina NFT Marketplace frontend performance. It enables developers to:

- Identify performance bottlenecks
- Optimize caching strategies
- Monitor error rates and types
- Track user experience metrics
- Make data-driven performance improvements

The system is designed to be lightweight, comprehensive, and easy to use, providing valuable insights without impacting application performance.
