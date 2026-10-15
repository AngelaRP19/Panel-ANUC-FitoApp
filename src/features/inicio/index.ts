// API pública del feature "inicio". Otros módulos solo importan desde aquí.
export * from './hooks'
export type { ResumenPanel, ResumenTecnico } from './types'
export { CasosPorAtender, DiagnosticosRecientes, KpisTecnico } from './components/InicioTecnico'
export { KpiCards } from './components/KpiCards'
export { PendientesAntiguos } from './components/PendientesAntiguos'
export { ResumenAlertas } from './components/ResumenAlertas'
export { CasosPorCategoria } from './components/CasosPorCategoria'
export { CargaTecnicos } from './components/CargaTecnicos'
