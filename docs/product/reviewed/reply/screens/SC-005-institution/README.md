# Ficha de institución (la pantalla)

> Ficha de pantalla, dueña: la épica [Responder](../../README.md). **Estado**: el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25 al modelo de [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md); **reescrita el 2026-09-14 con el catálogo adentro de planb** ([#536](https://github.com/lucasidev/plan-b/issues/536)): adentro del shell, con una tira de números de la institución, todas sus carreras agrupadas por facultad con sus reseñas y la transparencia dicha en lenguaje de lector. Pública, se lee sin cuenta. Slug `/universities/[slug]/careers`. Épicas que la componen: [Responder](../../README.md) (dueña de la pantalla; la respuesta de la institución a sus propios números queda como hueco declarado, ver abajo) y [Elegir dónde estudiar](../../../../student/choose-where-to-study/README.md) (cada carrera linkea a su propia [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md)).

## Quién la usa

**Claudia** y la institución (leen su transparencia relevada), **Valentina** y **Silvia** (entran antes de elegir, para ver qué carreras tienen reseñas y cómo es la institución por sus números y su transparencia, sin comparar contra otra acá: esa comparación vive en [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md)).

## Qué stories resuelve

[US-232](../../../../student/choose-where-to-study/stories/US-232-see-what-the-institution-publishes/README.md) (el checklist de transparencia: qué publica y qué no, con su fecha; la lee quien está eligiendo). Dos **huecos declarados**, ver "Lo que esta ficha deja abierto": [US-177](../../stories/US-177-track-change-across-periods/README.md) (la serie de sus propios conteos por período, "si mejoré desde que lo publicaron") y el bloque de la respuesta institucional en sí (con nombre y cargo, o "Sin respuesta · avisada el [fecha]" cuando no hay nada, igual que en la Ficha de cátedra), que todavía no tiene story dueña.

## Qué muestra

Nunca un número que mezcle plantel, transparencia y cobertura ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)):

1. **Cabecera**: el eyebrow con el tipo, del relevamiento ("Universidad · privada"); el nombre; y una línea con cuántas carreras tiene, en cuántas facultades, y la carrera medida cuando hay una ("56 carreras en 4 facultades. Una carrera medida: la Tecnicatura en Desarrollo y Calidad de Software."). Dice "unidades académicas" cuando alguna unidad no es una facultad.
2. **La tira de números**: estudiantes y egresados con su período ("7.660 estudiantes en 2023"; "No publicado" cuando la fuente no los da para esta institución), carreras con reseñas y cuántos datos de transparencia publica sobre los relevados ("0 de 4 datos de transparencia que la institución publica").
3. **Facultades y carreras**: todas las carreras de la institución, agrupadas por facultad, cada una con link a su [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md) y su estado: "137 reseñas" cuando junta reseñas publicadas, "con reseñas" cuando las que tiene todavía no alcanzan, y atenuada cuando no tiene ninguna; las que no son oficiales llevan la marca "No oficial". Primero las facultades y las carreras con reseñas, de más a menos, y después el orden alfabético; las carreras sin facultad asignada, al final. Ninguna carrera se esconde.
4. **A la derecha** (en pantalla ancha; debajo, en celular):
   - **Por dónde empezar**: las carreras con reseñas publicadas, de más a menos ("la única carrera con reseñas por ahora · 4 de 21 materias"; con varias, "67 reseñas · 4 de 21 materias").
   - **Identidad institucional**: el dato completo del relevamiento, con su fuente y su período; cuando la fuente no lo da, "No publicado por falta de datos" con la explicación debajo.
   - **Transparencia · verificado a fuente pública**: el checklist editorial (actas del órgano de gobierno publicadas, presupuesto ejecutado publicado, nómina docente con condición de cargo, proporción de cargos interinos, acreditaciones al día, auditada por la AGN), cada fila con su estado dicho para el lector ("La institución no lo publica", con la explicación del relevamiento debajo; lo publicado, con su fuente y su período), y al pie la fecha del relevamiento y "Ver fuentes".
5. **Sin pie**: Escribir reseña queda en el topbar.

## Estados

- **Vacía**: institución cargada, sin ninguna carrera con reseñas todavía; la lista se ve entera y "Por dónde empezar" no se dibuja.
- **Sin carreras cargadas**: el cuerpo lo dice ("Esta universidad todavía no tiene carreras cargadas.").
- **Transparencia sin relevar**: la sección lo dice ("Todavía no relevamos la transparencia de esta institución."); con un relevamiento parcial, cada fila muestra su propio estado, nunca un total que las mezcle.
- **La fuente no abre por institución** (una facultad regional dentro de una universidad nacional, o una institución que no informó al anuario): la tira dice "No publicado" en estudiantes y egresados, nunca el número de la universidad entera como si fuera propio.

## Lo que no muestra nunca

Ningún puntaje ni número que mezcle plantel, transparencia y cobertura ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)); ninguna comparación contra otra institución en esta pantalla (esa vive en [Dónde estudiarla](../../../../student/choose-where-to-study/screens/SC-008-where-to-study/README.md)); ninguna carrera escondida de la lista; ninguna regla del producto en el copy ("piso", "publica" como verbo de una carrera).

## Adónde va

Llega desde: Explorar, Buscar, la [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md) (la institución que la da, por las migas) y [Pedir una carrera](../../../../student/request-a-career/README.md). Va a: la Ficha de carrera de cada carrera y las fuentes de la transparencia relevada.

## Decisiones que aplica

[ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) (cada dato oficial con su fuente y su estado), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (plantel, transparencia y cobertura por separado, nunca un número que los mezcle; la institución no tiene puntaje; el comparador entre instituciones vive aparte, sobre datos oficiales).

## Lo que esta ficha deja abierto

- **La ciudad y la provincia** en la cabecera: el catálogo no las tiene todavía ([#532](https://github.com/lucasidev/plan-b/issues/532), R8).
- **Por qué falta el número de estudiantes o de egresados**: la tira dice "No publicado" y el relevamiento guarda la razón (el anuario no abre por facultad regional, la institución no informó), que la ficha todavía no muestra.
- **La nota del equipo sobre la institución** ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)): la Ficha de carrera ya muestra la suya; esta todavía no lee ninguna.
- **La serie por período** ([US-177](../../stories/US-177-track-change-across-periods/README.md)): la tira muestra el último período relevado, no la evolución.
- **El bloque de conteos propios al que responde la institución**: [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) fija que la institución responde "sobre lo que se dice de ella como sujeto (trámites, título, trato)", que es el instrumento administrativo de [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md); [US-227](../../stories/US-227-claim-an-institutional-position-to-reply/README.md) no tiene todavía dónde publicarse en esta ficha.
- **Qué story carga y mantiene la transparencia relevada**: ninguna story de ninguna épica reclama hoy esa propiedad.
