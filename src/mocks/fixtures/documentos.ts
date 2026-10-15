// Documentación fitosanitaria (artboard 07b · pantalla 20). Datos ficticios: solo mocks.
// Los PDF se generan al pedirlos (un PDF mínimo con el título), así se pueden abrir en
// desarrollo sin almacenamiento real (en producción vendrán de S3).
import type { Categoria } from '@/types/enums'

export type TipoDocumento = 'MANUAL' | 'FICHA_TECNICA' | 'GUIA_MANEJO' | 'LIBRO_REFERENCIA'

export interface DocumentoFixture {
  id: string
  titulo: string
  tipo: TipoDocumento
  /** null: documento general (no es de una categoría). */
  categoria: Categoria | null
  subido_por: string
  subido_en: string
  /** Archivo subido desde el panel (en memoria). Sin él, se genera un PDF de ejemplo. */
  archivo?: Blob
}

/** Propagación de cada categoría (texto de las tarjetas). */
export const PROPAGACION: Record<Categoria, string> = {
  TRIPS:
    'insecto que pasa de planta en planta y entre fincas vecinas con el viento, el material vegetal y la ropa.',
  BOTRYTIS:
    'hongo; sus esporas se mueven con el aire y el salpique. Avanza con humedad alta y poca ventilación.',
  RONA: 'hongo que se dispersa con la lluvia, el salpique y las herramientas; afecta tejidos jóvenes y frutos.',
  FUSARIUM:
    'hongo del suelo; se mueve con el agua de riego, el suelo pegado a herramientas y plántulas infectadas.',
  DEFICIENCIA_MAGNESIO:
    'no se transmite entre plantas ni fincas. Es un problema nutricional ligado al suelo y al plan de fertilización.',
}

const bogota = (f: string) => new Date(`${f}T10:00:00-05:00`).toISOString()
const WILMAR = 'Wilmar Torres'

function crear(): DocumentoFixture[] {
  const d = (
    id: string,
    titulo: string,
    tipo: TipoDocumento,
    categoria: Categoria | null,
    fecha: string,
  ): DocumentoFixture => ({
    id,
    titulo,
    tipo,
    categoria,
    subido_por: WILMAR,
    subido_en: bogota(fecha),
  })
  return [
    d('doc-manual', 'Manual fitosanitario de pasifloras', 'LIBRO_REFERENCIA', null, '2026-09-02'),
    d(
      'doc-trips-1',
      'Ficha de Trips: síntomas y propagación',
      'FICHA_TECNICA',
      'TRIPS',
      '2026-08-12',
    ),
    d('doc-trips-2', 'Guía de monitoreo con trampas', 'GUIA_MANEJO', 'TRIPS', '2026-08-20'),
    d('doc-bot-1', 'Ficha de Botrytis', 'FICHA_TECNICA', 'BOTRYTIS', '2026-07-30'),
    d('doc-bot-2', 'Manejo de humedad en invernadero', 'GUIA_MANEJO', 'BOTRYTIS', '2026-07-30'),
    d('doc-rona-1', 'Ficha de Roña', 'FICHA_TECNICA', 'RONA', '2026-07-30'),
    d('doc-rona-2', 'Poda y desinfección de herramientas', 'GUIA_MANEJO', 'RONA', '2026-08-05'),
    d('doc-fus-1', 'Ficha de Fusarium', 'FICHA_TECNICA', 'FUSARIUM', '2026-07-30'),
    d('doc-fus-2', 'Manejo de suelo y drenaje', 'GUIA_MANEJO', 'FUSARIUM', '2026-08-05'),
    d(
      'doc-mg-1',
      'Ficha de deficiencia de magnesio',
      'FICHA_TECNICA',
      'DEFICIENCIA_MAGNESIO',
      '2026-07-30',
    ),
    d('doc-mg-2', 'Guía de análisis de suelo', 'MANUAL', 'DEFICIENCIA_MAGNESIO', '2026-08-05'),
  ]
}

export const documentos: DocumentoFixture[] = crear()

/** Restaura los documentos del diseño (pruebas). */
export function reiniciarDocumentos() {
  documentos.splice(0, documentos.length, ...crear())
}

/** Texto apto para un PDF básico: sin tildes, paréntesis ni caracteres fuera de ASCII. */
const limpiar = (t: string) =>
  t
    .replace(/[()\\]/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '-')

/** PDF mínimo válido (una página con el título y unas líneas) para abrir en desarrollo. */
export function pdfDeEjemplo(
  titulo: string,
  lineas: string[] = ['Documento de ejemplo del panel ANUC Zetaquira'],
): Blob {
  const cuerpo = lineas
    .slice(0, 42)
    .map((l) => `0 -16 Td (${limpiar(l)}) Tj`)
    .join(' ')
  const contenido = `BT /F1 18 Tf 72 740 Td (${limpiar(titulo)}) Tj /F1 10 Tf 0 -10 Td ${cuerpo} ET`
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const posiciones: number[] = []
  objetos.forEach((o, i) => {
    posiciones.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  pdf += posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}
