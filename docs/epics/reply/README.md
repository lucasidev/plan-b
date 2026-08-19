# Replicar

> Épica del grupo **O7 · Contestar lo que se publicó (con nombre, porque es público)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Responder](screens/respond/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

La respuesta del docente o de la institución a lo que se publicó sobre su cátedra: con nombre, porque responder es un acto público. La réplica pasa el mismo chequeo previo que un comentario, no puede citar la parte que el autor dejó marcada como identificante, y espera un plazo desde el aviso al autor antes de publicarse: en ese plazo el autor edita, borra o pide revisión. Publicada, queda al lado del testimonio, con nombre y rol, sin bajarlo ni mover ningún conteo. Responder pide identidad verificada contra la cátedra del catálogo, en una cola propia separada de las constancias de alumno: para el docente, verificar es el permiso de publicar con su nombre, no una señal. Cuando no hay réplica, la ficha declara el estado del canal, nunca el silencio: "sin réplica" o "docente sin identidad verificada". Del lado de la institución, la misma lógica se lee en su ficha: la serie por período, y la comparación frase por frase contra las demás, sin puesto ni orden por valor.

## Para quién

**Claudia** (da bien su materia; le conviene que se publique y le da miedo que se publique). **Prof. Paredes** (no piensa contestar: el silencio es una posición, y no se presume). **La institución** (en qué está peor que la de al lado; si mejoró desde que lo publicaron).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O7-1 | Como el docente, quiero responder por mi cátedra con mi nombre, para que mi versión quede al lado y no abajo. | La réplica se publica al lado del testimonio, con nombre y rol, y solo desde identidad verificada; no baja el testimonio ni mueve conteos ([ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)). | épica: se parte al planificar; depende de O7-8, T2-2 |
| O7-2 | Como el docente, quiero que se vea que doy bien mi materia, porque es la primera vez que alguien lo mide. | 1. La ficha de cátedra publica los dos ejes sin mezclarlos: la cabecera con las dos proporciones y, por eje, la lista de frases con sus voces.<br>2. Exigencia alta se lee como información, no como falla; en ningún lado hay un puntaje. |  |
| O7-3 | Como la institución, quiero saber en qué estoy peor que la de al lado, porque el dato que me expone es el que me dice dónde arreglar. | 1. La ficha compara lo que se dice de ella como sujeto contra las demás cargadas, frase por frase y lado a lado, cada una con sus voces y su encogimiento.<br>2. Sin puesto, sin compuesto y sin ordenar por valor: alfabético o por voces. |  |
| O7-5 | Como el docente, quiero enterarme de que me nombraron, porque no puedo responder algo que no sé que existe. | Al docente verificado le llega un resumen periódico de lo que se publicó sobre su cátedra, sin fecha ni hora por reseña: ningún aviso permite inferir cuándo aportó alguien. | depende de avisos por mail |
| O7-6 | Como el docente, quiero que no me presuman el silencio, porque no contestar es una postura, no una admisión. | La ficha declara el estado del canal y nunca el silencio: "sin réplica" y, si aplica, "docente sin identidad verificada" (no se le pudo avisar); nunca "no quiso responder" (D06, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)). |  |
| O7-7 | Como la institución, quiero ver si mejoré desde que lo publicaron, porque arreglé el trámite, el número es de cohortes viejas, y sin serie es una foto que no me sirve para gestionar. | La ficha muestra cada proporción por el período en que pasó, con sus voces y su encogimiento, sin suavizar, con la publicación y la réplica marcadas. (Absorbe la que era O7-4.) |  |
| O7-8 | Como el docente, quiero probar que soy yo antes de responder, porque si cualquiera firma con mi nombre, mi réplica no vale nada. | La réplica no se publica sin identidad docente o institucional verificada contra el catálogo; esa verificación vive en una cola separada de la de constancias de alumno, y para el docente verificar es permiso, no señal. | depende de BO2-6; par de BO2-6 |
| T2-2 | Como quien ya aportó, quiero no quedar expuesto cuando el docente responde con nombre, porque si éramos cuatro en la comisión, su respuesta me señala sin nombrarme. | 1. La réplica no puede citar la parte del testimonio que identifica y pasa el mismo chequeo que el aporte.<br>2. Queda retenida un plazo desde el aviso: en ese plazo quien aportó edita, borra o pide revisión; si borra, la réplica no sale. | P1; depende de O7-8; tema del mapa: T2 · Cuando el riesgo es real |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (T2 · Cuando el riesgo es real): son temas, no actividades, y cada una de sus stories vive en la única épica que la implementa. El índice del [catálogo](../../domain/user-stories.md) conserva el tema como lista.

## Decisiones que aplica

[ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 5: la réplica pasa el mismo chequeo, no cita lo marcado, retenida el plazo desde el aviso, solo identidad docente o institucional verificada, queda al lado con nombre y rol, no baja ni mueve conteos; punto 6: orden por votos), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la serie por el período en que pasó, sin suavizar, con publicación y réplica marcadas; la comparación lado a lado sin ordenar por valor), D06 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): el estado del canal, "sin réplica" y "docente sin identidad verificada", nunca "no quiso responder"), [ADR-0009](../../decisions/0009-anonimato-como-regla-de-presentacion.md) (el anonimato como regla de presentación).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Responder**](screens/respond/README.md) (con identidad verificada): el testimonio con la parte no citable marcada, la respuesta con su chequeo previo, el plazo visible y cómo queda publicada; [boceto mid-fi](screens/respond/sketch.html) con sus tres pasos y sus estados.

Las que comparte con otras épicas viven en [`docs/design/screens/`](../../design/screens/README.md): **Verificar** (identidad docente, el permiso para responder) y **Ficha de institución** (la serie por período, la comparación frase por frase), además de la [Ficha de cátedra](../../design/screens/chair/README.md) (la réplica al lado del testimonio, el estado del canal, la serie). En el backoffice, **Verificaciones** y **Reportes** (la cola de retenidos, BO2-5), las dos de [Moderar sin romper el producto](../moderate-without-breaking-the-product/README.md). Los mails de [Avisos](../notices/README.md) (el resumen periódico al docente, sin timestamps por reseña) traen hasta acá.

## Lo que esta épica todavía no resuelve

- **Quién y cómo verifica la identidad institucional**: ADR-0068 dice "docente o institucional verificada", pero BO2-6 solo describe la cola del docente contra la cátedra.
- **Cuánto dura el plazo de T2-2** antes de publicar la réplica: el número falta.
- **Qué pasa con la réplica ya publicada si el testimonio se borra después**.
- **Si la institución replica sobre la ficha de institución entera o sobre el testimonio de un evento institucional puntual**.
