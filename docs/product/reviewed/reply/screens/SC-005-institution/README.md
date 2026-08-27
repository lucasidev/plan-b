# Ficha de institución (la pantalla)

> Ficha de pantalla, dueña: la épica [Responder](../../README.md). **Estado**: **el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25 al modelo de [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)**: sin puntaje, la ficha es la navegación de su plantel (carreras con datos), su transparencia relevada (verificada a fuente pública, con fecha y fuentes), las notas de curaduría ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)) y su cobertura como llamado a reseñar; **este README reescribe el cuerpo de la ficha al mismo boceto**. Pública, se lee sin cuenta. Slug hoy `/universities/[slug]/careers` (el chasis; la ficha se rehace). Épicas que la componen: [Responder](../../README.md) (dueña de la pantalla; la respuesta de la institución a sus propios números queda como hueco declarado, ver abajo), [Elegir dónde estudiar](../../../../student/choose-where-to-study/README.md) (cada carrera de la lista linkea a su propia [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md)) y [Reseñar](../../../../student/write-a-review/README.md) (el llamado a reseñar cuando faltan carreras).

## Quién la usa

**Claudia** y la institución (leen su transparencia relevada y sus notas de curaduría), **Valentina** y **Silvia** (entran antes de elegir, para ver qué carreras tienen datos y cómo es la institución por su transparencia, sin comparar contra otra acá: esa comparación vive en [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md)).

## Qué stories resuelve

[US-177](../../stories/US-177-track-change-across-periods/README.md) (la serie de sus propios conteos por período, "si mejoré desde que lo publicaron"). El bloque de la respuesta institucional en sí (con nombre y cargo, o "Sin respuesta · avisada el [fecha]" cuando no hay nada, igual que en la Ficha de cátedra) todavía no tiene story dueña ni lugar dibujado en el boceto: **hueco declarado**, ver "Lo que esta ficha deja abierto".

## Qué muestra

Cuatro cosas, nunca un número que las mezcle ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)):

1. **Cabecera de identidad**: nombre de la institución, tipo (pública o privada), provincia, cantidad de facultades y de estudiantes.
2. **Carreras con datos**: la navegación de su plantel, cada carrera con su facultad y su cantidad de reseñas, link a su propia [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md); las carreras sin datos publicables todavía se listan aparte ("Otras N carreras · todavía sin datos publicables"), nunca ocultas.
3. **Transparencia institucional, verificada a fuente pública**: un checklist editorial (actas del órgano de gobierno publicadas, presupuesto ejecutado publicado, nómina docente con condición de cargo, proporción de cargos interinos, acreditaciones al día), cada fila con su propio estado, y al pie "Relevado el [fecha] contra sitio institucional, CONEAU y AGN · Ver fuentes".
4. **De la curaduría**: una nota editorial en itálica, síntesis sin nombres a nivel institución, con su procedencia dicha ("Nota del equipo, leída de comentarios que no se publican · sin nombres · [fecha]").

Y el cierre: **cobertura como llamado a reseñar** ("¿Estudiás acá? N carreras no tienen datos todavía. La tuya puede ser la próxima.") con el botón a Reseñar.

## Estados

- **Vacía**: institución cargada, sin ninguna carrera con datos todavía; se ve igual que "carreras con datos" en cero, con el llamado a reseñar como única salida.
- **Sin nota de curaduría todavía**: la sección "De la curaduría" no aparece si el equipo todavía no escribió ninguna nota sobre esta institución; no se inventa una vacía.
- **Transparencia sin relevar un campo**: el checklist muestra cada fila con su propio estado (publicado, no publicado, o el número relevado), nunca un total que las mezcle.

## Lo que no muestra nunca

Ningún puntaje ni número que mezcle plantel, transparencia y cobertura ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)); ninguna comparación contra otra institución en esta pantalla (esa vive en [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md), y ahí tampoco se cruzan señales de reseñas entre instituciones); ningún nombre en la nota de curaduría; ninguna carrera sin datos escondida de la lista.

## Adónde va

Llega desde: Explorar, Buscar, la [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md) (la institución que la da) y [Pedir una carrera](../../../../student/request-a-career/README.md). Va a: la Ficha de carrera de cada carrera con datos, "Ver fuentes" de la transparencia relevada, y Reseñar cuando falta la propia.

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (las cuatro cosas separadas, nunca un número que las mezcle; la institución no tiene puntaje; el comparador entre instituciones vive aparte, sobre datos oficiales), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (la nota de curaduría: síntesis sin nombres, fechada, con procedencia dicha en la propia ficha).

## Lo que esta ficha deja abierto

- **El bloque de conteos propios al que responde la institución**: [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) fija que la institución responde "sobre lo que se dice de ella como sujeto (trámites, título, trato)", que es el instrumento administrativo de [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (trámites, infraestructura, becas; declarado también en [`phrases.md`](../../../../phrases.md)); pero el boceto todavía no dibuja ese bloque ni el "Sin respuesta · avisada el [fecha]" que le correspondería, así que [US-227](../../stories/US-227-claim-an-institutional-position-to-reply/README.md) no tiene todavía dónde publicarse en esta ficha.
- **Qué story carga y mantiene la transparencia relevada**: ninguna story de ninguna épica reclama hoy esa propiedad.
- **Si "sus cursadas" muestra también un agregado propio** (los dos bloques sumando todas las cursadas de todas sus carreras) o solo la lista de carreras con link a cada ficha, que es lo que muestra este boceto.
