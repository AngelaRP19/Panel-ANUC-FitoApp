# Panel ANUC Zetaquirá · Frontend

Panel web del sistema de identificación fitosanitaria temprana (Vite + React + TypeScript + Tailwind).
La guía de desarrollo (pantallas, reglas del producto, sistema de diseño) está en `FRONTEND_GUIA.md`;
el diseño de referencia es el lienzo «Panel Fitosanitario ANUC · Pantallas» en Claude Design.

## Comandos

```bash
npm install
cp .env.example .env.local   # VITE_USE_MOCKS=true para trabajar sin backend ni Cognito
npm run dev        # http://localhost:5173 (proxy /api → http://localhost:8000)
npm run typecheck
npm run lint
npm test
npm run build
npm run gen:api    # regenera src/types/api.d.ts desde el OpenAPI del backend
```

## Trabajar con mocks (`VITE_USE_MOCKS=true`)

La API se simula con MSW (`src/mocks/handlers`, datos en `src/mocks/fixtures`) y Cognito con un
simulador en memoria (`src/mocks/authSimulado.ts`). Cuentas de demostración (contraseña `demo1234`):

| Correo | Rol | Caso que permite probar |
|---|---|---|
| `lider@anuc.test` | Líder técnico (Wilmar Torres) | Acceso completo |
| `tecnico@anuc.test` | Técnico (Ana Lucía Becerra) | Vista del técnico |
| `jhon.sanabria@anuc.test` | Técnico | Contraseña temporal: pide crear una nueva al entrar |
| `diana.rincon@anuc.test` | Técnico deshabilitado | Mismo error genérico que credenciales incorrectas |

Escenarios: abre cualquier ruta con `?mock=sin-lider` para simular un panel sin líder técnico
(pantalla «Primer uso») y con `?mock=normal` para volver a los datos del diseño.

Código de recuperación de cuenta en el simulador: `123456`. Tras 5 intentos fallidos responde
«Demasiados intentos».

El catálogo de componentes está en `/dev/ui` (solo con `npm run dev`).

## Reglas de dependencias

`pages → features → components / services / hooks`. ESLint las hace cumplir:
- `components/` no importa de `features/` ni `pages/`.
- Las páginas no usan Axios; usan los hooks del feature.
- Entre features solo se importa la API pública (`@/features/<nombre>`).
- Solo `src/services/auth/cognito.ts` conoce Amplify; el resto usa `@/services/auth`.
