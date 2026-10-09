# Panel ANUC Zetaquirá · Frontend

Panel web del sistema de identificación fitosanitaria temprana (Vite + React + TypeScript + Tailwind).
El contexto completo y las reglas del proyecto están en `CONTEXTO_PROYECTO.md` (sección 8).

## Comandos

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173 (proxy /api → http://localhost:8000)
npm run typecheck
npm run lint
npm test
npm run gen:api    # regenera src/types/api.d.ts desde el OpenAPI del backend
```

## Reglas de dependencias

`pages → features → components / services / hooks`. ESLint las hace cumplir:
- `components/` no importa de `features/` ni `pages/`.
- Las páginas no usan Axios; usan los hooks del feature.
- Entre features solo se importa la API pública (`@/features/<nombre>`).
