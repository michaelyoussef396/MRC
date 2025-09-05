import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-sm border border-mrc-light-gray bg-mrc-off-white px-3 py-2 text-sm text-mrc-charcoal placeholder:text-mrc-medium-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mrc-deep-navy focus-visible:border-mrc-deep-navy disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }