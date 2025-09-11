# NFT Hooks Migration Guide

This guide helps you migrate from the old `useNFT.js` hooks to the new optimized `useOptimizedNFT.js` hooks with TanStack Query.

## Overview of Changes

The new hooks provide:

- ✅ Intelligent caching with TanStack Query
- ✅ Batch processing for better performance
- ✅ Progressive image loading
- ✅ Automatic retry logic with exponential backoff
- ✅ Optimistic updates for transactions
- ✅ Better error handling
- ✅ Memory usage optimization

## Hook Migration Map

### Basic NFT Data

**Old:**

```javascript
import { useNFTData } from "../hooks/useNFT";

const { tokenURI, tokenData, owner, isLoading } = useNFTData(tokenId);
```

**New:**

```javascript
import { useNFTData } from "../hooks/useOptimizedNFT";

const {
  data: nft,
  isLoading,
  error,
} = useNFTData(tokenId, {
  includeMetadata: true, // Optional: fetch IPFS metadata
});

// Access normalized data:
// nft.tokenId, nft.tokenURI, nft.tokenData, nft.owner, nft.metadata, nft.imageUrl
```

### User's NFTs

**Old:**

```javascript
import { useUserNFTs } from "../hooks/useNFT";

const { nfts, balance, isLoading } = useUserNFTs(address);
```

**New:**

```javascript
import { useUserNFTs, useUserNFTBalance } from "../hooks/useOptimizedNFT";

const { data: nfts = [], isLoading } = useUserNFTs(address, {
  includeMetadata: true,
});
const { data: balance } = useUserNFTBalance(address);
```

### User's Created NFTs

**Old:**

```javascript
import { useUserCreatedNFTs } from "../hooks/useNFT";

const { nfts, isLoading } = useUserCreatedNFTs(address);
```

**New:**

```javascript
import { useUserCreatedNFTs } from "../hooks/useOptimizedNFT";

const { data: nfts = [], isLoading } = useUserCreatedNFTs(address, {
  includeMetadata: true,
});
```

### Creator Profile

**Old:**

```javascript
import { useCreatorProfile } from "../hooks/useNFT";

const { data: profile } = useCreatorProfile(address);
```

**New:**

```javascript
import { useCreatorProfile } from "../hooks/useOptimizedNFT";

const { data: profile } = useCreatorProfile(address);
// Same API, but with better caching
```

### Minting NFTs

**Old:**

```javascript
import { useMintNFT } from "../hooks/useNFT";

const { mintNFT, isPending, isConfirming, isConfirmed, hash } = useMintNFT();
```

**New:**

```javascript
import { useMintNFT } from "../hooks/useOptimizedNFT";

const { mintNFT, isPending, isConfirming, isConfirmed, hash } = useMintNFT();
// Same API, but with automatic cache invalidation
```

## New Features

### Batch NFT Fetching

For loading multiple NFTs efficiently:

```javascript
import { useBatchNFTData } from "../hooks/useOptimizedNFT";

const tokenIds = ["1", "2", "3", "4", "5"];
const { data: nfts = [], isLoading } = useBatchNFTData(tokenIds, {
  includeMetadata: true,
  batchSize: 10, // Process in batches of 10
});
```

### Progressive Image Loading

For smooth image loading experience:

```javascript
import { useProgressiveImage } from "../hooks/useOptimizedNFT";

const { src, isLoading, isLoaded, isError, reload } = useProgressiveImage(
  imageUrl,
  {
    placeholder: "data:image/svg+xml;base64,...", // Optional placeholder
  }
);
```

### Using with Components

```javascript
import { NFTImage, ProgressiveImage } from '../components/ProgressiveImage';

// For NFT images with built-in placeholders
<NFTImage
  imageUrl={nft.imageUrl}
  tokenId={nft.tokenId}
  size="medium"
  className="rounded-lg"
/>

// For general progressive loading
<ProgressiveImage
  src={imageUrl}
  alt="Description"
  placeholder={placeholderUrl}
  className="w-full h-full object-cover"
/>
```

## Component Updates

### NFTCard Component

**Old:**

```javascript
function NFTCard({ tokenId }) {
  const { tokenURI, tokenData, owner, isLoading } = useNFTData(tokenId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <img src={resolveIpfs(tokenURI)} alt={`NFT #${tokenId}`} />
      <h3>NFT #{tokenId}</h3>
      <p>Owner: {owner}</p>
    </div>
  );
}
```

**New:**

```javascript
import { useNFTData } from "../hooks/useOptimizedNFT";
import { NFTImage } from "../components/ProgressiveImage";

function NFTCard({ tokenId }) {
  const {
    data: nft,
    isLoading,
    error,
  } = useNFTData(tokenId, {
    includeMetadata: true,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!nft) return <div>NFT not found</div>;

  return (
    <div>
      <NFTImage
        imageUrl={nft.imageUrl}
        tokenId={nft.tokenId}
        alt={nft.name}
        size="medium"
      />
      <h3>{nft.name || `NFT #${nft.tokenId}`}</h3>
      <p>Owner: {nft.owner}</p>
      {nft.description && <p>{nft.description}</p>}
    </div>
  );
}
```

### NFTGrid Component

**Old:**

```javascript
function NFTGrid({ userAddress }) {
  const { nfts, isLoading } = useUserNFTs(userAddress);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <NFTCard key={nft.tokenId} tokenId={nft.tokenId} />
      ))}
    </div>
  );
}
```

**New:**

```javascript
import { OptimizedNFTGrid } from "../components/OptimizedNFTGrid";

function NFTGrid({ userAddress }) {
  return (
    <OptimizedNFTGrid
      userAddress={userAddress}
      showUserNFTs={true}
      onNFTClick={(nft) => console.log("Clicked NFT:", nft)}
      className="p-4"
    />
  );
}
```

## Performance Optimizations

### Cache Configuration

The new hooks use intelligent caching strategies:

```javascript
// NFT metadata: 24 hours (rarely changes)
// User balances: 10 seconds (real-time critical)
// Marketplace data: 5 minutes (moderate changes)
// Auction data: 30 seconds (frequent changes)
```

### Batch Processing

Large datasets are processed in batches to avoid overwhelming the RPC:

```javascript
// Automatically batches requests in groups of 10 with 50ms delays
const { data: nfts } = useUserNFTs(address);

// Customizable batch processing
const { data: nfts } = useBatchNFTData(tokenIds, {
  batchSize: 5, // Smaller batches for slower networks
  includeMetadata: false, // Skip metadata for faster loading
});
```

### Memory Management

The new hooks include memory usage monitoring:

```javascript
import { monitorMemoryUsage } from "../lib/nftUtils";

// Check memory usage
const memoryStats = monitorMemoryUsage();
console.log(`Memory used: ${memoryStats?.used}MB`);
```

## Error Handling

### Retry Logic

Automatic retry with exponential backoff:

```javascript
// Network errors: 3 retries with exponential backoff
// RPC errors: 5 retries with linear backoff
// IPFS errors: 2 retries with multiple gateways
```

### Error Recovery

```javascript
const { data, error, refetch } = useNFTData(tokenId);

if (error) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

## Testing

### Unit Tests

```javascript
import { renderHook, waitFor } from "@testing-library/react";
import { useNFTData } from "../hooks/useOptimizedNFT";

test("should fetch NFT data", async () => {
  const { result } = renderHook(() => useNFTData("1"));

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toMatchObject({
    tokenId: "1",
    metadata: expect.any(Object),
  });
});
```

## Migration Checklist

- [ ] Update imports from `useNFT` to `useOptimizedNFT`
- [ ] Update component props to use `data` instead of individual fields
- [ ] Add error handling for new error states
- [ ] Replace manual image loading with `NFTImage` or `ProgressiveImage`
- [ ] Update tests to work with TanStack Query
- [ ] Remove old custom event listeners (handled automatically now)
- [ ] Update loading states to use new loading patterns
- [ ] Test with real data to ensure performance improvements

## Rollback Plan

If you need to rollback:

1. Keep the old `useNFT.js` file as `useNFT.legacy.js`
2. Update imports back to the legacy version
3. The new optimized hooks are fully backward compatible for basic usage

## Support

For questions or issues during migration:

1. Check the test files for usage examples
2. Review the component examples in `OptimizedNFTGrid.js`
3. Monitor the browser console for any cache-related warnings
4. Use React Query DevTools to debug query states
