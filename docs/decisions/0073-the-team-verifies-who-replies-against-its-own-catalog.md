# ADR-0073: People reply with a name and a position, and the team verifies them against the catalog it loads itself

- **Estado**: aceptado
- **Fecha**: 2026-08-20

## Contexto

La réplica es una de las cinco decisiones de la tesis: lo publicado necesita que el evaluado pueda responder. Pero **quién puede replicar y cómo se prueba que es quien dice ser nunca se decidió**, y el catálogo lo arrastra sin darse cuenta:

- Ocho stories en [Replicar](../product/reviewed/reply/README.md): cinco con rol "el docente", dos con rol "la institución", una de quien ya aportó. **Las dos de la institución no tienen camino de verificación**: la pantalla [Verificar](../product/student/care-for-what-is-published/screens/SC-022-verify/README.md) tiene dos tarjetas (alumno, docente), no tres.
- **Del alumno, qué documento sirve queda abierto** en su propia ficha.
- Y aparece una tercera figura que no está en ningún lado: **un área de la institución** (una secretaría, un departamento), que no es ni el docente ni la institución entera.

Dos decisiones previas cierran el camino fácil. [ADR-0048](0048-standing-is-opt-in-and-decoupled-from-email.md) retiró la verificación por **email institucional** con dos razones que siguen valiendo: asume que la universidad da emails usables (falso en muchas universidades argentinas) y que controlar ese email prueba la condición (no la prueba). Y la tesis dice que **publicamos sobre instituciones que no nos delegaron nada**: cualquier mecanismo que exija su colaboración previa contradice la premisa del producto.

Queda el problema en su forma difícil: **verificar sin pedirle permiso a quien tiene todo el incentivo de no dártelo.**

## Decisión

**Replican personas con nombre y cargo, nunca entidades, y el equipo las verifica contra el catálogo que él mismo carga. El backoffice es la autoridad: maneja la app y los datos.**

1. **La réplica la firma una persona.** No existe "responde la UNSTA": responde alguien, con su nombre y su cargo, y así se publica. Esto no es nuevo, ya lo fija [ADR-0068](0068-comment-publishes-as-testimony-below-the-phrases.md) ("queda al lado del testimonio, con nombre y rol"): acá se cobra su consecuencia. **Verificar autoridad institucional es irresoluble sin colaboración; verificar que una persona es quien dice ser contra un dato que ya tenemos, no.**
2. **Dos figuras replican, y por cosas distintas**: el **docente**, sobre lo que se dice de su cátedra; **quien tiene un cargo en la institución**, sobre lo que se dice de ella como sujeto (trámites, título, trato). No se agregan "las áreas" como figura propia: multiplicaría el problema por cada dependencia sin agregar una voz distinta.
3. **Quién es quién es parte del catálogo, y el catálogo lo carga el equipo.** Es el plano 1 de la tesis, aplicado a las personas: así como las carreras, los planes y las correlativas se cargan a mano y completos, **la cátedra se carga con su equipo docente y la institución con sus cargos**. No se crowdsourcea ni se deduce de lo que alguien reclama.
4. **Verificar es comparar contra ese catálogo, y lo hace el equipo.** Quien pide replicar dice quién es; el backoffice compara contra lo que ya está cargado y decide. **No hay auto-servicio ni verificación automática**: hay una persona del equipo resolviendo una cola, con autor y fecha (US-216), como toda acción del backoffice.
5. **Si el catálogo no tiene ese dato, primero se carga.** Un pedido de réplica sobre una cátedra sin equipo docente cargado no se rechaza: se convierte en trabajo de catálogo ([Sostener el catálogo](../product/team/sustain-the-catalog/README.md)) y se resuelve cuando el dato está. El hueco es nuestro y se dice, como con cualquier ficha que no existe todavía.
6. **El alumno se verifica con el certificado de alumno regular**, que es el documento que toda universidad emite y que el alumno consigue solo, sin que nadie sepa de plan-b. Cierra la pregunta abierta de su ficha, con las reglas que ya tenía: se ve lo mínimo (US-207) y se destruye al resolver (US-208).
7. **El cargo se publica normalizado, no textual.** Lo que en una institución es "Departamento de Alumnos", en otra "Sección Alumnos" y en otra "Secretaría de Alumnos" es la misma cosa y se publica igual. El catálogo guarda una **lista corta de cargos genéricos**, no el nombre que cada institución le da al suyo: sin eso, la lista crece con cada institución cargada y deja de servir para comparar. La lista se arma al cargar las primeras instituciones y se amplía solo cuando aparece un cargo que ninguno de los existentes cubre.
8. **La verificación se revalida una vez al año.** Un cargo no es permanente: alguien deja de ser docente o cambia de área, y su réplica queda publicada firmada con algo que ya no es cierto. Al año, la verificación vence y hay que renovarla; lo ya publicado no se retira, porque era cierto cuando se publicó.
9. **Ante la duda, no se verifica.** El daño no es simétrico: una réplica falsa firmada con el nombre de una universidad destruye la credibilidad del corpus entero, y la ausencia de réplica solo deja el canal declarado como vacío. Un rechazo pide motivo y no marca a nadie (US-211): se puede volver a intentar.

## Alternativas consideradas

**A. Email institucional.** Ya se descartó en [ADR-0048](0048-standing-is-opt-in-and-decoupled-from-email.md), y sus razones no cambiaron: muchas universidades argentinas no dan emails usables, y tener uno no prueba el cargo. Un administrativo con mail del dominio no habla por la institución, y un titular de cátedra sin mail institucional sí es docente.

**B. Verificar contra la fuente pública de cada institución** (buscar a la persona en el programa de la materia o el organigrama publicado, cada vez). Pone la fuente de verdad afuera: depende de que cada universidad publique, de que siga publicando, y de que quien verifica sepa leer diez formatos distintos. **Es lo contrario del plano 1 de la tesis**, que dice que el dato base lo cargamos nosotros y no se crowdsourcea. Esas fuentes sirven como **insumo para cargar el catálogo**, que es otra cosa: se miran una vez, al cargar, no en cada verificación. Descartada como mecanismo de verificación.

**C. Documento de designación o resolución.** Prueba mejor, pero exige que la persona consiga un papel interno y que alguien del equipo sepa distinguir uno válido de uno viejo. Pide colaboración institucional para lo que es un trámite personal, y no escala a mano. Descartada.

**D. Autodeclaración con corrección posterior** (replica cualquiera, se corrige si se prueba falso). Barata y rápida, pero invierte el daño: la réplica falsa ya se publicó con nombre de la universidad, y el desmentido nunca alcanza a quien la leyó. Contradice el punto 7. Descartada.

**E. Que solo replique el docente y la institución no tenga voz.** Es la opción más simple y la tesis la respalda a medias: justifica al docente de forma explícita ("responder es un acto público, el riesgo no es simétrico") y no dice nada equivalente de la institución. Se descarta porque el instrumento pierde exactamente a quien puede arreglar lo que se denuncia: un trámite que tarda ocho meses no lo arregla un docente, lo arregla una secretaría.

**F. Verificar a la entidad, no a la persona** (que "la UNSTA" tenga una cuenta). Es lo que hace todo producto con clientes institucionales, y acá no hay cliente: exige un contrato o un aval que la tesis dice explícitamente que no existe. Descartada.

## Consecuencias

- **El catálogo crece**: la cátedra pasa a cargarse con su equipo docente, y la institución con sus cargos normalizados. Es más trabajo de carga y suma una lista corta de cargos genéricos al [glosario](../product/language.md), que hasta hoy no tiene el término. Es más trabajo de carga para [Sostener el catálogo](../product/team/sustain-the-catalog/README.md), y es el precio de que el dato base sea nuestro.
- **[Verificar](../product/student/care-for-what-is-published/screens/SC-022-verify/README.md) pasa de dos caminos a tres**: alumno (señal), docente (permiso de réplica) y cargo institucional (permiso de réplica). La ficha y su boceto se rehacen.
- **Nacen las stories que faltaban**: cargar el equipo docente y los cargos como parte del catálogo, y la verificación del cargo institucional, hoy inexistente pese a que dos stories la asumen.
- **Una réplica puede quedar esperando a que el catálogo se ponga al día**, y eso es visible: el pedido entra a la cola de catálogo con su demora, como cualquier otro (US-212).
- **La revalidación anual es una cola nueva y recurrente**: cada verificación vence al año y vuelve a la cola. Crece con el corpus, no con el uso, y hay que verla venir antes de que se acumule.
- **La app y los datos los maneja el backoffice, de punta a punta**: nada de esto se resuelve solo ni por reputación. Es coherente con [ADR-0050](0050-backoffice-is-a-cross-cutting-slice-not-a-module.md) y con la separación de roles que ya fija US-217.

## Lo que este ADR no cierra

- **Cuál es la lista de cargos genéricos**: se arma al cargar las primeras instituciones, no antes. Fijarla de escritorio sería inventar el mapa de un territorio que todavía no recorrimos.
- **Qué pasa con la réplica cuando la verificación vence** y la persona no la renueva: si el canal queda declarado como vacío otra vez, o si el cargo se publica con la fecha en que se verificó.
- **De dónde saca el equipo la planta docente y los cargos**: los programas de materia, los organigramas, lo que llegue por pedido. Es trabajo de catálogo como cualquier otro, y no necesita un criterio distinto del que ya tiene cargar una carrera.
- **Cuánto se banca la carga manual** cuando haya muchas instituciones: es el mismo techo que ya tiene el catálogo entero, no uno nuevo.

## Refs

- [ADR-0068](0068-comment-publishes-as-testimony-below-the-phrases.md) (la réplica con nombre y rol, que es la premisa de este ADR), [ADR-0048](0048-standing-is-opt-in-and-decoupled-from-email.md) (el email institucional retirado), [ADR-0050](0050-backoffice-is-a-cross-cutting-slice-not-a-module.md) (el backoffice como corte transversal), [ADR-0065](0065-attribution-is-the-axis-not-a-split.md) (el eje decide la atribución, y por eso la institución responde por lo suyo y el docente por lo suyo).
- [THESIS.md](../THESIS.md): el plano del catálogo ("lo cargamos nosotros, a mano y completo"), "publicamos sobre instituciones que no nos delegaron nada" y "el nombre del docente sí, porque responder es un acto público".
- La épica [Replicar](../product/reviewed/reply/README.md) y la pantalla [Verificar](../product/student/care-for-what-is-published/screens/SC-022-verify/README.md).
