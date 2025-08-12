import * as React from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='default', size='md', ...props }, ref) => {
    const v = variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' :
            variant === 'ghost' ? 'bg-transparent hover:bg-gray-100' : 'bg-black text-white hover:bg-black/90'
    const s = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-3'
    return <button ref={ref} className={cn('rounded-xl active:scale-[0.99] transition-transform', v, s, className)} {...props} />
  }
)
Button.displayName = 'Button'
export default Button
