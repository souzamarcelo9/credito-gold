"use client"

import { useInView } from "@/hooks/useAnimations"
import { cn } from "@/lib/utils"

type Animation = "fade-up" | "fade-left" | "fade-right" | "fade-in" | "zoom-in"

interface AnimatedSectionProps {
  children: React.ReactNode
  animation?: Animation
  delay?: number
  className?: string
  threshold?: number
}

const ANIMATIONS: Record<Animation, { from: string; to: string }> = {
  "fade-up":    { from: "opacity-0 translate-y-12", to: "opacity-100 translate-y-0" },
  "fade-left":  { from: "opacity-0 -translate-x-12", to: "opacity-100 translate-x-0" },
  "fade-right": { from: "opacity-0 translate-x-12",  to: "opacity-100 translate-x-0" },
  "fade-in":    { from: "opacity-0",                  to: "opacity-100" },
  "zoom-in":    { from: "opacity-0 scale-90",         to: "opacity-100 scale-100" },
}

export function AnimatedSection({
  children, animation = "fade-up", delay = 0,
  className, threshold = 0.15,
}: AnimatedSectionProps) {
  const { ref, inView } = useInView(threshold)
  const { from, to }    = ANIMATIONS[animation]

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        inView ? to : from,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
