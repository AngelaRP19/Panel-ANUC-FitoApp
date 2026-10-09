// Etiquetas y mensajes reutilizables. NO es i18n: el sistema es solo en español.
import type {
  Afectacion,
  Categoria,
  EstadoAlerta,
  EstadoCaso,
  Especie,
  ResultadoAnalisis,
  ResultadoTecnico,
  Rol,
  TipoEvidencia,
} from '@/types/enums'

export const ROL_LABEL: Record<Rol, string> = {
  LIDER_TECNICO: 'Líder técnico',
  TECNICO: 'Técnico',
}

export const ESTADO_CASO_LABEL: Record<EstadoCaso, string> = {
  CREADO: 'Creado',
  EN_ANALISIS: 'En análisis',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  ANALISIS_TECNICO: 'En análisis técnico',
  CERRADO: 'Cerrado',
  DESCARTADO: 'Descartado',
}

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  BOTRYTIS: 'Botrytis',
  RONA: 'Roña',
  DEFICIENCIA_MAGNESIO: 'Deficiencia de magnesio',
  TRIPS: 'Trips',
  FUSARIUM: 'Fusarium',
}

export const RESULTADO_ANALISIS_LABEL: Record<ResultadoAnalisis, string> = {
  PRELIMINAR: 'Identificación preliminar',
  AMBIGUO: 'Ambiguo',
  NO_IDENTIFICADO: 'No identificado',
}

export const RESULTADO_TECNICO_LABEL: Record<ResultadoTecnico, string> = {
  CONFIRMADO: 'Confirmado',
  OTRA_PATOLOGIA: 'Otra patología',
  NO_IDENTIFICADO: 'No identificado',
  REQUIERE_VISITA: 'Requiere visita',
}

export const ESTADO_ALERTA_LABEL: Record<EstadoAlerta, string> = {
  GENERADA: 'Generada',
  EN_REVISION: 'En revisión',
  DESCARTADA: 'Descartada',
  CONFIRMADA: 'Confirmada',
  COMUNICADA: 'Comunicada',
}

export const ESPECIE_LABEL: Record<Especie, string> = {
  GULUPA: 'Gulupa',
  GRANADILLA: 'Granadilla',
  MARACUYA: 'Maracuyá',
}

export const TIPO_EVIDENCIA_LABEL: Record<TipoEvidencia, string> = {
  HOJA: 'Hoja',
  FRUTO: 'Fruto',
  TALLO: 'Tallo',
  PLANTA_COMPLETA: 'Planta completa',
}

export const AFECTACION_LABEL: Record<Afectacion, string> = {
  TOTAL: 'Total',
  PARCIAL: 'Parcial',
}

export const MENSAJES = {
  sinResultados: 'No hay resultados para esta búsqueda',
  errorCarga: 'No se pudo cargar la información. Intenta de nuevo.',
  errorGenerico: 'Ocurrió un error inesperado.',
  credencialesIncorrectas: 'Credenciales incorrectas',
  campoObligatorio: 'Este campo es obligatorio',
  // Regla 2: siempre "porcentaje de coincidencia de síntomas", nunca "confianza"
  porcentajeCoincidencia: 'Porcentaje de coincidencia de síntomas',
  avisoPreliminar:
    'Identificación preliminar: no es un diagnóstico. El diagnóstico lo emite el técnico.',
} as const
