"use client"

import { useEffect, useRef } from "react"

interface MiniChartProps {
  data:    number[]
  color?:  string
  height?: number
  fill?:   boolean
}

export function MiniChart({ data, color = "#1DB954", height = 52, fill = true }: MiniChartProps) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ref.current || data.length < 2) return
    const w     = ref.current.clientWidth || 280
    const h     = height
    const min   = Math.min(...data)
    const max   = Math.max(...data)
    const range = max - min || 1
    const pad   = 4
    const pts   = data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * (w - pad * 2),
      y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }))
    const line  = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const area  = `${line} L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`
    const gid   = `g${color.replace(/[^a-z0-9]/gi,"")}`
    ref.current.innerHTML = `
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${fill ? `<path d="${area}" fill="url(#${gid})" stroke="none"/>` : ""}
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${pts[pts.length-1].x}" cy="${pts[pts.length-1].y}" r="3" fill="${color}"/>
    `
  }, [data, color, height, fill])

  return <svg ref={ref} width="100%" height={height} />
}
