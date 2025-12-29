/**
 * Swipeable Card Component
 * Core interaction pattern for the discover feed
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'

export interface ProfileCard {
  id: string
  name: string
  age: number
  photos: string[]
  bio?: string
  location: string
  distance: number
  prompts?: Array<{
    question: string
    answer: string
  }>
  interests?: string[]
  verified: boolean
  online: boolean
  compatibilityScore?: number
  matchReason?: string
}

interface SwipeableCardProps {
  card: ProfileCard
  onSwipeLeft: (id: string) => void
  onSwipeRight: (id: string) => void
  onCardTap: (id: string) => void
}

export function SwipeableCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  onCardTap,
}: SwipeableCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [exitX, setExitX] = useState(0)
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  // Like/nope overlay opacity
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  function handleDragEnd(event: any, info: PanInfo) {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Swipe threshold
    if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
      if (offset > 0) {
        // Swipe right = like
        setExitX(1000)
        setTimeout(() => onSwipeRight(card.id), 100)
      } else {
        // Swipe left = pass
        setExitX(-1000)
        setTimeout(() => onSwipeLeft(card.id), 100)
      }
    }
  }

  function handlePhotoNavigation(direction: 'prev' | 'next') {
    if (direction === 'next' && currentPhotoIndex < card.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    } else if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        opacity,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Photo with navigation */}
        <div className="relative h-3/5">
          <img
            src={card.photos[currentPhotoIndex]}
            alt={card.name}
            className="w-full h-full object-cover"
          />
          
          {/* Photo indicators */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
            {card.photos.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index === currentPhotoIndex
                    ? 'bg-white'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Left/Right tap areas for photo navigation */}
          <div className="absolute inset-0 flex">
            <button
              className="w-1/3 h-full"
              onClick={() => handlePhotoNavigation('prev')}
              aria-label="Previous photo"
            />
            <button
              className="w-1/3 h-full"
              onClick={() => onCardTap(card.id)}
              aria-label="View profile"
            />
            <button
              className="w-1/3 h-full"
              onClick={() => handlePhotoNavigation('next')}
              aria-label="Next photo"
            />
          </div>

          {/* Status badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {card.verified && (
              <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            {card.online && (
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Online
              </span>
            )}
          </div>

          {/* Compatibility score (if available) */}
          {card.compatibilityScore && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-primary-600 text-sm font-bold px-3 py-1.5 rounded-full">
              {Math.round(card.compatibilityScore * 100)}% Match
            </div>
          )}
        </div>

        {/* Profile info */}
        <div className="h-2/5 p-6 overflow-y-auto">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-2xl font-bold text-neutral-900">
              {card.name}, {card.age}
            </h2>
            <span className="text-sm text-neutral-500">
              {card.distance}km away
            </span>
          </div>

          {card.matchReason && (
            <p className="text-sm text-primary-600 mb-3 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              {card.matchReason}
            </p>
          )}

          {card.bio && (
            <p className="text-neutral-700 mb-3 line-clamp-2">{card.bio}</p>
          )}

          {card.prompts && card.prompts.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-neutral-900 mb-1">
                {card.prompts[0].question}
              </p>
              <p className="text-sm text-neutral-700 italic">
                "{card.prompts[0].answer}"
              </p>
            </div>
          )}

          {card.interests && card.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Like/Nope overlays */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div className="bg-green-500 text-white text-4xl font-bold px-8 py-4 rounded-2xl rotate-12 border-4 border-green-500">
            LIKE
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div className="bg-red-500 text-white text-4xl font-bold px-8 py-4 rounded-2xl -rotate-12 border-4 border-red-500">
            NOPE
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * Card Action Buttons
 */
interface CardActionsProps {
  onPass: () => void
  onLike: () => void
  onSuperLike?: () => void
  disabled?: boolean
}

export function CardActions({
  onPass,
  onLike,
  onSuperLike,
  disabled = false,
}: CardActionsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Pass button */}
      <button
        onClick={onPass}
        disabled={disabled}
        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Pass"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Super like button (optional) */}
      {onSuperLike && (
        <button
          onClick={onSuperLike}
          disabled={disabled}
          className="w-12 h-12 rounded-full bg-blue-500 shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Super like"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      )}

      {/* Like button */}
      <button
        onClick={onLike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-primary-500 shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Like"
      >
        <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

/**
 * End of Deck Message
 */
export function EndOfDeck({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-neutral-900 mb-2">
        You've reached the end!
      </h3>
      <p className="text-neutral-600 mb-6">
        Come back later for more profiles, or check your matches
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Check for New Profiles
        </button>
      )}
    </div>
  )
}
