'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { WatercolorBackground } from '@/components/ui/watercolor-background'
import { AcrylicButton } from '@/components/ui/acrylic-button'

/**
 * Offline Page
 * Shown when the app is offline and content isn't cached
 */
export default function OfflinePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <WatercolorBackground variant="cool" intensity="subtle" animated={false} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
        {/* Offline icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <svg
            className="w-24 h-24 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-bold text-slate-700 mb-3"
        >
          You&apos;re Offline
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-500 max-w-sm mb-8"
        >
          Don&apos;t worry, your matches will be waiting when you&apos;re back online.
          Check your internet connection and try again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <AcrylicButton
            variant="primary"
            size="lg"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </AcrylicButton>

          <Link href="/app/feed" className="w-full">
            <AcrylicButton
              variant="ghost"
              size="lg"
              className="w-full"
            >
              View Cached Content
            </AcrylicButton>
          </Link>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-sm text-slate-400"
        >
          <p className="mb-2 font-medium">Tips while offline:</p>
          <ul className="space-y-1">
            <li>• View your recent matches</li>
            <li>• Read saved messages</li>
            <li>• Browse cached profiles</li>
          </ul>
        </motion.div>
      </div>
    </main>
  )
}
