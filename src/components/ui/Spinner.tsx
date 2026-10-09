import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const px = { sm: 16, md: 24, lg: 36 }[size]
  return (
    <Loader2
      size={px}
      role="status"
      aria-label="Cargando"
      className={cn('animate-spin text-verde-700')}
    />
  )
}
