import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-target",
  {
    variants: {
      variant: {
        default: "bg-mrc-deep-navy text-mrc-pure-white hover:bg-mrc-professional-blue",
        destructive: "bg-mrc-error-red text-mrc-pure-white hover:bg-red-600",
        outline: "border border-mrc-deep-navy bg-transparent text-mrc-deep-navy hover:bg-mrc-deep-navy hover:text-mrc-pure-white",
        secondary: "bg-mrc-professional-blue text-mrc-pure-white hover:bg-mrc-deep-navy",
        ghost: "text-mrc-deep-navy hover:bg-mrc-off-white hover:text-mrc-deep-navy",
        link: "text-mrc-deep-navy underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4",
        icon: "h-12 w-12",
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }