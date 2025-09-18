"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { gsap } from "../../lib/gsap";

export default function BrandingSection() {
  const sectionRef = useRef(null);
  const luminaLogoRef = useRef(null);
  const connectorRef = useRef(null);
  const somniaLogoRef = useRef(null);
  const textRef = useRef(null);
  const gsapContextRef = useRef(null);
  const intersectionObserverRef = useRef(null);

  // State for image loading and error handling
  const [luminaImageLoaded, setLuminaImageLoaded] = useState(false);
  const [somniaImageLoaded, setSomniaImageLoaded] = useState(false);
  const [luminaImageError, setLuminaImageError] = useState(false);
  const [somniaImageError, setSomniaImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Optimized image load handlers
  const handleLuminaLoad = useCallback(() => {
    setLuminaImageLoaded(true);
    setLuminaImageError(false);
  }, []);

  const handleSomniaLoad = useCallback(() => {
    setSomniaImageLoaded(true);
    setSomniaImageError(false);
  }, []);

  const handleLuminaError = useCallback(() => {
    setLuminaImageError(true);
    setLuminaImageLoaded(false);
  }, []);

  const handleSomniaError = useCallback(() => {
    setSomniaImageError(true);
    setSomniaImageLoaded(false);
  }, []);

  // Intersection Observer for lazy loading and performance
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Stop observing once visible
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before element is visible
        threshold: 0.1,
      }
    );

    observer.observe(sectionRef.current);
    intersectionObserverRef.current = observer;

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Animation effect - only runs when component is visible and images are loaded
  useEffect(() => {
    if (!sectionRef.current || !isVisible) return;

    // Wait for at least one image to load before starting animations
    if (
      !luminaImageLoaded &&
      !somniaImageLoaded &&
      !luminaImageError &&
      !somniaImageError
    ) {
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Use requestAnimationFrame to ensure animations don't block rendering
    const animationFrame = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        const elements = [
          luminaLogoRef.current,
          connectorRef.current,
          somniaLogoRef.current,
          textRef.current,
        ].filter(Boolean); // Filter out null refs

        if (prefersReducedMotion) {
          // For users who prefer reduced motion, just fade in without movement
          gsap.set(elements, { opacity: 0 });
          gsap.to(elements, {
            opacity: 1,
            duration: 0.3,
            stagger: 0.1,
            ease: "power2.out",
          });
        } else {
          // Full animation for users who don't mind motion
          // Set initial states with more pronounced upward movement
          gsap.set(elements, {
            opacity: 0,
            y: 30,
            scale: 0.95,
          });

          // Create enhanced timeline for staggered animations
          const tl = gsap.timeline({ delay: 0.3 });

          // Animate Lumina logo first (if loaded or errored)
          if (
            luminaLogoRef.current &&
            (luminaImageLoaded || luminaImageError)
          ) {
            tl.to(luminaLogoRef.current, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.2)",
            });
          }

          // Animate connector with slight delay overlap and subtle rotation
          if (connectorRef.current) {
            tl.to(
              connectorRef.current,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                rotation: 360,
                duration: 0.6,
                ease: "back.out(1.2)",
              },
              "-=0.4"
            );
          }

          // Animate Somnia logo (if loaded or errored)
          if (
            somniaLogoRef.current &&
            (somniaImageLoaded || somniaImageError)
          ) {
            tl.to(
              somniaLogoRef.current,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                ease: "back.out(1.2)",
              },
              "-=0.4"
            );
          }

          // Animate text last
          if (textRef.current) {
            tl.to(
              textRef.current,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                ease: "power3.out",
              },
              "-=0.3"
            );
          }

          // Add subtle continuous glow animation for logos (very subtle) - only if images loaded
          const loadedLogos = [];
          if (luminaLogoRef.current && luminaImageLoaded)
            loadedLogos.push(luminaLogoRef.current);
          if (somniaLogoRef.current && somniaImageLoaded)
            loadedLogos.push(somniaLogoRef.current);

          if (loadedLogos.length > 0) {
            gsap.to(loadedLogos, {
              filter:
                "drop-shadow(0 0 12px rgba(0,255,136,0.3)) drop-shadow(0 0 24px rgba(0,255,136,0.1))",
              duration: 3,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              delay: 1.5,
            });
          }

          // Add subtle pulsing glow to the connector
          if (connectorRef.current) {
            gsap.to(connectorRef.current, {
              textShadow:
                "0 0 20px rgba(0,255,136,0.4), 0 0 40px rgba(0,255,136,0.2)",
              duration: 2.5,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              delay: 2,
            });
          }
        }
      }, sectionRef);

      gsapContextRef.current = ctx;
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
        gsapContextRef.current = null;
      }
    };
  }, [
    isVisible,
    luminaImageLoaded,
    somniaImageLoaded,
    luminaImageError,
    somniaImageError,
  ]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up intersection observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }

      // Clean up GSAP context
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
        gsapContextRef.current = null;
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full py-16 sm:py-20 lg:py-24 relative"
      aria-label="Partnership branding section"
    >
      {/* Background gradient overlay for enhanced visual depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />

      {/* Subtle animated background particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/20 rounded-full animate-pulse"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        />
        <div
          className="absolute top-3/4 right-1/3 w-1 h-1 bg-lime-400/30 rounded-full animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-emerald-300/25 rounded-full animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Logo Container */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-8 sm:space-y-0 sm:space-x-8 lg:space-x-12">
          {/* Lumina Logo */}
          <div
            ref={luminaLogoRef}
            className="flex-shrink-0 group cursor-pointer transition-all duration-300 hover:scale-105"
            onMouseEnter={useCallback(() => {
              if (
                !window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches &&
                luminaLogoRef.current &&
                luminaImageLoaded
              ) {
                gsap.to(luminaLogoRef.current, {
                  scale: 1.08,
                  filter:
                    "drop-shadow(0 0 24px rgba(0,255,136,0.5)) drop-shadow(0 0 48px rgba(0,255,136,0.2))",
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            }, [luminaImageLoaded])}
            onMouseLeave={useCallback(() => {
              if (
                !window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches &&
                luminaLogoRef.current &&
                luminaImageLoaded
              ) {
                gsap.to(luminaLogoRef.current, {
                  scale: 1,
                  filter:
                    "drop-shadow(0 0 12px rgba(0,255,136,0.3)) drop-shadow(0 0 24px rgba(0,255,136,0.1))",
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            }, [luminaImageLoaded])}
          >
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full p-2 bg-gradient-to-br from-emerald-500/10 to-lime-500/10 backdrop-blur-sm border border-emerald-500/20 group-hover:border-emerald-400/40 transition-all duration-300">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                {luminaImageError ? (
                  // Fallback content for failed image load
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-lime-500/20 rounded-full">
                    <span className="text-emerald-400 font-bold text-lg sm:text-xl lg:text-2xl">
                      L
                    </span>
                  </div>
                ) : (
                  <Image
                    src="/logo/logo.webp"
                    alt="Lumina - NFT Marketplace Platform"
                    fill
                    className={`object-contain p-1 transition-opacity duration-300 ${
                      luminaImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 160px"
                    loading={isVisible ? "eager" : "lazy"}
                    onLoad={handleLuminaLoad}
                    onError={handleLuminaError}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                )}
                {/* Loading indicator */}
                {!luminaImageLoaded && !luminaImageError && isVisible && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-lime-500/10 rounded-full">
                    <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connector */}
          <div ref={connectorRef} className="flex-shrink-0 relative">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient relative z-10 drop-shadow-lg">
              ×
            </div>
            {/* Subtle glow behind connector */}
            <div className="absolute inset-0 text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-400/20 blur-sm">
              ×
            </div>
          </div>

          {/* Somnia Logo */}
          <div
            ref={somniaLogoRef}
            className="flex-shrink-0 group cursor-pointer transition-all duration-300 hover:scale-105"
            onMouseEnter={useCallback(() => {
              if (
                !window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches &&
                somniaLogoRef.current &&
                somniaImageLoaded
              ) {
                gsap.to(somniaLogoRef.current, {
                  scale: 1.08,
                  filter:
                    "drop-shadow(0 0 24px rgba(0,255,136,0.5)) drop-shadow(0 0 48px rgba(0,255,136,0.2))",
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            }, [somniaImageLoaded])}
            onMouseLeave={useCallback(() => {
              if (
                !window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches &&
                somniaLogoRef.current &&
                somniaImageLoaded
              ) {
                gsap.to(somniaLogoRef.current, {
                  scale: 1,
                  filter:
                    "drop-shadow(0 0 12px rgba(0,255,136,0.3)) drop-shadow(0 0 24px rgba(0,255,136,0.1))",
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            }, [somniaImageLoaded])}
          >
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full p-2 bg-gradient-to-br from-emerald-500/10 to-lime-500/10 backdrop-blur-sm border border-emerald-500/20 group-hover:border-emerald-400/40 transition-all duration-300">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                {somniaImageError ? (
                  // Fallback content for failed image load
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-lime-500/20 rounded-full">
                    <span className="text-emerald-400 font-bold text-lg sm:text-xl lg:text-2xl">
                      S
                    </span>
                  </div>
                ) : (
                  <Image
                    src="/logo/somnia.webp"
                    alt="Somnia - Blockchain Technology Partner"
                    fill
                    className={`object-contain p-1 transition-opacity duration-300 ${
                      somniaImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 160px"
                    loading={isVisible ? "eager" : "lazy"}
                    onLoad={handleSomniaLoad}
                    onError={handleSomniaError}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                )}
                {/* Loading indicator */}
                {!somniaImageLoaded && !somniaImageError && isVisible && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-lime-500/10 rounded-full">
                    <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* "Built on Somnia network" Text */}
        <div ref={textRef} className="text-center mt-8 sm:mt-10 lg:mt-12">
          <p className="text-sm sm:text-base lg:text-lg text-gray-300/90 font-medium tracking-wide">
            Built on <span className="text-gradient font-semibold">Somnia</span>{" "}
            network
          </p>
        </div>
      </div>
    </section>
  );
}
