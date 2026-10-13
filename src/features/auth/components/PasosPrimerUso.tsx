import { cn } from '@/utils/cn'

const PASOS = [
  'Crea la cuenta del líder técnico.',
  'Registra a los técnicos de la asociación.',
  'Registra productores, fincas y cultivos para que el chatbot los reconozca.',
]

/** Panel lateral «Primer uso · 3 pasos» (artboard 01b). El paso 1 es el actual. */
export function PasosPrimerUso() {
  return (
    <div className="mt-12 flex flex-col gap-5">
      <p
        id="pasos-primer-uso"
        className="text-xs leading-4 font-semibold tracking-[0.06em] text-verde-300 uppercase"
      >
        Primer uso · 3 pasos
      </p>
      <ol
        aria-labelledby="pasos-primer-uso"
        className="flex flex-col gap-4 text-[15px] leading-[22px]"
      >
        {PASOS.map((texto, i) => {
          const actual = i === 0
          return (
            <li
              key={texto}
              className="flex items-start gap-3"
              aria-current={actual ? 'step' : undefined}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-7 flex-none rounded-full text-center font-titulos text-sm font-bold',
                  actual
                    ? 'bg-verde-100 leading-7 text-verde-950'
                    : 'border border-verde-300 leading-[26px] text-verde-100',
                )}
              >
                {i + 1}
              </span>
              <span>
                <span className="sr-only">Paso {i + 1}: </span>
                {actual ? (
                  <>
                    <b className="font-semibold text-blanco">{texto}</b>
                    <br />
                    Estás aquí.
                  </>
                ) : (
                  texto
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
