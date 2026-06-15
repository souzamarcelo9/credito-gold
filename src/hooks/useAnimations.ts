"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Detecta quando o elemento entra na viewport
 * e dispara a animação
 */
export function useInView(threshold = 0.15) {
  const ref  = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

/**
 * Anima um número de 0 até o valor final
 */
export function useCountUp(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // Easing out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])

  return value
}
