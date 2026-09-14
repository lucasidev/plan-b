# Explorar (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); las dos lentes existen desde R6 (V03); **reescrita el 2026-09-14 con el catálogo adentro de planb** ([#536](https://github.com/lucasidev/plan-b/issues/536)): vive adentro del shell de la aplicación (la barra lateral con Explorar primero, el topbar con el buscador y Escribir reseña, "Ingresar" sin cuenta), `/universities` es Explorar y las dos lentes son Universidades y Carreras. Pública, se lee sin cuenta. Épicas que la componen: [Elegir dónde estudiar](../../README.md) (dos lentes y lo que los datos dicen), [Pedir una carrera](../../../request-a-career/README.md) (el vacío explicado, con Pedir al lado).

## Quién la usa

**Valentina** (compara antes de decidir cinco años; si ve un número redondo lo descarta), **Ana** (busca su facultad; si el vacío no se explica acá, ya sospechó del producto), **Silvia** (entra a mirar la carrera de su hija sin saber de planes ni correlativas), y quien lee, sin cuenta, en general. No es para quien va a reseñar: esa persona ya tiene su carrera declarada y busca su materia desde [Mis aportes](../../../undo/screens/SC-018-my-contributions/README.md).

## Qué stories resuelve

[US-222](../../stories/US-222-browse-what-there-is-to-study/README.md) (la razón de que esta pantalla exista: ver qué hay para estudiar sin tener un nombre que buscar), [US-171](../../../../guarantees/README.md#stories) (nunca un puntaje ni un orden por conveniencia; alfabético o por reseñas), [US-139](../../../request-a-career/README.md#stories) (el vacío se explica y ninguno es un cero), [US-168](../../../../guarantees/README.md#stories) (sin cuenta).

## Qué muestra

1. **Dos lentes**, Universidades y Carreras, con un switch para pasar de una a otra sin escribir nada. `/universities` abre por default: es Explorar.
2. **Universidades**: cada institución con su nombre, si es pública o privada y cuántas carreras tiene ("Privada · 56 carreras"), y al lado "N carreras con reseñas" o "sin reseñas todavía". Una carrera cuenta como con reseñas cuando alguna de sus cátedras juntó al menos una, publique o no.
3. **Lo que los datos dicen**, a la derecha, en las dos lentes: cinco líneas calculadas solo con datos oficiales y conteos del catálogo, cada una con su fuente y su período, y quien no informa nombrado con la nota del hecho: la universidad más elegida (estudiantes, anuario SPU), la carrera más ofrecida (en cuántas instituciones se dicta la misma carrera canónica), la carrera con mejor tiempo de salida (egreso por cohorte, dicho como el derivado de la institución entera que es, con el link a su regla en Método), la universidad donde más alumnos avanzan (reinscriptos con dos o más materias aprobadas) y la universidad con mejor valoración de la entidad auditora (hoy UNT, la única con evaluación institucional de CONEAU relevada). Un empate se muestra como empate, con las empatadas iguales; nunca un ranking completo ni un número compuesto ([ADR-0096](../../../../../decisions/0096-explorar-interprets-official-data-by-institution-and-career.md)).
4. **Carreras**: primero las que se dictan en más de una institución, agrupadas por carrera canónica para comparar lado a lado, cada oferta con la institución, el link a su ficha y su estado ("N reseñas", "con reseñas" cuando todavía ninguna cátedra publica, "sin reseñas todavía"); después las que se dictan en una sola institución, en lista compacta. Todo alfabético (US-171).
5. **Sin cuenta** (US-168): explorar y abrir cualquier ficha desde acá no pide login.

## Estados

El vacío en sus tres estados (US-139), ninguno es un cero:
- **"No la cargamos todavía"**: no existe en el catálogo. Con el link a Pedir al lado.
- **"Sin reseñas todavía"**: existe, nadie reseñó todavía.
- **"Con reseñas"**: alguna cátedra ya juntó reseñas aunque ninguna publique; con "N reseñas" cuando alguna publica. La cobertura por materia se lee en la ficha de la carrera, no en el listado.

Una línea de "Lo que los datos dicen" sin dato lo dice ("ninguna institución publica…"); no desaparece.

## Lo que no muestra nunca

Ranking, puntaje ni orden por conveniencia (US-171); ninguna institución patrocinada, destacada ni remarcada; ninguna entrada mostrada como un cero cuando en realidad está cargada sin reseñas o con reseñas que todavía no publican (US-139); ningún número compuesto entre instituciones ni comparación que la fuente no permita (un dato de toda una universidad nacional no compite con el de una institución: se nombra con su salvedad); ninguna regla del producto (piso, cobertura) en las filas.

## Adónde va

Llega desde: [La entrada](../SC-004-entrance/README.md), un link, o vuelve desde [Buscar](../SC-006-search/README.md). Va a: [Ficha de carrera](../SC-001-career/README.md), [Ficha de institución](../../../../reviewed/reply/screens/SC-005-institution/README.md), [Dónde estudiarla](../SC-008-where-to-study/README.md), [Método](../../../take-the-data/screens/SC-021-method/README.md) (desde el derivado), [Pedir](../../../request-a-career/screens/SC-010-request/README.md), [Buscar](../SC-006-search/README.md).

## Decisiones que aplica

[ADR-0096](../../../../../decisions/0096-explorar-interprets-official-data-by-institution-and-career.md) (Explorar interpreta los datos oficiales por institución y por carrera, con hechos de un solo dato y su fuente, nunca un compuesto), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (los estados del vacío siempre a la vista, nunca ocultos detrás de un umbral), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (conteos, nunca un puntaje). Las garantías de [Que no me molesten](../../../../guarantees/README.md) que se verifican acá: sin cuenta (US-168), sin orden por conveniencia (US-171).

## Lo que esta ficha deja abierto

- **La ciudad de cada institución** en su fila ("San Miguel de Tucumán"): el catálogo no la tiene todavía ([#532](https://github.com/lucasidev/plan-b/issues/532), R8).
- **Qué hace mejor valorada a una universidad cuando haya más de una evaluada**: el informe de CONEAU no trae puntaje.
- **Si hay filtros** (provincia, modalidad) **y cuáles.**
