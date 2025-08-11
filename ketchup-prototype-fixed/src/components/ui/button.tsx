import * as React from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='default', size='md', ...props }, ref) => {
    const v = variant === 'secondary' ? 'bg-muted text-foreground hover:bg-muted/80' :
            variant === 'ghost' ? 'bg-transparent hover:bg-muted' : 'bg-black text-white hover:bg-black/90'
    const s = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
    return <button ref={ref} className={cn('rounded-md', v, s, className)} {...props} />
  }
)
Button.displayName = 'Button'
export default Button
