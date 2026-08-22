# Escenarios de Sostener el catálogo

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-191: Ver qué falta antes de lo cargado

### Camino feliz

**E1.** Dado que en Catálogo hay tres ofertas: "Ingeniería en Sistemas de Información" (UTN) con 6 huecos (entre ellos duración nominal y carrera canónica, más 4 no bloqueantes), "Licenciatura en Nutrición" (USPT) con 2 correlativas sin cargar, e "Ingeniería en Sistemas" (UNSTA) publicada y sin huecos.
Cuando Sofía abre Catálogo.
Entonces la lista abre ordenada por cantidad de huecos: primero "Ingeniería en Sistemas de Información" (6 huecos), después "Licenciatura en Nutrición" (2 huecos), y al final "Ingeniería en Sistemas" (publicada, sin huecos), nunca por orden alfabético ni por fecha de carga.

**E2.** Dado que "Ingeniería en Sistemas de Información" (UTN) tiene 6 huecos: duración nominal, carrera canónica, y 4 más (materias canónicas del plan sin cargar).
Cuando Sofía abre esa oferta.
Entonces duración nominal y carrera canónica se marcan aparte, como los dos huecos que bloquean publicar, distinguidos de los otros 4 que no bloquean.

### Negativos

**N1.** Dado que "Ingeniería en Sistemas de Información" (UTN) ya tiene resuelta la duración nominal (5 años) pero todavía le falta atar la carrera canónica. Cuando Sofía intenta tocar "Publicar oferta". Entonces el botón queda deshabilitado y la oferta no se publica, aunque los otros 5 huecos, incluidos los 4 no bloqueantes, ya estén cargados: alcanza con que falte uno solo de los dos bloqueantes.

### Edge cases

- Una oferta recién creada, sin ningún campo cargado todavía, aparece primera en la lista con el conteo máximo de huecos.
- Sofía carga la duración nominal y cierra la pestaña antes de seguir con las materias canónicas: al volver, el hueco de duración nominal ya no aparece y el resto sigue pendiente, sin perder lo ya guardado.
- Dos ofertas con la misma cantidad de huecos: el criterio de desempate no está definido (Falta decidir: "cómo se prioriza entre varios huecos bloqueantes a la vez" queda abierto en la ficha de la pantalla).
- Resueltos los dos huecos bloqueantes pero con huecos no bloqueantes todavía pendientes: publicar se habilita igual, porque solo bloquean los dos marcados aparte.

## US-192: Ordenar la cola por demanda

### Camino feliz

**E1.** Dado que en Pedidos hay tres carreras pedidas: "Ingeniería en Sistemas de Información" (UTN) con 34 pedidos confirmados, "Licenciatura en Nutrición" (USPT) con 21, y "Profesorado en Educación Física" (SIGLO 21) con 9.
Cuando Sofía abre Pedidos.
Entonces la lista se ordena 34, 21, 9 (de mayor a menor pedidos confirmados), y cada fila muestra la institución de origen (UTN, USPT, SIGLO 21) junto al conteo.

### Negativos

**N1.** Dado que "Profesorado en Educación Física" (SIGLO 21) entró a la cola hace apenas 2 días con 9 pedidos, y "Licenciatura en Nutrición" (USPT) entró hace 14 días con 21 pedidos. Cuando la cola se ordena. Entonces "Licenciatura en Nutrición" aparece antes que "Profesorado en Educación Física" pese a ser más vieja en la cola: el orden es estrictamente por pedidos confirmados (21 contra 9), nunca por antigüedad ni por orden de llegada.

### Edge cases

- Dos carreras con la misma cantidad de pedidos confirmados: el criterio de desempate no está definido (Falta decidir).
- Un mail que pidió una carrera pero nunca confirmó el link no suma al conteo de esa fila (D03).
- Una carrera que ya se publicó sale de esta cola: no vuelve a contarse acá aunque sigan llegando lecturas de su ficha.

## US-193: Avisar a quienes esperaban al terminar

### Camino feliz

**E1.** Dado que "Ingeniería en Sistemas de Información" (UTN) tiene 34 mails confirmados que la pidieron y ya está publicada en Catálogo, sin huecos bloqueantes pendientes.
Cuando Sofía toca "Marcar como cargada" en Pedidos.
Entonces salen 34 mails "Cargamos lo que pediste" con el link a la ficha ya cargada, que se lee sin cuenta, y la fila de "Ingeniería en Sistemas de Información" (UTN) sale de la cola de Pedidos.

### Negativos

**N1.** Dado que "Licenciatura en Nutrición" (USPT) todavía tiene 2 huecos sin resolver y no está publicada en Catálogo. Cuando Sofía intenta tocar "Marcar como cargada" en Pedidos. Entonces la acción no se habilita y no sale ningún aviso: no se puede marcar como cargada una oferta que todavía no se publicó.

### Edge cases

- Una carrera cargada por el criterio de arranque del primer día (US-203), con 0 pedidos confirmados: al marcarla como cargada no sale ningún mail, porque no hay a quién avisar.
- El mismo mail pidió la misma carrera dos veces (D03, un mail cuenta una vez por carrera): recibe un solo aviso, no dos.
- El servicio de mail falla al mandar el aviso a los 34 confirmados: si se reintenta solo o hay que volver a tocar "Marcar como cargada" no está definido (Falta decidir; ver también Avisos, "qué pasa si el mail rebota").

## US-194: Contrastar la corrección contra la fuente

### Camino feliz

**E1.** Dado que llega una corrección propuesta sobre "Duración nominal · Ingeniería en Sistemas, UNSTA": valor viejo "5 años", valor nuevo propuesto "5,5 años", con la fuente "plan de estudios 2024, publicado por la facultad".
Cuando Sofía abre esa corrección en Correcciones.
Entonces ve el valor viejo (5 años) y el valor nuevo propuesto (5,5 años) lado a lado, contrastados contra esa fuente.

**E2.** Dado el mismo caso de E1, con la fuente confirmando 5,5 años.
Cuando Sofía toca "Aplicar".
Entonces el dato pasa a 5,5 años para todos, sin votación, y queda registrado "aplicada por Sofía el 17 de agosto de 2026".

### Negativos

**N1.** Dado que llega una corrección propuesta sobre la correlativa de Análisis Matemático II (UNSTA), pidiendo cambiarla de "para rendir" a "para cursar", y la fuente oficial confirma que sigue siendo "para rendir". Cuando Sofía contrasta la propuesta contra esa fuente y toca "Rechazar" con el motivo "la fuente oficial confirma 'para rendir'; la propuesta decía 'para cursar'". Entonces el valor viejo ("para rendir") se mantiene sin cambios, y la corrección queda registrada como rechazada, el 15 de agosto de 2026, con ese motivo.

### Edge cases

- Cola sin correcciones pendientes: la pantalla dice que está al día, nadie propuso un cambio desde la última revisión.
- La sesión de Sofía expira mientras está contrastando una corrección: la corrección sigue en la cola sin aplicarse ni rechazarse, nadie la marca como revisada a medias.
- Dos correcciones propuestas sobre el mismo campo al mismo tiempo, con valores distintos: si se muestran las dos o la segunda se descarta no está definido (Falta decidir).
- Una corrección aplicada por error: no hay camino de deshacer descrito (Falta decidir; ver también Correcciones, "el criterio para rechazar").

## US-195: Declarar dos ofertas como la misma carrera

### Camino feliz

**E1.** Dado que "Ingeniería en Sistemas de Información" (UTN) se está cargando y ya existe la carrera canónica "Ingeniería en Sistemas", usada hoy por "Ingeniería en Sistemas" (UNSTA).
Cuando Sofía busca "Ingeniería en Sistemas" en el paso de atar la carrera canónica y la selecciona, en vez de crear una nueva.
Entonces "Ingeniería en Sistemas de Información" (UTN) queda atada a la carrera canónica "Ingeniería en Sistemas", con el registro "atada por Sofía el 19 de agosto de 2026".

**E2.** Dado que "Ingeniería en Sistemas de Información" (UTN) e "Ingeniería en Sistemas" (UNSTA) están atadas a la misma carrera canónica "Ingeniería en Sistemas".
Cuando alguien abre Dónde estudiarla para "Ingeniería en Sistemas".
Entonces aparecen las dos ofertas (UTN y UNSTA) lado a lado, y ninguna oferta de una carrera canónica distinta, como "Licenciatura en Nutrición" (USPT), entra en esa comparación.

### Negativos

**N1.** Dado que "Licenciatura en Nutrición" (USPT) no tiene ninguna carrera canónica atada todavía, aunque su nombre se parezca al de otras ofertas de nutrición de otras instituciones. Cuando se arma la comparación de Dónde estudiarla. Entonces "Licenciatura en Nutrición" (USPT) NO se agrupa con ninguna otra oferta solo porque el nombre se parece: sin una decisión del catálogo registrada con autor y fecha, queda sola.

### Edge cases

- Una oferta atada a la carrera canónica equivocada por error: el criterio para desatar y volver a atar no está descrito (Falta decidir).
- Una oferta sin ninguna carrera canónica atada todavía: es uno de los dos huecos bloqueantes de US-191, no puede publicarse.
- Dos ofertas parecidas pero no iguales (por ejemplo, dos ingenierías con orientaciones distintas): quién decide si son la misma carrera canónica no tiene criterio escrito (Falta decidir, la épica lo deja abierto).

## US-196: Cargar la cátedra como entidad propia

### Camino feliz

**E1.** Dado que "Análisis Matemático I" (Ingeniería en Sistemas de Información, UTN) no tiene ninguna cátedra cargada todavía.
Cuando Sofía carga una cátedra nueva con materia "Análisis Matemático I", titular "R. Domínguez", equipo "1 adjunto, 2 ayudantes" y "vigente desde: 2024".
Entonces la cátedra queda guardada como entidad propia, distinta de una comisión, y en el período siguiente (2024-C2) sigue siendo la misma cátedra, sin recargarse de cero.

**E2.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) ya está cargada con su equipo, cada integrante con su nombre.
Cuando Lucía reseña esa cursada en Reseñar y se le pregunta la cátedra que recuerda.
Entonces "Análisis Matemático I, R. Domínguez" aparece en la lista que Reseñar ofrece.

**E3.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) ya tiene cargado su equipo completo, con el nombre de cada integrante: el titular R. Domínguez, un adjunto y dos ayudantes.
Cuando llega un pedido de réplica de alguien que dice ser el adjunto de esa cátedra, y Camila lo verifica.
Entonces Camila compara el nombre declarado contra el nombre del adjunto que ya está cargado en Catálogo: la verificación se hace contra ese dato, nunca contra lo que la persona declara de sí misma.

### Negativos

**N1.** Dado que la cátedra "Análisis Matemático I, R. Domínguez" (UTN) tiene cargados un titular, un adjunto y dos ayudantes, y llega un pedido de réplica de alguien que dice ser un segundo adjunto que el catálogo no tiene cargado. Cuando Camila compara ese pedido contra el equipo cargado. Entonces Camila NO agrega ese nombre al equipo de la cátedra a partir de lo que la persona declaró: si no está cargado, no cuenta como parte de la cátedra hasta que Sofía lo cargue.

### Edge cases

- Cambia el titular de una cátedra ya cargada: si sigue siendo la misma entidad o se vuelve una cátedra nueva no está definido (Falta decidir, la épica lo deja abierto explícitamente).
- Una materia con dos cátedras en paralelo, cada una con su propio equipo docente en el mismo período: se cargan como entidades separadas.
- Una cátedra sin ningún integrante cargado todavía y llega un pedido de réplica sobre ella: qué pasa con ese pedido es ADR-0073 punto 5, y es territorio de US-225 en Replicar, no de esta story.

## US-197: Vincular materias declaradas a la canónica

### Camino feliz

**E1.** Dado que en la cola de materias declaradas de "Ingeniería en Sistemas" (UNSTA) hay dos pendientes: "Taller de Programación", nombrada por 7 personas, y "Bases de Datos II", nombrada por 3.
Cuando Sofía abre esa cola en Catálogo.
Entonces ve "Taller de Programación" con "7 personas la nombraron" y "Bases de Datos II" con "3 personas la nombraron".

**E2.** Dado que "Taller de Programación" (7 personas) es, en el fondo, el mismo contenido que la materia canónica "Programación I" ya cargada en el plan.
Cuando Sofía toca "Vincular a Programación I".
Entonces "Taller de Programación" queda vinculada a "Programación I", con el registro "vinculada por Sofía el 21 de agosto de 2026", y las 7 reseñas que la nombraban empiezan a contar para "Programación I".

**E3.** Dado que "Bases de Datos II" (3 personas) no coincide con ninguna materia canónica ya cargada del plan.
Cuando Sofía toca "Fusionar o crear nueva" y decide crear una materia canónica nueva.
Entonces se crea "Bases de Datos II" como materia canónica, con el registro de quién lo hizo, y las 3 reseñas pendientes pasan a contar para esa materia nueva.

### Negativos

**N1.** Dado que "Taller de Programación" todavía está pendiente de vincular, sin vincularse ni fusionarse. Cuando alguien mira la ficha de "Programación I" o la cobertura de "Ingeniería en Sistemas" (UNSTA). Entonces las 7 reseñas de "Taller de Programación" NO cuentan en la ficha de "Programación I" ni entran a la cobertura de la carrera todavía (D08): solo su autor la ve como pendiente en Mis aportes.

### Edge cases

- Una materia declarada nombrada por una sola persona entra igual a la cola, sin piso mínimo para aparecer.
- Vincular "Bases de Datos II" a una canónica que en realidad es otra materia distinta: qué pasa con las reseñas ya sumadas si se corrige después no está definido (Falta decidir, la épica lo deja abierto).
- Una materia del plan viejo que ya no está en el plan nuevo, tras una reforma (US-204), entra acá como pendiente de vincular contra la materia canónica.

## US-198: Editar la frase en un solo lugar

### Camino feliz

**E1.** Dado que el catálogo de frases tiene 46 filas, entre ellas F18 "Hay clases que no se dan" (sujeto cátedra, eje gestión, sentido negativo).
Cuando quien cura las frases edita la redacción, el sujeto o el eje de F18 desde Frases.
Entonces el cambio se guarda en ese único lugar, sin una segunda copia editable en ninguna otra pantalla, con el registro "último cambio: quien cura las frases, 21 ago 2026".

**E2.** Dado que F18 "Hay clases que no se dan" tiene eje gestión, y hoy está marcada en 3 cátedras, 2 materias, 2 carreras y una institución.
Cuando quien cura las frases cambia su eje de gestión a exigencia.
Entonces el sistema avisa, antes de confirmar, que se van a reprocesar esas 3 cátedras, 2 materias, 2 carreras y una institución, y recién al confirmar esas 8 fichas se reprocesan con F18 del lado de exigencia.

**E3.** Dado que, antes del cambio, F18 tenía 37 de 100 voces en la Ficha de cátedra de "Análisis Matemático I, R. Domínguez" (UTN): 37% en crudo, publicado con su encogimiento en 28,2%; y en otra de las tres cátedras afectadas, más chica, tenía 4 de 4 voces (100% en crudo, encogido a 51,0%).
Cuando se confirma el cambio de eje de F18, de gestión a exigencia, y esas fichas se reprocesan.
Entonces las dos siguen mostrando la misma proporción de F18 (28,2% y 51,0% respectivamente), pero ahora en la lista de exigencia en vez de la de gestión: el número de voces no cambia, cambia dónde se atribuye.

**E4.** Dado que el catálogo de frases tiene sus 46 filas con redacción, sujeto y eje ya curados.
Cuando alguien abre Método.
Entonces la lista que Método publica es exactamente esas 46 filas, sin ninguna frase de más ni de menos.

### Negativos

**N1.** Dado que quien cura las frases empieza a editar el eje de F18 de gestión a exigencia, y ve el aviso de que esto va a reprocesar 3 cátedras, 2 materias, 2 carreras y una institución. Cuando cancela la edición en vez de confirmar. Entonces F18 sigue con eje gestión en las 8 fichas afectadas, y ninguna se reprocesa.

### Edge cases

- Corregir la redacción de una frase sin tocar su eje no dispara el aviso de reproceso de atribución, porque el eje no cambió.
- Dos personas del equipo editando la misma frase al mismo tiempo: qué pasa si los dos cambios chocan no está definido (Falta decidir).
- Una frase recién creada, con cero fichas donde está marcada: cambiar su eje no reprocesa ninguna ficha, pero el catálogo igual guarda el cambio con autor y fecha.
- El límite de longitud de una redacción nueva o corregida no está definido (Falta decidir).

## US-199: Revisar frases destiladas antes de ofrecerlas

### Camino feliz

**E1.** Dado que la destilación propuso la candidata "Tardan semanas en devolver la nota", a partir de tres comentarios de reseñas distintas: "tardaron un mes en devolvernos el primer parcial", "todavía espero la nota del final de julio" y "en la mesa de diciembre recién nos dijeron la nota de agosto".
Cuando quien cura las frases abre la cola de curaduría en Frases.
Entonces ve la candidata con sus tres comentarios de origen, sin la cuenta que escribió cada uno.

**E2.** Dado la misma candidata "Tardan semanas en devolver la nota", sin sujeto ni eje asignados todavía.
Cuando quien cura las frases la aprueba asignándole sujeto "cátedra" y eje "gestión", y confirma "Confirmar y marcar como destilada".
Entonces recién ahí queda disponible para marcarse al reseñar una cátedra, ofrecida como frase destilada.

**E3.** Dado que "Tardan semanas en devolver la nota" ya fue aprobada (sujeto cátedra, eje gestión) y, desde entonces, 3 de las 10 personas que reseñaron la cátedra "Análisis Matemático II, Cátedra Pérez" (UNSTA) la marcaron: 30% en crudo, publicado con su encogimiento en 10,8%.
Cuando alguien abre esa Ficha de cátedra.
Entonces "Tardan semanas en devolver la nota" aparece en la lista de gestión con "3 de 10 voces" (10,8%) y la marca "síntesis", nunca como una cita textual de una reseña puntual.

### Negativos

**N1.** Dado que la candidata "Tardan semanas en devolver la nota" todavía está en la cola de curaduría, sin aprobar ni descartar. Cuando Lucía reseña "Análisis Matemático II, Cátedra Pérez" (UNSTA) y ve las frases disponibles para marcar. Entonces "Tardan semanas en devolver la nota" NO aparece entre las frases que puede marcar: no se ofrece hasta que se apruebe.

**N2.** Dado que quien cura las frases descarta la candidata "Tardan semanas en devolver la nota" en vez de aprobarla. Cuando alguien busca esa candidata después, en Frases o en cualquier ficha pública. Entonces no aparece en ningún lado: no se ofrece nunca, y no queda rastro público de que existió.

### Edge cases

- Cola de curaduría vacía: no hay candidatas esperando desde la última revisión.
- La primera persona que marca una destilada recién aprobada la sostiene sola: 1 de 1 voces, encogida a 20,7%, se publica igual, sin piso.
- Dos frases con el mismo 30% en crudo publican proporciones distintas según cuántas voces las sostienen (3 de 10, encogida a 10,8%, contra 12 de 40, encogida a 18,1%): el encogimiento depende de cuántas voces hay, no solo del porcentaje crudo.
- Una candidata descartada por error no tiene camino de recuperación, porque descartar no deja rastro.
- Cuántos comentarios hacen falta para que la destilación proponga una candidata no está definido (Falta decidir, la épica lo deja abierto).

## US-200: Mostrar el ritmo real de la cola

### Camino feliz

**E1.** Dado que Pedidos tiene 217 pedidos en cola repartidos en 54 carreras distintas, y el ritmo real de carga es de 2 carreras por semana, con 8 de las 11 carreras pedidas este mes ya cargadas.
Cuando Sofía abre Pedidos.
Entonces arriba de la lista se muestra "se tarda, en promedio: 12 días" (desde que la carrera entra a la cola hasta que se publica) y "este mes: 8 de 11", con la aclaración de que, a dos por semana, las últimas 3 quedan para el mes que viene.

**E2.** Dado el mismo estado de la cola: 217 pedidos, 54 carreras, 12 días de promedio, 8 de 11 este mes.
Cuando alguien sin cuenta abre La cola, la vista pública.
Entonces ve los mismos dos números ("se tarda, en promedio: 12 días" y "este mes: 8 de 11"), sin el detalle operativo propio del backoffice, como la lista completa de 54 filas con su fecha de entrada a la cola.

### Negativos

**N1.** Dado que 3 de las 11 carreras pedidas este mes no se van a cargar dentro del mes al ritmo de 2 por semana. Cuando se muestra el número "este mes: 8 de 11". Entonces la pantalla NO dice que esas 3 se van a cargar igual ni promete una fecha puntual para ninguna: solo declara que quedan afuera del mes, sin fingir que se resuelve todo.

### Edge cases

- Cola con un solo pedido, recién arrancado el producto: el promedio se calcula igual, aunque sea sobre muy pocos casos.
- La ventana sobre la que se promedia "cuánto se tarda" no está definida (Falta decidir, la épica lo deja abierto explícitamente).
- Una carrera que queda afuera del mes dos meses seguidos: si escala de prioridad o sigue esperando en la misma posición no está definido (Falta decidir).

## US-201: Corregir una oferta ya publicada

### Camino feliz

**E1.** Dado que "Ingeniería en Sistemas" (UNSTA) está publicada, y su correlativa dice "Análisis Matemático II pide Álgebra aprobada para cursar", cuando en realidad la facultad pide "regularizada".
Cuando Sofía corrige el campo a "Análisis Matemático II pide Álgebra regularizada para cursar" y guarda.
Entonces el dato queda corregido en la oferta publicada, sin necesidad de despublicarla.

**E2.** Dado el mismo caso de E1, y que 40 personas tienen esa correlativa marcada en Mi carrera.
Cuando Sofía guarda la corrección.
Entonces las 40 personas reciben el aviso de qué cambió: de "Álgebra aprobada" a "Álgebra regularizada" para cursar Análisis Matemático II.

### Negativos

**N1.** Dado que "Licenciatura en Nutrición" (USPT) todavía no está publicada, porque le faltan 2 correlativas, y por lo tanto nadie la tiene marcada en Mi carrera. Cuando Sofía edita una de esas correlativas antes de publicar. Entonces no sale ningún aviso: editar antes de publicar no es "corregir una oferta ya publicada", así que no hay a quién notificar todavía.

### Edge cases

- Un campo corregido que nadie tenía marcado: guardar el cambio no dispara ningún mail, pero el dato queda corregido igual.
- Dos correcciones directas sobre el mismo campo el mismo día: si cada guardado dispara su propio aviso o solo el último no está definido (Falta decidir).
- La corrección directa de Sofía en Catálogo y una corrección propuesta por un tercero en Correcciones (US-194) son dos caminos distintos para el mismo dato: cuál gana si coinciden en el tiempo no está definido (Falta decidir).

## US-202: Cargar con una fuente no oficial

### Camino feliz

**E1.** Dado que la facultad de "Ingeniería en Sistemas de Información" (UTN) no publica el reglamento de correlatividades completo.
Cuando Sofía carga "Análisis Matemático II pide Álgebra para cursar" y marca el campo como "fuente: no oficial", con la aclaración "reconstruida a partir del reglamento de correlatividades 2022; la facultad no publica el plan vigente completo".
Entonces el campo se guarda igual: la falta de fuente oficial no bloquea la carga.

**E2.** Dado ese mismo campo cargado como "fuente: no oficial" y la oferta ya publicada.
Cuando alguien lee la ficha pública de "Ingeniería en Sistemas de Información" (UTN).
Entonces esa correlativa se muestra con la marca de que no viene de una fuente oficial.

### Negativos

**N1.** Dado un campo con fuente oficial confirmada, como la duración nominal de "Ingeniería en Sistemas" (UNSTA), cargada con fuente "plan de estudios 2024, publicado por la facultad". Cuando alguien lee esa ficha pública. Entonces ese campo NO muestra la marca de "fuente: no oficial": la marca solo aparece en los campos que efectivamente se cargaron sin fuente oficial.

### Edge cases

- Un campo marcado "fuente: no oficial" que llega después a Correcciones: la pantalla dice que no hay fuente oficial con la que contrastar, en vez de exigir una que no existe (US-202 aplicado dentro de US-194).
- La facultad publica, más adelante, la fuente oficial que faltaba: si el campo se "oficializa" solo o alguien tiene que recargarlo a mano no está definido (Falta decidir).
- Dos fuentes no oficiales que se contradicen entre sí, por ejemplo dos versiones de un reglamento que no coinciden: con cuál se queda el catálogo no está definido (Falta decidir).

## US-203: Decidir qué cargar el primer día

### Camino feliz

**E1.** Dado que Pedidos no tiene ningún pedido confirmado todavía, el primer día del producto.
Cuando Sofía abre Pedidos.
Entonces la pantalla no se ve vacía: muestra un criterio explícito de qué cargar primero (por ejemplo, las carreras de las personas del equipo, las más pedidas en otros sitios, o una por universidad para tener cobertura amplia desde el día uno), en vez de decir solo "no hay pedidos".

**E2.** Dado el mismo estado: sin pedidos confirmados todavía.
Cuando alguien sin cuenta abre La cola, la vista pública.
Entonces ve el mismo criterio de arranque explicado del lado público, en vez de una cola vacía.

### Negativos

**N1.** Dado que Pedidos no tiene ningún pedido confirmado todavía. Cuando alguien abre Pedidos o La cola esperando ver la cola. Entonces la pantalla NO se queda vacía sin explicación: no muestra un estado "no hay pedidos" desnudo, porque esta story existe justamente para que eso no pase.

### Edge cases

- Entra el primer pedido confirmado después de días de cola vacía con el criterio de arranque: si ese criterio desaparece de una o convive un tiempo con la cola por demanda no está definido (Falta decidir).
- El criterio de arranque concreto (cuál lista, cuáles carreras) no está decidido: la épica lo deja abierto explícitamente (Falta decidir: si es una lista escrita o una decisión que se toma cada vez).

## US-204: Que la reforma no parta el corpus

### Camino feliz

**E1.** Dado que "Ingeniería en Sistemas" (UNSTA) tiene Plan 2019 (deprecado, sigue existiendo para quien ya lo cursa) y Plan 2024 (vigente, el que se ofrece a quien entra ahora).
Cuando Sofía carga el plan nuevo.
Entonces Plan 2019 no se borra ni se reemplaza: los dos planes coexisten, cada uno con su año.

**E2.** Dado que "Análisis Matemático I" es la materia canónica de "Ingeniería en Sistemas" (UNSTA) tanto en el Plan 2019 como en el Plan 2024: bajo el Plan 2019 acumuló 70 voces de reseñas cursadas entre 2019 y 2023 (38 de ellas marcaron F01 "Es dura de verdad"), y bajo el Plan 2024 acumuló 50 voces de reseñas cursadas desde 2024 (22 marcaron F01).
Cuando alguien abre la Ficha de materia de "Análisis Matemático I".
Entonces las reseñas de las dos épocas se suman en la misma ficha: 120 voces en total, 60 marcaron F01, 50% en crudo publicado con su encogimiento en 41,2%, porque cada reseña quedó pegada al período en que se cursó y a la materia canónica, no a la fila del plan.

### Negativos

**N1.** Dado el mismo caso de "Análisis Matemático I" bajo el Plan 2019 y el Plan 2024. Cuando se calcula la cobertura de "Ingeniería en Sistemas" (UNSTA), cuántas materias canónicas tienen voces sobre el total (D04). Entonces "Análisis Matemático I" cuenta como una sola materia canónica con voces, no como dos materias distintas que duplicarían el denominador.

### Edge cases

- Alguien nombra al reseñar una materia que existía en el Plan 2019 pero ya no está en el Plan 2024: entra como pendiente de vincular contra la materia canónica (US-197), igual que cualquier materia declarada.
- Dos ofertas de la misma institución en dos planes: si Dónde estudiarla las compara como una columna sola o como dos no está definido (Falta decidir, la épica lo deja abierto explícitamente).
- La Ficha de carrera listando uno o los dos años del plan: no está definido (Falta decidir, la épica lo deja abierto explícitamente).

## US-224: Normalizar el cargo institucional

### Camino feliz

**E1.** Dado que en UNSTA el puesto se llama "Departamento de Alumnos", en USPT "Sección Alumnos" y en SIGLO 21 "Secretaría de Alumnos", y el catálogo ya tiene el cargo genérico "Área de alumnos" en su lista corta.
Cuando Sofía carga el cargo de cada institución.
Entonces las tres quedan atadas al mismo cargo genérico "Área de alumnos", y ninguna se publica con su nombre textual original.

**E2.** Dado que alguien responde una réplica desde el cargo "Área de alumnos" de UNSTA, cargado a partir del textual "Departamento de Alumnos".
Cuando esa réplica se publica en la ficha pública.
Entonces se lee "Área de alumnos, UNSTA", nunca "Departamento de Alumnos".

**E3.** Dado que la lista corta de cargos genéricos hoy tiene "Área de alumnos" y "Secretaría académica", y ninguno cubre el puesto de una institución nueva que se está cargando, "Oficina de Becas".
Cuando Sofía no encuentra un cargo genérico que le sirva.
Entonces agrega "Área de becas" como cargo nuevo a la lista corta, ampliándola solo porque ningún cargo existente lo cubría.

### Negativos

**N1.** Dado que la lista corta de cargos genéricos ya tiene "Área de alumnos". Cuando Sofía carga una cuarta institución cuyo puesto se llama "Dirección de Alumnos", el mismo trabajo con otro nombre textual. Entonces Sofía NO crea un cargo genérico nuevo para "Dirección de Alumnos": lo ata al "Área de alumnos" ya existente, porque la lista se amplía solo cuando aparece un cargo que ninguno de los existentes cubre, no cada vez que cambia el nombre textual.

### Edge cases

- El primer día, antes de cargar ninguna institución, la lista corta de cargos genéricos está vacía: se arma al cargar las primeras instituciones, no antes.
- Un cargo textual ambiguo que podría atarse a dos genéricos distintos, por ejemplo "Secretaría General" entre trámites y títulos: a cuál se ata no está definido caso por caso (Falta decidir, la lista concreta se arma recorriendo instituciones reales).
- Un cargo genérico que deja de tener instituciones cargadas debajo: si se retira de la lista o queda igual no está definido (Falta decidir).
