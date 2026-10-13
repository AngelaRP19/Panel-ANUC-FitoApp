import type { FormEventHandler, ReactNode } from 'react'
import { ClipboardCheck, Leaf, Map } from 'lucide-react'
import { cn } from '@/utils/cn'

const PUNTOS = [
  { icon: Leaf, texto: 'Gulupa, granadilla y maracuyá de Zetaquirá, Boyacá' },
  {
    icon: ClipboardCheck,
    texto: 'El sistema orienta con una identificación preliminar; el técnico decide',
  },
  { icon: Map, texto: 'Mapa de vigilancia y alertas de posible concentración' },
]

/** Contenido por defecto del panel de marca (login y recuperar cuenta). */
function PresentacionPanel() {
  return (
    <>
      <p className="mt-12 max-w-105 text-lg leading-7">
        Revisa los casos que los productores envían por WhatsApp, registra el diagnóstico técnico y
        vigila posibles concentraciones de casos.
      </p>
      <ul className="flex flex-col gap-4 text-[15px] leading-[22px]">
        {PUNTOS.map(({ icon: Icon, texto }) => (
          <li key={texto} className="flex gap-3">
            <Icon
              size={20}
              strokeWidth={1.75}
              className="flex-none text-verde-300"
              aria-hidden="true"
            />
            {texto}
          </li>
        ))}
      </ul>
      <p className="mt-auto text-nota text-verde-300">
        Uso exclusivo de los técnicos de la asociación.
      </p>
    </>
  )
}

/**
 * Pantalla dividida de las rutas públicas (artboards 01, 01b, 01c, 01d, 01e): panel de marca
 * de 560 px sobre verde-950 a la izquierda y la tarjeta del formulario centrada a la derecha.
 * En pantallas pequeñas el panel se reduce a la marca sobre la tarjeta.
 */
export function PantallaMarca({
  children,
  lateral = <PresentacionPanel />,
}: {
  children: ReactNode
  /** Contenido del panel bajo la marca (primer uso muestra sus 3 pasos). */
  lateral?: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-verde-50">
      <aside
        aria-label="ANUC Zetaquirá"
        className="hidden w-140 flex-none flex-col gap-8 bg-verde-950 p-14 text-verde-100 lg:flex"
      >
        <div>
          <p className="font-titulos text-display font-bold text-blanco">ANUC Zetaquirá</p>
          <p className="font-medium text-verde-300">Panel fitosanitario</p>
        </div>
        {lateral}
      </aside>

      <main
        id="contenido"
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10"
      >
        {/* Marca compacta para pantallas pequeñas */}
        <div className="text-center lg:hidden">
          <p className="font-titulos text-h1 font-bold text-verde-950">ANUC Zetaquirá</p>
          <p className="text-cuerpo-sm font-medium text-tinta-secundaria">Panel fitosanitario</p>
        </div>
        {children}
      </main>
    </div>
  )
}

/** Tarjeta de los formularios de acceso (pf-card): 440 px, o 520 px en primer uso. */
export function TarjetaAcceso({
  children,
  labelledBy,
  onSubmit,
  ancha = false,
}: {
  children: ReactNode
  labelledBy: string
  onSubmit: FormEventHandler<HTMLFormElement>
  ancha?: boolean
}) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={labelledBy}
      className={cn(
        'flex w-full flex-col rounded-lg border border-borde bg-blanco p-6 shadow-1',
        ancha ? 'max-w-130 gap-4.5 sm:px-10 sm:py-9' : 'max-w-110 gap-5 sm:p-10',
      )}
    >
      {children}
    </form>
  )
}
