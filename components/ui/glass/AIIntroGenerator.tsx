'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { InteractiveButton } from './InteractiveButton'
import { GlassCard3D } from './GlassCard3D'

/**
 * AI-Assisted Introduction Generator
 * Helps users craft personalized first messages based on profile content
 * Uses templates and user inputs to generate contextual openers
 */

interface Profile {
  name: string
  age: number
  bio?: string
  interests?: string[]
  photos?: { caption?: string }[]
  promptAnswers?: { prompt: string; answer: string }[]
}

interface AIIntroGeneratorProps {
  targetProfile: Profile
  onGenerate: (message: string) => void
  onSend: (message: string) => void
  onDismiss: () => void
  className?: string
}

// Message templates categorized by style
const messageTemplates = {
  playful: [
    "I noticed {observation} - {question}?",
    "Okay but {observation} is actually amazing. {followup}",
    "Not to be dramatic, but {observation} and I think we'd get along 😄",
    "I have a very important question about {topic}: {question}?",
  ],
  genuine: [
    "Hey {name}! {observation} really caught my attention. {question}?",
    "I love that you mentioned {topic}. {followup}",
    "Your {observation} resonated with me - {connection}",
    "Hi {name}, I couldn't help but notice {observation}. {question}?",
  ],
  witty: [
    "Plot twist: I also {shared_interest}. This could be the start of something 👀",
    "On a scale of 1 to {topic}, how {question}?",
    "Confession: I stalked your profile for way too long because {observation}",
    "I was going to say something clever about {topic} but honestly I just think you seem cool",
  ],
  direct: [
    "Hi {name}! I think we'd really click. Want to grab coffee sometime?",
    "Hey! Your profile made me smile. Would love to chat more about {topic}.",
    "No pickup lines here - just genuinely interested in getting to know you better.",
    "Hi {name}, you seem like someone I'd actually want to meet. Coffee?",
  ],
}

// Observation generators based on profile content
function generateObservations(profile: Profile): string[] {
  const observations: string[] = []
  
  if (profile.bio) {
    // Extract potential talking points from bio
    const bioLower = profile.bio.toLowerCase()
    
    if (bioLower.includes('travel') || bioLower.includes('adventure')) {
      observations.push('you love exploring new places')
    }
    if (bioLower.includes('food') || bioLower.includes('cook') || bioLower.includes('chef')) {
      observations.push('you appreciate good food')
    }
    if (bioLower.includes('music') || bioLower.includes('concert')) {
      observations.push('you have great taste in music')
    }
    if (bioLower.includes('book') || bioLower.includes('read')) {
      observations.push('you\'re a fellow bookworm')
    }
    if (bioLower.includes('dog') || bioLower.includes('pet')) {
      observations.push('you\'re a dog person')
    }
    if (bioLower.includes('gym') || bioLower.includes('fitness') || bioLower.includes('workout')) {
      observations.push('you take fitness seriously')
    }
    if (bioLower.includes('coffee')) {
      observations.push('you appreciate a good cup of coffee')
    }
  }
  
  if (profile.interests && profile.interests.length > 0) {
    profile.interests.slice(0, 3).forEach(interest => {
      observations.push(`you're into ${interest}`)
    })
  }
  
  if (profile.promptAnswers && profile.promptAnswers.length > 0) {
    profile.promptAnswers.forEach(({ prompt, answer }) => {
      observations.push(`your answer about "${prompt.slice(0, 30)}..."`)
    })
  }
  
  // Fallback observations
  if (observations.length === 0) {
    observations.push('your vibe seems really genuine')
    observations.push('your photos tell a cool story')
    observations.push('your profile stands out')
  }
  
  return observations
}

// Generate questions based on observations
function generateQuestions(observation: string): string[] {
  const questions: string[] = []
  
  if (observation.includes('travel') || observation.includes('places')) {
    questions.push("What's the most underrated place you've visited")
    questions.push("What's next on your travel bucket list")
  } else if (observation.includes('food') || observation.includes('cook')) {
    questions.push("What's your go-to comfort food")
    questions.push("What's the best meal you've ever had")
  } else if (observation.includes('music')) {
    questions.push("What's the best concert you've been to")
    questions.push("What song are you currently obsessed with")
  } else if (observation.includes('book')) {
    questions.push("What book has stuck with you the most")
    questions.push("What are you reading right now")
  } else if (observation.includes('dog') || observation.includes('pet')) {
    questions.push("What's your pet's name and personality")
    questions.push("Do they have a favorite spot in your home")
  } else if (observation.includes('fitness') || observation.includes('gym')) {
    questions.push("What's your favorite way to stay active")
    questions.push("Morning workout or evening - which team are you on")
  } else if (observation.includes('coffee')) {
    questions.push("What's your coffee order")
    questions.push("Best coffee spot you've found")
  } else {
    questions.push("What got you into that")
    questions.push("I'd love to hear more about that")
    questions.push("What's the story behind that")
  }
  
  return questions
}

export function AIIntroGenerator({
  targetProfile,
  onGenerate,
  onSend,
  onDismiss,
  className,
}: AIIntroGeneratorProps) {
  const [step, setStep] = useState<'style' | 'customize' | 'preview'>('style')
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof messageTemplates>('genuine')
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([])
  const [selectedMessage, setSelectedMessage] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const observations = generateObservations(targetProfile)
  
  const generateMessages = useCallback(() => {
    setIsGenerating(true)
    
    // Simulate AI generation delay
    setTimeout(() => {
      const templates = messageTemplates[selectedStyle]
      const generated: string[] = []
      
      templates.forEach(template => {
        const observation = observations[Math.floor(Math.random() * observations.length)]
        const questions = generateQuestions(observation)
        const question = questions[Math.floor(Math.random() * questions.length)]
        const topic = observation.replace('you\'re into ', '').replace('you ', '')
        
        let message = template
          .replace('{name}', targetProfile.name)
          .replace('{observation}', observation)
          .replace('{question}', question)
          .replace('{topic}', topic)
          .replace('{followup}', 'Would love to chat more about it!')
          .replace('{connection}', 'I totally get that.')
          .replace('{shared_interest}', topic)
        
        generated.push(message)
      })
      
      setGeneratedMessages(generated)
      setSelectedMessage(generated[0])
      setIsGenerating(false)
      setStep('customize')
    }, 1000)
  }, [selectedStyle, observations, targetProfile.name])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center',
        'bg-black/50 backdrop-blur-sm p-4',
        className
      )}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">AI Message Helper ✨</h3>
            <p className="text-sm text-slate-500">
              Craft the perfect intro for {targetProfile.name}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Style */}
            {step === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  What vibe do you want to go for?
                </p>
                
                {(Object.keys(messageTemplates) as Array<keyof typeof messageTemplates>).map(style => (
                  <motion.button
                    key={style}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStyle(style)}
                    className={cn(
                      'w-full p-4 rounded-xl text-left transition-all',
                      'border-2',
                      selectedStyle === style
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    <div className="font-semibold capitalize flex items-center gap-2">
                      {style === 'playful' && '😄'}
                      {style === 'genuine' && '💫'}
                      {style === 'witty' && '🎭'}
                      {style === 'direct' && '🎯'}
                      {style}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {style === 'playful' && 'Fun, lighthearted, with a touch of humor'}
                      {style === 'genuine' && 'Authentic, thoughtful, shows real interest'}
                      {style === 'witty' && 'Clever wordplay, memorable one-liners'}
                      {style === 'direct' && 'Confident, straightforward, no games'}
                    </div>
                  </motion.button>
                ))}
                
                <InteractiveButton
                  onClick={generateMessages}
                  className="w-full mt-4"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Messages ✨'}
                </InteractiveButton>
              </motion.div>
            )}
            
            {/* Step 2: Customize */}
            {step === 'customize' && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Pick one or customize your own:
                </p>
                
                {generatedMessages.map((message, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      setSelectedMessage(message)
                      setCustomMessage(message)
                    }}
                    className={cn(
                      'w-full p-3 rounded-xl text-left text-sm transition-all',
                      'border-2',
                      selectedMessage === message
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {message}
                  </motion.button>
                ))}
                
                <div className="pt-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Or write your own:
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full mt-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('style')}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    ← Back
                  </button>
                  <InteractiveButton
                    onClick={() => {
                      setSelectedMessage(customMessage || selectedMessage)
                      setStep('preview')
                    }}
                    className="flex-1"
                  >
                    Preview →
                  </InteractiveButton>
                </div>
              </motion.div>
            )}
            
            {/* Step 3: Preview */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Here's what {targetProfile.name} will see:
                </p>
                
                <GlassCard3D className="p-4" intensity="subtle">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      You
                    </div>
                    <div className="flex-1">
                      <div className="bg-rose-500 text-white p-3 rounded-2xl rounded-tl-sm">
                        {customMessage || selectedMessage}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Just now</div>
                    </div>
                  </div>
                </GlassCard3D>
                
                <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                  💡 <strong>Tip:</strong> Messages that reference specific profile details 
                  get 3x more responses!
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('customize')}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    ← Edit
                  </button>
                  <InteractiveButton
                    variant="love"
                    onClick={() => {
                      onSend(customMessage || selectedMessage)
                      onDismiss()
                    }}
                    className="flex-1"
                  >
                    Send 💕
                  </InteractiveButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Quick Message Suggestions
 * Shows contextual message starters inline
 */
interface QuickSuggestionsProps {
  profile: Profile
  onSelect: (message: string) => void
  className?: string
}

export function QuickMessageSuggestions({ profile, onSelect, className }: QuickSuggestionsProps) {
  const suggestions = [
    `Hey ${profile.name}! Love your profile 😊`,
    `What's the story behind your first photo?`,
    `You seem like someone I'd actually want to meet!`,
    `Best thing you've done this week? 👀`,
  ]
  
  return (
    <div className={cn('flex gap-2 overflow-x-auto py-2 px-1', className)}>
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(suggestion)}
          className="flex-shrink-0 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  )
}
