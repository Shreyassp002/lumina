"use client";

import Layout from "../components/ui/Layout";
import BrandingSection from "../components/ui/BrandingSection";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

export default function Home() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(el.querySelectorAll(".fade-section")).forEach((s) => {
        gsap.from(s, {
          opacity: 0,
          y: 12,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.04,
        });
      });

      const featureCards = el.querySelectorAll(".feature-card");
      if (featureCards.length) {
        gsap.from(featureCards, {
          opacity: 0,
          y: 14,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.08,
          delay: 0.1,
        });
      }

      const statCards = el.querySelectorAll(".stat-card");
      if (statCards.length) {
        gsap.from(statCards, {
          opacity: 0,
          y: 10,
          duration: 0.35,
          ease: "power2.out",
          stagger: 0.06,
          delay: 0.15,
        });
      }
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={sectionRef} className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% -10%, rgba(0,255,136,0.12), transparent), radial-gradient(1000px 500px at 80% 10%, rgba(0, 200, 110, 0.12), transparent)",
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 fade-section">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              Discover the Future of
              <span className="block bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                Digital Art
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-green-200/80 mb-8 max-w-3xl mx-auto">
              Create, trade, and auction NFTs on the Somnia blockchain.
              Experience lightning-fast transactions and minimal fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/marketplace"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-semibold rounded-lg hover:from-emerald-400 hover:to-lime-400 transition-all duration-200 transform hover:scale-105 neon-glow"
              >
                Explore Marketplace
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center px-8 py-4 border-2 border-[#133027] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[#0e1518] transition-all duration-200"
              >
                Create NFT
                <Sparkles className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-lime-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl animate-pulse delay-500"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 fade-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-200 mb-4">
              Why Choose Lumina?
            </h2>
            <p className="text-xl text-green-200/70 max-w-2xl mx-auto">
              Built on Somnia&apos;s high-performance blockchain for the
              ultimate NFT experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:neon-glow transition-shadow duration-300 feature-card">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-200 mb-4">
                Lightning Fast
              </h3>
              <p className="text-green-200/70">
                Experience sub-second transaction finality with Somnia&apos;s
                high-performance blockchain. No more waiting for slow
                confirmations.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:neon-glow transition-shadow duration-300 feature-card">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-200 mb-4">
                Secure & Reliable
              </h3>
              <p className="text-green-200/70">
                Built with enterprise-grade security. Your NFTs and funds are
                protected by battle-tested smart contracts and security audits.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:neon-glow transition-shadow duration-300 feature-card">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-200 mb-4">
                Creator Friendly
              </h3>
              <p className="text-green-200/70">
                Fair royalties, low fees, and powerful tools for creators. Focus
                on your art while we handle the technical complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 fade-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">
                10K+
              </div>
              <div className="text-green-200/70">NFTs Created</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">
                5K+
              </div>
              <div className="text-green-200/70">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">
                1M+
              </div>
              <div className="text-green-200/70">Volume Traded</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">
                99.9%
              </div>
              <div className="text-green-200/70">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Branding Section */}
      <BrandingSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-lime-500 text-black fade-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your NFT Journey?
          </h2>
          <p className="text-xl text-black/80 mb-8">
            Join thousands of creators and collectors on the most advanced NFT
            marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="inline-flex items-center px-8 py-4 bg-black text-emerald-300 font-semibold rounded-lg hover:bg-[#0e1518] transition-colors duration-200"
            >
              Create Your First NFT
              <Sparkles className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-8 py-4 border-2 border-black/20 text-black font-semibold rounded-lg hover:bg-black/10 transition-colors duration-200"
            >
              Browse Marketplace
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
