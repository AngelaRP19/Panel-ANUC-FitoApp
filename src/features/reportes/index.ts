// API pública del feature "reportes" (pantallas 23 y 24 · Fase C).
export * from './hooks'
export type * from './types'
export { KpisReporte, Secciones } from './components/Secciones'
export { PanelFiltros } from './components/PanelFiltros'
export { ConsultasGuardadas, GuardarConsultaModal } from './components/Consultas'
export { BotonesExportar, FiltrosAplicados, TarjetasReportes } from './components/Cabecera'
export { esTipoReporte, REPORTES } from './utils'
