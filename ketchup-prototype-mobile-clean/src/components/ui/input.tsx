import * as React from 'react'
import { cn } from '@/lib/cn'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('border rounded-xl px-4 py-3 w-full text-base', className)} {...props} />
  )
)
Input.displayName = 'Input'
