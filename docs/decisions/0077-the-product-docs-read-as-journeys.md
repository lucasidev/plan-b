# ADR-0077: The product docs read as journeys

- **Estado**: aceptado (2026-08-22)
- **Fecha**: 2026-08-22
- **Precisa**: [ADR-0070](0070-product-requirements-are-vertical-by-capability-and-design-is-text.md), [ADR-0072](0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)

## Contexto

`docs/product/` tenía trece épicas hermanas, cada una dueña de sus pantallas y de su flujo. Al intentar ubicar un boceto nuevo apareció que esa forma escondía **dos jerarquías metidas en el mismo árbol**, y se midió en vez de discutirse:

1. **28 de las 34 pantallas las componen stories de más de una épica**, y las trece épicas aportan stories a pantallas ajenas. El "dueño" de una pantalla era en muchos casos "quien la pidió primero".
2. **Los flujos ya se salían de su épica**: los `flow.md` acumulaban 12 referencias a pantallas de otras épicas, y el de Reseñar tocaba 3 propias y 5 ajenas de cuatro épicas. Era un e2e disfrazado de flujo local.
3. **Cinco stories no eran de ninguna épica**: US-167, US-168, US-169, US-170 y US-171 aplican a las 34 pantallas. Cuatro de ellas eran toda la épica "Que no me molesten", la única sin pantallas propias, y la exigencia de trazabilidad simétrica les pedía una lista de pantallas que por definición no pueden cerrar.

El marco que ordena esto es el de los mapas de historias (Patton): **el flujo no compite con las épicas, es la columna vertebral, y las épicas son sus pasos**. La tensión existía porque no todas las épicas de planb son pasos: unas son tramos de un recorrido, otras son garantías que valen durante todo el recorrido, y otras son de otro actor (el equipo). La guía de Cucumber sobre organización de features llega a lo mismo por el otro lado: organizar por story no escala porque una feature se parte en muchas stories y una story toca muchas features; se agrupa por capacidad, y las capacidades se ordenan por el recorrido.

## Decisión

**`docs/product/` se lee como recorridos, uno por actor, y las épicas son sus tramos.**

1. **Tres recorridos**: `student/` (ocho tramos), `reviewed/` (Replicar: responde el reseñado, que es el docente o la institución con cargo verificado, US-178 y US-227; el journey se nombra por el actor que los dos comparten, porque `teacher/` dejaba a la institución invisible) y `team/` (Sostener el catálogo, Moderar, Cortar los accesos). La carpeta de cada épica se mueve un nivel adentro y no cambia por dentro.
2. **El orden de los tramos es el backbone y vive en el índice** (`docs/product/README.md`). Un e2e ("entrar y reseñar") es un segmento de esa fila, no una carpeta ni un artefacto: no existe `flows/` ni `e2e/`. El `flow.md` de cada tramo queda donde está.
3. **La pantalla vive en la épica de su acto**, como siempre: que otras épicas le pongan condiciones no la muda. Registro es de Entrar aunque cuatro épicas más le agreguen requisitos.
4. **Las garantías suben a `guarantees/`**, al nivel producto: las cinco stories que valen en toda pantalla (US-167 a US-171), cada una con su carpeta (letra + escenarios), más el checklist con el que cada ficha de pantalla se verifica. **"Que no me molesten" se disuelve como épica**: era ese conjunto de garantías con nombre de tramo. US-167 sale de Deshacer por la misma regla.
5. **Avisos queda al nivel producto** como canal: no es tramo de nadie y los tres recorridos escriben por él.
6. **La condición de esta forma es que el aro de ATDD sea corto**: la carpeta de la story es el slice (letra, escenarios, contrato cuando se planifique), el test nace de su `scenarios.md` y cita el ID. Si una reorganización futura alarga ese camino, está mal aunque ordene mejor.

## Alternativas consideradas

**A. `e2e/screens/` para las pantallas compartidas.** Se ejecutó y se revirtió el mismo día: clasificar por "cuántas épicas la tocan" movía pantallas cuya alma es un acto de una sola épica (Registro quedó fuera de Entrar), y el conteo cambia cuando se agrega una condición, así que la pantalla se mudaba de carpeta con el tiempo. Un archivo que se muda cuando le agregás una condición es lo peor que puede pasarle a una topología.

**B. Las 34 pantallas planas, sin dueño.** Descartada: 33 de las 34 fichas ya declaraban su épica dueña y esa propiedad (la del acto) es estable y correcta. Aplanar tiraba información buena para resolver un problema que estaba en otro lado.

**C. La pantalla como composición de artboards por story.** Cada story dibujaría su pedazo y la pantalla sería un `canvas.json` que los junta. Descartada porque la story no dibuja: el boceto de una pantalla es una composición que alguien tiene que juzgar entera, y partirlo agrega el trabajo de verificar que la unión cierre sin sacar ninguno.

**D. Oficializar tres ejes** (el árbol de épicas más un catálogo `screens/` y un catálogo `flows/` como vistas). Rechazada explícitamente: disgrega lo que se quiere junto, y las dos "vistas" eran listas que había que mantener a mano.

**E. Dejarlo como estaba.** Las mediciones del contexto son la razón de que no: el 82% de las pantallas cruzadas y los flujos desbordados no eran excepciones, eran la norma.

## Lo que compone, no compite

**El mapa generado.** El índice por recorridos se complementa con un mapa generado del repo (escenarios, pantallas y esfuerzo por story) que no es fuente de nada: se regenera. No compite con esta decisión; la visualiza.

## Consecuencias

- **Las tres dudas de clasificación se cerraron el 2026-08-23, leyendo los roles y no las pantallas**: (a) US-173, US-174 y US-177 se quedan en Replicar: el flag original las juzgó por la pantalla donde se resuelven, pero sus roles son el docente y la institución mirándose en el instrumento, que es el primer paso del recorrido del reseñado (me nombran, me miro, me verifico, respondo). (b) Mi carrera y Cuidar lo publicado se quedan como tramos: son momentos distintos del recorrido, no apéndices (Mi carrera es el alumno ya cursando, contra Elegir que es antes de entrar; Cuidar es volver sobre lo común, contra Deshacer que es volver sobre lo propio); tres stories es poco tramo, pero el criterio es que alguien lo pida, no un mínimo. (c) Llevarse el dato se queda en `student/` como cierre del recorrido de lectura, con su persona declarada (quien investiga): un journey propio de un solo tramo sería una carpeta por pureza. Queda una pregunta menor sin empujar: US-185 y US-186 rozan territorio de garantía, y hoy se sostienen en Método.
- **US-152 quedó señalada como la única story mal atomizada** (su tercer criterio contiene cuatro caminos y el mecanismo de US-156). Partirla es decisión aparte, antes de que entre a un sprint.
- `check-docs` valida la forma nueva: épicas adentro de un recorrido, garantías con el mismo slice (README + escenarios) e ID único, y el conteo del índice por recorridos.
- Los flujos por tramo no cambian; el recorrido completo se lee en el índice, no en un mermaid nuevo.
- El movimiento fue de 309 archivos con más de 700 links recalculados resolviéndolos; el ático no se tocó (no referenciaba nada de lo movido).

## Refs

- [ADR-0070](0070-product-requirements-are-vertical-by-capability-and-design-is-text.md) (el corte vertical por épica, que esta decisión conserva como tramo), [ADR-0072](0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md) (la story vive en su épica; ahora la épica vive en su recorrido).
- Patton, J., *User Story Mapping* (2014): el backbone como narrativa y las épicas como sus pasos.
- Cucumber, ["Solving: How to organise feature files?"](https://cucumber.io/blog/bdd/solving-how-to-organise-feature-files/): organizar por capacidad, no por story.
- Brown, S., el modelo C4: un solo modelo, vistas por audiencia; acá el modelo es el árbol y la vista es el mapa generado.
