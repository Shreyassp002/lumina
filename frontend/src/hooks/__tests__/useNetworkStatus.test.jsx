import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNetworkStatus } from "../useNetworkStatus";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock navigator.onLine
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, "addEventListener", {
  value: mockAddEventListener,
});
Object.defineProperty(window, "removeEventListener", {
  value: mockRemoveEventListener,
});

describe("useNetworkStatus", () => {
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

    // Reset mocks
    vi.clearAllMocks();
    navigator.onLine = true;
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should initialize with online status", () => {
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it("should set up event listeners on mount", () => {
    renderHook(() => useNetworkStatus(), { wrapper });

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    );
  });

  it("should clean up event listeners on unmount", () => {
    const { unmount } = renderHook(() => useNetworkStatus(), { wrapper });

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    );
  });

  it("should handle offline event", () => {
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    // Simulate going offline
    act(() => {
      navigator.onLine = false;
      // Find and call the offline event handler
      const offlineHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "offline"
      )[1];
      offlineHandler();
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it("should handle online event and trigger sync", () => {
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    // Mock query client methods before going offline
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const resumePausedMutationsSpy = vi.spyOn(
      queryClient,
      "resumePausedMutations"
    );

    // First go offline
    act(() => {
      navigator.onLine = false;
      const offlineHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "offline"
      )[1];
      offlineHandler();
    });

    expect(result.current.wasOffline).toBe(true);

    // Then go back online
    act(() => {
      navigator.onLine = true;
      const onlineHandler = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "online"
      )[1];
      onlineHandler();
    });

    expect(result.current.isOnline).toBe(true);
    // wasOffline is reset to false after sync is triggered
    expect(result.current.wasOffline).toBe(false);
    expect(invalidateQueriesSpy).toHaveBeenCalled();
    expect(resumePausedMutationsSpy).toHaveBeenCalled();
  });

  it("should check network connectivity", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    const isConnected = await result.current.checkNetworkConnectivity();

    expect(isConnected).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/health", {
      method: "HEAD",
      signal: expect.any(AbortSignal),
      cache: "no-cache",
    });
  });

  it("should handle network connectivity check failure", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    const isConnected = await result.current.checkNetworkConnectivity();

    expect(isConnected).toBe(false);
  });

  it("should return false for connectivity check when offline", async () => {
    navigator.onLine = false;

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    const isConnected = await result.current.checkNetworkConnectivity();

    expect(isConnected).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
