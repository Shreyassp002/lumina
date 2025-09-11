import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAllAuctions,
  useAuctionData,
  useAuctionCountdown,
} from "../useAuction";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  usePublicClient: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useWatchContractEvent: vi.fn(),
}));

// Mock ABI and address
vi.mock("../../abi/luminaAuction", () => ({
  LUMINA_AUCTION_ABI: [],
  LUMINA_AUCTION_ADDRESS: "0x123",
}));

describe("useAuction hooks", () => {
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
  });

  describe("useAuctionCountdown", () => {
    it("should calculate time left correctly", () => {
      const futureTime = Date.now() + 60000; // 1 minute from now
      const auction = { endTime: futureTime };

      const { result } = renderHook(() => useAuctionCountdown(auction), {
        wrapper,
      });

      expect(result.current.isEnded).toBe(false);
      expect(result.current.timeLeft).toMatch(/\d+s/);
    });

    it("should handle ended auctions", () => {
      const pastTime = Date.now() - 60000; // 1 minute ago
      const auction = { endTime: pastTime };

      const { result } = renderHook(() => useAuctionCountdown(auction), {
        wrapper,
      });

      expect(result.current.isEnded).toBe(true);
      expect(result.current.timeLeft).toBe("Ended");
    });

    it("should handle null auction", () => {
      const { result } = renderHook(() => useAuctionCountdown(null), {
        wrapper,
      });

      expect(result.current.isEnded).toBe(true);
      expect(result.current.timeLeft).toBe("");
    });
  });

  describe("useAuctionData", () => {
    it("should return null for invalid auction ID", async () => {
      const { usePublicClient } = await import("wagmi");
      usePublicClient.mockReturnValue(null);

      const { result } = renderHook(() => useAuctionData(null), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toBe(undefined);
      });
    });
  });

  describe("useAllAuctions", () => {
    it("should handle empty auction list", async () => {
      const { usePublicClient } = await import("wagmi");
      const mockPublicClient = {
        readContract: vi.fn().mockResolvedValue(0n),
      };
      usePublicClient.mockReturnValue(mockPublicClient);

      const { result } = renderHook(() => useAllAuctions(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });
  });
});
