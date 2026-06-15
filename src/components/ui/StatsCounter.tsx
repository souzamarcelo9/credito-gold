"use client"

import { useInView, useCountUp } from "@/hooks/useAnimations"

interface StatItem {
  value:  number
  prefix?: string
  suffix?: string
  label:  string
  decimals?: number
}

interface StatsCounterProps {
  stats: StatItem[]
}

function StatCard({ stat }: { stat: StatItem; index: number }) {
  const { ref, inView } = useInView(0.3)
  const count = useCountUp(stat.value, 2000, inView)

  const display = stat.decimals
    ? (count / Math.pow(10, stat.decimals)).toFixed(1)
    : count.toLocaleString("pt-BR")

  return (
    <div ref={ref} className="text-center">
      <div className="font-['Sora'] text-3xl font-extrabold text-white">
        {stat.prefix}{display}{stat.suffix}
      </div>
      <div className="mt-1 text-sm font-medium text-white/80">{stat.label}</div>
    </div>
  )
}

export function StatsCounter({ stats }: StatsCounterProps) {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  )
}
