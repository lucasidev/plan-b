# ADR-0055: El filtro de contenido es un primer filtro grueso, no un veredicto

- **Estado**: aceptado
- **Fecha**: 2026-07-27 (registra una decisión ya vigente desde S5)

## Contexto

Las reseñas de planb son texto libre que un alumno escribe sobre una materia y sobre una persona con nombre y apellido, y se publican de forma anónima. Eso hace que dos cosas puedan entrar al corpus y quedarse: datos personales (de terceros o del propio autor) y agresiones dirigidas a un docente identificable.

Moderar solo por reporte no alcanza como única defensa: el reporte llega **después** de que el contenido ya se publicó y alguien lo leyó, y depende de que ese alguien se tome el trabajo. Hace falta algo que actúe en el momento de publicar.

La decisión de qué es ese algo se tomó y está implementada, pero quedó registrada en el docstring de `RegexReviewContentFilter`. Ahí la lee quien abre esa clase, no quien está por decidir algo relacionado. Y hay un ADR que ya se apoya en ella: [ADR-0013](0013-embedding-gated-en-transiciones-a-published.md) razona sobre reseñas que pasan por `UnderReview` "retenidas por filtro", o sea que un ADR aceptado depende de una decisión que no estaba escrita.

## Decisión

**El filtro es un primer filtro grueso que deriva a revisión humana, no un juez que rechaza.**

Tres consecuencias que forman parte de la decisión:

1. **No bloquea la publicación.** Cuando dispara, la reseña se guarda y entra en `UnderReview`: sale del feed público y espera decisión de un moderador. El autor no pierde lo que escribió ni recibe un rechazo automático sobre el que no puede argumentar.
2. **Sesgo deliberado hacia el falso positivo.** Ante la duda, se prefiere mandar a revisión antes que dejar pasar. Pero acotado: si cada reseña cayera en cola, la cola deja de ser útil y el moderador empieza a aprobar en automático, que es peor que no filtrar.
3. **Implementación local, sin dependencia externa.** Regex compiladas sobre una blacklist embebida más patrones de PII (email, teléfono, DNI), evaluadas en una pasada con timeout. Los dos ejes de texto se concatenan y se evalúan juntos: al que decide solo le importa si hay que revisar, no en qué campo cayó.

## Alternativas consideradas

### A. No filtrar, moderar solo por reporte

Rechazada. El reporte es reactivo por definición: el contenido ya se publicó, ya se leyó y ya hizo el daño, y encima depende de que un tercero se moleste en reportar. Para PII de un tercero es especialmente malo, porque el perjudicado puede no ser usuario de la app y no enterarse nunca.

### B. Bloquear la publicación cuando dispara

Rechazada. Un regex no tiene contexto: no distingue una mención legítima de un patrón que se le parece. Rechazar de plano castiga al autor por un falso positivo sin darle a nadie la chance de mirarlo, y en un producto que depende de que la gente aporte contenido, esa fricción se paga en reseñas que no se escriben.

### C. Servicio externo de moderación o un modelo

Rechazada por costo y por proporción. La universidad comparte la propiedad del proyecto sin aportar recursos, así que un servicio pago por volumen no es opción, y montar un modelo propio para el volumen actual es desproporcionado. La decisión se puede revisar cuando el volumen lo justifique: el filtro está detrás de una interfaz (`IReviewContentFilter`), así que cambiar la implementación no toca el flujo de publicar.

### D. Filtro más agresivo, con más patrones

Rechazada por lo mismo que el punto 2 de la decisión: una cola inflada de falsos positivos entrena al moderador a aprobar sin leer, y ahí el filtro deja de aportar seguridad y solo aporta trabajo.

## Consecuencias

**Positivas**

- Lo que dispara sale del feed **antes** de que alguien lo lea, sin depender de un reporte.
- El costo de operación es cero y no hay dependencia externa en el camino de publicar.
- La decisión final la toma una persona, que es lo que corresponde para contenido que habla de otra persona identificable.

**Negativas**

- La blacklist es una lista que alguien tiene que mantener, y envejece. No hay proceso definido para actualizarla.
- Los regex no entienden contexto: van a dejar pasar agresiones bien escritas y van a marcar texto inocente. El filtro es un piso, no una garantía.
- Un texto que dispara genera trabajo de moderación aunque sea legítimo.

**A vigilar**

- La revisión de modelos de 2026-07-26 encontró un agujero adyacente: `RestoreFromReports` devuelve a `Published` una reseña que estaba en `UnderReview` **sin re-evaluar el filtro**, porque el estado no distingue si llegó ahí por reportes o por filtro. Con el orden reportar-primero y editar-después, una reseña puede volver a publicarse con el contenido que el filtro había retenido. Está anotado como pendiente; el arreglo natural es persistir el motivo de la cuarentena.

## Refs

- [ADR-0013](0013-embedding-gated-en-transiciones-a-published.md): razona sobre reseñas retenidas por filtro; depende de esta decisión.
- [ADR-0010](0010-threshold-auto-hide-configurable-por-env-var.md): el otro camino a `UnderReview`, por acumulación de reportes. Los dos convergen en el mismo estado, y esa convergencia es la causa del agujero anotado arriba.
- [`docs/history/domain-v1/review-lifecycle.md`](../history/domain-v1/review-lifecycle.md): las transiciones completas del estado de una reseña.
