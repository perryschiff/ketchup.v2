import * as React from 'react'
import { cn } from '@/lib/cn'

type SelectProps = {
  value?: string
  onValueChange?: (v: string)=>void
  children?: React.ReactNode
}
export function Select({ value, onValueChange, children }: SelectProps) {
  const [val, setVal] = React.useState(value || '')
  React.useEffect(()=>{ setVal(value || '') }, [value])
  return <div className='inline-block'>{children}</div>
}
export function SelectTrigger({ className, children }: React.HTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('border rounded-md px-3 py-2 w-full text-left', className)}>{children}</button>
}
export function SelectValue({ placeholder }: { placeholder?: string }) { return <span>{placeholder}</span> }
export function SelectContent({ children }: { children?: React.ReactNode }) { return <div className='hidden'>{children}</div> }
export function SelectItem({ value, children, onClick }: { value: string, children: React.ReactNode, onClick?: ()=>void }) {
  return <div data-value={value} onClick={onClick}>{children}</div>
}
