"use client";

import { useState, useEffect } from "react";

/**
 * Progressive Image Component with placeholder support
 * Provides smooth loading experience with fallback states
 */
export function ProgressiveImage({
  src,
  alt,
  placeholder = null,
  className = "",
  style = {},
  onLoad = () => {},
  onError = () => {},
  ...props
}) {
  const [loadingState, setLoadingState] = useState("loading");
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    if (!src) {
      setLoadingState("idle");
      setCurrentSrc(placeholder);
      return;
    }

    setLoadingState("loading");
    setCurrentSrc(placeholder);

    const img = new Image();

    img.onload = () => {
      setCurrentSrc(src);
      setLoadingState("loaded");
      onLoad();
    };

    img.onerror = () => {
      setLoadingState("error");
      setCurrentSrc(placeholder);
      onError();
    };

    img.src = src;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder, onLoad, onError]);

  const isLoading = loadingState === "loading";
  const isError = loadingState === "error";

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Main image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoading ? "opacity-50" : "opacity-100"
          }`}
          {...props}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {isError && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * NFT Image Component with progressive loading
 * Specifically designed for NFT images with IPFS support
 */
export function NFTImage({
  imageUrl,
  tokenId,
  alt,
  className = "",
  size = "medium",
  showPlaceholder = true,
  ...props
}) {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-64 h-64",
    full: "w-full h-full",
  };

  const placeholderSvg = showPlaceholder
    ? `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f3f4f6"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
            NFT #${tokenId || "..."}
          </text>
        </svg>
      `)}`
    : null;

  return (
    <ProgressiveImage
      src={imageUrl}
      alt={alt || `NFT #${tokenId}`}
      placeholder={placeholderSvg}
      className={`${sizeClasses[size]} object-cover rounded-lg ${className}`}
      {...props}
    />
  );
}

/**
 * Avatar Image Component for user profiles
 */
export function AvatarImage({
  src,
  alt,
  size = "medium",
  className = "",
  fallbackText = "?",
  ...props
}) {
  const sizeClasses = {
    small: "w-8 h-8 text-xs",
    medium: "w-12 h-12 text-sm",
    large: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-lg",
  };

  const fallbackSvg = `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#e5e7eb"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
        ${fallbackText.charAt(0).toUpperCase()}
      </text>
    </svg>
  `)}`;

  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      placeholder={fallbackSvg}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      {...props}
    />
  );
}

export default ProgressiveImage;
