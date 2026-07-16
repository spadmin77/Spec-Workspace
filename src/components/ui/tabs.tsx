import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

function Tabs({ className, children }: TabsProps) {
  return (
    <div className={cn('flex bg-muted p-1 rounded-xl border gap-1', className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  activeValue: string
  onClick: (value: string) => void
  children: ReactNode
  className?: string
}

function TabsTrigger({ value, activeValue, onClick, className, children }: TabsTriggerProps) {
  const isActive = value === activeValue
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        'px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wide cursor-pointer',
        isActive
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        className
      )}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  )
}

export { Tabs, TabsTrigger }
