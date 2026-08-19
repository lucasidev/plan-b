# Épicas

La unidad vertical de la documentación de producto ([ADR-0070](../decisions/0070-product-docs-group-by-epic-one-story-per-epic-screens-owned-or-shared-and-design-as-text.md)): una épica es **lo que una persona viene a hacer**, en el sentido de la actividad de un story map (no la épica de portfolio de SAFe). Son trece: los ocho objetivos del mapa, Cuidar lo publicado, las tres actividades del backoffice y Avisos. Los grupos T2, T3, T4, BO4, BO5 y BO6 del mapa son **temas** (tres escenarios que rompen la promesa, cuando la carga no da abasto), no actividades: sus stories viven en la épica que las implementa, y el [catálogo](../domain/user-stories.md) las lista por tema para leerlas juntas.

## Los niveles

Una épica es una carpeta, y adentro hay cuatro cosas, cada una de un nivel distinto:

```
docs/epics/<epic>/
├── README.md              la épica: qué es, para quién, SUS STORIES con la letra completa (la única copia de cada fila),
│                          las decisiones que aplica, las pantallas que usa, el estado, lo que no resuelve
├── flow.md                el proceso: uno o más flujos en mermaid, con ramas, salidas y errores;
│                          un flujo puede cruzar épicas (el handoff es un nodo que nombra a la otra)
└── screens/<screen>/      las pantallas que existen solo para esta épica (la épica es su dueña)
    ├── README.md          la ficha de la pantalla: qué stories resuelve, qué muestra por paso y por estado, acciones, adónde va, slug
    └── sketch.html        el boceto de la pantalla, mid-fi, con todos sus pasos y estados (el hi-fi después, en el mismo archivo)
```

- **Story**: la unidad de valor. Vive en **una sola épica**, la que la implementa; su fila (`| ID | Story | Listo cuando | Notas |`) existe una vez, en el README de esa épica. Una story que "pasa por" dos épicas está mal cortada o mal ubicada. Otra épica la cita por ID con link a la dueña, nunca la copia. Al entrar a sprint, la ficha `US-NNN` la amplía.
- **Flujo**: el proceso. Puede cruzar épicas: el pedido de Ana (Pedir una carrera) termina en la cola de Sofía (Sostener el catálogo); el flujo lo dibuja como handoff.
- **Pantalla**: la vista. Tiene **una sola carpeta** en el repo: en la épica, si solo esa épica la usa; en [`docs/design/screens/`](../design/screens/README.md), si la componen varias (las fichas de lectura, el umbral, Mi perfil, Mis aportes). El inventario de las 34 dice dónde vive cada una.
- **Boceto**: es de una pantalla, nunca de una story ni de una épica; todos los pasos de una pantalla van en el mismo `sketch.html`. HTML con los tokens del [design system](../design/design-system.md): ninguna imagen es fuente.

Lo transversal no se corta: la [tesis](../THESIS.md), el [glosario](../domain/ubiquitous-language.md), las [personas](../domain/user-personas.md), el [catálogo de frases](../domain/phrases.md), los [ADRs](../decisions/README.md), las [revisiones](../reviews/README.md), el design system. La épica los cita.

Reglas de forma: la **carpeta se nombra en inglés, en kebab-case**, como todo identificador del repo; el nombre visible de la épica es español y va en el texto (ADR-0070, punto 7). Una épica no es un feature de código: sus stories se implementan en uno o más slices cuando entran a sprint (`US-NNN`, con `-b`/`-f`). El estado de la épica (borrador, revisada, en construcción, construida) está en su README.

## Índice

| Épica | Carpeta | Grupo del mapa | Persona que la pide | Stories | Estado |
|---|---|---|---|---|---|
| [Elegir dónde estudiar](choose-where-to-study/README.md) | `choose-where-to-study/` | O1 · Decidir dónde estudiar (+ T1-4, T2-3, T3-2, T3-6) | Valentina, Silvia, quien lee | 12 | borrador: README, flujo y Dónde estudiarla con ficha y boceto |
| [Pedir una carrera](request-a-career/README.md) | `request-a-career/` | O2 · Entender el vacío | Ana | 4 | borrador: README, flujo, Pedir y La cola con ficha y boceto |
| [Mi carrera](my-career/README.md) | `my-career/` | O3 · Armar el cuatrimestre | Lucía | 3 | borrador: README, flujo, Mi carrera y Empezar con ficha y boceto |
| [Reseñar](write-a-review/README.md) | `write-a-review/` | O4 · Que quede registrado (+ T2-1, T2-4, T3-1, T3-3, T3-4, T3-5, T4-1) | Lucía, Matías, Diego | 19 | borrador: README, flujo, Reseñar y Mi situación con ficha y boceto |
| [Deshacer](undo/README.md) | `undo/` | O5 · Poder deshacer | quien ya aportó; quien lee (reportar) | 3 | borrador: README, flujo, Editar y Baja con ficha y boceto |
| [Que no me molesten](do-not-bother-me/README.md) | `do-not-bother-me/` | O6 · garantía | quien lee, quien vuelve | 4 | garantía: se verifica en cada ficha de pantalla y en el DoD; no se planifica |
| [Replicar](reply/README.md) | `reply/` | O7 · Contestar lo que se publicó (+ T2-2) | Claudia, Paredes, la institución | 8 | borrador: README, flujo y Responder con ficha y boceto |
| [Llevarse el dato](take-the-data/README.md) | `take-the-data/` | O8 · Llevarme el dato | Rocío | 8 | borrador: README, flujo y Método con ficha y boceto |
| [Cuidar lo publicado](care-for-what-is-published/README.md) | `care-for-what-is-published/` | T1 · votar, corregir, verificarse | quien ya aportó, quien vuelve | 3 | borrador: README y flujo; sin pantallas propias |
| [Sostener el catálogo](sustain-the-catalog/README.md) | `sustain-the-catalog/` | BO1 (+ BO4-1, BO4-2, BO4-3, BO4-5, BO5-1) | Sofía, quien cura las frases | 14 | borrador: README, flujo y sus cuatro pantallas con ficha y boceto |
| [Moderar sin romper el producto](moderate-without-breaking-the-product/README.md) | `moderate-without-breaking-the-product/` | BO2 (+ BO4-4, BO4-6, BO5-2, BO5-3) | Nahuel, Camila | 10 | borrador: README, flujo, Reportes y Verificaciones con ficha y boceto |
| [Cortar los accesos](cut-the-access/README.md) | `cut-the-access/` | BO3 (+ BO6-1, BO6-2) | Admin | 5 | borrador: README, flujo y Equipo con ficha y boceto |
| [Avisos](notices/README.md) | `notices/` | infraestructura transversal (sostiene O2-4, O4-5, O4-12, O7-5, BO1-3, T2-2) | todos | 0 propias | borrador: README, flujo y los cinco mails con ficha y boceto |

93 stories en total; la cuenta por épica es la del README de cada una. Las épicas de la versión anterior (EPIC-00 a EPIC-11) están en el [ático](../history/domain-v1/epics/) con sus fichas.
