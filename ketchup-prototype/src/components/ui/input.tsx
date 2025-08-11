import * as React from 'react'
import { cn } from '@/lib/cn'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('border rounded-md px-3 py-2 w-full', className)} {...props} />
  )
)
Input.displayName = 'Input'
