import { Link } from 'react-router'
import { MapPinOff } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PATHS } from '@/routes/paths'

// TODO(pantalla 4): ajustar al artboard 12e cuando se construya la navegación final.
export default function NotFoundPage() {
  usePageTitle('Página no encontrada')
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-verde-50 px-4 text-center">
      <span className="mb-2 grid size-14 place-items-center rounded-full bg-verde-100 text-verde-700">
        <MapPinOff size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h1 className="titulo-h1">Página no encontrada</h1>
      <p className="max-w-90 text-cuerpo-sm text-tinta-terciaria">
        La dirección no existe o cambió. Revisa el enlace o vuelve al inicio del panel.
      </p>
      <Link to={PATHS.inicio} className={buttonClass('primary', 'md', 'mt-2')}>
        Volver al inicio
      </Link>
    </main>
  )
}
