# US-F01-f: Scaffolding frontend Next.js

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: M
**UC**: 
**ADR refs**: ADR-0019, ADR-0020, ADR-0021, ADR-0022, ADR-0024

## Como dev, quiero el scaffolding del frontend Next.js para tener base sobre la que implementar UI

Como tech lead solo-dev, quiero el scaffolding completo del frontend (Next.js 15 App Router, React 19.1, shadcn/ui, Tailwind CSS 4, bun) para que las features de UI posteriores se monten sobre stack moderno con RSC + TanStack Query y forms primitivos.

## Acceptance Criteria

- [x] Proyecto Next.js 15 con App Router inicializado en `frontend/`.
- [x] React 19.1 como runtime, no React 18.
- [x] shadcn/ui inicializado con los componentes base (`button`, `input`, `card`, `dialog`, etc.).
- [x] Tailwind CSS 4 configurado con tokens del design system.
- [x] Bun como package manager y runtime de scripts.
- [x] Estructura `src/{app,features,components,lib}/` (ADR-0020: features alineadas con módulos backend).
- [x] TanStack Query v5 configurado con RSC prefetch + HydrationBoundary (ADR-0021).
- [x] Biome configurado como linter + formatter.
- [x] `bun dev` levanta el servidor sin errores.

## Sub-tasks

- [x] `bunx create-next-app@latest` con App Router
- [x] Instalar shadcn/ui CLI y componentes base
- [x] Setup Tailwind CSS 4 + theme tokens
- [x] Configurar TanStack Query con RSC integration
- [x] Crear estructura de carpetas `features/` por módulo backend
- [x] Setup Biome (lint + format)

## Notas de implementación

- **Single Next.js app con route groups**: ADR-0019 evita partir el frontend en múltiples apps (member, admin, etc.). Los route groups (`(auth)`, `(member)`, `(admin)`) dan separación lógica sin separar deploy.
- **Features alineadas con módulos backend**: ADR-0020. `features/sign-in/` mapea a `modules/identity`, `features/reviews/` a `modules/reviews`. Mantener el mismo nombre evita drift de mental models.
- **TanStack Query con RSC prefetch + HydrationBoundary**: ADR-0021. El RSC hace el primer fetch, el cliente lo hidrata, evitamos waterfalls y duplicación de fetch en client-side.
- **React 19.1 sobre React 18**: forms primitives (`useActionState`, `useFormStatus`) cubren forms de 1-3 fields sin TanStack Form. ADR-0022.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: 
- ADRs: [ADR-0019](../../decisions/0019-single-nextjs-app-con-route-groups.md), [ADR-0020](../../decisions/0020-features-alineadas-con-modulos-backend.md), [ADR-0021](../../decisions/0021-data-fetching-rsc-tanstack-query.md), [ADR-0022](../../decisions/0022-forms-react19-primitives-tanstack-form.md), [ADR-0024](../../decisions/0024-dev-tooling-stack.md)
