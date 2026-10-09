import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-borde bg-blanco p-10 text-center text-tinta-secundaria">
      <Inbox size={32} />
      <p className="text-sm">{message}</p>
      {action}
    </div>
  )
}
