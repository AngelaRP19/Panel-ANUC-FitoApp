// Enums del dominio como objetos `as const` (compatibles con erasableSyntaxOnly).
// Deben coincidir con los valores del backend. Si la API envía un valor que no está
// aquí, las etiquetas de `locales/es.ts` lo muestran con un texto genérico.

export const Rol = {
  LIDER_TECNICO: 'LIDER_TECNICO',
  TECNICO: 'TECNICO',
} as const
export type Rol = (typeof Rol)[keyof typeof Rol]

/**
 * Estados del caso (decisión del equipo). No existe REABIERTO: los casos cerrados no se reabren.
 * CREADO / EN_ANALISIS: el chatbot aún no envía el caso al panel.
 * PENDIENTE_REVISION: en el panel, sin técnico. EN_REVISION: con técnico, sin diagnóstico.
 * REGISTRADO: diagnóstico guardado, falta cerrar.
 */
export const EstadoCaso = {
  CREADO: 'CREADO',
  EN_ANALISIS: 'EN_ANALISIS',
  PENDIENTE_REVISION: 'PENDIENTE_REVISION',
  EN_REVISION: 'EN_REVISION',
  REGISTRADO: 'REGISTRADO',
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
  /** La alerta comunicada se envió por error y se mandó una corrección (D-17). */
  CORREGIDA: 'CORREGIDA',
} as const
export type EstadoAlerta = (typeof EstadoAlerta)[keyof typeof EstadoAlerta]

export const Especie = {
  GULUPA: 'GULUPA',
  GRANADILLA: 'GRANADILLA',
  MARACUYA: 'MARACUYA',
} as const
export type Especie = (typeof Especie)[keyof typeof Especie]

/** Un cultivo es una unidad productiva dentro de una finca; contiene una o varias especies. */
export const TipoCultivo = {
  INVERNADERO: 'INVERNADERO',
  CAMPO_ABIERTO: 'CAMPO_ABIERTO',
} as const
export type TipoCultivo = (typeof TipoCultivo)[keyof typeof TipoCultivo]

/** PLANTA_COMPLETA, si llega de la API, se agrupa como «Otras». */
export const TipoEvidencia = {
  HOJA: 'HOJA',
  ENVES: 'ENVES',
  FRUTO: 'FRUTO',
  TALLO: 'TALLO',
  PLANTA_COMPLETA: 'PLANTA_COMPLETA',
} as const
export type TipoEvidencia = (typeof TipoEvidencia)[keyof typeof TipoEvidencia]

/** Veredas del diseño. La lista real viene de la API. */
export const Vereda = {
  JURACAMBITA: 'JURACAMBITA',
  CENTRO: 'CENTRO',
  SAN_LUIS: 'SAN_LUIS',
} as const
export type Vereda = (typeof Vereda)[keyof typeof Vereda]
