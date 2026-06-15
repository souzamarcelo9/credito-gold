import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          className={cn(
            "w-full rounded-[14px] border-2 border-[#e5e7eb] bg-[#f4f6f8] px-4 py-3 font-sans text-sm text-[#0D1B2A] outline-none transition-all",
            "placeholder:text-[#9ca3af]",
            "focus:border-[#1DB954] focus:bg-white",
            icon && "pr-11",
            error && "border-red-400 focus:border-red-500",
            className
          )}
          {...props}
        />
        {icon && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d1d5db]">
            {icon}
          </span>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
