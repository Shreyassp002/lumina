/**
 * Tests for NFT hooks
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useNFTData,
  useUserNFTs,
  useUserCreatedNFTs,
  useBatchNFTData,
  useProgressiveImage,
} from "../useNFT";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  usePublicClient: vi.fn(),
  useReadContract: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    data: null,
    isPending: false,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
  useWatchContractEvent: vi.fn(),
}));

// Mock NFT utilities
vi.mock("../../lib/nftUtils", () => ({
  fetchMetadataWithFallback: vi.fn(),
  processBatch: vi.fn(),
  resolveIpfsUrl: vi.fn((url) =>
    url?.replace("ipfs://", "https://ipfs.io/ipfs/")
  ),
  monitorMemoryUsage: vi.fn(() => ({ used: 10, total: 100 })),
}));

// Mock performance monitoring
vi.mock("./usePerformanceMonitoring", () => ({
  useComponentPerformance: vi.fn(() => ({
    recordInteraction: vi.fn(() => vi.fn()),
  })),
}));

describe("useNFT hooks", () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  describe("useNFTData", () => {
    it("should fetch NFT data with metadata", async () => {
      const mockPublicClient = {
        readContract: vi
          .fn()
          .mockResolvedValueOnce("ipfs://test-metadata")
          .mockResolvedValueOnce({
            creator: "0x123",
            royaltyBps: 500,
            category: "art",
          })
          .mockResolvedValueOnce("0x456"),
      };

      const mockMetadata = {
        name: "Test NFT",
        description: "Test Description",
        image: "ipfs://test-image",
        imageUrl: "https://ipfs.io/ipfs/test-image",
      };

      const { usePublicClient } = await import("wagmi");
      const { fetchMetadataWithFallback } = await import("../../lib/nftUtils");

      vi.mocked(usePublicClient).mockReturnValue(mockPublicClient);
      vi.mocked(fetchMetadataWithFallback).mockResolvedValue(mockMetadata);

      const { result } = renderHook(
        () => useNFTData("1", { includeMetadata: true }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatchObject({
        tokenId: "1",
        metadata: mockMetadata,
      });
    });

    it("should handle errors gracefully", async () => {
      const mockPublicClient = {
        readContract: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      const { usePublicClient } = await import("wagmi");
      vi.mocked(usePublicClient).mockReturnValue(mockPublicClient);

      const { result } = renderHook(() => useNFTData("1"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useUserNFTs", () => {
    it("should fetch user owned NFTs", async () => {
      const mockPublicClient = {
        readContract: vi
          .fn()
          .mockResolvedValueOnce(2n) // getCurrentTokenId
          .mockResolvedValueOnce("0x123") // ownerOf token 1
          .mockResolvedValueOnce("0x456") // ownerOf token 2
          .mockResolvedValueOnce({ creator: "0x123" }) // tokenData 1
          .mockResolvedValueOnce("ipfs://metadata1"), // tokenURI 1
      };

      const { usePublicClient } = await import("wagmi");
      vi.mocked(usePublicClient).mockReturnValue(mockPublicClient);

      const { result } = renderHook(() => useUserNFTs("0x123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
    });
  });

  describe("useBatchNFTData", () => {
    it("should fetch multiple NFTs efficiently", async () => {
      const mockPublicClient = {
        readContract: vi
          .fn()
          .mockResolvedValueOnce("ipfs://metadata1")
          .mockResolvedValueOnce("ipfs://metadata2"),
      };

      const { usePublicClient } = await import("wagmi");
      const { processBatch } = await import("../../lib/nftUtils");

      vi.mocked(usePublicClient).mockReturnValue(mockPublicClient);
      vi.mocked(processBatch).mockImplementation((items, processor) =>
        Promise.all(items.map(processor))
      );

      const { result } = renderHook(() => useBatchNFTData(["1", "2"]), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe("useProgressiveImage", () => {
    it("should handle image loading states", async () => {
      const { result } = renderHook(
        () => useProgressiveImage("https://example.com/image.jpg"),
        {
          wrapper,
        }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.src).toBe("");

      // Simulate image load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});

describe("NFT hook integration", () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  it("should work together for complete NFT data flow", async () => {
    const mockPublicClient = {
      readContract: vi
        .fn()
        .mockResolvedValueOnce("ipfs://test-metadata")
        .mockResolvedValueOnce({
          creator: "0x123",
          royaltyBps: 500,
          category: "art",
        })
        .mockResolvedValueOnce("0x456"),
    };

    const { usePublicClient } = await import("wagmi");
    vi.mocked(usePublicClient).mockReturnValue(mockPublicClient);

    const { result } = renderHook(() => useNFTData("1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data.tokenId).toBe("1");
  });
});
