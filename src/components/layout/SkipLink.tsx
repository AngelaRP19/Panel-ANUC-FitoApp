/** Enlace «Saltar al contenido»: visible solo al recibir el foco con el teclado. */
export function SkipLink({ targetId = 'contenido' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-md bg-verde-700 px-4 py-2 font-semibold text-blanco focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
    >
      Saltar al contenido
    </a>
  )
}
