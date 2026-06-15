import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:  "bg-[#1DB954] text-white hover:bg-[#0f9c40] shadow-[0_4px_16px_rgba(29,185,84,0.35)] hover:-translate-y-0.5",
        orange:   "bg-[#FF6B00] text-white hover:bg-[#e06000] shadow-[0_4px_16px_rgba(255,107,0,0.35)] hover:-translate-y-0.5",
        outline:  "border-2 border-[#e5e7eb] bg-transparent text-[#0D1B2A] hover:border-[#1DB954] hover:text-[#1DB954]",
        ghost:    "bg-transparent text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#0D1B2A]",
        navy:     "bg-[#0D1B2A] text-white hover:bg-[#1a2d42]",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm:   "h-9 px-4 text-xs",
        default: "h-11 px-6",
        lg:   "h-13 px-8 text-base py-3",
        full: "h-13 w-full px-8 text-base py-3",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
