import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm bg-white border border-border rounded-lg',
          'focus:outline-hidden focus:ring-2 focus:ring-ring/50 focus:border-ring',
          'transition-all placeholder:text-muted-foreground/60',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
