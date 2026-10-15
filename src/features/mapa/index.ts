// API pública del feature "mapa" (Mapa de vigilancia · pantalla 19).
export * from './hooks'
export type { CasoMapa, DatosMapa, FiltrosMapa as FiltrosDelMapa } from './api'
export { FiltrosMapa } from './components/FiltrosMapa'
export { MapaVigilancia } from './components/MapaVigilancia'
export { AlertaMapa, CapaConcentracion, TablaCasosMapa } from './components/PanelMapa'
export { leerOcultas } from './utils'
