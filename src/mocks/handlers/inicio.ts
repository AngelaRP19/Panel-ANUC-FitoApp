import { http, HttpResponse } from 'msw'
import type { PeriodoCategorias } from '@/features/inicio/types'
import { categoriasDemo, resumenDemo } from '../fixtures/inicio'
import { API } from './comun'

export const inicioHandlers = [
  http.get(`${API}/panel/resumen`, () => HttpResponse.json(resumenDemo())),
  http.get(`${API}/panel/casos-por-categoria`, ({ request }) => {
    const periodo = (new URL(request.url).searchParams.get('periodo') ?? '90d') as PeriodoCategorias
    return HttpResponse.json(categoriasDemo(periodo))
  }),
]
