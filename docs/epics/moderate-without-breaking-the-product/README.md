# Moderar sin romper el producto

> Épica del grupo **BO2 · Moderar sin romper el producto (decir que no importa más que decir que sí)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README, [flujo](flow.md) y sus pantallas propias con ficha y boceto mid-fi: Reportes, Verificaciones); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Moderar acá no es sacar lo que incomoda: es bajar solo lo que expone a una persona fuera de su acto público, con el texto retirado y la voz siempre intacta ([THESIS.md](../../THESIS.md), "Posición"). Dos colas separadas hacen ese trabajo. La de **reportes** junta lo que alguien denuncia después de publicado y lo que el chequeo previo retuvo antes de publicar; la trabaja Nahuel. La de **verificaciones** junta las constancias de alumno y la identidad docente; la trabaja Camila. Las dos no pueden convivir en la misma persona. Y ninguna cantidad de reportes baja nada sola: decide una persona, con un criterio escrito y público desde antes del primer reporte.

Es moderación con un filtro previo: buena parte de lo que Nahuel resuelve nunca llegó a publicarse, porque el chequeo automático ya separó lo que habla de una persona fuera de su acto antes de que existiera como texto público. Lo que él mira a mano es la excepción, no el volumen de todo lo que se escribe.

Y es donde se resuelven las situaciones que el mapa agrupaba aparte como temas, porque pasan en la misma cola: cuando Reportes tiene cuarenta reportes y treinta retenidos, dice cuánto se tarda y qué queda para después, separa lo retenido (que nadie leyó y no está publicado) de lo reportado (que sigue publicado) y prioriza lo sin publicar, no el orden de llegada (BO4-6); una constancia adulterada se rechaza con motivo, sin marcar a quien la subió (BO4-4); un grupo de cuentas correlacionadas que reseña la misma cátedra dispara una alarma que mira la procedencia (fecha de alta, patrón idéntico, ausencia de trayectoria) y no el volumen, las cuentas marcadas dejan de sumar y los conteos se pueden congelar sin borrar nada (BO5-2); y doce reportes contra lo que critica a la misma facultad se agrupan por objetivo y ventana de 72 horas y se resuelven con un criterio, no de a uno, con el mail confirmado deduplicando (BO5-3).

## Para quién

**Nahuel** (modera: el criterio escrito de qué es exposición, que quede registrado qué bajó y por qué, que la cola de retenidos no lo convierta en el cuello del corpus) y **Camila** (verifica: ver lo mínimo para decidir, que quede registrado que lo vio, que nadie más pueda, atar al docente a la cátedra). [Cortar los accesos](../cut-the-access/README.md) es lo que hace que Nahuel y Camila no puedan ser la misma persona.

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO2-1 | Como quien modera, quiero bajar solo lo que expone a una persona, porque si bajamos lo que incomoda a la institución, plan-b deja de tener sentido. | 1. El reporte muestra motivo y criterio; la exposición protegida es la de quien aportó y la de terceros, no la del docente evaluado ni la de la institución, y la queja dura contra ellos no es causal.<br>2. Lo reportado sigue publicado hasta que se resuelve, salvo el único caso de riesgo inmediato, con criterio escrito.<br>3. Bajar exige elegir la categoría (la que la ficha muestra como texto retirado y la que O8-6 agrega); se baja el texto, nunca la voz. | épica: se parte al planificar |
| BO2-2 | Como quien modera, quiero que el que reportó sepa por qué quedó o se bajó, porque un formulario sin respuesta enseña a no volver a reportar. | Resolver un reporte manda el criterio aplicado al mail confirmado desde el que se reportó, que es el único canal porque reportar no pide cuenta, no un acuse genérico. | par de O5-4 |
| BO2-3 | Como quien modera, quiero ver lo mínimo de una constancia para decidir, porque cada nombre que veo es alguien que confió en que sería anónimo. | La verificación compara contra lo declarado y el documento se destruye al resolver. |  |
| BO2-4 | Como quien modera, quiero no poder ver qué reseñó la persona cuya constancia verifico, porque si puedo cruzarlo, el anonimato es una promesa y no un mecanismo. | 1. Desde la cola de constancias no hay ningún camino a los aportes de esa cuenta, ni por acceso directo.<br>2. La cola de identidad docente es otra y no cae bajo esta regla: verificar al docente es atarlo a la cátedra sobre la que se publica. |  |
| BO2-5 | Como quien modera, quiero una cola con lo que el chequeo previo retuvo, porque un comentario o una réplica que habla de una persona fuera de su acto no se publica hasta que alguien lo mire. | 1. La cola trae comentarios y réplicas retenidos con la parte que los retuvo marcada.<br>2. Cada uno se libera o se baja con su categoría, y quien lo escribió ve que está retenido y por qué.<br>3. Nada retenido se publica solo por vencimiento de tiempo. | épica: se parte al planificar; depende de T2-1 |
| BO2-6 | Como quien verifica, quiero una cola de identidad docente separada de la de constancias, porque para el alumno verificarse es una señal y para el docente es el permiso de publicar una réplica con su nombre. | 1. La identidad docente se prueba contra el catálogo (la cátedra que dice tener) en su propia cola; sin eso no se publica ninguna réplica.<br>2. Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie. | épica: se parte al planificar; par de O7-8 |
| BO4-4 | Como quien modera, quiero detectar una constancia adulterada, porque verificar a alguien que miente le da peso a lo que no lo tiene. | El rechazo pide motivo y el que la subió puede volver a intentar sin quedar marcado. | P2; tema del mapa: BO4 · Cuando la carga no da abasto |
| BO4-6 | Como quien modera, quiero ver la cola cuando tiene cuarenta reportes y treinta retenidos, porque a cinco minutos cada uno son seis horas de una persona y lo retenido no se publica hasta que alguien lo mire. | La cola dice cuánto se tarda y qué queda para después, separa lo retenido (que todavía nadie leyó) de lo reportado (que sigue publicado), y prioriza lo que está sin publicar, no el orden de llegada. | P1; tema del mapa: BO4 · Cuando la carga no da abasto |
| BO5-2 | Como quien modera, quiero que me avise cuando un grupo de cuentas correlacionadas reseña la misma cátedra, porque puede ser un centro organizando o el docente pidiéndoselo a sus alumnos, y eso destruye el corpus. | 1. La alarma mira la procedencia (fecha de alta, patrón idéntico, ausencia de trayectoria) y no el volumen: cuarenta personas con historia distinta no la disparan.<br>2. Las cuentas marcadas no suman voces ni entran a ningún agregado de trayectoria.<br>3. Los conteos se pueden congelar sin borrar nada. | P1; tema del mapa: BO5 · Cuando el corpus está bajo ataque |
| BO5-3 | Como quien modera, quiero ver los reportes agrupados por quién los manda, porque doce reportes sobre lo que critica a la misma facultad son una estrategia, no doce quejas. | 1. Los reportes se agrupan por objetivo y ventana (los que apuntan a la misma cátedra o institución en 72 horas se ven juntos), y el grupo se resuelve con un criterio, no de a uno.<br>2. El mail confirmado deduplica: dos del mismo mail cuentan uno (D05, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)). | P1; tema del mapa: BO5 · Cuando el corpus está bajo ataque |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (BO4 · Cuando la carga no da abasto; BO5 · Cuando el corpus está bajo ataque): son temas, no actividades, y cada una de sus stories vive en la única épica que la implementa. El índice del [catálogo](../../domain/user-stories.md) conserva el tema como lista.

## Decisiones que aplica

[ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 2: el chequeo previo con dos salidas; punto 3: se modera la exposición de quien aportó y de terceros, nunca la del docente ni la de la institución nombrados, y la queja dura contra ellos no es causal; lo reportado sigue publicado hasta resolver salvo el único caso de riesgo inmediato con criterio escrito; reportar confirma el mail; punto 4: se baja el texto, nunca la voz, con categoría; punto 5: la réplica pasa el mismo chequeo), D09 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): verificación y moderación son roles excluyentes, equipo mínimo de cuatro), [ADR-0010](../../decisions/0010-threshold-auto-hide-configurable-por-env-var.md) (superado: en el producto nuevo ningún umbral de reportes baja nada solo), [ADR-0048](../../decisions/0048-oficializacion-de-condicion-opt-in.md) (para el alumno, verificarse es señal, no permiso), las Restricciones del catálogo ([`user-stories.md`](../../domain/user-stories.md): la política de moderación y réplica es pública antes de que exista el primer reporte).

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Reportes**](screens/reports/README.md) (backoffice, rol moderación): las dos colas (lo reportado, que sigue publicado; lo retenido, sin publicar hasta que alguien mire), el criterio de exposición a la vista, la alarma de cuentas correlacionadas y los reportes agrupados; [boceto mid-fi](screens/reports/sketch.html).
- [**Verificaciones**](screens/verifications/README.md) (backoffice, rol verificación): las dos colas separadas, constancias de alumno (lo mínimo, el documento se destruye, sin camino a los aportes) e identidad docente (el permiso, contra la cátedra); [boceto mid-fi](screens/verifications/sketch.html).

Las que comparte con otras épicas: **Anonimato** y **Método** (donde la política de moderación y réplica se publica, en [Llevarse el dato](../take-the-data/README.md)), y la [Ficha de cátedra](../../design/screens/chair/README.md) (el texto retirado con su categoría).

## Lo que esta épica todavía no resuelve

- **El texto del criterio escrito de "riesgo inmediato"**: el único caso que despublica antes de resolver, y todavía falta redactarlo.
- **Qué ve exactamente Nahuel de un comentario retenido**: si es la reseña entera o solo la parte que el chequeo marcó, sin poder cruzarla con la cuenta.
- **Cómo se responde a un reporte cuyo mail confirmado rebota**: BO2-2 manda el criterio aplicado a ese mail y asume que llega.
- **Cómo se calcula "cuánto se tarda"** en Reportes y si usa el mismo cálculo que Pedidos (BO4-6, BO4-1).
- **Qué ve el público cuando los conteos de una cátedra están congelados** (BO5-2): "en revisión", los conteos de antes de congelar, u otra cosa.
- **Quién desmarca una cuenta marcada por error y cómo se entera esa persona**: hoy nada se le dice.
- **Si la alarma de BO5-2 corre sola o la dispara Nahuel** al notar un patrón sobre una cátedra, y si un ataque coordinado de reportes puede disparar el camino de "riesgo inmediato" de BO2-1 o son dos mecanismos que nunca se tocan.
