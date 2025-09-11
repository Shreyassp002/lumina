# Offline Support Implementation

This document describes the offline support and connection handling implementation for the Lumina NFT Marketplace frontend.

## Overview

The offline support system provides:

- **Offline Detection**: Automatic detection of network connectivity changes
- **Graceful Degradation**: Serve cached data when offline
- **Automatic Retry**: Retry failed requests when connection is restored
- **Background Sync**: Sync data automatically when coming back online

## Architecture

### Core Components

1. **useNetworkStatus Hook** (`src/hooks/useNetworkStatus.js`)

   - Detects online/offline status using `navigator.onLine`
   - Listens for `online` and `offline` events
   - Provides network connectivity testing
   - Triggers background sync when connection is restored

2. **useOfflineQuery Hook** (`src/hooks/useOfflineQuery.js`)

   - Enhanced version of `useQuery` with offline-aware behavior
   - Serves cached data indefinitely when offline
   - Adjusts query options based on connection status

3. **Background Sync Service** (`src/lib/backgroundSync.js`)

   - Manages data synchronization when coming back online
   - Priority-based sync queue
   - Retry logic with exponential backoff
   - Batch operations to prevent overwhelming the network

4. **Offline Provider** (`src/providers/OfflineProvider.js`)
   - Integrates network status with background sync
   - Handles connection restoration events
   - Manages user-specific data sync

### Offline-Aware Hooks

- `useOfflineNFTData` - NFT data with offline support
- `useOfflineUserNFTs` - User's NFT collection with offline support
- `useOfflineActiveListings` - Marketplace listings with offline support
- `useOfflineActiveAuctions` - Auction data with offline support

## Usage

### Basic Usage

```javascript
import { useOfflineNFTData } from "../hooks/useOfflineOptimizedNFT";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

function MyComponent() {
  const { isOnline } = useNetworkStatus();
  const { data, isServingCachedData } = useOfflineNFTData("1");

  return (
    <div>
      {!isOnline && <div>You're offline - showing cached data</div>}
      {isServingCachedData && <div>Serving cached data</div>}
      {/* Render your data */}
    </div>
  );
}
```

### Network Status Detection

```javascript
import { useNetworkStatus } from "../hooks/useNetworkStatus";

function NetworkIndicator() {
  const { isOnline, checkNetworkConnectivity } = useNetworkStatus();

  const handleCheck = async () => {
    const isConnected = await checkNetworkConnectivity();
    console.log("Network connectivity:", isConnected);
  };

  return (
    <div>
      <span>Status: {isOnline ? "Online" : "Offline"}</span>
      <button onClick={handleCheck}>Check Connection</button>
    </div>
  );
}
```

## Features

### 1. Offline Detection

The system automatically detects when the user goes offline using:

- `navigator.onLine` property
- `online` and `offline` browser events
- Optional connectivity testing via `/api/health` endpoint

### 2. Cached Data Serving

When offline, the system:

- Serves data from TanStack Query cache
- Sets `staleTime` to `Infinity` to prevent cache expiration
- Disables background refetching
- Provides `isServingCachedData` flag to components

### 3. Automatic Retry

When connection is restored:

- All queries are invalidated to refresh data
- Paused mutations are resumed
- Background sync is triggered for critical data

### 4. Background Sync

The background sync service handles:

- **Priority-based sync**: Critical data synced first
- **Retry logic**: Failed syncs are retried with exponential backoff
- **Batch operations**: Multiple sync tasks are processed efficiently
- **Error handling**: Failed syncs are logged and retried

#### Sync Priorities

1. **Critical**: User balances, active auctions
2. **High**: User-owned NFTs, user listings
3. **Medium**: Marketplace listings, general NFT data
4. **Low**: Statistics, non-essential data

### 5. User Interface

- **OfflineIndicator**: Shows offline status to users
- **InlineOfflineIndicator**: Compact offline indicator for components
- **ConnectionStatus**: Shows both online and offline states

## Configuration

### Query Client Configuration

The query client is configured with offline-aware settings:

```javascript
// Network mode adapts based on connection status
networkMode: getNetworkMode(), // "always" when online, "offlineFirst" when offline

// Mutations are paused when offline
mutations: {
  networkMode: "online", // Pause mutations when offline
}
```

### Cache Strategies

Different data types have different cache strategies:

- **NFT Metadata**: 24 hours (rarely changes)
- **Marketplace Listings**: 5 minutes (moderate changes)
- **Auction Data**: 30 seconds (frequent changes)
- **User Balances**: 10 seconds (real-time critical)

## Testing

The implementation includes comprehensive tests:

- **Unit Tests**: Individual hook and service testing
- **Integration Tests**: Data flow and cache invalidation
- **Network Simulation**: Offline/online state transitions

Run tests with:

```bash
npm test -- --run useNetworkStatus useOfflineQuery backgroundSync
```

## Best Practices

### For Developers

1. **Use Offline-Aware Hooks**: Replace standard hooks with offline-aware versions
2. **Handle Loading States**: Show appropriate loading states for cached data
3. **Provide Feedback**: Use offline indicators to inform users
4. **Test Offline Scenarios**: Test your components in offline mode

### For Users

1. **Cached Data**: Understand that offline data may be stale
2. **Sync Indicators**: Look for sync indicators when coming back online
3. **Manual Refresh**: Use manual refresh options when needed

## Troubleshooting

### Common Issues

1. **Stale Data**: Cached data may be outdated when offline

   - **Solution**: Data automatically syncs when connection is restored

2. **Failed Mutations**: Transactions fail when offline

   - **Solution**: Mutations are paused and resumed when online

3. **Slow Sync**: Background sync takes time after reconnection
   - **Solution**: Critical data is prioritized for faster sync

### Debug Tools

- React Query DevTools show cache status
- Browser Network tab for connectivity testing
- Console logs for sync operations

## Future Enhancements

Potential improvements:

- Service Worker integration for true offline support
- Selective sync based on user preferences
- Offline transaction queuing
- Progressive Web App (PWA) features
