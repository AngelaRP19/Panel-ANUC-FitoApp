// API pública del feature "casos". Otros módulos solo importan desde aquí.
export * from './hooks'
export type * from './types'
export { CasosTabs } from './components/CasosTabs'
export { CasosFiltros, FiltrosActivos } from './components/CasosFiltros'
export { CLAVES_PANEL, esCasoNoEncontrado, type FiltrosPanel } from './utils'
export { CasosTable } from './components/CasosTable'
export { ResumenCasoModal } from './components/ResumenCasoModal'
export { CasoEncabezado } from './components/CasoEncabezado'
export { ResultadoPreliminar } from './components/ResultadoPreliminar'
export { GaleriaEvidencias } from './components/GaleriaEvidencias'
export {
  CuestionarioDialog,
  HistorialDialog,
  ProductorFincaDialog,
  ReasignarDialog,
} from './components/VentanasCaso'
export { Timeline } from './components/Timeline'
export { PanelDiagnostico } from './components/PanelDiagnostico'
export { ExtenderConservacionDialog } from './components/ExtenderConservacionDialog'
