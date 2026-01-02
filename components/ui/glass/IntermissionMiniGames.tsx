'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { InteractiveButton } from './InteractiveButton'

/**
 * Intermission Mini-Games
 * Fun activities for when users are waiting or offline
 * Includes: Love Quiz, Heart Catcher, Compatibility Calculator
 */

interface IntermissionProps {
  reason: 'offline' | 'loading' | 'no-matches' | 'rate-limited'
  onDismiss?: () => void
  className?: string
}

type MiniGame = 'quiz' | 'catcher' | 'calculator' | 'waiting'

export function IntermissionMode({ reason, onDismiss, className }: IntermissionProps) {
  const [currentGame, setCurrentGame] = useState<MiniGame>('waiting')
  const [score, setScore] = useState(0)
  
  const reasonMessages = {
    offline: "You're offline! Play while we reconnect...",
    loading: "Finding your perfect matches...",
    'no-matches': "No new profiles right now. Check back soon!",
    'rate-limited': "Slow down! Let's play while you wait...",
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50',
        'bg-gradient-to-br from-rose-500/90 via-pink-500/90 to-violet-500/90',
        'backdrop-blur-xl',
        'flex flex-col items-center justify-center p-6',
        className
      )}
    >
      {/* Status message */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {reasonMessages[reason]}
        </h2>
        {score > 0 && (
          <div className="text-white/80">Score: {score}</div>
        )}
      </motion.div>
      
      {/* Game selection or active game */}
      <AnimatePresence mode="wait">
        {currentGame === 'waiting' && (
          <motion.div
            key="selection"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="grid grid-cols-1 gap-4 w-full max-w-sm"
          >
            <GameButton
              emoji="💝"
              title="Love Quiz"
              description="Test your dating knowledge"
              onClick={() => setCurrentGame('quiz')}
            />
            <GameButton
              emoji="💕"
              title="Heart Catcher"
              description="Catch falling hearts"
              onClick={() => setCurrentGame('catcher')}
            />
            <GameButton
              emoji="✨"
              title="Compatibility Test"
              description="Your perfect match traits"
              onClick={() => setCurrentGame('calculator')}
            />
          </motion.div>
        )}
        
        {currentGame === 'quiz' && (
          <LoveQuiz
            key="quiz"
            onScore={(points) => setScore(s => s + points)}
            onBack={() => setCurrentGame('waiting')}
          />
        )}
        
        {currentGame === 'catcher' && (
          <HeartCatcher
            key="catcher"
            onScore={(points) => setScore(s => s + points)}
            onBack={() => setCurrentGame('waiting')}
          />
        )}
        
        {currentGame === 'calculator' && (
          <CompatibilityCalculator
            key="calculator"
            onBack={() => setCurrentGame('waiting')}
          />
        )}
      </AnimatePresence>
      
      {/* Dismiss button */}
      {onDismiss && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          onClick={onDismiss}
          className="absolute top-6 right-6 text-white text-sm"
        >
          ✕ Close
        </motion.button>
      )}
    </motion.div>
  )
}

function GameButton({ 
  emoji, 
  title, 
  description, 
  onClick 
}: { 
  emoji: string
  title: string
  description: string
  onClick: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-left flex items-center gap-4 border border-white/30"
    >
      <span className="text-4xl">{emoji}</span>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-white/70">{description}</div>
      </div>
    </motion.button>
  )
}

/**
 * Love Quiz Mini-Game
 */
const quizQuestions = [
  {
    question: "What's the best first message to send?",
    options: [
      { text: "Hey", correct: false },
      { text: "Something about their profile", correct: true },
      { text: "U up?", correct: false },
      { text: "Send a pickup line", correct: false },
    ],
  },
  {
    question: "When should you meet in person?",
    options: [
      { text: "Before chatting", correct: false },
      { text: "After a week of chatting", correct: true },
      { text: "After 3 months", correct: false },
      { text: "Never", correct: false },
    ],
  },
  {
    question: "What makes a great dating profile?",
    options: [
      { text: "All selfies", correct: false },
      { text: "No photos", correct: false },
      { text: "Variety of photos + genuine bio", correct: true },
      { text: "Just a bio, no photos", correct: false },
    ],
  },
  {
    question: "Best first date idea?",
    options: [
      { text: "Movie theater", correct: false },
      { text: "Coffee or drinks", correct: true },
      { text: "Meeting parents", correct: false },
      { text: "Weekend trip", correct: false },
    ],
  },
  {
    question: "Red flag in a profile?",
    options: [
      { text: "They have hobbies", correct: false },
      { text: "Too many group photos", correct: false },
      { text: "Negativity about exes", correct: true },
      { text: "Travel photos", correct: false },
    ],
  },
]

function LoveQuiz({ 
  onScore, 
  onBack 
}: { 
  onScore: (points: number) => void
  onBack: () => void 
}) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  
  const question = quizQuestions[currentQ]
  
  const handleAnswer = (index: number) => {
    if (answered) return
    
    setSelectedIndex(index)
    setAnswered(true)
    
    if (question.options[index].correct) {
      onScore(10)
      setCorrectCount(c => c + 1)
    }
    
    setTimeout(() => {
      if (currentQ < quizQuestions.length - 1) {
        setCurrentQ(q => q + 1)
        setAnswered(false)
        setSelectedIndex(null)
      } else {
        setFinished(true)
      }
    }, 1500)
  }
  
  if (finished) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">
          {correctCount >= 4 ? '🎉' : correctCount >= 2 ? '👍' : '📚'}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {correctCount}/{quizQuestions.length} Correct!
        </h3>
        <p className="text-white/80 mb-6">
          {correctCount >= 4 ? "You're a dating expert!" :
           correctCount >= 2 ? "Pretty good!" : 
           "Keep learning!"}
        </p>
        <InteractiveButton variant="secondary" onClick={onBack}>
          Play Again
        </InteractiveButton>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-white/60 text-sm mb-2">
        Question {currentQ + 1}/{quizQuestions.length}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-6">
        {question.question}
      </h3>
      
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={!answered ? { scale: 1.02 } : {}}
            whileTap={!answered ? { scale: 0.98 } : {}}
            onClick={() => handleAnswer(index)}
            disabled={answered}
            className={cn(
              'w-full p-4 rounded-xl text-left transition-all',
              'bg-white/20 border border-white/30',
              answered && option.correct && 'bg-green-500/50 border-green-400',
              answered && selectedIndex === index && !option.correct && 'bg-red-500/50 border-red-400',
              !answered && 'hover:bg-white/30'
            )}
          >
            <span className="text-white">{option.text}</span>
          </motion.button>
        ))}
      </div>
      
      <button
        onClick={onBack}
        className="mt-6 text-white/60 hover:text-white text-sm"
      >
        ← Back to games
      </button>
    </motion.div>
  )
}

/**
 * Heart Catcher Mini-Game
 */
function HeartCatcher({ 
  onScore, 
  onBack 
}: { 
  onScore: (points: number) => void
  onBack: () => void 
}) {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; caught: boolean }>>([])
  const [paddleX, setPaddleX] = useState(50)
  const [gameScore, setGameScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameOver, setGameOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const heartIdRef = useRef(0)
  
  // Spawn hearts
  useEffect(() => {
    if (gameOver) return
    
    const spawnInterval = setInterval(() => {
      setHearts(prev => [
        ...prev.slice(-15), // Keep max 15 hearts
        {
          id: heartIdRef.current++,
          x: 10 + Math.random() * 80,
          y: -10,
          caught: false,
        }
      ])
    }, 800)
    
    return () => clearInterval(spawnInterval)
  }, [gameOver])
  
  // Move hearts down
  useEffect(() => {
    if (gameOver) return
    
    const moveHearts = () => {
      setHearts(prev => prev
        .map(h => ({ ...h, y: h.y + 1.5 }))
        .filter(h => h.y < 100 && !h.caught)
      )
      animationRef.current = requestAnimationFrame(moveHearts)
    }
    
    animationRef.current = requestAnimationFrame(moveHearts)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameOver])
  
  // Check collisions
  useEffect(() => {
    setHearts(prev => {
      let caught = false
      const updated = prev.map(h => {
        if (
          !h.caught &&
          h.y > 75 && h.y < 90 &&
          Math.abs(h.x - paddleX) < 12
        ) {
          caught = true
          return { ...h, caught: true }
        }
        return h
      })
      
      if (caught) {
        setGameScore(s => s + 1)
        onScore(1)
      }
      
      return updated
    })
  }, [paddleX, onScore])
  
  // Timer
  useEffect(() => {
    if (gameOver) return
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gameOver])
  
  // Mouse/touch controls
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    setPaddleX(Math.max(10, Math.min(90, x)))
  }, [])
  
  if (gameOver) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">💕</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Game Over!
        </h3>
        <p className="text-4xl text-white mb-6">{gameScore} hearts caught!</p>
        <InteractiveButton 
          variant="secondary" 
          onClick={() => {
            setGameOver(false)
            setGameScore(0)
            setTimeLeft(30)
            setHearts([])
          }}
        >
          Play Again
        </InteractiveButton>
        <button
          onClick={onBack}
          className="block mx-auto mt-4 text-white/60 hover:text-white text-sm"
        >
          ← Back to games
        </button>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md"
    >
      <div className="flex justify-between text-white mb-4">
        <span>❤️ {gameScore}</span>
        <span>⏱️ {timeLeft}s</span>
      </div>
      
      <div
        ref={containerRef}
        className="relative w-full h-64 bg-white/10 rounded-2xl overflow-hidden touch-none"
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        {/* Hearts */}
        {hearts.filter(h => !h.caught).map(heart => (
          <motion.div
            key={heart.id}
            className="absolute text-2xl"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          >
            ❤️
          </motion.div>
        ))}
        
        {/* Paddle */}
        <motion.div
          className="absolute bottom-4 w-20 h-3 bg-white rounded-full"
          style={{ left: `${paddleX}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      
      <button
        onClick={onBack}
        className="mt-4 text-white/60 hover:text-white text-sm"
      >
        ← Back to games
      </button>
    </motion.div>
  )
}

/**
 * Compatibility Calculator
 */
const traits = [
  { id: 'adventure', label: 'Adventurous', emoji: '🏔️' },
  { id: 'homebody', label: 'Homebody', emoji: '🏠' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'analytical', label: 'Analytical', emoji: '🧠' },
  { id: 'social', label: 'Social Butterfly', emoji: '🦋' },
  { id: 'introvert', label: 'Introvert', emoji: '📚' },
  { id: 'romantic', label: 'Hopeless Romantic', emoji: '💕' },
  { id: 'practical', label: 'Practical', emoji: '🎯' },
]

function CompatibilityCalculator({ onBack }: { onBack: () => void }) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [result, setResult] = useState<string | null>(null)
  
  const toggleTrait = (id: string) => {
    setSelectedTraits(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id].slice(0, 4)
    )
  }
  
  const calculateResult = () => {
    if (selectedTraits.length < 2) return
    
    const results = [
      "You're most compatible with adventurous, open-minded partners who share your curiosity! 🌟",
      "Your ideal match is someone grounded but spontaneous - stability with a side of fun! ✨",
      "You need a partner who appreciates deep conversations and quiet moments together 💫",
      "Look for someone who balances your energy - opposites can attract! 🎭",
      "Your perfect match shares your values but brings new perspectives to explore 🔮",
    ]
    
    setResult(results[Math.floor(Math.random() * results.length)])
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md"
    >
      {!result ? (
        <>
          <h3 className="text-xl font-bold text-white mb-2">
            Select up to 4 traits that describe you:
          </h3>
          <p className="text-white/60 text-sm mb-6">
            {selectedTraits.length}/4 selected
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {traits.map(trait => (
              <motion.button
                key={trait.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleTrait(trait.id)}
                className={cn(
                  'p-3 rounded-xl border transition-all text-left',
                  selectedTraits.includes(trait.id)
                    ? 'bg-white/30 border-white/50'
                    : 'bg-white/10 border-white/20'
                )}
              >
                <span className="text-xl mr-2">{trait.emoji}</span>
                <span className="text-white text-sm">{trait.label}</span>
              </motion.button>
            ))}
          </div>
          
          <InteractiveButton
            onClick={calculateResult}
            disabled={selectedTraits.length < 2}
            className="w-full"
          >
            Calculate Compatibility ✨
          </InteractiveButton>
        </>
      ) : (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">💫</div>
          <p className="text-white text-lg mb-6">{result}</p>
          <InteractiveButton
            variant="secondary"
            onClick={() => {
              setResult(null)
              setSelectedTraits([])
            }}
          >
            Try Again
          </InteractiveButton>
        </motion.div>
      )}
      
      <button
        onClick={onBack}
        className="block mx-auto mt-4 text-white/60 hover:text-white text-sm"
      >
        ← Back to games
      </button>
    </motion.div>
  )
}

/**
 * Simple loading spinner with personality
 */
export function FunLoadingSpinner({ message }: { message?: string }) {
  const emojis = ['💕', '✨', '💫', '🌟', '💝']
  const [currentEmoji, setCurrentEmoji] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji(i => (i + 1) % emojis.length)
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        key={currentEmoji}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="text-5xl mb-4"
      >
        {emojis[currentEmoji]}
      </motion.div>
      {message && (
        <p className="text-white/80 text-center">{message}</p>
      )}
    </div>
  )
}
