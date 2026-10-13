// API pública del feature "inicio". Otros módulos solo importan desde aquí.
export * from './hooks'
export type { ResumenPanel } from './types'
export { KpiCards } from './components/KpiCards'
export { PendientesAntiguos } from './components/PendientesAntiguos'
export { ResumenAlertas } from './components/ResumenAlertas'
export { CasosPorCategoria } from './components/CasosPorCategoria'
export { CargaTecnicos } from './components/CargaTecnicos'
