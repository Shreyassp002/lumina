/**
 * NFT Utilities for optimized data handling and caching
 */

/**
 * IPFS URI resolution with multiple gateway fallbacks
 */
export const ipfsGateways = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://dweb.link/ipfs/",
];

export const resolveIpfsUri = (uri, gatewayIndex = 0) => {
  if (!uri) return null;

  if (uri.startsWith("ipfs://")) {
    const hash = uri.replace("ipfs://", "");
    return `${ipfsGateways[gatewayIndex]}${hash}`;
  }

  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    return uri;
  }

  // Handle bare IPFS hashes
  if (uri.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/)) {
    return `${ipfsGateways[gatewayIndex]}${uri}`;
  }

  return null;
};

/**
 * Fetch metadata with fallback gateways
 */
export const fetchMetadataWithFallback = async (tokenURI, maxRetries = 3) => {
  if (!tokenURI) return null;

  // If it's a direct HTTP URL, try it first
  if (tokenURI.startsWith("https://") || tokenURI.startsWith("http://")) {
    try {
      const response = await fetch(tokenURI, {
        timeout: 10000, // 10 second timeout
      });

      if (response.ok) {
        const metadata = await response.json();
        if (metadata && typeof metadata === "object") {
          return {
            ...metadata,
            imageUrl: metadata.image ? resolveIpfsUri(metadata.image, 0) : null,
            animationUrl: metadata.animation_url
              ? resolveIpfsUri(metadata.animation_url, 0)
              : null,
            fetchedFrom: tokenURI,
            gatewayUsed: "direct",
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata from direct URL:`, error);
    }
  }

  // Try IPFS gateways for IPFS URIs
  for (
    let gatewayIndex = 0;
    gatewayIndex < ipfsGateways.length;
    gatewayIndex++
  ) {
    try {
      const httpUri = resolveIpfsUri(tokenURI, gatewayIndex);
      if (!httpUri || httpUri === tokenURI) continue; // Skip if already tried direct URL

      const response = await fetch(httpUri, {
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) continue;

      const metadata = await response.json();

      // Validate metadata structure
      if (!metadata || typeof metadata !== "object") continue;

      return {
        ...metadata,
        imageUrl: metadata.image
          ? resolveIpfsUri(metadata.image, gatewayIndex)
          : null,
        animationUrl: metadata.animation_url
          ? resolveIpfsUri(metadata.animation_url, gatewayIndex)
          : null,
        fetchedFrom: httpUri,
        gatewayUsed: gatewayIndex,
      };
    } catch (error) {
      console.warn(
        `Failed to fetch metadata from gateway ${gatewayIndex}:`,
        error
      );
      continue;
    }
  }

  console.warn("Failed to fetch metadata from all sources:", tokenURI);
  return {
    name: `NFT #${tokenURI.split("/").pop() || "Unknown"}`,
    description: "Metadata unavailable",
    image: null,
    fetchedFrom: null,
    gatewayUsed: null,
  };
};

/**
 * Batch processing utility for large datasets
 */
export const processBatch = async (
  items,
  processor,
  batchSize = 10,
  delay = 100
) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.all(
        batch.map((item) => processor(item))
      );
      results.push(...batchResults);
    } catch (error) {
      console.error(
        `Batch processing failed for batch starting at index ${i}:`,
        error
      );
      // Add null results for failed batch
      results.push(...new Array(batch.length).fill(null));
    }

    // Add delay between batches to avoid overwhelming the RPC
    if (i + batchSize < items.length && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
};

/**
 * Image optimization utilities
 */
export const getImageUrl = (originalUrl, options = {}) => {
  if (!originalUrl) return null;

  const {
    width = null,
    height = null,
    quality = 80,
    format = "webp",
  } = options;

  // For IPFS images, we can use image optimization services
  if (originalUrl.includes("ipfs")) {
    // Example using a hypothetical image optimization service
    // In production, you might use services like Cloudinary, ImageKit, etc.
    const params = new URLSearchParams();
    if (width) params.set("w", width);
    if (height) params.set("h", height);
    params.set("q", quality);
    params.set("f", format);

    // This is a placeholder - replace with actual image optimization service
    // return `https://your-image-service.com/optimize?url=${encodeURIComponent(originalUrl)}&${params}`;
  }

  return originalUrl;
};

/**
 * Generate placeholder image data URL
 */
export const generatePlaceholder = (
  width = 200,
  height = 200,
  text = "Loading..."
) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
        ${text}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * NFT data normalization
 */
export const normalizeNFTData = (rawData) => {
  if (!rawData) return null;

  const {
    tokenId,
    tokenURI,
    tokenData,
    owner,
    metadata,
    imageUrl,
    lastUpdated = Date.now(),
  } = rawData;

  return {
    tokenId: String(tokenId),
    tokenURI,
    owner: owner?.toLowerCase() || null,
    creator: tokenData?.creator?.toLowerCase() || null,
    royaltyBps: tokenData?.royaltyBps || 0,
    category: tokenData?.category || "",
    metadata: metadata || null,
    name: metadata?.name || `NFT #${tokenId}`,
    description: metadata?.description || "",
    imageUrl: imageUrl || null,
    animationUrl: metadata?.animationUrl || null,
    attributes: metadata?.attributes || [],
    lastUpdated,
  };
};

/**
 * Cache key generation for consistent caching
 */
export const generateCacheKey = (type, ...params) => {
  const cleanParams = params
    .filter((param) => param !== null && param !== undefined)
    .map((param) => String(param).toLowerCase());

  return [type, ...cleanParams].join(":");
};

/**
 * Debounce utility for search and filtering
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Retry utility with exponential backoff
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;

      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
};

/**
 * Memory usage monitoring for large datasets
 */
export const monitorMemoryUsage = () => {
  if (
    typeof window !== "undefined" &&
    "performance" in window &&
    "memory" in performance
  ) {
    const memory = performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
};

/**
 * Validate NFT metadata structure
 */
export const validateMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    return { isValid: false, errors: ["Metadata is not an object"] };
  }

  const errors = [];
  const warnings = [];

  // Check required fields
  if (!metadata.name) {
    errors.push("Missing required field: name");
  }

  if (!metadata.image && !metadata.animation_url) {
    errors.push("Missing required field: image or animation_url");
  }

  // Check optional but recommended fields
  if (!metadata.description) {
    warnings.push("Missing recommended field: description");
  }

  if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
    warnings.push("Missing or invalid attributes array");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Format NFT attributes for display
 */
export const formatAttributes = (attributes) => {
  if (!Array.isArray(attributes)) return [];

  return attributes.map((attr) => ({
    trait_type: attr.trait_type || "Property",
    value: attr.value,
    display_type: attr.display_type || null,
    max_value: attr.max_value || null,
  }));
};

/**
 * Calculate rarity score (placeholder implementation)
 */
export const calculateRarityScore = (attributes, collectionStats = {}) => {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return { score: 0, rank: null };
  }

  // This is a simplified rarity calculation
  // In production, you'd want more sophisticated rarity algorithms
  let totalRarity = 0;

  attributes.forEach((attr) => {
    const traitCount = collectionStats[attr.trait_type]?.[attr.value] || 1;
    const totalSupply = collectionStats.totalSupply || 1000;
    const rarity = totalSupply / traitCount;
    totalRarity += rarity;
  });

  return {
    score: Math.round(totalRarity * 100) / 100,
    rank: null, // Would be calculated based on collection-wide data
  };
};

export default {
  resolveIpfsUri,
  fetchMetadataWithFallback,
  processBatch,
  getImageUrl,
  generatePlaceholder,
  normalizeNFTData,
  generateCacheKey,
  debounce,
  retryWithBackoff,
  monitorMemoryUsage,
  validateMetadata,
  formatAttributes,
  calculateRarityScore,
};
