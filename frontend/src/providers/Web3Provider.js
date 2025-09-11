"use client";

import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config } from "../lib/wagmi";
import {
  createQueryClientWithUtils,
  getReactQueryDevtools,
} from "../lib/queryClientOptimized";
import { lazy, Suspense, useEffect, useState } from "react";

import "@rainbow-me/rainbowkit/styles.css";

// Performance and offline providers removed - no longer needed

// Create a single query client instance
const queryClient = createQueryClientWithUtils();

// Component for lazy-loaded dev tools
function LazyDevTools() {
  const [DevTools, setDevTools] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Only load dev tools in development
      const loadDevTools = async () => {
        const ReactQueryDevtools = getReactQueryDevtools();
        if (ReactQueryDevtools) {
          setDevTools(() => ReactQueryDevtools);
        }
      };
      loadDevTools();
    }
  }, []);

  if (!DevTools) return null;

  return (
    <DevTools
      initialIsOpen={false}
      position="bottom-right"
      buttonPosition="bottom-right"
    />
  );
}

// Loading fallback for providers
const ProviderLoadingFallback = ({ children }) => (
  <div className="min-h-screen bg-[var(--background)]">{children}</div>
);

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
          <LazyDevTools />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
