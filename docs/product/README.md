# Producto

Acá se describe **qué hace el producto**. La unidad es la **épica**, cortada en vertical ([ADR-0070](../decisions/0070-product-requirements-are-vertical-by-capability-and-design-is-text.md)): lo que alguien viene a hacer (leer el escrutinio, reseñar, replicar, moderar), con **todo lo suyo adentro**: sus requisitos, su proceso y sus pantallas. No hay pantallas sin dueño ni carpeta de cosas compartidas: si una pantalla la tocan varias épicas, **pertenece a la que la hace existir** y las demás le aportan una acción y lo dicen en su propio README.

**Dos palabras, y no son la misma**: la **épica** es la carpeta; la **story** es un archivo adentro de ella, en `stories/`. Nada de acá tiene estado de gestión: el trabajo se planifica en [`docs/plan/`](../plan/README.md), que cita estos IDs y no los copia ([ADR-0072](../decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)).

## Qué hay adentro

```
docs/product/<capability>/
├── README.md              qué es, para quién, SUS REQUISITOS con su criterio de hecho (única copia),
│                          las decisiones que aplica, sus pantallas, lo que aporta a pantallas de otros,
│                          y lo que todavía no resuelve
├── flow.md                el proceso en mermaid: persona, disparador, pasos, ramas, salidas y errores
└── screens/<screen>/      cada pantalla que le pertenece
    ├── README.md          la ficha: quién la usa, qué stories resuelve, qué muestra por paso y por
    │                      estado, lo que no muestra nunca, adónde va, lo que deja abierto
    └── sketch.html        el boceto, HTML con los tokens del design system (mid-fi, y hi-fi en el mismo
                           archivo para las pantallas que definen el producto: git guarda el mid-fi)
```

- **La story** (`stories/US-NNN-slug.md`) vive en su épica, una sola vez y para siempre, con su criterio de aceptación. No tiene estado de gestión: cuando se planifica, [`docs/plan/`](../plan/README.md) la cita por ID y le agrega el sprint, las tareas y el contrato técnico.
- **El flujo** puede cruzar épicas: el pedido de Ana termina en la cola de Sofía. El handoff se dibuja como un nodo que nombra a la otra épica.
- **La pantalla** tiene un solo lugar: su épica dueña. El [sitemap](map.md) es el índice derivado de las 34, con su slug y quién le aporta a cada una.
- **El boceto** es de una pantalla, nunca de una story ni de una épica entera.

Lo que no se corta, porque no es de ninguna épica: la [tesis](../THESIS.md), el [glosario](language.md), las [personas](personas.md), el [catálogo de frases](phrases.md), los [ADRs](../decisions/README.md), las [revisiones](../history/reviews/README.md) y el [design system](design-system.md) (el lenguaje visual: tokens y tipografía, no una pantalla). La épica los cita.

Reglas de forma: la **carpeta se nombra en inglés, en kebab-case**, como todo identificador del repo; el nombre visible de la épica va en español en el texto. Una épica de docs no es un feature de código: sus stories se implementan en uno o más slices de código cuando se planifican.

## Índice

| Épica | Carpeta | Grupo del mapa | Persona que la pide | Stories | Pantallas |
|---|---|---|---|---|---|
| [Elegir dónde estudiar](choose-where-to-study/README.md) | `choose-where-to-study/` | O1 (+ US-135, US-136, US-137, US-138) | Valentina, Silvia, quien lee | 14 | 8 |
| [Pedir una carrera](request-a-career/README.md) | `request-a-career/` | O2 | Ana | 4 | 2 |
| [Mi carrera](my-career/README.md) | `my-career/` | O3 | Lucía | 3 | 2 |
| [Reseñar](write-a-review/README.md) | `write-a-review/` | O4 (+ US-158, US-159, US-160, US-161, US-162, US-163, US-164) | Lucía, Matías, Diego | 19 | 3 |
| [Deshacer](undo/README.md) | `undo/` | O5 | quien ya aportó; quien lee (reportar) | 3 | 4 |
| [Que no me molesten](do-not-bother-me/README.md) | `do-not-bother-me/` | O6 | quien lee, quien vuelve | 4 | ninguna: es garantía |
| [Replicar](reply/README.md) | `reply/` | O7 (+ US-179) | Claudia, Paredes, la institución | 9 | 1 |
| [Llevarse el dato](take-the-data/README.md) | `take-the-data/` | O8 | Rocío | 8 | 1 |
| [Cuidar lo publicado](care-for-what-is-published/README.md) | `care-for-what-is-published/` | T1 | quien ya aportó, quien vuelve | 3 | 1 |
| [Entrar](enter/README.md) | `enter/` | el umbral (garantías de O6) | cualquiera que va a producir | 1 | 4 |
| [Sostener el catálogo](sustain-the-catalog/README.md) | `sustain-the-catalog/` | BO1 (+ US-200/2/3/5, US-204) | Sofía, quien cura las frases | 15 | 4 |
| [Moderar sin romper el producto](moderate-without-breaking-the-product/README.md) | `moderate-without-breaking-the-product/` | BO2 (+ US-211, US-212, US-213, US-214) | Nahuel, Camila | 12 | 2 |
| [Cortar los accesos](cut-the-access/README.md) | `cut-the-access/` | BO3 (+ US-218, US-219) | Admin | 5 | 1 |
| [Avisos](notices/README.md) | `notices/` | infraestructura transversal | todos | ninguno propio | 1 |

93 stories y 34 pantallas en total.

## Las 34 pantallas

Cada una vive en su épica dueña, con su ficha y su boceto. Esta tabla es solo el índice por ID y slug de URL, que es lo único que no se deduce de la estructura de carpetas (los slugs se verificaron contra `frontend/src/app/` el 2026-08-19). **Una pantalla se nombra por lo que dice arriba**, en español; la URL es código, en inglés, y se fija al construirla.

| ID | Épica dueña | Pantalla | Slug hoy |
|---|---|---|---|
| `SC-001` | Elegir dónde estudiar | [Ficha de carrera](choose-where-to-study/screens/SC-001-career/README.md) | sin slug hoy |
| `SC-002` |  | [Ficha de cátedra](choose-where-to-study/screens/SC-002-chair/README.md) | sin slug hoy |
| `SC-003` |  | [Explorar](choose-where-to-study/screens/SC-003-explore/README.md) | `/universities` |
| `SC-004` |  | [Inicio](choose-where-to-study/screens/SC-004-home/README.md) | `/` |
| `SC-005` |  | [Ficha de institución](reply/screens/SC-005-institution/README.md) | `/universities/[slug]/careers` |
| `SC-006` |  | [Buscar](choose-where-to-study/screens/SC-006-search/README.md) | sin slug hoy |
| `SC-007` |  | [Ficha de materia](choose-where-to-study/screens/SC-007-subject/README.md) | `/subjects/[id]` |
| `SC-008` |  | [Dónde estudiarla](choose-where-to-study/screens/SC-008-where-to-study/README.md) | sin slug hoy |
| `SC-009` | Pedir una carrera | [La cola](request-a-career/screens/SC-009-queue/README.md) | sin slug hoy |
| `SC-010` |  | [Pedir](request-a-career/screens/SC-010-request/README.md) | sin slug hoy |
| `SC-011` | Mi carrera | [Mi carrera](my-career/screens/SC-011-my-career/README.md) | `/my-career` |
| `SC-012` |  | [Empezar](my-career/screens/SC-012-onboarding/README.md) | `/onboarding/*` |
| `SC-013` | Reseñar | [Anonimato](write-a-review/screens/SC-013-anonymity/README.md) | `/about` |
| `SC-014` |  | [Mi situación](write-a-review/screens/SC-014-my-status/README.md) | sin slug hoy |
| `SC-015` |  | [Reseñar](write-a-review/screens/SC-015-write-review/README.md) | `/reviews/write` |
| `SC-016` | Deshacer | [Baja](undo/screens/SC-016-delete-account/README.md) | sin slug hoy |
| `SC-017` |  | [Editar](undo/screens/SC-017-edit/README.md) | sin slug hoy |
| `SC-018` |  | [Mis aportes](undo/screens/SC-018-my-contributions/README.md) | `/reviews` |
| `SC-019` |  | [Mi perfil](undo/screens/SC-019-my-profile/README.md) | `/my-profile` |
| `SC-020` | Replicar | [Responder](reply/screens/SC-020-respond/README.md) | sin slug hoy |
| `SC-021` | Llevarse el dato | [Método](take-the-data/screens/SC-021-method/README.md) | sin slug hoy |
| `SC-022` | Cuidar lo publicado | [Verificar](care-for-what-is-published/screens/SC-022-verify/README.md) | `/verify-teacher` |
| `SC-023` | Entrar | [Error](enter/screens/SC-023-error/README.md) | sin slug hoy |
| `SC-024` |  | [Recuperar](enter/screens/SC-024-forgot-password/README.md) | `/forgot-password` |
| `SC-025` |  | [Ingresar](enter/screens/SC-025-sign-in/README.md) | `/sign-in` |
| `SC-026` |  | [Registro](enter/screens/SC-026-sign-up/README.md) | `/sign-up` |
| `SC-027` | Sostener el catálogo | [Catálogo](sustain-the-catalog/screens/SC-027-catalog/README.md) | `/admin/universities` |
| `SC-028` |  | [Correcciones](sustain-the-catalog/screens/SC-028-corrections/README.md) | sin slug hoy |
| `SC-029` |  | [Frases](sustain-the-catalog/screens/SC-029-phrases/README.md) | sin slug hoy |
| `SC-030` |  | [Pedidos](sustain-the-catalog/screens/SC-030-requests/README.md) | sin slug hoy |
| `SC-031` | Moderar sin romper el producto | [Reportes](moderate-without-breaking-the-product/screens/SC-031-reports/README.md) | `/admin/moderacion/reportes` |
| `SC-032` |  | [Verificaciones](moderate-without-breaking-the-product/screens/SC-032-verifications/README.md) | sin slug hoy |
| `SC-033` | Cortar los accesos | [Equipo](cut-the-access/screens/SC-033-team/README.md) | sin slug hoy |
| `SC-034` | Avisos | [Avisos](notices/screens/SC-034-mail/README.md) | sin slug hoy |

## Los temas del mapa que no son épicas

Los grupos transversales del mapa agrupan por riesgo o por situación, no por lo que alguien viene a hacer; sus stories viven en la épica que las implementa. El tema se conserva acá como lista, para leerlas juntas:

- **T2 · Cuando el riesgo es real (tres escenarios que rompen la promesa)**: US-158 → [Reseñar](write-a-review/README.md); US-179 → [Replicar](reply/README.md); US-136 → [Elegir dónde estudiar](choose-where-to-study/README.md); US-159 → [Reseñar](write-a-review/README.md).
- **T3 · Cuando el catálogo no alcanza (el dato existe pero no me sirve como está)**: US-160 → [Reseñar](write-a-review/README.md); US-137 → [Elegir dónde estudiar](choose-where-to-study/README.md); US-161 → [Reseñar](write-a-review/README.md); US-162 → [Reseñar](write-a-review/README.md); US-163 → [Reseñar](write-a-review/README.md); US-138 → [Elegir dónde estudiar](choose-where-to-study/README.md).
- **T4 · Y quien no está de acuerdo (discrepar no es lo mismo que denunciar)**: US-164 → [Reseñar](write-a-review/README.md).
- **BO4 · Cuando la carga no da abasto (operación diaria, no excepciones)**: US-200 → [Sostener el catálogo](sustain-the-catalog/README.md); US-201 → [Sostener el catálogo](sustain-the-catalog/README.md); US-202 → [Sostener el catálogo](sustain-the-catalog/README.md); US-211 → [Moderar sin romper el producto](moderate-without-breaking-the-product/README.md); US-203 → [Sostener el catálogo](sustain-the-catalog/README.md); US-212 → [Moderar sin romper el producto](moderate-without-breaking-the-product/README.md).
- **BO5 · Cuando el corpus está bajo ataque (tres escenarios que rompen el producto)**: US-204 → [Sostener el catálogo](sustain-the-catalog/README.md); US-213 → [Moderar sin romper el producto](moderate-without-breaking-the-product/README.md); US-214 → [Moderar sin romper el producto](moderate-without-breaking-the-product/README.md).
- **BO6 · Y quién nos mira a nosotros (lo que le pedimos a las instituciones, aplicado adentro)**: US-218 → [Cortar los accesos](cut-the-access/README.md); US-219 → [Cortar los accesos](cut-the-access/README.md).
---

## Restricciones: los requisitos no funcionales del producto

Los **requisitos no funcionales** (atributos de calidad): no dicen qué hace el producto sino con qué calidad tiene que hacerlo. Ninguna persona los pide en primera persona y aun así tienen que cumplirse en toda pantalla, así que no son story de ninguna épica. Van al [Definition of Done](../plan/definition-of-done.md), no al backlog, porque no se terminan: se sostienen.

Que nadie los perciba no los hace menores: que las constancias se destruyan al resolver y que nada publicado traiga nombre son requisitos cuyo éxito es exactamente que no se noten, y sostienen la tesis entera.

- **Accesibilidad y celular.** La lectura es pública y la mayoría llega desde el teléfono: las fichas, Método, Dónde estudiarla y el CSV se leen y se usan en un celular chico, y cumplen WCAG 2.2 AA (contraste, teclado, lectores de pantalla, texto que escala). Una ficha que solo se lee en escritorio no está terminada.
- **Datos personales (Ley 25.326).** Consentimiento informado al registrarse, aviso de privacidad público, y los derechos de acceso, rectificación y supresión resueltos por US-165 y US-166 (borrar de a uno; la baja anonimiza y preserva lo aportado, ADR-0044). Las constancias se destruyen al resolver (US-207). Nada publicado trae nombre, cuenta ni perfil (US-159).
- **La política de moderación y réplica es pública.** El criterio escrito de US-205 (qué es exposición, qué no lo es, el único caso de riesgo inmediato), el chequeo previo (US-158) y las reglas de la réplica (US-179, US-178) se publican donde se publica el método, antes de que exista el primer reporte. Nahuel aplica lo que cualquiera puede leer.
- **Rendimiento y disponibilidad de lo público.** Lo que se lee sin cuenta es lo que la mesa cita: las fichas cargan rápido y se cachean; una caída de lo público es una caída del producto, y el CSV siempre está.

## Las reglas de escritura de una story

Las stories de cada épica son los **requisitos funcionales**: qué hace el producto. Los **no funcionales** (con qué calidad lo hace) son las [Restricciones](#restricciones-los-requisitos-no-funcionales-del-producto) de más arriba cuando valen para todo el producto, y una story más de su épica cuando valen solo ahí. Lo que no es ninguno de los dos (cómo se implementa: el endpoint, el índice, el evento) no es requisito y se planifica en [`docs/plan/`](../plan/README.md).

Estas reglas son para las stories. Medidas contra INVEST (Wake), las tres C (Jeffries) y el framework QUS (Lucassen et al., 2016) en la [revisión de calidad del 17](../history/reviews/2026-08-17-catalog-quality.md):

- **Formato completo**: rol + "quiero" + "porque/para". El rol sale de la lista cerrada de dieciocho, y cada uno es una persona del producto ([user-personas](personas.md)); un requisito con un rol que no está en la lista tiene el rol mal.
- **Criterio de aceptación o no existe**: el "listo cuando". **Un criterio por línea, hasta tres**, cada uno marcable verdadero o falso por separado. Más de tres significa que está mal cortado y se parte al planificar.
- **Única**: dos stories no dicen lo mismo. Cuando es el mismo hecho visto por dos actores (el que reporta y el que modera), son un par legítimo y se enlazan en Notas.
- **Trazable**: cita las decisiones que la gobiernan, y vive en una sola épica; el resto la cita por ID.
- **Su criterio es la fuente del test**: al construirse, el "listo cuando" se traduce al test que lo verifica y el test cita el ID ([ADR-0072](../decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)).
- **Sin estado de gestión**: Status, Sprint, Priority y Effort describen el trabajo, y viven en [`docs/plan/`](../plan/README.md).

## Qué tiene que cumplir una épica

- **Alguien la pide**: hay una persona concreta que viene a hacer eso. Si no se puede nombrar, no es una épica: es parte de otra.
- **Tiene al menos una story con su criterio.** Una épica sin stories es un título. (Dos excepciones declaradas: **Avisos** y **Entrar** son infraestructura y cumplen requisitos de otras.)
- **Tiene su proceso, o dice por qué no**: `flow.md` si hay recorrido; si es una garantía que se verifica en cada pantalla, lo declara.
- **Es dueña de las pantallas que existen por ella**, y de ninguna más. Ninguna pantalla del producto queda sin dueño.
- **Se lee sola**: contiene todo lo suyo y cita lo transversal, sin copiarlo.
 Los grupos T2, T3, T4, BO4, BO5 y BO6 del mapa son **temas**, no épicas: sus stories viven en la épica que las implementa y este índice los lista por tema. Las épicas de la versión anterior (EPIC-00 a EPIC-11) están en el [ático](../history/domain-v1/epics/).
