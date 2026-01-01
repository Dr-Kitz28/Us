'use client'

import { ReactNode, HTMLAttributes } from 'react'
import { glassClasses } from './tokens'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  shimmer?: boolean
  depth?: 'near' | 'mid' | 'far'
}

/**
 * Premium Glass UI Panel Component
 * Provides frosted glass effect with optional hover animations
 */
export function GlassPanel({ 
  children, 
  hover = false, 
  shimmer = false,
  depth = 'mid',
  className = '',
  ...props 
}: GlassPanelProps) {
  const baseClass = hover ? glassClasses.panelHover : glassClasses.panel
  const depthStyles = {
    near: { transform: 'translateZ(50px)' },
    mid: { transform: 'translateZ(25px)' },
    far: { transform: 'translateZ(0px)' },
  }

  return (
    <div 
      className={`${baseClass} ${className}`}
      style={depthStyles[depth]}
      {...props}
    >
      {shimmer && (
        <div 
          className="absolute inset-0 overflow-hidden rounded-2xl"
          style={{ 
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
            animation: 'shimmer 3s infinite'
          }}
        />
      )}
      {children}
    </div>
  )
}

/**
 * Glass Button Component
 */
interface GlassButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  disabled?: boolean
}

export function GlassButton({ children, disabled = false, className = '', ...props }: GlassButtonProps) {
  return (
    <button
      className={`${glassClasses.button} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Glass Input Component
 */
interface GlassInputProps extends HTMLAttributes<HTMLInputElement> {
  type?: string
  placeholder?: string
  value?: string
}

export function GlassInput({ type = 'text', placeholder, value, className = '', ...props }: GlassInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      className={`${glassClasses.input} ${className}`}
      {...props}
    />
  )
}
