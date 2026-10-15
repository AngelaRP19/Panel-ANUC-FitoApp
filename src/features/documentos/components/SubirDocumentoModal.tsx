import { useState, type FormEvent } from 'react'
import { Upload } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import type { Categoria } from '@/types/enums'
import type { TipoDocumento } from '../api'
import { useSubirDocumento } from '../hooks'
import { MAX_MB, TIPO_DOCUMENTO_LABEL } from '../utils'

type Errores = Partial<Record<'titulo' | 'tipo' | 'archivo', string>>

/** «Subir documento» (solo líder): título, tipo, categoría opcional y archivo PDF. */
export function SubirDocumentoModal({ onClose }: { onClose: () => void }) {
  const subir = useSubirDocumento()
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errores, setErrores] = useState<Errores>({})

  const validar = (): Errores => {
    const e: Errores = {}
    if (!titulo.trim()) e.titulo = 'Escribe el título del documento.'
    if (!tipo) e.tipo = 'Elige el tipo de documento.'
    if (!archivo) e.archivo = 'Elige el archivo PDF.'
    else if (archivo.type !== 'application/pdf' && !/\.pdf$/i.test(archivo.name)) {
      e.archivo = 'El archivo debe ser un PDF.'
    } else if (archivo.size > MAX_MB * 1024 * 1024) {
      e.archivo = `El archivo supera los ${MAX_MB} MB.`
    }
    return e
  }

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length) return
    subir.mutate(
      {
        titulo: titulo.trim(),
        tipo: tipo as TipoDocumento,
        categoria: categoria as Categoria | '',
        archivo: archivo!,
      },
      {
        onSuccess: (d) => {
          toast.exito('Documento subido', `«${d.titulo}» ya está en la documentación.`)
          onClose()
        },
        onError: (err) => {
          if (esErrorApi(err) && Object.keys(err.campos).length) setErrores(err.campos as Errores)
        },
      },
    )
  }
  const errorGeneral =
    subir.isError && !(esErrorApi(subir.error) && Object.keys(subir.error.campos).length)

  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      size="sm"
      icon={Upload}
      iconTone="ok"
      title="Subir documento"
      description="Los documentos se abren en una pestaña nueva. Solo el líder técnico puede subirlos."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={subir.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-doc" loading={subir.isPending}>
            Subir documento
          </Button>
        </>
      }
    >
      <form id="form-doc" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <RequiredLegend />
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se subió el documento.">
            {esErrorApi(subir.error) ? subir.error.message : MENSAJES.errorConexionTexto}
          </Aviso>
        )}
        <FormField label="Título" htmlFor="doc-t" required error={errores.titulo}>
          <Input
            id="doc-t"
            value={titulo}
            invalid={!!errores.titulo}
            aria-describedby={fieldDescriptionId('doc-t')}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej.: Ficha de Trips: síntomas y propagación"
          />
        </FormField>
        <FormField label="Tipo de documento" htmlFor="doc-tipo" required error={errores.tipo}>
          <Select
            id="doc-tipo"
            value={tipo}
            invalid={!!errores.tipo}
            aria-describedby={fieldDescriptionId('doc-tipo')}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="Elige el tipo"
            options={Object.entries(TIPO_DOCUMENTO_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </FormField>
        <FormField
          label="Categoría fitosanitaria"
          htmlFor="doc-cat"
          hint="Opcional · sin categoría queda en «Documentos generales»."
        >
          <Select
            id="doc-cat"
            value={categoria}
            aria-describedby={fieldDescriptionId('doc-cat')}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Sin categoría"
            options={Object.entries(CATEGORIA_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </FormField>
        <FormField
          label="Archivo"
          htmlFor="doc-f"
          required
          error={errores.archivo}
          hint={`PDF de máximo ${MAX_MB} MB.`}
        >
          <input
            id="doc-f"
            type="file"
            accept="application/pdf,.pdf"
            aria-invalid={!!errores.archivo || undefined}
            aria-describedby={fieldDescriptionId('doc-f')}
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="text-cuerpo-sm file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-borde-control file:bg-blanco file:px-3 file:font-semibold file:text-verde-700 hover:file:bg-verde-50"
          />
        </FormField>
      </form>
    </Modal>
  )
}
