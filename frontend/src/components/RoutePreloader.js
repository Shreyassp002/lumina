"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { preloadHooksForRoute } from "../hooks/optimizedImports";
import {
  preloadMarketplaceComponents,
  preloadAuctionComponents,
  preloadNFTComponents,
} from "./LazyComponents";

export default function RoutePreloader() {
  const pathname = usePathname();

  useEffect(() => {
    // Preload hooks and components based on current route
    preloadHooksForRoute(pathname);

    // Preload components based on route
    switch (pathname) {
      case "/marketplace":
        preloadMarketplaceComponents();
        preloadNFTComponents();
        break;
      case "/auctions":
        preloadAuctionComponents();
        preloadNFTComponents();
        break;
      case "/profile":
        preloadNFTComponents();
        preloadMarketplaceComponents();
        preloadAuctionComponents();
        break;
      case "/create":
        preloadNFTComponents();
        break;
      default:
        // For home page, no specific preloading needed
        break;
    }
  }, [pathname]);

  useEffect(() => {
    // Preload likely next routes based on user behavior patterns
    const preloadTimer = setTimeout(() => {
      switch (pathname) {
        case "/":
          // From home, users likely go to marketplace
          preloadMarketplaceComponents();
          break;
        case "/marketplace":
          // From marketplace, users might go to auctions or profile
          preloadAuctionComponents();
          break;
        case "/auctions":
          // From auctions, users might go to marketplace
          preloadMarketplaceComponents();
          break;
        default:
          break;
      }
    }, 2000); // Preload after 2 seconds to avoid blocking initial render

    return () => clearTimeout(preloadTimer);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
