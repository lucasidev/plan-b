# ADR-0014: Arquitectura modular monolith con bounded contexts como módulos

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Planb tiene 5 bounded contexts claramente identificados en el ubiquitous language: Identity, Academic, Enrollments, Reviews, Moderation. El código del backend tiene que reflejar esa división con mecanismos que hagan que los límites no dependan de la disciplina del equipo, sino de la estructura del proyecto.

Es un proyecto de un solo developer, MVP del tamaño de una tecnicatura, sin plan de extracción a microservicios. Necesita rigor DDD sin ceremonia innecesaria.

## Decisión

Backend organizado como **modular monolith full**: cada bounded context es un módulo físicamente aislado con sus propios csprojs de Domain, Application e Infrastructure.

Layout:

```
backend/
├── libs/shared-kernel/     (Result, Error, abstractions — 1 csproj src + 1 tests)
├── modules/
│   ├── identity/       (Domain + Application + Infrastructure + Tests = 4 csprojs)
│   ├── academic/       (idem)
│   ├── enrollments/
│   ├── reviews/
│   └── moderation/
├── host/Planb.Api/         (composición, DI wiring, Program.cs)
└── tests/Planb.IntegrationTests/
```

Total: ~22 csprojs.

Cada módulo expone comunicación cross-module vía:
- **PublicContracts** (folder en `Application/` con types `public sealed`): interfaces sincrónicas para reads.
- **IntegrationEvents** (folder en `Application/`): mensajes asíncronos para writes post-commit.

El resto del código del módulo es `internal sealed`.

## Alternativas consideradas

### A. Flat vertical slices (3 csprojs totales)

Un solo `Planb.Application` con folders por feature (Identity/, Academic/, etc.). Single `DbContext`. Patrón común en apps DDD de escala chica/mediana.

Descartada porque los boundaries son convencionales (namespace + disciplina del dev), no enforceados. Cross-module references indistinguibles de intra-module. Patrón válido para apps chicas pero no aprovecha la división DDD que ya hicimos.

### C. Modular monolith liviano (1 csproj por módulo)

Cada módulo un solo csproj con carpetas internas (Domain/, Application/, Infrastructure/). ~10 csprojs totales.

Descartada porque mezcla las capas dentro del mismo ensamblado. El discernimiento entre "esto es domain" y "esto es infra" queda solo a nivel de path. No hay barrera física para importar EF Core desde el dominio.

## Consecuencias

**Positivas:**

- Boundaries físicos: csproj references + `internal sealed` evitan acoplamiento accidental cross-module.
- Cada módulo con su `DbContext`, schema propio, y migraciones independientes.
- DDD rigor defensible ante el docente — puede ver en el solution explorer cómo los bounded contexts del ubiquitous language se materializan en proyectos.
- Escala de refactoring: cambiar algo dentro de un módulo no toca los demás.

**Negativas:**

- ~22 csprojs en la solution. Build times más largos (~mitigado con build incremental).
- Cross-module operations requieren arquitectura (PublicContracts, integration events). No se puede tomar un atajo con un join EF Core.
- Ceremonia inicial de setup más alta.

**Invariantes a mantener:**

- Un módulo **nunca** referencia otro módulo como csproj reference. Solo los types `public sealed` de `Application/PublicContracts/` son visibles porque el ensamblado entero del Application es referenciado, pero el resto es `internal`.
- `IntegrationEvents` son `public sealed record` que consumidores pueden suscribir.
- Host (`Planb.Api`) es el único proyecto que referencia **todos** los módulos. Su rol es composición.
