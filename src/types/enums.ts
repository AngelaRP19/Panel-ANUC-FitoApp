// Enums del dominio como objetos `as const` (compatibles con erasableSyntaxOnly).
// Deben coincidir con los valores del backend.

export const Rol = {
  LIDER_TECNICO: 'LIDER_TECNICO',
  TECNICO: 'TECNICO',
} as const
export type Rol = (typeof Rol)[keyof typeof Rol]

export const EstadoCaso = {
  CREADO: 'CREADO',
  EN_ANALISIS: 'EN_ANALISIS',
  PENDIENTE_REVISION: 'PENDIENTE_REVISION',
  ANALISIS_TECNICO: 'ANALISIS_TECNICO',
  CERRADO: 'CERRADO',
  DESCARTADO: 'DESCARTADO',
} as const
export type EstadoCaso = (typeof EstadoCaso)[keyof typeof EstadoCaso]

export const Categoria = {
  BOTRYTIS: 'BOTRYTIS',
  RONA: 'RONA',
  DEFICIENCIA_MAGNESIO: 'DEFICIENCIA_MAGNESIO',
  TRIPS: 'TRIPS',
  FUSARIUM: 'FUSARIUM',
} as const
export type Categoria = (typeof Categoria)[keyof typeof Categoria]

export const ResultadoAnalisis = {
  PRELIMINAR: 'PRELIMINAR',
  AMBIGUO: 'AMBIGUO',
  NO_IDENTIFICADO: 'NO_IDENTIFICADO',
} as const
export type ResultadoAnalisis = (typeof ResultadoAnalisis)[keyof typeof ResultadoAnalisis]

export const ResultadoTecnico = {
  CONFIRMADO: 'CONFIRMADO',
  OTRA_PATOLOGIA: 'OTRA_PATOLOGIA',
  NO_IDENTIFICADO: 'NO_IDENTIFICADO',
  REQUIERE_VISITA: 'REQUIERE_VISITA',
} as const
export type ResultadoTecnico = (typeof ResultadoTecnico)[keyof typeof ResultadoTecnico]

export const EstadoAlerta = {
  GENERADA: 'GENERADA',
  EN_REVISION: 'EN_REVISION',
  DESCARTADA: 'DESCARTADA',
  CONFIRMADA: 'CONFIRMADA',
  COMUNICADA: 'COMUNICADA',
} as const
export type EstadoAlerta = (typeof EstadoAlerta)[keyof typeof EstadoAlerta]

export const Especie = {
  GULUPA: 'GULUPA',
  GRANADILLA: 'GRANADILLA',
  MARACUYA: 'MARACUYA',
} as const
export type Especie = (typeof Especie)[keyof typeof Especie]

export const TipoEvidencia = {
  HOJA: 'HOJA',
  FRUTO: 'FRUTO',
  TALLO: 'TALLO',
  PLANTA_COMPLETA: 'PLANTA_COMPLETA',
} as const
export type TipoEvidencia = (typeof TipoEvidencia)[keyof typeof TipoEvidencia]

export const Afectacion = {
  TOTAL: 'TOTAL',
  PARCIAL: 'PARCIAL',
} as const
export type Afectacion = (typeof Afectacion)[keyof typeof Afectacion]
