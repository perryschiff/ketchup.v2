import * as React from 'react'
import { cn } from '@/lib/cn'
export function Badge({ className, variant='default', ...props }: React.HTMLAttributes<HTMLSpanElement> & {variant?: 'default'|'secondary'|'destructive'}) {
  const styles = variant==='secondary' ? 'bg-gray-100 text-gray-800' : variant==='destructive' ? 'bg-red-100 text-red-800' : 'bg-gray-800 text-white'
  return <span className={cn('inline-flex items-center px-2.5 py-1 rounded-md text-xs', styles, className)} {...props} />
}
