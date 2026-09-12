# Frontend (planb)

Next.js 15 App Router, React 19.1, Bun, TanStack Query, shadcn/ui y Tailwind 4. La guía general está en [`../AGENTS.md`](../AGENTS.md); las stories y el código real mandan sobre este resumen.

## Forma del cambio

- Un caso de uso vive en `src/features/<use-case>/` con `api`, `actions`, `schema`, `types`, `components` e `index` solo cuando los necesita.
- Las rutas en `src/app/` componen features. No alojan lógica de negocio.
- Las server actions que mutan son puras: devuelven estado o destino; no llaman `redirect()` ni `revalidatePath()` dentro de la mutación.
- Para un feature o interacción nueva usá `slice-frontend`. Para decisiones visuales usá `bencium-controlled-ux-designer`; la landing puede usar sus alternativas solo cuando Lucas las pida o el skill lo habilite.

## Producto y UI

- La user story, su persona y su criterio de aceptación definen qué se construye. El sketch mid-fi orienta, no es contrato.
- Reusar los tokens de [`../docs/product/design-system.md`](../docs/product/design-system.md). No hardcodear otra paleta.
- UI y texto visible en español rioplatense. Identificadores en inglés.
- Antes de nombrar algo, buscar el término en [`../docs/product/language.md`](../docs/product/language.md).
- La autorización real vive en backend; los guards de route groups son UX y deben mantener el rol correcto.

## Verificación

- Component tests para comportamiento y estados. Playwright para navegación, layout real, accesibilidad del navegador y recorridos completos.
- Un cambio visual no se declara verificado a 393 px si no se renderizó en un navegador real.
- Si cambia un request o response, typecheck y unit tests no reemplazan el test del contrato HTTP.

Referencias: [`../docs/engineering/testing.md`](../docs/engineering/testing.md), [`../docs/product/design-system.md`](../docs/product/design-system.md) y [ADR-0046](../docs/decisions/0046-server-actions-as-pure-mutations.md).
