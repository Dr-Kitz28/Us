'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { WatercolorBackground } from '@/components/ui/watercolor-background'
import { AcrylicButton } from '@/components/ui/acrylic-button'
import { GlassCard } from '@/components/ui/glass-card'

/**
 * Landing Page - Art-Forward Design
 * Premium watercolor aesthetic with mobile-first PWA feel
 */
export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated watercolor background */}
      <WatercolorBackground variant="warm" intensity="medium" animated />

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        
        {/* Logo and brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Abstract heart logo */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 relative"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <filter id="heartGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M50 88 C20 60, 5 40, 20 25 C35 10, 50 20, 50 35 C50 20, 65 10, 80 25 C95 40, 80 60, 50 88 Z"
                fill="url(#heartGradient)"
                filter="url(#heartGlow)"
              />
            </svg>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold heading-display mb-3">
            <span className="text-gradient">Uz</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Where meaningful connections bloom naturally
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-10 max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            { icon: '✨', label: 'Authentic' },
            { icon: '🔒', label: 'Safe' },
            { icon: '💫', label: 'Meaningful' },
          ].map((feature, i) => (
            <GlassCard
              key={feature.label}
              variant="default"
              padding="sm"
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <span className="text-2xl block mb-1">{feature.icon}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {feature.label}
              </span>
            </GlassCard>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col gap-4 w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/register" className="w-full">
            <AcrylicButton
              variant="primary"
              size="lg"
              glow
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Account
            </AcrylicButton>
          </Link>

          <Link href="/login" className="w-full">
            <AcrylicButton
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Sign In
            </AcrylicButton>
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted by thousands finding love
          </p>
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span>Made with</span>
            <svg className="w-3 h-3 text-rose-400 animate-heartbeat" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>in India</span>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
