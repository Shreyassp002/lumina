/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better optimization
  experimental: {
    // Enable optimizePackageImports for better tree shaking
    optimizePackageImports: [
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "lucide-react",
      "viem",
      "wagmi",
      "@rainbow-me/rainbowkit",
    ],
  },

  // Bundle analyzer configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Enable bundle analyzer in development
    if (process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
    }

    // Optimize TanStack Query imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ensure we're using the optimized builds
      "@tanstack/react-query": require.resolve("@tanstack/react-query"),
    };

    // Split chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate chunk for TanStack Query
          reactQuery: {
            name: "react-query",
            test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
            chunks: "all",
            priority: 30,
          },
          // Separate chunk for Wagmi and Viem
          web3: {
            name: "web3",
            test: /[\\/]node_modules[\\/](wagmi|viem|@rainbow-me)/,
            chunks: "all",
            priority: 25,
          },
          // Separate chunk for UI libraries
          ui: {
            name: "ui",
            test: /[\\/]node_modules[\\/](lucide-react|gsap)/,
            chunks: "all",
            priority: 20,
          },
        },
      };
    }

    return config;
  },

  // Enable compression
  compress: true,

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Enable static optimization
  trailingSlash: false,

  // Additional optimizations
  poweredByHeader: false,
  reactStrictMode: true,
};
