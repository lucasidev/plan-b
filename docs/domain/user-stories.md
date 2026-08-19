# User Stories (planb)

Catálogo de user stories. Cada US vive en su propio archivo dentro de [user-stories/](user-stories).

> **Estado (2026-08-16)**: el producto cambió de tesis ([THESIS.md](../THESIS.md), [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md)). **El catálogo vigente está indexado abajo y la letra de cada story vive en su épica** (`docs/epics/<epic>/README.md`, [ADR-0070](../decisions/0070-product-docs-group-by-epic-one-story-per-epic-screens-owned-or-shared-and-design-as-text.md)); el de la versión anterior queda al final como historia (US-097/098/099 canceladas con S12, US-057 muere por tesis, las hechas son historia y no se tocan). La numeración formal `US-NNN` se asigna cuando una story entra a sprint, como siempre; hasta entonces se referencian por su ID de mapa (`O1-1`, `T2-1`, `BO4-2`). Estructura del mapa (pantallas, flujos, planos): [`product-map.md`](../design/product-map.md). Los nombres en backticks (Dónde estudiarla, Reseñar, Método) son nombres de pantalla del mapa, no rutas: la URL es código, en inglés, y se fija al entrar a sprint. Personas: [`user-personas.md`](user-personas.md).

---

# El catálogo vigente (mapa de producto, 2026-08-16)

Ocho objetivos con 49 stories, cuatro grupos transversales con 15, y seis de backoffice con 29: 93 en total (revisado 2026-08-16: se fusionaron O4-3 en O4-6 y O7-4 en O7-7, O5-3 pasó a garantía, y entraron T2-4 y O8-6; **revisado 2026-08-17 contra la tesis cerrada**, [ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md) a [0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md): se reescribieron 39 criterios que hablaban con el vocabulario viejo o prometían menos de lo decidido, y entraron 19 que las decisiones pedían y nadie construía: O1-8, O4-10 a O4-13, O7-8, O8-7, O8-8, T1-4, T3-7, BO1-5 a BO1-9, BO2-5, BO2-6, BO3-3 y BO4-6; después, T3-7 se fusionó en O1-8). Cada una trae su criterio de "listo cuando": sin criterio no se puede decir si una pantalla la resuelve. **Una story vive en una sola épica**, la que la implementa, y su fila (`| ID | Story | Listo cuando | Notas |`) está una sola vez, en `docs/epics/<epic>/README.md`; este archivo es el índice por ID, las reglas del catálogo y lo transversal. Los grupos T2, T3, T4, BO4, BO5 y BO6 del mapa son temas, no actividades: sus stories viven en la épica que las implementa y el tema queda como etiqueta en Notas y como lista acá abajo. **Un criterio por línea y hasta tres por story**: cada uno tiene que poder marcarse verdadero o falso por separado; si hacen falta más de tres, la story es una épica y se parte al planificar (está marcada así en Notas). El detalle (criterios de aceptación completos, edge cases, out of scope, Given-When-Then, dependencias) entra en la ficha `US-NNN` cuando la story entra a sprint, como fija el [template](us-template.md): la fila es la tarjeta, no la especificación. Prioridad solo donde el mapa la marca (P1/P2); el resto no está priorizado todavía. **Notas** trae la prioridad, si es épica, de qué depende, con qué story es par (el mismo hecho visto por dos actores: se construyen juntas) y si espera una decisión.

**Los roles son una lista cerrada, y cada uno es una persona** ([user-personas.md](user-personas.md)): quien lee (cualquiera, sin cuenta), quien está eligiendo (Valentina), quien paga y no cursa (Silvia), quien no está cubierto (Ana), quien está cursando (Lucía), quien reseña (cualquiera en el acto de reseñar), quien ya aportó (Matías), quien vuelve (cualquier cuenta, cuando vuelve a leer o a corregir), quien dejó la carrera (Diego), quien ya no entra a la app (Diego y los egresados), quien investiga (Rocío), el docente (Claudia, Paredes), la institución, quien carga el catálogo (Sofía), quien cura las frases (equipo, editorial), quien modera (Nahuel), quien verifica (Camila: BO3-3 los separa), quien administra (Admin). Una story con un rol que no está acá tiene el rol mal.

> **Decisiones**: las diez que dejó la propagación del 17 están cerradas (D01 a D10 en el [registro](../reviews/2026-08-17-catalog-propagation.md)); ninguna fila espera una decisión.

## Índice por épica

La letra de cada story (la fila entera, con su "listo cuando" y sus notas) vive en el README de su épica; una story que otra épica necesita se cita por ID con link a la dueña, nunca se copia.

| Épica | Carpeta | Grupo del mapa | Stories |
|---|---|---|---|
| [Elegir dónde estudiar](../epics/choose-where-to-study/README.md) | `docs/epics/choose-where-to-study/` | O1 · Decidir dónde estudiar (y poder desconfiar del número) | O1-1, O1-2, O1-3, O1-4, O1-5, O1-6, O1-7, O1-8, T1-4, T2-3, T3-2, T3-6 |
| [Pedir una carrera](../epics/request-a-career/README.md) | `docs/epics/request-a-career/` | O2 · Entender el vacío (cuando lo que busco no está) | O2-1, O2-2, O2-3, O2-4 |
| [Mi carrera](../epics/my-career/README.md) | `docs/epics/my-career/` | O3 · Armar el cuatrimestre (lo que la lapicera no calcula sola) | O3-1, O3-2, O3-3 |
| [Reseñar](../epics/write-a-review/README.md) | `docs/epics/write-a-review/` | O4 · Que quede registrado (sin que me cueste la cursada) | O4-1, O4-2, O4-4, O4-5, O4-6, O4-7, O4-8, O4-9, O4-10, O4-11, O4-12, O4-13, T2-1, T2-4, T3-1, T3-3, T3-4, T3-5, T4-1 |
| [Deshacer](../epics/undo/README.md) | `docs/epics/undo/` | O5 · Poder deshacer (se construye: las pantallas Editar y Baja, y el reporte sin cuenta) | O5-1, O5-2, O5-4 |
| [Que no me molesten](../epics/do-not-bother-me/README.md) | `docs/epics/do-not-bother-me/` | O6 · Que no me molesten (garantía: el contrapeso, nadie quiere más funciones) | O6-1, O6-2, O6-3, O6-4 |
| [Replicar](../epics/reply/README.md) | `docs/epics/reply/` | O7 · Contestar lo que se publicó (con nombre, porque es público) | O7-1, O7-2, O7-3, O7-5, O7-6, O7-7, O7-8, T2-2 |
| [Llevarse el dato](../epics/take-the-data/README.md) | `docs/epics/take-the-data/` | O8 · Llevarme el dato (para discutirlo afuera) | O8-1, O8-6, O8-2, O8-3, O8-4, O8-5, O8-7, O8-8 |
| [Cuidar lo publicado](../epics/care-for-what-is-published/README.md) | `docs/epics/care-for-what-is-published/` | T1 · Cuidar lo publicado (curación, no opinión) | T1-1, T1-2, T1-3 |
| [Sostener el catálogo](../epics/sustain-the-catalog/README.md) | `docs/epics/sustain-the-catalog/` | BO1 · Sostener el catálogo (lo único que no se crowdsourcea) | BO1-1, BO1-2, BO1-3, BO1-4, BO1-5, BO1-6, BO1-7, BO1-8, BO1-9, BO4-1, BO4-2, BO4-3, BO4-5, BO5-1 |
| [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/README.md) | `docs/epics/moderate-without-breaking-the-product/` | BO2 · Moderar sin romper el producto (decir que no importa más que decir que sí) | BO2-1, BO2-2, BO2-3, BO2-4, BO2-5, BO2-6, BO4-4, BO4-6, BO5-2, BO5-3 |
| [Cortar los accesos](../epics/cut-the-access/README.md) | `docs/epics/cut-the-access/` | BO3 · Cortar los accesos (que el anonimato sea mecanismo) | BO3-1, BO3-2, BO3-3, BO6-1, BO6-2 |
| [Avisos](../epics/notices/README.md) | `docs/epics/notices/` | infraestructura transversal | ninguna propia: sostiene O2-4, O4-5, O4-12, O7-5, BO1-3, T2-2 |

## Los temas del mapa que no son épicas

Los grupos transversales del mapa agrupan por riesgo o por situación, no por lo que alguien viene a hacer; sus stories viven en la épica que las implementa. El tema se conserva acá como lista, para leerlas juntas:

- **T2 · Cuando el riesgo es real (tres escenarios que rompen la promesa)**: T2-1 → [Reseñar](../epics/write-a-review/README.md); T2-2 → [Replicar](../epics/reply/README.md); T2-3 → [Elegir dónde estudiar](../epics/choose-where-to-study/README.md); T2-4 → [Reseñar](../epics/write-a-review/README.md).
- **T3 · Cuando el catálogo no alcanza (el dato existe pero no me sirve como está)**: T3-1 → [Reseñar](../epics/write-a-review/README.md); T3-2 → [Elegir dónde estudiar](../epics/choose-where-to-study/README.md); T3-3 → [Reseñar](../epics/write-a-review/README.md); T3-4 → [Reseñar](../epics/write-a-review/README.md); T3-5 → [Reseñar](../epics/write-a-review/README.md); T3-6 → [Elegir dónde estudiar](../epics/choose-where-to-study/README.md).
- **T4 · Y quien no está de acuerdo (discrepar no es lo mismo que denunciar)**: T4-1 → [Reseñar](../epics/write-a-review/README.md).
- **BO4 · Cuando la carga no da abasto (operación diaria, no excepciones)**: BO4-1 → [Sostener el catálogo](../epics/sustain-the-catalog/README.md); BO4-2 → [Sostener el catálogo](../epics/sustain-the-catalog/README.md); BO4-3 → [Sostener el catálogo](../epics/sustain-the-catalog/README.md); BO4-4 → [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/README.md); BO4-5 → [Sostener el catálogo](../epics/sustain-the-catalog/README.md); BO4-6 → [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/README.md).
- **BO5 · Cuando el corpus está bajo ataque (tres escenarios que rompen el producto)**: BO5-1 → [Sostener el catálogo](../epics/sustain-the-catalog/README.md); BO5-2 → [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/README.md); BO5-3 → [Moderar sin romper el producto](../epics/moderate-without-breaking-the-product/README.md).
- **BO6 · Y quién nos mira a nosotros (lo que le pedimos a las instituciones, aplicado adentro)**: BO6-1 → [Cortar los accesos](../epics/cut-the-access/README.md); BO6-2 → [Cortar los accesos](../epics/cut-the-access/README.md).
---

# Catálogo de la versión anterior (historia)

Las **126 fichas** de la versión anterior (foundations `US-F*`, tooling `US-T*`, y las `US-001..099` con sus subdivisiones `-b/-f/-i`) viven en [`user-stories/`](user-stories), cada una con su `Status` en el header (75 Done, el resto Backlog, Cancelada, Parcial o Superada). Son la evidencia del trabajo hecho y **no se tocan**: ni se actualizan ni se reescriben contra la tesis nueva.

El índice por estado y por epic que vivía acá se eliminó el 2026-08-16: había quedado desincronizado con las fichas (31 archivos que no listaba, parents subdivididos que la propia convención dice que no deberían coexistir) y ya no cumplía función. Para el estado histórico, la fuente es el header de cada ficha y las secciones de sprint de [STATUS.md](../STATUS.md).

Convención de IDs que esas fichas usan, y que el catálogo vigente hereda cuando una story del mapa entra a sprint: `US-NNN[-x]` con `-b` backend, `-f` frontend, `-i` infra, `-t` tooling. Effort: Small ≈ 1-3 días, Medium ≈ 3-7 días, Large ≈ 1-2 semanas.

---

## Restricciones (no son stories: se verifican en el DoD)

Lo que ninguna persona pide en primera persona y aun así tiene que cumplirse en toda pantalla. Van al [Definition of Done](definition-of-done.md), no al backlog, porque no se terminan: se sostienen.

- **Accesibilidad y celular.** La lectura es pública y la mayoría llega desde el teléfono: las fichas, Método, Dónde estudiarla y el CSV se leen y se usan en un celular chico, y cumplen WCAG 2.2 AA (contraste, teclado, lectores de pantalla, texto que escala). Una ficha que solo se lee en escritorio no está terminada.
- **Datos personales (Ley 25.326).** Consentimiento informado al registrarse, aviso de privacidad público, y los derechos de acceso, rectificación y supresión resueltos por O5-1 y O5-2 (borrar de a uno; la baja anonimiza y preserva lo aportado, ADR-0044). Las constancias se destruyen al resolver (BO2-3). Nada publicado trae nombre, cuenta ni perfil (T2-4).
- **La política de moderación y réplica es pública.** El criterio escrito de BO2-1 (qué es exposición, qué no lo es, el único caso de riesgo inmediato), el chequeo previo (T2-1) y las reglas de la réplica (T2-2, O7-8) se publican donde se publica el método, antes de que exista el primer reporte. Nahuel aplica lo que cualquiera puede leer.
- **Rendimiento y disponibilidad de lo público.** Lo que se lee sin cuenta es lo que la mesa cita: las fichas cargan rápido y se cachean; una caída de lo público es una caída del producto, y el CSV siempre está.

## Template y criterios

- **Template de US**: [us-template.md](us-template.md): incluye estructura completa, sources de las prácticas (INVEST / Connextra / BDD / DoR), y guía de cuándo aplicar cada sección.
- **Definition of Ready (DoR)**: dentro de `us-template.md`: pre-sprint, qué tiene que tener una US para entrar al sprint planning.
- **Definition of Done (DoD)**: [definition-of-done.md](definition-of-done.md): post-implementación, qué tiene que cumplir una US para considerarse Done.

US que entran a sprint backfillean (si faltan): Out of scope, Edge cases, Test scenarios (Given-When-Then), Dependencies. US en Backlog pueden estar más livianas: el backfill es parte del sprint planning.

---

## Cómo se trackean

- Catálogo canónico: este doc (las stories del mapa, referenciadas por su ID de mapa hasta entrar a sprint) + una ficha por US numerada en [user-stories/](user-stories) cuando entra a sprint.
- Tracking operacional: este repo. El `Status` vive en el header de cada ficha; el sprint, en [`STATUS.md`](../STATUS.md). Notion se dejó de usar el 2026-08-18.
- En código: PRs referencian `US-NNN` desde la descripción y los commits.
