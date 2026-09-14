# Ficha de institución (la pantalla)

> Ficha de pantalla, dueña: la épica [Responder](../../README.md). **Estado**: el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25 al modelo de [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md); **reescrita el 2026-09-14 con el catálogo adentro de planb** ([#536](https://github.com/lucasidev/plan-b/issues/536)): adentro del shell, con una tira de números de la institución, las carreras agrupadas por facultad con sus reseñas y la transparencia dicha en lenguaje de lector. Pública, se lee sin cuenta. Slug `/universities/[slug]/careers`. Épicas que la componen: [Responder](../../README.md) (dueña de la pantalla; la respuesta de la institución a sus propios números queda como hueco declarado, ver abajo), [Elegir dónde estudiar](../../../../student/choose-where-to-study/README.md) (cada carrera linkea a su propia [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md)) y [Reseñar](../../../../student/write-a-review/README.md) (el llamado a reseñar cuando faltan carreras).

## Quién la usa

**Claudia** y la institución (leen su transparencia relevada y sus notas de curaduría), **Valentina** y **Silvia** (entran antes de elegir, para ver qué carreras tienen reseñas y cómo es la institución por sus números y su transparencia, sin comparar contra otra acá: esa comparación vive en [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md)).

## Qué stories resuelve

[US-177](../../stories/US-177-track-change-across-periods/README.md) (la serie de sus propios conteos por período, "si mejoré desde que lo publicaron") y [US-232](../../../../student/choose-where-to-study/stories/US-232-see-what-the-institution-publishes/README.md) (el checklist de transparencia: qué publica y qué no, con su fecha; la lee quien está eligiendo). El bloque de la respuesta institucional en sí (con nombre y cargo, o "Sin respuesta · avisada el [fecha]" cuando no hay nada, igual que en la Ficha de cátedra) todavía no tiene story dueña ni lugar dibujado: **hueco declarado**, ver "Lo que esta ficha deja abierto".

## Qué muestra

Cuatro cosas, nunca un número que las mezcle ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)):

1. **Cabecera**: el eyebrow con el tipo ("Universidad · privada", del relevamiento), el nombre y cuántas facultades tiene; la tira de números: estudiantes y egresados con su período y su fuente (anuario SPU; "no informa" con la razón cuando la fuente no abre por institución), carreras con reseñas, y transparencia publicada ("3 de 6").
2. **Facultades y carreras**: la navegación de su plantel, agrupada por facultad (alfabético; las carreras sin facultad asignada al final), cada carrera con link a su propia [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md) y su estado: "137 reseñas" cuando publica, "con reseñas" cuando alguna cátedra juntó reseñas pero ninguna publica, y nada cuando no tiene. Ninguna carrera se esconde.
3. **Transparencia institucional, verificada a fuente pública**: el checklist editorial (actas del órgano de gobierno publicadas, presupuesto ejecutado publicado, nómina docente con condición de cargo, proporción de cargos interinos, acreditaciones al día, auditada por la AGN), cada fila con su propio estado dicho para el lector ("La institución no lo publica", con la explicación del relevamiento debajo), y al pie la fecha de relevamiento y las fuentes.
4. **De la curaduría**: una nota editorial, síntesis sin nombres a nivel institución, con su procedencia dicha ("Nota del equipo, leída de comentarios que no se publican · sin nombres · [fecha]"), cuando el equipo escribió una.

A la derecha (en pantalla ancha; debajo, en celular): "Por dónde empezar", las carreras con reseñas de más a menos, y la transparencia.

## Estados

- **Vacía**: institución cargada, sin ninguna carrera con reseñas todavía; la lista se ve entera y "Por dónde empezar" no se dibuja.
- **Sin nota de curaduría todavía**: la sección "De la curaduría" no aparece si el equipo todavía no escribió ninguna nota sobre esta institución; no se inventa una vacía.
- **Transparencia sin relevar un campo**: el checklist muestra cada fila con su propio estado, nunca un total que las mezcle; el "N de M" de la tira cuenta solo lo publicado sobre lo relevado.
- **La fuente no abre por institución** (una facultad regional dentro de una universidad nacional): la tira dice "no informa" con la razón, nunca el número de la universidad entera como si fuera propio.

## Lo que no muestra nunca

Ningún puntaje ni número que mezcle plantel, transparencia y cobertura ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)); ninguna comparación contra otra institución en esta pantalla (esa vive en [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md)); ningún nombre en la nota de curaduría; ninguna carrera escondida de la lista; ninguna regla del producto en el copy ("piso", "publica" como verbo de una carrera).

## Adónde va

Llega desde: Explorar, Buscar, la [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md) (la institución que la da) y [Pedir una carrera](../../../../student/request-a-career/README.md). Va a: la Ficha de carrera de cada carrera, "Ver fuentes" de la transparencia relevada, y Reseñar.

## Decisiones que aplica

[ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) (cada dato oficial con su fuente y su estado), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (las cuatro cosas separadas, nunca un número que las mezcle; la institución no tiene puntaje; el comparador entre instituciones vive aparte, sobre datos oficiales), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (la nota de curaduría: síntesis sin nombres, fechada, con procedencia dicha en la propia ficha).

## Lo que esta ficha deja abierto

- **La ciudad y la provincia** en la cabecera: el catálogo no las tiene todavía ([#532](https://github.com/lucasidev/plan-b/issues/532), R8).
- **El bloque de conteos propios al que responde la institución**: [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) fija que la institución responde "sobre lo que se dice de ella como sujeto (trámites, título, trato)", que es el instrumento administrativo de [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md); [US-227](../../stories/US-227-claim-an-institutional-position-to-reply/README.md) no tiene todavía dónde publicarse en esta ficha.
- **Qué story carga y mantiene la transparencia relevada**: ninguna story de ninguna épica reclama hoy esa propiedad.
- **El llamado a reseñar al pie** ("¿Estudiás acá? N carreras no tienen reseñas todavía"): el boceto lo dibuja; la pantalla lo lleva en el topbar del shell.
