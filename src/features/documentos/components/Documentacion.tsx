import { BookOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { formatearFecha } from '@/utils/fechas'
import type { Documentacion, Documento } from '../api'
import { useAbrirDocumento } from '../hooks'
import { TIPO_DOCUMENTO_LABEL } from '../utils'

/** Capítulos de categoría del manual, en su orden. */
const CAPITULOS: Categoria[] = ['BOTRYTIS', 'RONA', 'DEFICIENCIA_MAGNESIO', 'TRIPS', 'FUSARIUM']

/** Enlace que abre el PDF en una pestaña nueva. */
function EnlacePdf({ documento }: { documento: Documento }) {
  const abrir = useAbrirDocumento()
  return (
    <button
      type="button"
      onClick={() =>
        abrir.mutate(documento.id, {
          onError: () => toast.error('No se pudo abrir el documento', MENSAJES.errorConexionTexto),
        })
      }
      className="inline-flex cursor-pointer items-center gap-1 self-start border-0 bg-transparent p-0 text-left text-cuerpo-sm enlace"
    >
      <FileText size={15} aria-hidden="true" className="flex-none" />
      {documento.titulo} · PDF
      <span className="sr-only">
        {' '}
        ({TIPO_DOCUMENTO_LABEL[documento.tipo]}, se abre en una pestaña nueva)
      </span>
    </button>
  )
}

/** Manual principal: tabla de contenido con enlaces a las tarjetas y «Abrir manual completo». */
function Manual({ manual }: { manual: Documento }) {
  const abrir = useAbrirDocumento()
  return (
    <section
      aria-labelledby="t-man"
      className="flex flex-col gap-3 rounded-lg border border-borde bg-blanco px-5.5 py-5 shadow-1 lg:col-span-4"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-md bg-verde-100 text-verde-700">
          <BookOpen size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <div className="sobretitulo">{TIPO_DOCUMENTO_LABEL[manual.tipo]}</div>
          <h2 id="t-man" className="titulo-h3">
            {manual.titulo}
          </h2>
        </div>
      </div>
      <p className="text-cuerpo-sm text-tinta-terciaria">
        Documento interno de la asociación · gulupa, granadilla y maracuyá · actualizado el{' '}
        {formatearFecha(manual.subido_en)}
      </p>
      <ol className="m-0 flex flex-col gap-1.5 pl-5 text-cuerpo-sm">
        <li>Cómo leer la identificación preliminar</li>
        {CAPITULOS.map((c) => (
          <li key={c}>
            <a href={`#doc-${c}`} className="enlace">
              {CATEGORIA_LABEL[c]}
            </a>
          </li>
        ))}
        <li>Propagación y vigilancia de concentraciones</li>
      </ol>
      <Button
        variant="secondary"
        className="justify-center"
        loading={abrir.isPending}
        onClick={() =>
          abrir.mutate(manual.id, {
            onError: () => toast.error('No se pudo abrir el manual', MENSAJES.errorConexionTexto),
          })
        }
      >
        Abrir manual completo (PDF)
      </Button>
    </section>
  )
}

/** Una tarjeta por categoría: si participa en alertas, su propagación y sus PDF. */
function TarjetaCategoria({ c }: { c: Documentacion['categorias'][number] }) {
  const nombre = CATEGORIA_LABEL[c.categoria]
  const noSePropaga = c.categoria === 'DEFICIENCIA_MAGNESIO'
  return (
    <article
      id={`doc-${c.categoria}`}
      aria-labelledby={`t-doc-${c.categoria}`}
      className="flex scroll-mt-24 flex-col gap-2 rounded-lg border border-borde bg-blanco px-4.5 py-4 shadow-1"
    >
      <div className="flex items-center gap-2.5">
        <FormaCategoria categoria={c.categoria} tamano={16} />
        <h2 id={`t-doc-${c.categoria}`} className="flex-1 titulo-h3">
          {nombre}
        </h2>
        <span
          className={
            c.participa
              ? 'inline-flex h-6 items-center rounded-sm border border-verde-300 bg-verde-100 px-2 text-xs font-semibold text-verde-800'
              : 'inline-flex h-6 items-center rounded-sm border border-borde bg-neutro-suave px-2 text-xs font-semibold text-neutro'
          }
        >
          {c.participa
            ? 'Participa en alertas'
            : noSePropaga
              ? 'No participa · no se propaga'
              : 'No participa'}
        </span>
      </div>
      <p className="text-cuerpo-sm">
        <b className="font-semibold">Propagación:</b> {c.propagacion}
      </p>
      {c.documentos.length > 0 ? (
        <div className="flex flex-col gap-1">
          {c.documentos.map((d) => (
            <EnlacePdf key={d.id} documento={d} />
          ))}
        </div>
      ) : (
        <p className="text-cuerpo-sm text-tinta-terciaria">Sin documentos de este tipo.</p>
      )}
    </article>
  )
}

/** Contenido de la documentación (artboard 07b): manual principal y tarjetas por categoría. */
export function DocumentacionContenido({ datos }: { datos: Documentacion }) {
  const ultima = datos.categorias.length % 2 === 1
  return (
    <div className="grid items-start gap-5 lg:grid-cols-12">
      {datos.manual && <Manual manual={datos.manual} />}
      <div
        className={
          datos.manual
            ? 'grid gap-4 sm:grid-cols-2 lg:col-span-8'
            : 'grid gap-4 sm:grid-cols-2 lg:col-span-12'
        }
      >
        {datos.categorias.map((c, i) => (
          <div
            key={c.categoria}
            className={ultima && i === datos.categorias.length - 1 ? 'sm:col-span-2' : undefined}
          >
            <TarjetaCategoria c={c} />
          </div>
        ))}
        {datos.generales.length > 0 && (
          <article className="flex flex-col gap-2 rounded-lg border border-borde bg-blanco px-4.5 py-4 shadow-1 sm:col-span-2">
            <h2 className="titulo-h3">Documentos generales</h2>
            {datos.generales.map((d) => (
              <EnlacePdf key={d.id} documento={d} />
            ))}
          </article>
        )}
      </div>
    </div>
  )
}
