import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'

interface AccesoRestringidoProps {
  titulo: string
  texto: ReactNode
  /** Botón o enlace para salir («Ir a mis casos», «Volver al inicio»). */
  accion: ReactNode
  /** Pista bajo la acción («¿Crees que deberías atenderlo? …»). */
  pista?: ReactNode
}

/** Tarjeta de acceso restringido (artboard 12e): candado, título (h1), explicación y salida. */
export function AccesoRestringido({ titulo, texto, accion, pista }: AccesoRestringidoProps) {
  return (
    <section
      aria-labelledby="t-acceso"
      className="flex flex-col items-center gap-3 rounded-lg border border-borde bg-blanco px-6 py-14 text-center shadow-1 sm:px-12"
    >
      <span className="mb-2 grid size-14 place-items-center rounded-full bg-neutro-suave text-neutro">
        <Lock size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h1 id="t-acceso" className="titulo-h1">
        {titulo}
      </h1>
      <p className="max-w-130 text-tinta-secundaria">{texto}</p>
      <div className="mt-2 flex gap-2">{accion}</div>
      {pista && <p className="mt-1 text-cuerpo-sm text-tinta-terciaria">{pista}</p>}
    </section>
  )
}
