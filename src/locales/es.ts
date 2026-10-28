// Etiquetas y mensajes reutilizables. NO es i18n: el sistema es solo en español.
// Reglas de lenguaje: «porcentaje de coincidencia de síntomas» (nunca «confianza»),
// «categoría fitosanitaria» (nunca «enfermedad») y nada de reapertura de casos.
import type {
  Categoria,
  EstadoAlerta,
  EstadoCaso,
  Especie,
  ResultadoAnalisis,
  ResultadoTecnico,
  Rol,
  TipoCultivo,
  TipoEvidencia,
  Vereda,
} from '@/types/enums'

/** Texto para valores que la API envía y el panel todavía no conoce. */
export const ETIQUETA_DESCONOCIDA = 'Sin clasificar'

/**
 * Busca la etiqueta de un valor del dominio. Si la API envía un valor nuevo,
 * devuelve un texto genérico en lugar de romper la pantalla.
 */
export function etiqueta<K extends string>(
  mapa: Record<K, string>,
  valor: string | null | undefined,
  porDefecto = ETIQUETA_DESCONOCIDA,
): string {
  if (!valor) return porDefecto
  return (mapa as Record<string, string>)[valor] ?? porDefecto
}

export const ROL_LABEL: Record<Rol, string> = {
  LIDER_TECNICO: 'Líder técnico',
  TECNICO: 'Técnico',
}

export const ESTADO_CASO_LABEL: Record<EstadoCaso, string> = {
  CREADO: 'Caso creado',
  EN_ANALISIS: 'En análisis',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  EN_REVISION: 'En revisión',
  REGISTRADO: 'Registrado',
  CERRADO: 'Cerrado',
  DESCARTADO: 'Descartado',
}

export const ESTADO_ALERTA_LABEL: Record<EstadoAlerta, string> = {
  GENERADA: 'Generada',
  EN_REVISION: 'En revisión',
  CONFIRMADA: 'Confirmada',
  COMUNICADA: 'Comunicada',
  DESCARTADA: 'Descartada',
  CORREGIDA: 'Corregida',
}

export const ESTADO_CUENTA_LABEL = { activo: 'Activo', inactivo: 'Deshabilitado' } as const

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  BOTRYTIS: 'Botrytis',
  RONA: 'Roña',
  DEFICIENCIA_MAGNESIO: 'Deficiencia de magnesio',
  TRIPS: 'Trips',
  FUSARIUM: 'Fusarium',
}

/** Forma de cada categoría en mapas, leyendas, gráficas e insignias. */
export const CATEGORIA_FORMA_LABEL: Record<Categoria, string> = {
  TRIPS: 'triángulo',
  BOTRYTIS: 'círculo',
  RONA: 'rombo',
  FUSARIUM: 'cruz',
  DEFICIENCIA_MAGNESIO: 'cuadrado',
}

export const RESULTADO_ANALISIS_LABEL: Record<ResultadoAnalisis, string> = {
  PRELIMINAR: 'Identificación preliminar',
  AMBIGUO: 'Ambigua · 2 categorías',
  NO_IDENTIFICADO: 'No identificada',
}

export const RESULTADO_TECNICO_LABEL: Record<ResultadoTecnico, string> = {
  CONFIRMADO: 'Confirmado',
  OTRA_PATOLOGIA: 'Otra patología',
  NO_IDENTIFICADO: 'No identificado',
  REQUIERE_VISITA: 'Requiere visita',
}

export const ESPECIE_LABEL: Record<Especie, string> = {
  GULUPA: 'Gulupa',
  GRANADILLA: 'Granadilla',
  MARACUYA: 'Maracuyá',
}

export const TIPO_CULTIVO_LABEL: Record<TipoCultivo, string> = {
  INVERNADERO: 'Invernadero',
  CAMPO_ABIERTO: 'Campo abierto',
}

export const TIPO_EVIDENCIA_LABEL: Record<TipoEvidencia, string> = {
  HOJA: 'Hoja',
  ENVES: 'Envés',
  FRUTO: 'Fruto',
  TALLO: 'Tallo',
  PLANTA_COMPLETA: 'Otras',
}

export const VEREDA_LABEL: Record<Vereda, string> = {
  JURACAMBITA: 'Juracambita',
  CENTRO: 'Centro',
  SAN_LUIS: 'San Luis',
}

/** Mensajes de interfaz reutilizables (textos del diseño). */
export const MENSAJES = {
  // Estados de interfaz (artboard «Estados»)
  sinResultadosTitulo: 'No hay resultados para esta búsqueda',
  sinResultadosTexto: 'Revisa el ID, el nombre del productor o la finca, o limpia los filtros.',
  limpiarFiltros: 'Limpiar filtros',
  sinConexion: 'Sin conexión.',
  sinConexionTexto: 'Los datos pueden no estar actualizados. Reintentando en 10 s.',
  errorConexionTexto:
    'No hay conexión con el servidor. Revisa tu conexión a internet e intenta de nuevo.',
  reintentar: 'Reintentar',
  errorGenerico: 'Ocurrió un error inesperado. Intenta de nuevo.',

  // Producto
  porcentajeCoincidencia: 'Porcentaje de coincidencia de síntomas',
  avisoPreliminar: 'Resultado preliminar: la decisión corresponde al técnico.',
  avisoAlerta:
    'Es una posibilidad detectada por el sistema, no un hecho. Revisa los casos antes de confirmar.',
  vencimientoConservacion: 'Fecha de vencimiento de conservación',
  vencimientoAlCerrar: 'Se fija al cerrar el caso · 6 meses',

  // Autenticación
  credencialesIncorrectas:
    'El correo o la contraseña no son correctos. Revisa los datos e intenta de nuevo.',
  demasiadosIntentos: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  cuentaInexistente: 'No hay ninguna cuenta registrada con este correo',
  contrasenaActualizada: 'Contraseña actualizada.',
  codigoInvalido: 'El código no es correcto o ya venció. Pide uno nuevo.',
  demasiadosIntentosTitulo: 'Demasiados intentos.',
  demasiadosIntentosTexto: 'Espera unos minutos e inténtalo de nuevo.',

  // Validación de formularios
  campoObligatorio: 'Este campo es obligatorio',
  correoInvalido: 'Escribe un correo válido, por ejemplo nombre@anuc.org',
  celularInvalido: 'Escribe un celular de 10 dígitos que empiece por 3',
  celularDuplicado: 'Este número de celular ya está registrado',
  contrasenaReglas: 'Usa al menos 8 caracteres, con letras y números',
  contrasenasNoCoinciden: 'Las contraseñas no coinciden',

  // Ayudas de formato
  ayudaCorreo: 'Formato nombre@dominio',
  ayudaCelular: '10 dígitos, empieza por 3 · ej. 313 402 7781',
  campoObligatorioLeyenda: 'Campo obligatorio',
} as const
