import * as React from 'react'
import { cn } from '@/lib/cn'
export function Select({ children, value, onValueChange }: any){ return <div data-value={value} className='inline-block'>{children}</div> }
export function SelectTrigger({ className, children }: any){ return <button className={cn('border rounded-xl px-3 py-2 w-full text-left', className)}>{children}</button> }
export function SelectValue({ placeholder }: any){ return <span>{placeholder}</span> }
export function SelectContent({ children }: any){ return <div className='hidden'>{children}</div> }
export function SelectItem({ value, children }: any){ return <div data-value={value}>{children}</div> }
