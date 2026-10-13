// Rutas del panel (guía, sección 6.2). Usa siempre estas constantes, nunca cadenas sueltas.
export const PATHS = {
  login: '/login',
  primerUso: '/primer-uso',
  recuperarCuenta: '/recuperar-cuenta',

  inicio: '/inicio',
  casos: '/casos',
  caso: (id: string) => `/casos/${encodeURIComponent(id)}`,
  alertas: '/alertas',
  mensajeAlerta: (id: string) => `/alertas/${encodeURIComponent(id)}/mensaje`,
  mapa: '/mapa',
  reportes: '/reportes',
  productores: '/productores',
  fincas: '/fincas',
  tecnicos: '/tecnicos',
  parametros: '/parametros',
  documentacion: '/parametros/documentacion',
  consulta: '/consulta',
  miCuenta: '/mi-cuenta',
  sinAcceso: '/sin-acceso',

  devUi: '/dev/ui',
} as const
