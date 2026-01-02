'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnimatedBackground } from './AnimatedBackground'
import { GlassCard3D } from './GlassCard3D'
import { InteractiveButton } from './InteractiveButton'

/**
 * Grand Intro Sequence
 * A 30-45 second interactive cold open inspired by video game title sequences
 * Phases: Title Card → Vibe Selection → Character Setup → Rules → Tutorial
 */

interface GrandIntroProps {
  userName?: string
  onComplete: (data: IntroData) => void
  skipEnabled?: boolean
}

interface IntroData {
  vibeGenre: string
  lookingFor: string
  firstMove: 'them' | 'me' | 'either'
  skipped: boolean
}

type Phase = 'title' | 'vibe' | 'character' | 'rules' | 'tutorial' | 'complete'

const vibeOptions = [
  { id: 'romantic', label: 'Hopeless Romantic', emoji: '💕', color: 'from-rose-500 to-pink-400' },
  { id: 'adventure', label: 'Adventure Seeker', emoji: '🌟', color: 'from-amber-500 to-orange-400' },
  { id: 'chill', label: 'Netflix & Chill', emoji: '🎬', color: 'from-violet-500 to-purple-400' },
  { id: 'foodie', label: 'Foodie First', emoji: '🍜', color: 'from-green-500 to-emerald-400' },
  { id: 'creative', label: 'Creative Soul', emoji: '🎨', color: 'from-cyan-500 to-blue-400' },
  { id: 'fitness', label: 'Gym & Goals', emoji: '💪', color: 'from-red-500 to-rose-400' },
]

const lookingForOptions = [
  { id: 'relationship', label: 'Something Serious', emoji: '💍' },
  { id: 'casual', label: 'Keep It Casual', emoji: '😎' },
  { id: 'friends', label: 'New Friends', emoji: '🤝' },
  { id: 'explore', label: 'Still Figuring Out', emoji: '🦋' },
]

const rulesCards = [
  { 
    icon: '✨', 
    title: 'Be Authentic', 
    text: 'Your real self is your best self. No catfishing, no filters (okay, maybe one).' 
  },
  { 
    icon: '🤝', 
    title: 'Respect Always', 
    text: 'Treat others how you want to be treated. Kindness is attractive.' 
  },
  { 
    icon: '🔒', 
    title: 'Stay Safe', 
    text: 'Never share personal info too quickly. Meet in public first.' 
  },
  { 
    icon: '💬', 
    title: 'Start Conversations', 
    text: '"Hey" is boring. Ask about their interests, make them smile!' 
  },
]

export function GrandIntro({ userName, onComplete, skipEnabled = true }: GrandIntroProps) {
  const [phase, setPhase] = useState<Phase>('title')
  const [selectedVibe, setSelectedVibe] = useState<string>('')
  const [selectedLooking, setSelectedLooking] = useState<string>('')
  const [firstMove, setFirstMove] = useState<'them' | 'me' | 'either'>('either')
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0)
  const [showSkip, setShowSkip] = useState(false)
  
  const titleControls = useAnimation()
  
  // Show skip button after 3 seconds
  useEffect(() => {
    if (skipEnabled) {
      const timer = setTimeout(() => setShowSkip(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [skipEnabled])
  
  // Auto-advance title after animation
  useEffect(() => {
    if (phase === 'title') {
      titleControls.start({
        opacity: [0, 1],
        scale: [0.8, 1],
        y: [30, 0],
      }).then(() => {
        setTimeout(() => setPhase('vibe'), 2500)
      })
    }
  }, [phase, titleControls])
  
  // Auto-cycle rules
  useEffect(() => {
    if (phase === 'rules') {
      const timer = setInterval(() => {
        setCurrentRuleIndex(prev => {
          if (prev >= rulesCards.length - 1) {
            clearInterval(timer)
            setTimeout(() => setPhase('tutorial'), 1000)
            return prev
          }
          return prev + 1
        })
      }, 2500)
      return () => clearInterval(timer)
    }
  }, [phase])
  
  const handleSkip = useCallback(() => {
    onComplete({
      vibeGenre: selectedVibe || 'romantic',
      lookingFor: selectedLooking || 'explore',
      firstMove,
      skipped: true,
    })
  }, [selectedVibe, selectedLooking, firstMove, onComplete])
  
  const handleComplete = useCallback(() => {
    onComplete({
      vibeGenre: selectedVibe,
      lookingFor: selectedLooking,
      firstMove,
      skipped: false,
    })
  }, [selectedVibe, selectedLooking, firstMove, onComplete])
  
  const nextPhase = useCallback(() => {
    const phases: Phase[] = ['title', 'vibe', 'character', 'rules', 'tutorial', 'complete']
    const currentIndex = phases.indexOf(phase)
    if (currentIndex < phases.length - 1) {
      setPhase(phases[currentIndex + 1])
    }
  }, [phase])
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dynamic background based on phase */}
      <AnimatedBackground 
        variant={
          phase === 'title' ? 'cosmic' :
          phase === 'vibe' ? 'romantic' :
          phase === 'character' ? 'sunset' :
          phase === 'rules' ? 'night' :
          'aurora'
        }
      />
      
      {/* Skip button */}
      <AnimatePresence>
        {showSkip && phase !== 'complete' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={handleSkip}
            className="absolute top-6 right-6 text-white/80 text-sm font-medium px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm z-50"
          >
            Skip Intro →
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Phase Content */}
      <div className="relative h-full flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Title Card Phase */}
          {phase === 'title' && (
            <motion.div
              key="title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                animate={titleControls}
                className="space-y-6"
              >
                <motion.h1 
                  className="text-6xl md:text-8xl font-bold text-white tracking-tight"
                  style={{ 
                    textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  Us
                </motion.h1>
                <motion.p 
                  className="text-xl md:text-2xl text-white/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Find your person
                </motion.p>
                
                {/* Animated decorative elements */}
                <motion.div
                  className="flex justify-center gap-4 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {['💕', '✨', '🌟'].map((emoji, i) => (
                    <motion.span
                      key={i}
                      className="text-3xl"
                      animate={{
                        y: [0, -10, 0],
                        rotate: [-5, 5, -5],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Vibe Genre Selection */}
          {phase === 'vibe' && (
            <motion.div
              key="vibe"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-lg mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                What&apos;s your vibe?
              </h2>
              <p className="text-white/70 mb-8">Choose what describes you best</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {vibeOptions.map((option, i) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedVibe(option.id)}
                    className={cn(
                      'relative p-4 rounded-2xl backdrop-blur-md transition-all duration-300',
                      'border-2',
                      selectedVibe === option.id
                        ? `bg-gradient-to-br ${option.color} border-white/50`
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    )}
                  >
                    <span className="text-3xl mb-2 block">{option.emoji}</span>
                    <span className="text-white font-medium text-sm">{option.label}</span>
                    
                    {selectedVibe === option.id && (
                      <motion.div
                        layoutId="vibe-check"
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                      >
                        <span className="text-green-500 text-sm">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              <InteractiveButton
                onClick={nextPhase}
                disabled={!selectedVibe}
                className="w-full"
              >
                Continue
              </InteractiveButton>
            </motion.div>
          )}
          
          {/* Character Setup - Looking For */}
          {phase === 'character' && (
            <motion.div
              key="character"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-lg mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                What are you looking for?
              </h2>
              <p className="text-white/70 mb-8">No pressure, you can change this later</p>
              
              <div className="space-y-3 mb-8">
                {lookingForOptions.map((option, i) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedLooking(option.id)}
                    className={cn(
                      'w-full p-4 rounded-2xl backdrop-blur-md transition-all duration-300',
                      'border-2 text-left flex items-center gap-4',
                      selectedLooking === option.id
                        ? 'bg-white/30 border-white/50'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    )}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-white font-medium">{option.label}</span>
                    
                    {selectedLooking === option.id && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-white"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* First Move Preference */}
              <div className="mb-8">
                <p className="text-white/70 text-sm mb-3">Who makes the first move?</p>
                <div className="flex gap-2 justify-center">
                  {[
                    { value: 'them', label: 'They Do' },
                    { value: 'either', label: 'Either' },
                    { value: 'me', label: 'I Do' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFirstMove(opt.value as typeof firstMove)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        firstMove === opt.value
                          ? 'bg-white text-slate-800'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <InteractiveButton
                onClick={nextPhase}
                disabled={!selectedLooking}
                className="w-full"
              >
                Next
              </InteractiveButton>
            </motion.div>
          )}
          
          {/* Rules Cards */}
          {phase === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mx-auto text-center"
            >
              <motion.h2 
                className="text-2xl font-bold text-white mb-8"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
              >
                The Golden Rules
              </motion.h2>
              
              <div className="relative h-64">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRuleIndex}
                    initial={{ opacity: 0, x: 50, rotateY: -15 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: -50, rotateY: 15 }}
                    transition={{ type: 'spring', damping: 20 }}
                  >
                    <GlassCard3D className="p-8" intensity="subtle">
                      <span className="text-5xl mb-4 block">
                        {rulesCards[currentRuleIndex].icon}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {rulesCards[currentRuleIndex].title}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {rulesCards[currentRuleIndex].text}
                      </p>
                    </GlassCard3D>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-6">
                {rulesCards.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      i === currentRuleIndex ? 'bg-white w-6' : 
                      i < currentRuleIndex ? 'bg-white/80' : 'bg-white/30'
                    )}
                  />
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Tutorial / Final Phase */}
          {phase === 'tutorial' && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mx-auto text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🎉
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                You&apos;re all set{userName ? `, ${userName}` : ''}!
              </h2>
              
              <p className="text-white/80 mb-8">
                Time to find your perfect match. Swipe right if you like them, 
                left to pass. It&apos;s that simple!
              </p>
              
              {/* Quick tutorial animation */}
              <div className="relative mb-8 h-32">
                <motion.div
                  className="absolute left-1/2 top-1/2 w-16 h-20 bg-white/20 rounded-xl backdrop-blur-sm"
                  style={{ x: '-50%', y: '-50%' }}
                  animate={{
                    x: ['-50%', '100%', '-50%', '-200%', '-50%'],
                    rotate: [0, 15, 0, -15, 0],
                    opacity: [1, 0.5, 1, 0.5, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                {/* Swipe indicators */}
                <motion.span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 text-2xl"
                  animate={{ opacity: [0.3, 1, 0.3], x: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ← Pass
                </motion.span>
                <motion.span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 text-2xl"
                  animate={{ opacity: [0.3, 1, 0.3], x: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  Like →
                </motion.span>
              </div>
              
              <InteractiveButton
                variant="love"
                onClick={handleComplete}
                className="w-full text-lg"
              >
                Start Matching! 💕
              </InteractiveButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Compact intro for returning users or quick setup
 */
export function QuickIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-rose-500/90 to-pink-600/90 backdrop-blur-sm"
    >
      <div className="text-center text-white p-8">
        <motion.h1 
          className="text-5xl font-bold mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Welcome Back! 👋
        </motion.h1>
        <p className="text-white/80 mb-8">Ready to find your person?</p>
        <InteractiveButton variant="secondary" onClick={onComplete}>
          Let&apos;s Go!
        </InteractiveButton>
      </div>
    </motion.div>
  )
}
