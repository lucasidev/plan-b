# Escenarios de Moderar sin romper el producto

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-205: Bajar solo lo que expone a alguien

### Camino feliz

**E1.** Dado que Matías reseña Análisis Matemático II, Cátedra Pérez, UNSTA, 2024, primer cuatrimestre, marca la frase F18 (Hay clases que no se dan, hoy en 12 de 40 voces, 18,1%, ADR-0075) y en su comentario deja el número de teléfono personal del ayudante Ibarra para que otros lo llamen directamente, y alguien reporta ese testimonio.
Cuando Nahuel abre el reporte en Reportes.
Entonces ve el motivo que dejó quien reportó y el criterio de exposición siempre a la vista arriba de la cola, y encuentra que lo que puede exponer ahí es al ayudante Ibarra (un tercero fuera de su acto público), no a Cátedra Pérez ni a UNSTA como institución.

**E2.** Dado que el testimonio de Matías sobre Cátedra Pérez tiene ese reporte pendiente de resolver.
Cuando pasan los días sin que Nahuel lo haya mirado todavía.
Entonces el testimonio sigue publicado igual, con F18 sumando sus 12 de 40 voces (18,1%) sin ningún cambio: reportado no es lo mismo que bajado, y solo el único caso de riesgo inmediato, con criterio escrito, se despublica antes de resolver.

**E3.** Dado que Nahuel revisa el reporte contra el testimonio de Matías y decide que el número de teléfono del ayudante Ibarra expone datos de contacto de un tercero.
Cuando confirma bajar ese texto.
Entonces tiene que elegir una categoría (por ejemplo "Datos de contacto", una de las que Método muestra agregadas en US-181) antes de poder bajarlo, y al confirmar se baja el comentario, nunca la voz: F18 sigue sumando la voz de Matías en sus 12 de 40 (18,1%).

### Negativos

**N1.** Dado que un reporte contra un testimonio de Prof. Paredes en Cátedra Paredes (Análisis Matemático II, UNSTA) dice que la cátedra entera es un desastre y que toda la facultad debería revisarla, sobre un testimonio que solo marca frases duras contra esa cátedra sin exponer a ninguna persona.
Cuando Nahuel lo revisa.
Entonces no lo baja: una queja dura contra la cátedra o la institución no es causal, aunque sea muy dura, porque la exposición protegida es la de quien aportó y la de terceros, nunca la del docente evaluado ni la de la institución.

**N2.** Dado que Nahuel decide bajar el comentario de Matías por exponer el teléfono del ayudante Ibarra.
Cuando intenta confirmar la baja sin elegir ninguna categoría.
Entonces el sistema no lo deja: bajar exige elegir la categoría antes de confirmar.

### Edge cases

- Un reporte llega contra un testimonio que Nahuel ya había bajado antes por otro reporte anterior: la story no dice qué hace la cola con un reporte sobre contenido ya bajado. **Falta decidir**.
- Prof. Paredes reporta su propio testimonio después de escribirlo, arrepentido de haber contado un dato que lo identifica: la story no distingue si reportar la propia reseña se trata distinto a reportar la de otro. **Falta decidir**.
- Matías se da de baja de su cuenta mientras su testimonio todavía tiene un reporte esperando en la cola: la Baja no frena la moderación (US-166), así que Nahuel sigue resolviendo el reporte igual, ahora sobre contenido de una cuenta ya anonimizada.
- El texto exacto del criterio escrito de riesgo inmediato, el único caso que despublica antes de resolver, todavía no está redactado (README de la épica). **Falta decidir**.

## US-206: Avisar por qué se resolvió un reporte

### Camino feliz

**E1.** Dado que Prof. Paredes reportó, con su mail confirmado, el testimonio de Matías sobre Cátedra Pérez, y Nahuel lo resuelve bajando el comentario con la categoría "Datos de contacto".
Cuando la resolución se guarda.
Entonces le llega un mail a Prof. Paredes, al mismo mail confirmado desde el que reportó, con el criterio aplicado a esa resolución puntual, no un acuse genérico de "recibimos tu reporte".

**E2.** Dado que Nahuel resuelve otro reporte dejando el testimonio publicado, porque la queja era dura contra Cátedra Paredes y no expone a nadie (US-205).
Cuando esa resolución se guarda.
Entonces también le llega al mail confirmado de quien reportó un aviso con el criterio aplicado, sea cual sea la resolución: que quedó publicado y por qué.

### Negativos

**N1.** Dado que alguien reportó un testimonio pero nunca confirmó el mail con el link de confirmación.
Cuando Nahuel resuelve otros reportes de esa misma cola.
Entonces a esa persona no le llega ningún aviso: su reporte nunca entró a la cola porque el mail nunca se confirmó, así que no hay nada que resolver ni que avisar.

### Edge cases

- Cómo se responde a un reporte cuyo mail confirmado rebota: la épica lo deja abierto. **Falta decidir**.
- Un reporte que se resolvió como parte de un grupo de doce contra la misma facultad (US-214): si cada mail confirmado del grupo recibe el mismo criterio aplicado por separado o un aviso conjunto no está definido. **Falta decidir**.
- Reportar no pide cuenta, así que el mail es el único canal: no existe una notificación dentro de la cuenta de quien reportó, ni siquiera si esa persona tiene una cuenta en plan-b.

## US-207: Ver lo mínimo para verificar una constancia

### Camino feliz

**E1.** Dado que Matías declaró en su perfil que cursa Ingeniería en Sistemas en UNSTA y sube su certificado de alumno regular, con su nombre y DNI, en Verificar.
Cuando Camila abre ese pedido en la cola de constancias de Verificaciones.
Entonces ve lo mínimo para decidir: el nombre y el DNI que trae la constancia, contrastados contra lo que Matías declaró (nombre, carrera, institución), sin ver ningún otro dato de su cuenta.

**E2.** Dado que el nombre y la carrera de la constancia de Matías coinciden con lo que declaró.
Cuando Camila confirma la aprobación.
Entonces el documento que subió se destruye en ese momento: no queda ningún archivo guardado para volver a mirarlo después.

### Negativos

**N1.** Dado que el pedido de Matías todavía está pendiente, sin que Camila lo haya resuelto.
Cuando se consulta el estado de ese pedido.
Entonces el documento todavía existe: no se destruye antes de resolverse, ni apenas se sube.

### Edge cases

- El documento también se destruye si Camila rechaza la constancia, no solo si la aprueba: "al resolver" cubre las dos resoluciones (US-211).
- Matías sube una segunda constancia mientras la primera todavía está pendiente de revisión: si reemplaza a la primera o se acumulan las dos no está definido. **Falta decidir**.
- Una constancia en un formato que Camila no puede abrir o leer: la story no dice qué pasa en ese caso. **Falta decidir**.

## US-208: No cruzar verificación con lo aportado

### Camino feliz

**E1.** Dado que Camila está revisando la constancia de Matías en la cola de constancias de Verificaciones.
Cuando intenta llegar a sus reseñas o votos por cualquier camino de la interfaz, incluida una URL directa a Mis aportes de esa cuenta.
Entonces no encuentra ningún link ni acceso: desde la cola de constancias no hay ningún camino hacia los aportes de esa cuenta.

**E2.** Dado que Claudia Fernández pide verificar que es titular de Cátedra Pérez, Análisis Matemático II, UNSTA.
Cuando Camila la revisa en la cola de identidad docente, separada de la de constancias.
Entonces la compara contra el equipo docente que el catálogo tiene cargado para esa cátedra: verificarla es atarla a la cátedra sobre la que se publica, y esta cola no cae bajo la regla de "sin camino a los aportes" de las constancias de alumno, porque no hay un aporte anónimo que proteger de esa manera.

### Negativos

**N1.** Dado que Camila ya aprobó la constancia de Matías.
Cuando busca, en cualquier otra pantalla de Verificaciones, algún registro que una su nombre real con su cuenta o con lo que reseñó.
Entonces no lo encuentra: el corte es por construcción, no por buena voluntad.

### Edge cases

- El corte de esta story es dentro de la propia cola de Camila (no linkea a los aportes); que Camila y Nahuel no puedan ser la misma persona es un mecanismo aparte, ver US-217 en Cortar los accesos.
- La cola de cargo institucional (US-225) funciona igual que la de identidad docente: compara contra el catálogo, no contra aportes anónimos de una cuenta.

## US-209: Revisar lo que el chequeo retuvo

### Camino feliz

**E1.** Dado que el comentario de Lucía sobre Cátedra Pérez, donde cuenta que el titular es alcohólico y que se nota en las clases, quedó retenido por el chequeo previo con la parte "es alcohólico" marcada como lo que lo retuvo.
Cuando Nahuel abre la cola de retenidos en Reportes.
Entonces ve ese comentario con esa parte resaltada, junto con cualquier réplica retenida de la misma forma: nadie lo leyó todavía y no está publicado.

**E2.** Dado que el comentario de Lucía quedó retenido apenas intentó publicarlo, antes de que Nahuel lo haya mirado.
Cuando Lucía entra a Mis aportes.
Entonces ve que ese comentario está retenido y la razón (habla de la salud del titular, fuera de su acto público), sin tener que esperar a que el equipo lo resuelva para enterarse.

**E3.** Dado que Nahuel revisa el comentario retenido de Lucía y confirma que expone la salud del titular fuera de su acto público.
Cuando decide bajarlo.
Entonces elige la categoría "Vida privada, salud o familia" antes de confirmar.

**E4.** Dado que el comentario de Matías sobre Cátedra Pérez, "el ayudante Ibarra llega siempre tarde a las clases de consulta", quedó retenido porque nombra a un tercero.
Cuando Nahuel lo revisa y confirma que describe un acto público del ayudante en su rol de cátedra, no su vida privada.
Entonces lo libera y el comentario se publica.

**E5.** Dado que el comentario retenido de Lucía lleva diez días esperando sin que Nahuel lo haya mirado.
Cuando pasa ese tiempo.
Entonces sigue sin publicarse: nada retenido se publica solo por vencimiento de tiempo.

### Negativos

**N1.** Dado que el comentario de Lucía está retenido.
Cuando cualquiera que no sea del equipo de moderación busca leerlo en la Ficha de cátedra.
Entonces no lo encuentra: no está publicado mientras espera en la cola.

### Edge cases

- Si las frases que Lucía marcó en esa misma reseña (por ejemplo, si también marcó F18) cuentan mientras su comentario sigue retenido, o si toda la reseña espera junto con el texto: ninguna story de la épica lo dice. **Falta decidir**.
- Un comentario retenido con la parte marcada, pero cuya réplica (US-172) también quedó retenida por la misma razón: las dos conviven en la misma cola, cada una con su propia categoría al resolverse.
- Una reseña sin comentario (solo frases marcadas) nunca entra a esta cola, porque no hay texto que el chequeo previo pueda retener.

## US-210: Separar la cola de identidad docente

### Camino feliz

**E1.** Dado que Sofía cargó el equipo docente de Cátedra Pérez con Claudia Fernández como titular, activa desde 2021, y Claudia pide verificar que es la titular de esa cátedra.
Cuando Camila revisa el pedido en la cola de identidad docente, separada de la de constancias.
Entonces compara el nombre declarado contra el titular que el catálogo tiene cargado para Cátedra Pérez y, al coincidir, lo aprueba: sin esa aprobación, Responder no le habilita ningún campo para escribir la réplica.

**E2.** Dado que Camila aprueba la identidad docente de Claudia Fernández el 2026-08-21.
Cuando esa decisión se guarda.
Entonces queda con autor "Camila" y fecha "2026-08-21".

**E3.** Dado que alguien pide verificar identidad docente diciendo ser el adjunto de Cátedra Pérez, pero el nombre declarado no coincide con ningún integrante del equipo que Sofía cargó.
Cuando Camila revisa el pedido y lo rechaza, con su nombre y la fecha.
Entonces esa cuenta sigue sin campo de respuesta en Responder, y el rechazo no deja ninguna marca visible sobre ella.

### Negativos

**N1.** Dado que alguien dice ser titular de Cátedra Suárez (Química General, UNSTA) y el catálogo todavía no tiene cargado el equipo docente de esa cátedra.
Cuando pide verificar su identidad docente.
Entonces el pedido no se rechaza pero tampoco se aprueba: pasa a ser trabajo de catálogo (cargar el equipo docente) y se resuelve recién cuando ese dato está.

### Edge cases

- Dos personas piden verificarse como el mismo integrante de una cátedra (por ejemplo, las dos dicen ser "el adjunto" de Cátedra Pérez): la story no dice cuál gana. **Falta decidir**.
- Un pedido con el nombre de la cátedra mal escrito, que no coincide con ninguna fila del catálogo: si se rechaza directo o también pasa a trabajo de catálogo no está definido. **Falta decidir**.
- La identidad docente de Claudia vence al año y vuelve a esta misma cola para revisarse de nuevo (US-226), no a una cola aparte.

## US-211: Detectar una constancia adulterada

### Camino feliz

**E1.** Dado que Matías sube en Verificar una constancia de alumno regular cuyo formato no corresponde al que emite UNSTA.
Cuando Camila la revisa en Verificaciones y decide rechazarla.
Entonces tiene que escribir un motivo, por ejemplo "el formato no corresponde al de la institución declarada", antes de poder confirmar el rechazo.

**E2.** Dado que la constancia de Matías quedó rechazada con ese motivo.
Cuando Matías entra a Verificar de nuevo.
Entonces ve el estado "rechazada" con el motivo que escribió Camila, y puede subir una constancia nueva sin que su cuenta quede marcada de ninguna forma: ni advertencia, ni límite de intentos, ni ninguna señal para Camila de que ya falló antes.

### Negativos

**N1.** Dado que Camila decide rechazar una constancia.
Cuando intenta confirmar el rechazo sin escribir ningún motivo.
Entonces el sistema no la deja: el motivo es obligatorio para rechazar.

### Edge cases

- Matías reintenta varias veces seguidas con constancias que siguen sin coincidir: la story no fija un tope de intentos ni un bloqueo tras varios rechazos. **Falta decidir**.
- El motivo del rechazo es el mismo texto que ve Camila y el que ve Matías en Verificar: la story no distingue una versión interna de una versión pública del motivo.

## US-212: Mostrar la cola de moderación desbordada

### Camino feliz

**E1.** Dado que Reportes tiene 40 reportes (contenido ya publicado y denunciado después) y 30 retenidos (contenido que el chequeo previo frenó antes de publicar, que todavía nadie leyó).
Cuando Nahuel abre la cola.
Entonces ve cuánto se tarda, en promedio, en resolver cada uno y qué cantidad queda para después, con los reportes y los retenidos mostrados en secciones separadas.

**E2.** Dado esa misma cola, con 40 reportados y 30 retenidos.
Cuando Nahuel decide qué mirar primero.
Entonces la cola le prioriza los 30 retenidos por sobre los 40 reportados: lo retenido no está publicado y lo reportado sigue publicado mientras espera, así que lo sin publicar va primero.

### Negativos

**N1.** Dado la misma cola desbordada.
Cuando se arma el orden de trabajo dentro de cada sección.
Entonces nunca se ordena estrictamente por fecha de llegada: ni el más viejo de los retenidos ni el más viejo de los reportados van primero solo por antigüedad, el criterio es sin publicar antes que reportado.

### Edge cases

- Cómo se calcula exactamente "cuánto se tarda", y si usa el mismo cálculo que Pedidos (US-200), no está decidido (README de la épica). **Falta decidir**.
- Una cola sin nada pendiente, ni reportes ni retenidos: la story no dice si se muestra un estado especial o simplemente la cola vacía. **Falta decidir**.
- Hoy hay un solo moderador (Nahuel); si el equipo escalara a un segundo moderador, qué pasa cuando dos abren el mismo reporte a la vez no está resuelto en ninguna story de la épica. **Falta decidir**.

## US-213: Alertar cuentas correlacionadas por procedencia

### Camino feliz

**E1.** Dado que 15 cuentas se dieron de alta el mismo día, con un texto de reseña casi idéntico entre ellas y sin ninguna trayectoria previa (ninguna había reseñado ni votado nada antes), y las 15 marcan F18 en Cátedra Pérez dentro de una ventana de 2 horas.
Cuando el sistema evalúa la procedencia de esas cuentas.
Entonces dispara la alarma de cuentas correlacionadas sobre Cátedra Pérez, por la fecha de alta compartida, el patrón idéntico y la ausencia de trayectoria.

**E2.** Dado que Nahuel revisa esa alarma y marca las 15 cuentas como correlacionadas.
Cuando se recalcula F18 sobre Cátedra Pérez.
Entonces esas 15 voces no suman ni al numerador ni al denominador de F18, ni a ningún agregado de trayectoria de esas cuentas.

**E3.** Dado que Nahuel, después de marcar las 15 cuentas, congela los conteos de Cátedra Pérez.
Cuando se mira el estado de esa cátedra.
Entonces ninguna reseña ni comentario se borró: las 15 reseñas siguen existiendo, solo que sus voces no suman mientras estén marcadas, y los conteos quedan congelados.

### Negativos

**N1.** Dado que 40 personas, con fechas de alta y trayectorias distintas entre sí, reseñan Cátedra Pérez en la misma semana, por ejemplo tras una difusión real.
Cuando el sistema evalúa la procedencia de esas cuentas.
Entonces la alarma no se dispara solo por ese volumen: cuarenta personas con historia distinta no la disparan, la señal es la procedencia, no la cantidad.

### Edge cases

- Quién desmarca una cuenta marcada por error y cómo se entera esa persona: hoy nada se le dice (README de la épica). **Falta decidir**.
- Si la alarma corre sola o la dispara Nahuel al notar un patrón sobre una cátedra: la épica lo deja abierto. **Falta decidir**.
- Si un ataque coordinado de reportes puede disparar el camino de riesgo inmediato de US-205, o son dos mecanismos que nunca se tocan: no está resuelto. **Falta decidir**.
- Qué ve el público mientras los conteos de Cátedra Pérez están congelados ("en revisión", los conteos de antes de congelar, u otra cosa): no está decidido (README de la épica). **Falta decidir**.

## US-214: Agrupar reportes por objetivo y ventana

### Camino feliz

**E1.** Dado que, en una ventana de 72 horas, llegan 12 reportes con mail confirmado, todos contra testimonios que marcan frases duras sobre UNSTA como institución.
Cuando Nahuel abre Reportes.
Entonces ve esos 12 reportes agrupados en un solo bloque por objetivo (UNSTA) y ventana (72 horas), en vez de 12 filas sueltas.

**E2.** Dado ese grupo de 12 reportes contra UNSTA.
Cuando Nahuel revisa y confirma que ninguno expone a una persona, porque son quejas duras contra la institución y no causal (US-205).
Entonces resuelve el grupo entero de una sola vez, con ese criterio, no reporte por reporte.

**E3.** Dado que, dentro de esos 12 reportes, el mismo mail confirmado de Prof. Paredes mandó dos reportes distintos contra dos testimonios distintos sobre UNSTA dentro de la ventana.
Cuando se arma el grupo.
Entonces ese mail cuenta una sola vez en el conteo de reportantes del grupo, no dos: el mail confirmado deduplica (D05).

### Negativos

**N1.** Dado que, en la misma ventana de 72 horas, llegan reportes contra Cátedra Pérez y, por separado, reportes contra UNSTA como institución.
Cuando se arma la cola.
Entonces esos dos conjuntos no se agrupan entre sí: cada objetivo arma su propio grupo, aunque coincidan en el tiempo.

### Edge cases

- Un reporte que entra pasadas las 72 horas desde el primero del grupo: si queda afuera del grupo o si la ventana se corre con cada reporte nuevo no está definido. **Falta decidir**.
- Un reporte sin mail confirmado nunca entra a la cola (US-167), así que tampoco entra a ningún grupo.
- Un reporte que llega solo, sin ningún otro contra el mismo objetivo en la ventana, no arma grupo: se resuelve individual, con el criterio de US-205 y el aviso de US-206.

## US-225: Verificar un cargo institucional

### Camino feliz

**E1.** Dado que Sofía cargó el cargo genérico "Secretaría Académica" para UNSTA en el catálogo (US-224), y Marcela Sosa pide verificar que tiene ese cargo en UNSTA.
Cuando Camila revisa el pedido en la cola de cargo institucional, separada de constancias y de identidad docente.
Entonces compara el cargo declarado contra los cargos que el catálogo ya tiene cargados para UNSTA y, al coincidir, lo aprueba: sin esa aprobación, Responder no le habilita el campo para escribir la réplica institucional.

**E2.** Dado que alguien pide verificar el cargo "Oficina de Becas" en una institución que todavía no tiene ese cargo cargado en el catálogo.
Cuando Camila revisa el pedido.
Entonces no lo rechaza: lo pasa como trabajo de catálogo para que Sofía lo cargue, y el pedido se resuelve recién cuando el cargo esté cargado.

**E3.** Dado que Camila aprueba el cargo de Marcela Sosa el 2026-08-21.
Cuando esa decisión se guarda.
Entonces queda con autor "Camila" y fecha "2026-08-21"; y si en cambio lo hubiera rechazado, la réplica institucional seguiría sin habilitarse y la cuenta de Marcela no quedaría marcada de ninguna forma.

### Negativos

**N1.** Dado que alguien pide verificar un cargo institucional escribiendo el nombre textual exacto de su puesto en un campo libre, por ejemplo "Secretaría de Alumnos, tercer piso".
Cuando llega al paso de elegir qué cargo tiene.
Entonces no puede: solo elige entre los cargos genéricos de la lista corta del catálogo (US-224), sin ningún campo de texto libre.

### Edge cases

- Dos personas piden verificarse con el mismo cargo genérico en la misma institución, por ejemplo dos "Secretaría Académica" de UNSTA: la story no dice si eso está permitido. **Falta decidir**.
- Todavía no existe la story del lado de quien tiene el cargo pidiendo verificarse, análoga a US-178 para el docente (nota de la story). Los pasos exactos de ese pedido quedan fuera de esta traducción.
- El cargo de Marcela Sosa vence al año y vuelve a la misma cola de cargo institucional para revisarse de nuevo (US-226), no a una cola aparte.

## US-226: Revalidar la identidad verificada al año

### Camino feliz

**E1.** Dado que a Claudia Fernández le aprobaron su identidad docente como titular de Cátedra Pérez el 2025-08-21.
Cuando llega el 2026-08-21, un año después.
Entonces esa identidad vence y vuelve a la cola de Verificaciones para que Camila la revise de nuevo, con autor y fecha como cualquier otra resolución de la cola.

**E2.** Dado que a Marcela Sosa le aprobaron su cargo de Secretaría Académica en UNSTA el 2025-08-21.
Cuando llega el 2026-08-21.
Entonces ese cargo también vence y vuelve a la cola de Verificaciones, con la misma regla que la identidad docente: toda identidad verificada, sea docente o cargo institucional, vence al año.

**E3.** Dado que la réplica de Claudia Fernández al testimonio de Matías sobre Cátedra Pérez ya se publicó, firmada "Claudia Fernández, titular, identidad verificada", mientras su verificación estaba vigente.
Cuando su identidad vence al año.
Entonces esa réplica sigue publicada exactamente igual, con la misma firma: lo ya publicado no se retira cuando la verificación vence, porque era cierto cuando se publicó.

### Negativos

**N1.** Dado que la identidad docente de Claudia venció y todavía no se revalidó.
Cuando Claudia intenta escribir una respuesta nueva a otro testimonio.
Entonces Responder no le habilita el campo: para responder de nuevo necesita pasar otra vez por la cola de Verificaciones.

### Edge cases

- Entre que la identidad de Claudia vence y Camila llega a revisarla de nuevo pasa un tiempo en el que espera en la cola: si durante esa espera puede seguir usando alguna réplica ya empezada, o queda bloqueada desde el mismo día del vencimiento, no está decidido. **Falta decidir**.
- Qué pasa con la réplica ya publicada si la persona no renueva nunca más: ADR-0073 no lo decide (nota de la story y README de la épica). **Falta decidir**.
- Una identidad que vence y se revalida el mismo día: el nuevo año de vigencia cuenta desde la nueva aprobación, no desde la anterior.
