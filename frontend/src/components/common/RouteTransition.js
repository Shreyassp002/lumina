"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";

export default function RouteTransition() {
  const pathname = usePathname();
  const overlayRef = useRef(null);

  useEffect(() => {
    // Clean up any existing GSAP animations and ScrollTriggers on route change
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.globalTimeline.clear();

    const overlay = overlayRef.current;
    if (!overlay) return;

    const tl = gsap.timeline();
    tl.set(overlay, { yPercent: -100, opacity: 1, display: "block" })
      .to(overlay, { yPercent: 0, duration: 0.35, ease: "power2.out" })
      .to(overlay, { yPercent: 100, duration: 0.4, ease: "power2.in" })
      .set(overlay, { display: "none" })
      .call(() => {
        // Refresh ScrollTrigger after route transition
        ScrollTrigger.refresh();
      });
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ display: "none" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-lime-500 opacity-90" />
    </div>
  );
}
