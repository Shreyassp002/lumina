"use client";

import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";

export default function Layout({ children }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
