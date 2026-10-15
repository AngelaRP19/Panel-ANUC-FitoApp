import { http, HttpResponse } from 'msw'
import type { Categoria } from '@/types/enums'
import { parametros } from '../fixtures/alertas'
import {
  documentos,
  pdfDeEjemplo,
  PROPAGACION,
  type DocumentoFixture,
  type TipoDocumento,
} from '../fixtures/documentos'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const CATEGORIAS: Categoria[] = ['TRIPS', 'BOTRYTIS', 'RONA', 'FUSARIUM', 'DEFICIENCIA_MAGNESIO']
const TIPOS: TipoDocumento[] = ['MANUAL', 'FICHA_TECNICA', 'GUIA_MANEJO', 'LIBRO_REFERENCIA']
const NOMBRE: Record<Categoria, string> = {
  TRIPS: 'Trips',
  BOTRYTIS: 'Botrytis',
  RONA: 'Roña',
  FUSARIUM: 'Fusarium',
  DEFICIENCIA_MAGNESIO: 'Deficiencia de magnesio',
}
const MAX_BYTES = 20 * 1024 * 1024

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Documento como lo devuelve la API (sin el archivo). */
const aDocumento = (d: DocumentoFixture) => ({
  id: d.id,
  titulo: d.titulo,
  tipo: d.tipo,
  categoria: d.categoria,
  subido_por: d.subido_por,
  subido_en: d.subido_en,
})

export const documentosHandlers = [
  // Documentación agrupada: el manual principal y una tarjeta por categoría. `q` busca en
  // títulos, categorías y propagación; `tipo` filtra los documentos.
  http.get(`${API}/documentos`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const p = new URL(request.url).searchParams
    const q = normalizar(p.get('q') ?? '').trim()
    const tipo = p.get('tipo')
    const pasa = (d: DocumentoFixture) =>
      (!tipo || d.tipo === tipo) &&
      (!q ||
        normalizar(d.titulo).includes(q) ||
        (d.categoria !== null &&
          normalizar(`${NOMBRE[d.categoria]} ${PROPAGACION[d.categoria]}`).includes(q)))

    const manual = documentos.find((d) => d.id === 'doc-manual')
    const generales = documentos.filter((d) => d.categoria === null && d.id !== 'doc-manual')
    const categorias = CATEGORIAS.map((c) => ({
      categoria: c,
      participa: parametros.find((x) => x.categoria === c)?.habilitada ?? false,
      propagacion: PROPAGACION[c],
      documentos: documentos.filter((d) => d.categoria === c && pasa(d)).map(aDocumento),
    })).filter(
      (c) =>
        !q ||
        c.documentos.length > 0 ||
        normalizar(`${NOMBRE[c.categoria]} ${c.propagacion}`).includes(q),
    )
    return HttpResponse.json({
      manual: manual && (!tipo || manual.tipo === tipo) ? aDocumento(manual) : null,
      generales: generales.filter(pasa).map(aDocumento),
      categorias: tipo ? categorias.filter((c) => c.documentos.length > 0) : categorias,
    })
  }),

  // El PDF del documento (se abre en una pestaña nueva).
  http.get(`${API}/documentos/:id/archivo`, ({ request, params }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const d = documentos.find((x) => x.id === params.id)
    if (!d) return errorApi(404, 'NO_ENCONTRADO', 'El documento no existe.')
    return new HttpResponse(d.archivo ?? pdfDeEjemplo(d.titulo), {
      headers: { 'Content-Type': 'application/pdf' },
    })
  }),

  // Subir documento (solo líder): PDF de hasta 20 MB con título, tipo y categoría opcional.
  http.post(`${API}/documentos`, async ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    if (u.rol !== 'LIDER_TECNICO') {
      return errorApi(403, 'SOLO_LIDER', 'Solo el líder técnico puede subir documentos.')
    }
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return errorApi(400, 'ARCHIVO_ILEGIBLE', 'No se pudo leer el archivo. Intenta de nuevo.')
    }
    const titulo = String(form.get('titulo') ?? '').trim()
    const tipo = String(form.get('tipo') ?? '') as TipoDocumento
    const categoria = String(form.get('categoria') ?? '') as Categoria | ''
    const archivo = form.get('archivo')
    const campos: Record<string, string> = {}
    if (!titulo) campos.titulo = 'Escribe el título del documento.'
    if (!TIPOS.includes(tipo)) campos.tipo = 'Elige el tipo de documento.'
    if (categoria && !CATEGORIAS.includes(categoria)) campos.categoria = 'Categoría no válida.'
    if (!(archivo instanceof Blob)) campos.archivo = 'Elige el archivo PDF.'
    else if (archivo.type !== 'application/pdf') campos.archivo = 'El archivo debe ser un PDF.'
    else if (archivo.size > MAX_BYTES) campos.archivo = 'El archivo supera los 20 MB.'
    if (Object.keys(campos).length) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const nuevo: DocumentoFixture = {
      id: `doc-${Date.now()}`,
      titulo,
      tipo,
      categoria: categoria || null,
      subido_por: u.nombre,
      subido_en: new Date().toISOString(),
      archivo: archivo as Blob,
    }
    documentos.push(nuevo)
    return HttpResponse.json(aDocumento(nuevo), { status: 201 })
  }),
]
