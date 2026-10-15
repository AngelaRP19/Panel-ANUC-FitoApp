// Llamadas HTTP del feature "documentos" (pantalla 20 · Documentación fitosanitaria).
// Endpoints: GET /documentos?q&tipo · GET /documentos/{id}/archivo (PDF)
//            POST /documentos (multipart: titulo, tipo, categoria, archivo · solo líder)
// En producción los archivos vienen de S3; el panel los pide por la API.
import { api } from '@/services/apiClient'
import type { Categoria } from '@/types/enums'

export type TipoDocumento = 'MANUAL' | 'FICHA_TECNICA' | 'GUIA_MANEJO' | 'LIBRO_REFERENCIA'

export interface Documento {
  id: string
  titulo: string
  tipo: TipoDocumento
  categoria: Categoria | null
  subido_por: string
  subido_en: string
}

export interface Documentacion {
  manual: Documento | null
  generales: Documento[]
  categorias: {
    categoria: Categoria
    participa: boolean
    propagacion: string
    documentos: Documento[]
  }[]
}

export type FiltrosDocumentos = { q: string; tipo: string }

export async function listarDocumentos(f: FiltrosDocumentos): Promise<Documentacion> {
  const params: Record<string, string> = {}
  if (f.q) params.q = f.q
  if (f.tipo) params.tipo = f.tipo
  const { data } = await api.get<Documentacion>('/documentos', { params })
  return data
}

export async function obtenerArchivo(id: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/documentos/${encodeURIComponent(id)}/archivo`, {
    responseType: 'blob',
  })
  return data
}

export interface DatosDocumento {
  titulo: string
  tipo: TipoDocumento
  categoria: Categoria | ''
  archivo: File
}

export async function subirDocumento(d: DatosDocumento): Promise<Documento> {
  const form = new FormData()
  form.append('titulo', d.titulo)
  form.append('tipo', d.tipo)
  form.append('categoria', d.categoria)
  form.append('archivo', d.archivo)
  const { data } = await api.post<Documento>('/documentos', form)
  return data
}
