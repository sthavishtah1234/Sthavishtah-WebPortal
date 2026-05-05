"use client"

import { useEffect, useRef, useState } from "react"

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}

// Component wrapper for scroll animations
export function ScrollReveal({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
}: {
  children: React.ReactNode
  className?: string
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "flip" | "slide-up" | "bounce-in"
  delay?: number
  duration?: number
  threshold?: number
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold })

  const animations: Record<string, { hidden: string; visible: string }> = {
    "fade-up": {
      hidden: "opacity-0 translate-y-10",
      visible: "opacity-100 translate-y-0",
    },
    "fade-down": {
      hidden: "opacity-0 -translate-y-10",
      visible: "opacity-100 translate-y-0",
    },
    "fade-left": {
      hidden: "opacity-0 translate-x-10",
      visible: "opacity-100 translate-x-0",
    },
    "fade-right": {
      hidden: "opacity-0 -translate-x-10",
      visible: "opacity-100 translate-x-0",
    },
    "zoom-in": {
      hidden: "opacity-0 scale-90",
      visible: "opacity-100 scale-100",
    },
    "flip": {
      hidden: "opacity-0 rotateY-90",
      visible: "opacity-100 rotateY-0",
    },
    "slide-up": {
      hidden: "opacity-0 translate-y-20",
      visible: "opacity-100 translate-y-0",
    },
    "bounce-in": {
      hidden: "opacity-0 scale-50",
      visible: "opacity-100 scale-100",
    },
  }

  const anim = animations[animation] || animations["fade-up"]

  return (
    <div
      ref={ref}
      className={`transition-all ${className} ${isVisible ? anim.visible : anim.hidden}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  )
}
