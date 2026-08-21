# Cómo se escribe una story, y cómo se planifica

Dos artefactos, dos lugares, y ninguno repite al otro.

| | Dónde vive | Qué dice | Qué NO dice |
|---|---|---|---|
| **La story** | `docs/product/<épica>/stories/US-NNN-slug.md` | qué quiere el usuario, cuándo está lista y en qué pantallas se resuelve | nada de estado, sprint, estimación ni implementación |
| **La pantalla** | `docs/product/<épica>/screens/SC-NNN-slug/` | cómo se ve y cómo se recorre ([contrato](screen-template.md)) | qué tiene que lograr: eso lo dicen sus stories |
| **La planificación** | acá, en [`status.md`](status.md) | en qué sprint entra, cómo va, en qué tareas se parte | nada de lo que el producto tiene que hacer: eso lo dice la story |

---

## La story

```markdown
# US-NNN: <título corto en español, lo que la story pide>

**Épica**: [Reseñar](../README.md)
**Del mapa**: O4-1

## Historia

Como <rol>, quiero <lo que quiere>, porque <por qué le importa>.

## Listo cuando

- <criterio verificable, marcable verdadero o falso por alguien de afuera>
- <hasta tres; más de tres significa que la story está mal cortada>

## Dónde se resuelve

- [Reseñar](../screens/SC-015-write-review/README.md): <qué parte de esta story pasa en esa pantalla>

<Las pantallas donde esta story ocurre, con una línea cada una. Si la story no tiene pantalla (una garantía, un mail, una regla de fondo), se dice acá por qué. La ficha de cada pantalla lista esta story del otro lado, y `check-docs` valida que las dos listas coincidan.>

## Notas

<dependencias con otras stories, decisiones que la gobiernan, lo que deja abierto. Se omite si no hay.>
```

**El nombre del archivo**: `US-NNN` (identificación, estable para siempre) más un slug en inglés kebab-case de 3 a 6 palabras que dice de qué trata, igual que los ADRs de este repo. La épica la dice la carpeta, no el nombre.

### Las reglas que la sostienen

- **El ID no cambia nunca.** Ni al moverse de épica, ni al reescribirse, ni al repriorizarse. Es lo que citan el commit, la branch, el test y el PR: si cambia, se rompe la trazabilidad hacia atrás.
- **El ID no lleva semántica.** Ni el grupo, ni la capa, ni la partición, ni la prioridad. Todo lo que se codifica adentro de un ID se vuelve mentira cuando cambia. En la versión anterior `-b` terminó significando "backend" en unas y "segunda parte" en otras, y el prefijo del mapa ya no describía dónde vivía una de cada cuatro stories.
- **El slug se congela al crear.** Si la story cambia tanto que el slug miente, no es la misma story: es una nueva con número nuevo, y la vieja se marca superada. Igual que un ADR.
- **La story no se parte por razones de ejecución.** Nunca. Si es grande, se planifica en varias tareas; el ID no se toca. Se parte solo si resulta que describía dos cosas distintas, o sea si estaba mal escrita, y entonces son dos stories nuevas.
- **El rol sale de la lista cerrada** de dieciocho, y cada uno es una persona del producto ([personas](../product/personas.md)). Un rol que no está en la lista es un rol mal puesto.
- **Sin estado de gestión.** Status, Sprint y Effort describen el trabajo, no el producto, y viven acá.
- **Su criterio es la fuente del test.** Al construirse, cada "listo cuando" se traduce al test que lo verifica y el test cita el ID ([ADR-0072](../decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)). Un criterio que no se puede traducir a test está mal escrito.

## Lo que no es una story

- **Los requisitos no funcionales** (accesibilidad, Ley 25.326, política de moderación pública, rendimiento): nadie los pide en primera persona y no se terminan nunca, se sostienen. Son las [Restricciones](../product/README.md) y se verifican en el [Definition of Done](definition-of-done.md), en cada story.
- **El trabajo técnico sin producto atrás** (migrar EF, arreglar el CI, la poda del planificador): no hay usuario ni valor que describir. Es una tarea de sprint, se anota en [`status.md`](status.md) y no tiene story que citar; su commit ya se identifica con el scope de Conventional Commits.

---

## La planificación

Una story entra a un sprint cuando está lista para construirse, y ahí se le define el trabajo. Eso vive en [`status.md`](status.md), en la sección de su sprint:

```markdown
### US-NNN · <título de la story>  → [ficha](../product/<épica>/stories/US-NNN-slug.md)

**Estado**: Planificada | En curso | Done (PR #NN)
**Effort**: S | M | L

**Contrato técnico** (el cómo, que la story no dice porque no le corresponde):
- `PATCH /api/<recurso>/{id}`; el rechazo por autoría viaja como 403.
- Emite `<Algo>Changed` por el outbox.

**Tareas**:
- [ ] backend: <qué>
- [ ] frontend: <qué>

**Escenarios de test**: uno por cada "listo cuando" de la story, en Given-When-Then, citando el ID.

**Edge cases**: los que apliquen (flujo abandonado, fallas de red, concurrencia, sesión que expira, datos vacíos, accesibilidad, tiempo).

**Notas de implementación**: decisiones no obvias y deuda diferida explícita.
```

La capa (backend, frontend, infra) es un **atributo de la tarea**, no parte de ningún identificador: se escribe en la tarea y se cambia sin renombrar nada.

### Definition of Ready

Una story entra a sprint cuando:

- [ ] Tiene su "listo cuando" escrito, y cada criterio se puede traducir a un escenario de test.
- [ ] Su contrato técnico está definido para lo que la story no cubre.
- [ ] Las dependencias con otras stories están resueltas o diferidas con razón.
- [ ] Las tareas están desglosadas.
- [ ] El scope está declarado: qué queda explícitamente afuera.

El [Definition of Done](definition-of-done.md) dice cuándo sale.

---

## Bases

- **INVEST** ([Bill Wake, 2003](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/)): independiente, negociable, valiosa, estimable, chica, testeable.
- **Las tres C** (Ron Jeffries, 2001) y [Mike Cohn](https://www.mountaingoatsoftware.com/agile/user-stories): la story es el soporte de una conversación, y su confirmación es el criterio de aceptación.
- **Given-When-Then** ([Thoughtworks](https://www.thoughtworks.com/insights/blog/applying-bdd-acceptance-criteria-user-stories)): mapea 1:1 a tests, que es lo que impide que el criterio driftee en silencio.
- **Una sola fuente con referencias** (Cyrille Martraire, *Living Documentation*): si el dato hace falta en otro lado, se referencia y nunca se copia. Es la regla que gobierna esta separación entera.
