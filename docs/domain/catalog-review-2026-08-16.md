# Revisión adversarial del catálogo (2026-08-16)

Segunda vuelta sobre las bases del producto nuevo, esta vez buscando el caso que las rompe en vez de leerlas asintiendo: tres lentes en paralelo (las nueve personas caminando las stories; ocho adversarios atacando; el modelo de datos que las stories exigen sin decir), sobre [THESIS.md](../THESIS.md), [user-stories.md](user-stories.md), [user-personas.md](user-personas.md) y [product-map.md](product-map.md). Salieron 39 hallazgos; muchos son la misma falla vista desde tres lados. Acá están consolidados por raíz, con la evidencia y una propuesta por cada uno. **Es insumo para decidir, no decisiones**: lo que Lucas resuelva se propaga a la tesis y al catálogo, y este doc queda como registro de por qué.

Lo que las tres lentes coincidieron en señalar como lo más grave: **el catálogo tiene una sola story de privacidad de agregados (T2-4) escrita como si el problema fuera un umbral, cuando son cinco problemas distintos**. ADR-0063 lo había marcado como "diseño de día cero"; el catálogo lo resolvió con una línea. Los grupos A y B de abajo son eso.

---

## A · El piso de personas: cinco fallas donde había una story

**A1. El desbloqueo 1/5/15 contradice el piso el día uno.** `product-map.md` dice "con uno aparece la primera frase"; THESIS y T2-4 dicen "ningún conteo público sale por debajo del piso". Mostrar la primera frase de una cátedra con un aporte publica una celda de n=1: en una comisión de siete, con período visible, el docente sabe quién habló esta semana. Y la auditoría del mapa lo había marcado como "consistencia verificada" contra ADR-0054 (null vs cero), que es el ADR equivocado: el piso es ADR-0047. Además una fila con conteo 1 en el CSV *es* una fila por persona, que O8-1 prohíbe.
→ **Propuesta**: nada se publica (frase, conteo, testimonio) sobre un sujeto cuyo corpus está bajo el piso; una ficha con 1 a 4 aportes dice "todavía no alcanza para publicar" y muestra su n. Reescribir los desbloqueos del mapa y borrar la "consistencia verificada" falsa. Esto se lleva puesta a T2-3 tal como está ("qué se desbloquea con el primer aporte" tiene que ser "cuántos faltan").

**A2. "Personas" es una unidad que el sistema no puede medir.** Aportar pide cuenta y nada más; el registro no verifica; verificarse es opcional. Cinco mails descartables = n=5 = se encienden los dos números en 25 minutos. Y con una sola cuenta: T3-5 acepta un segundo aporte "si la cátedra o el período cambian", y el período lo declara el aportante, así que una persona declara seis períodos y son seis "personas" para el piso. BO5-2 no lo ve: seis períodos distintos es un aporte por celda.
→ **Propuesta**: definir el denominador. El piso cuenta **cuentas con señal de independencia** (antigüedad mínima o verificación), y la ficha publica n_total y n_verificadas por separado; el desbloqueo mira la segunda o una combinación explícita. Además: la clave de unicidad del aporte es (cuenta, materia, período declarado), sin la cátedra (que es opcional y no puede ser clave). Y hace falta el remedio que hoy no existe: **recalcular excluyendo un conjunto de cuentas** (con la ficha declarando "hubo una corrección"), porque el único remedio escrito es congelar, o sea quedarse con el número envenenado.

**A3. Celda homogénea sobre población chica.** Comisión de seis, los seis tocan "hay clases que no se dan": conteo 6 pasa el piso de 5, y el docente, que tiene la lista de seis, sabe con certeza qué dijo cada uno. El piso protege cuando la celda es heterogénea; unánime sobre población chica no protege nada, y ese es exactamente el caso que el producto existe para producir.
→ **Propuesta**: si el conteo de una frase iguala o casi iguala el tamaño conocido de la unidad en ese período, se publica un nivel arriba (la cátedra agregando períodos), no al nivel del período. Es un tradeoff real (se pierde granularidad justo donde el dato es más fuerte) y por eso se decide explícito.

**A4. Entre snapshots, cada aporte es un delta visible.** La ficha y el CSV son válidos foto por foto; nadie mira la diferencia entre dos fotos. El decanato baja el CSV los lunes: de 12 a 13 es una persona, con ventana de siete días y cruzable con quién pasó por Bedelía. Peor con los deltas negativos: si O5-1 permite borrar y el conteo baja de 13 a 12, la institución confirma que su presión funcionó y qué había dicho el que se fue.
→ **Propuesta**: el conteo público y el CSV son **cortes con fecha**, no el estado de ahora; los aportes entran al corte siguiente; dos cortes consecutivos nunca difieren en menos que el piso (si no llega, se acumula). Es la única forma en que O5-1 y O8-1 conviven.

**A5. O7-5 le da al evaluado un canal de vigilancia con timestamp.** "Al docente verificado le llega el aviso cuando su cátedra recibe una valoración": martes da clase, martes 22:40 le llega el mail, y con tres semanas la intersección de "estuvo en la clase previa al aviso" son dos personas. Nosotros se lo mandamos.
→ **Propuesta**: el aviso al docente es agregado y diferido (cuando la cátedra cruza el piso, o resumen del período); ningún aviso permite inferir cuándo se hizo un aporte. La necesidad real de Claudia y Paredes se cumple igual con un digest.

**A6. T3-4 no puede ser verdadera y segura a la vez.** "Mis aportes muestran cuánto se movió el número de esa cátedra": si la cátedra está bajo el piso, le muestra a una persona un conteo que el piso prohíbe, y como conoce su propio aporte deriva el de los otros (y Paredes se hace una cuenta, aporta sobre su propia cátedra, y T3-4 le entrega el número). Si no se lo muestra, Matías ve lo que ya vivió: aportó y nada se movió.
→ **Propuesta**: mis aportes muestran solo lo que ya es público; bajo el piso muestran cuántos faltan para que se encienda, nunca el valor parcial.

**A7. El CSV de O8-1 es más fino que la ficha.** La ficha publica dos números por (entidad, período); el CSV publica el desglose por frase. Con seis aportantes la ficha pasa el piso, y en el CSV la fila "hay clases que no se dan | cátedra X | 2024-C2 | 1" es una celda de n=1. THESIS dice "lo que se descarga es lo que se publica"; las dos cosas no pueden ser ciertas.
→ **Propuesta**: decidir a qué granularidad vive el piso, y esa define el esquema del CSV. Lo consistente: el piso vale por celda del CSV también, y las filas bajo piso se suprimen declarándolo (el CSV trae una fila de "celdas suprimidas: N").

## B · El texto libre: existe implícito y nadie lo creó

**B1. Cinco stories protegen o usan un texto que ninguna story define.** O4-1 dice "sin escribir nada **obligatorio**"; T2-1 (P1) "si lo que **escribí** me delata"; T3-3 "retomar lo que empecé a **escribir**"; BO2-4 "no poder ver qué **escribió**"; el flujo 12 "escribe en contar". Y la tesis dice "se tocan frases, no se escribe en una pantalla en blanco". O hay un campo de texto libre opcional (sin story que lo cree, acote, modere ni le defina si entra a los números), o dos P1 son inconstruibles. En cascada: T1-1 vota "testimonios" (¿se vota un set de frases idéntico al de otro?), BO2-1 baja "lo que expone" (¿bajar qué, si son frases nuestras?), O8-6 cuenta "testimonios bajados".

**B2. Y si existe, deshace el argumento del pivote.** ADR-0063 justificó el viraje diciendo que la curaduría concentra el riesgo "en texto que escribimos y controlamos nosotros, no en texto libre de terceros". Con texto libre publicado: me registro, elijo la cátedra de la docente que me bochó, toco frases suaves y en el texto escribo una acusación falsa sobre su vida privada. T2-1 chequea si me delata *a mí* (no), "decido yo si lo dejo", se publica. La única defensa es reactiva (reporte + Nahuel), y Paredes por definición no reporta.
→ **Propuesta (una decisión de producto, dos opciones)**: **(a) el texto no se publica**: alimenta la curaduría (el canal "ninguna de estas describe lo mío" que ADR-0063 pide en "a vigilar"), el backoffice tiene la cola de textos que no encontraron frase, y T2-1/T2-2 se reescriben (lo que delata es la combinación cátedra + período + rol, y se fusionan con T2-4). Coherente con la tesis y con el pivote. **(b) el texto se publica**: hace falta una story que lo cree con tope, que no entre a los números, que pase T2-1 *y* una revisión previa cuando nombra o describe a una persona, y BO2-1 tiene que decir que el docente nombrado cuenta como persona expuesta. Mi recomendación es (a); es la única que no reabre lo que el pivote cerró.

## C · La réplica: sin identidad probada, sin palanca, sin curaduría

**C1. Nadie verifica que el docente sea el docente.** O7-1 publica la respuesta con nombre; O7-5 habla de "docente verificado"; ninguna story del catálogo nuevo crea la verificación docente. Las cuatro de verificación son de alumno, y T1-3 fija "verificarse no es condición para hablar", que para el alumno es correcto y para el docente es catastrófico: cualquiera con cuenta publica una respuesta firmada "Claudia Fernández". Y BO2-4 ("ningún camino de la verificación a los aportes") es imposible para el docente: verificarlo es exactamente atarlo a la cátedra que tiene los aportes. Además `verificar` mezcla los dos objetos (constancia de alumno, identidad docente), y el mecanismo docente quedó sin nada desde que ADR-0048 deprecó el email institucional y US-091/092 nunca se construyeron.
→ **Propuesta**: story nueva en O7: la réplica no se publica sin identidad docente probada contra el catálogo; la verificación docente vive en una cola distinta de la de constancias; para el docente verificar es permiso, no señal.

**C2. "Se entera antes de que se publique" no le da ni ventana ni acción.** Claudia responde 23:50, el aviso llega 23:51, se publica 23:52: criterio cumplido, promesa rota. Y si borró su aporte (O5-1) o su cuenta (O5-2), no hay a quién avisar y la réplica sale igual.
→ **Propuesta**: T2-2 gana plazo y palanca: la respuesta queda retenida N días desde el aviso; en ese plazo quien aportó puede editar, borrar o pedir revisión; si borra, la respuesta no se publica.

**C3. La réplica no cita pero describe.** "En mi comisión hubo una sola persona que rindió tres veces el primer parcial y faltó nueve clases": no cita una palabra del testimonio y señala a una persona con conocimiento del aula. T2-2 prohíbe citar; esto no cita. La réplica es el único texto libre no curado del producto y no pasa el chequeo que T2-1 le hace al alumno.
→ **Propuesta**: la respuesta pasa el mismo chequeo de identificación por contexto que el aporte, y cuando describe notas, asistencia o situación personal de alguien no se publica sin moderación.

## D · Moderación: criterio, estado intermedio, y quién la ejecuta

**D1. BO2-1 no dice de quién es la exposición que cuenta.** "Bajar solo lo que expone a una persona": el docente *es* una persona y está nombrado. Leído literal, todo testimonio sobre una cátedra es bajable. La tesis tiene la respuesta ("el del docente sí, porque responder es un acto público; el riesgo no es simétrico") pero la story no la carga, y la story es lo que Nahuel abre a las tres de la mañana. Paredes reporta las catorce apariciones de "hay clases que no se dan" alegando exposición y no hay criterio escrito.
→ **Propuesta**: BO2-1 dice explícito que la exposición protegida es la de quien aportó, no la del docente ni la de la institución nombrada; el reporte de un evaluado sobre su propia ficha se resuelve con ese criterio.

**D2. Nadie decidió qué pasa con lo reportado mientras espera.** Si baja, el reporte masivo es un botón de censura (el adversario g). Si queda, "expone a una persona" sigue publicado días. ADR-0010 (auto-hide con umbral) era la única respuesta y ADR-0063 lo puso en retiro sin reemplazo.
→ **Propuesta**: lo reportado sigue publicado hasta que un humano resuelva; ninguna cantidad de reportes lo baja sola; existe un único caso "riesgo inmediato" con criterio escrito que despublica antes.

**D3. Reporte sin cuenta deja a BO5-3 sin nada que agrupar.** O5-4 saca el único identificador estable; BO5-3 (P1) quiere agrupar "doce reportes de la misma facultad" y no puede. Y BO2-2 quiere responderle al reportante, que no tiene cuenta.
→ **Propuesta**: el reporte sigue sin pedir cuenta pero **confirma el mail por link** antes de entrar a la cola; dos reportes del mismo mail cuentan uno; el mail es el canal de BO2-2 y el origen agrupable de BO5-3.

**D4. Moderación y verificación viven en la misma persona: BO2-4 es ausencia de UI, no mecanismo.** BO3-1 corta un solo lado (catálogo no llega a reportes ni verificaciones) y deja fusionados los dos que rompen el anonimato. Nahuel está definido así ("modera reportes y verifica constancias"). Ve la constancia con nombre y carrera a las 14:32 y a las 14:40 la cola de reportes filtrada por esa carrera: no hay camino en la pantalla, hay camino en la cabeza y en la sesión. Y BO3-2 registra, no impide: el Admin se puede auto-asignar los dos roles.
→ **Propuesta**: verificación y moderación son roles **excluyentes** (asignar el segundo a quien tiene el primero es imposible, no auditado); el registro guarda referencias que un solo rol no puede unir; el Admin no se auto-asigna roles operativos. Y la persona Nahuel se parte en dos, o el equipo mínimo son cuatro.

**D5. Falta la cola de moderación desbordada.** BO4-1 es la gemela para catálogo; no existe para moderación. Cuarenta reportes a cinco minutos son tres horas de una persona.
→ **Propuesta**: story gemela de BO4-1 en BO4 o BO5.

## E · Ataques al corpus que las stories no cubren

**E1. BO5-2 no distingue campaña legítima de brigading, y su remedio lo puede disparar el evaluado sobre sí mismo.** La tesis dice "cuarenta diciéndolo es un hecho"; BO5-2 dice que veinte en dos días es sospecha. Un centro que moviliza a la comisión después de seis clases sin dar dispara la misma alarma que el ataque, y "período bajo revisión" desmiente el reclamo verdadero. Y Paredes arma veinte cuentas, tira veinte valoraciones sobre su propia cátedra, se congela su ficha, repite: un botón de apagado sobre su propia ficha, construido por nosotros.
→ **Propuesta**: el pico se evalúa por **procedencia** (correlación entre cuentas: fecha de alta, patrón idéntico, ausencia de trayectoria), no por volumen; cuarenta cuentas con historia distinta no disparan nada, veinte creadas la misma semana sí; congelar nunca es inducible por el evaluado sobre su ficha; el remedio por default es recalcular excluyendo el conjunto (A2), no congelar.

**E2. El churn de catálogo lava el número.** BO5-1 protege la reforma de plan; nada protege la unidad que se juzga, la cátedra. La facultad recompone y renombra cátedras cada cuatrimestre (muchas lo hacen sin mala fe), manda correcciones consistentes con su publicación oficial, Sofía las aplica porque la fuente lo respalda, y cada cátedra arranca en n=0: ninguna celda llega al piso, ninguna ficha publica. El árbitro de la identidad de la unidad es la publicación del evaluado. ADR-0061 tenía la doctrina (medir la vigencia del plantel); ninguna story la porta.
→ **Propuesta**: la identidad de la unidad de agregación es nuestra y sobrevive a renombres y reasignaciones; renombrar o cambiar docente no parte ni mueve conteos publicados; la ficha muestra qué parte del corpus corresponde al plantel actual. Y las correcciones que tocan claves de agregación no se aprueban con el mismo criterio que un horario.

**E3. La cola pública de pedidos dirige el único recurso escaso y no cuesta nada llenarla.** 300 pedidos desde 300 mails generados en diez minutos: la cola los pone primeros, BO1-2 manda a Sofía a cargarlos, BO4-1 publica un tiempo de espera sobre demanda inventada, y Ana lee una cola que le miente. Segundo vector: BO1-3 manda mail "a todos los que la pidieron"; pido 200 carreras con el mail de una víctima y recibe 200 mails desde nuestro servidor.
→ **Propuesta**: un pedido cuenta una vez por mail confirmado por link; el conteo público distingue confirmados de crudos; nadie recibe aviso a un mail que no confirmó. Sigue sin pedir cuenta.

## F · Personas que el catálogo deja sin poder lograr lo suyo

**F1. Publicar el rol etiqueta a Diego como el fracaso que O4-9 promete no ser.** O4-4 publica "el rol y el período"; el registro pide rol; si el rol publicado es "abandonó", O4-9 se rompe. Y T1-3 hace que verificarse pese más, pero Diego no puede sacar constancia de alumno regular de una carrera que dejó hace cinco años: el que más tiene para contar es el que menos puede pesar.
→ **Propuesta**: O4-4 fija el conjunto cerrado de lo publicable: si cursó la materia y en qué período; nunca el desenlace, nunca el nombre. Y una story en T1: quien ya no cursa se puede verificar igual con su certificado de materias aprobadas.

**F2. Tres promesas dependen del plan marcado, que el catálogo declara opcional.** `abandono` vive "sobre la pantalla del plan" que Diego no visita; O4-5 ("el aviso llega con una materia concreta") no se puede armar para quien salteó el onboarding y O6-2 prohíbe volver a preguntar; y el egreso "se pregunta igual" sin decir a quién ni cuándo: el que se recibió no vuelve nunca, así que O1-1 y O1-7 (Silvia) no tienen mecanismo de adquisición.
→ **Propuesta**: la pregunta de abandono aparece dentro de `contar`, una vez, sin plan marcado; y una story de reenganche por mail a cuentas inactivas con una sola pregunta ("¿te recibiste? ¿cuándo?"), respondible sin volver a la app.

**F3. El mail de Ana la deja donde le prometimos no mandarla.** O2-2 promete pedir sin cuenta; O2-4 promete "el plan ya está listo para marcar", que es `micarrera` (con cuenta). El mail la deposita en el registro, y `registro` le vuelve a pedir institución y carrera (contra O6-2). Y dejó su mail sin cuenta y no hay story que le permita sacarlo.
→ **Propuesta**: el mail lleva a la ficha ya cargada (que se lee sin cuenta); si decide registrarse, el pedido precarga institución y carrera; el mismo mail trae el link para borrar la dirección.

**F4. "Todavía no respondió" presupone que se le preguntó.** Paredes no se va a verificar nunca, entonces nunca recibe el aviso, y la ficha publica desde el día uno una frase que presupone pregunta: es interpretar, que es exactamente lo que su persona prohíbe.
→ **Propuesta**: O7-6 declara el estado del canal, no del silencio: "no lo pudimos notificar" / "notificado, sin respuesta" / la respuesta.

**F5. Falta el tercer estado vacío, y "ninguna gana en todo" no es verificable.** Hay dos vacíos definidos (no cargada; cargada sin testimonios) y falta el más común del primer año: cargada, con aportes, bajo el piso. Nadie dice qué se muestra ni cómo se distingue de "no la cargamos", que es la sospecha que O2-1 existe para desactivar. Y O1-2 ("ninguna gana en todo") es un criterio sobre el dato: si una universidad le gana a la otra en todo, obliga a suprimir un resultado real, contra "no juzga lo que mide".
→ **Propuesta**: story nueva en O2 (distinguir "no la cargamos" de "todavía no hay voces suficientes", con cuántas faltan); y O1-2 se reescribe: la comparación no ordena por puntaje global ni declara ganador, y cada celda muestra su n o su estado de cobertura.

**F6. "Cuántas clases no se dieron" es un escalar sobre una persona nombrada sin regla de agregación.** Uno dice 15, ocho dicen 2. ¿Publica 15? ¿el promedio? T4-1 resuelve desacuerdo para frases; no aplica a un número. Sin regla, "publicamos el número, no el veredicto" se cumple por casualidad, y el número elegido es una acusación de incumplimiento laboral.
→ **Propuesta**: O4-6 publica mediana y rango con su n, nunca un valor único cuando las declaraciones no convergen, y respeta el piso en (cátedra, período).

## G · Lo que hay que decidir para poder modelar (sin respuesta en ningún doc)

**G1. La atribución deja dos combinaciones sin lado, y el propio corpus del mapa las usa.** La regla que escribimos hoy en la tesis: exigencia-materia = carrera dura; gestión-cátedra o gestión-institución = alguien fallando. Pero "Contenido de hace diez años" es sujeto materia y eje gestión (alguien falla, y la regla la manda a "carrera dura" o a ningún lado); "Te la estudiás solo" es sujeto cátedra y eje exigencia (la regla no la asigna). La matriz sujeto × eje tiene seis celdas y la regla resuelve tres; el "65%" no tiene denominador.
→ **Propuesta**: la atribución la decide el **eje**, no el sujeto: todo lo de eje exigencia es "la carrera siendo dura" venga de donde venga (una materia dura o una cátedra exigente son la carrera exigiendo); todo lo de eje gestión es "alguien fallando" (una materia con contenido viejo o una cátedra que no da clases son la institución fallando). Seis celdas resueltas, denominador = todos los toques. La oración de la tesis se corrige a eso.

**G2. Qué es "cátedra".** El mapa dice "por docente"; ADR-0061 eligió la comisión; el catálogo tiene Commission con varios docentes con rol. Tres candidatos incompatibles: (materia, docente), (materia, comisión), (materia, equipo). Bloquea la referencia del aporte, la unicidad, la comparación de T3-6 y "mi cátedra" de O7-1 (si la comisión tiene cuatro docentes, ¿los cuatro responden?).
→ **Propuesta**: la cátedra es la **comisión** (materia × período × nombre), como ya se había decidido en ADR-0061; los docentes son atributo del período; la réplica la firma un docente de la comisión con su nombre; la ficha muestra la vigencia del plantel (E2). Y las frases de cátedra sin cátedra elegida (Diego no recuerda al docente) van al conteo de la materia con sujeto "cátedra sin identificar": suman a gestión-institución del nivel de arriba y no se pierden.

**G3. A qué entidad se pega una frase de institución.** Se emite dentro de un aporte sobre una materia; el modelo tiene University → Career, sin facultad. Si el sujeto es la universidad, todas sus carreras muestran la misma gestión institucional; si es (universidad, carrera), `institucion` compara algo que no define cómo compone.
→ **Propuesta**: el sujeto es la **carrera en la institución** (que es también la unidad de O1-2 y de la ficha `carrera`); `institucion` agrega sus carreras y lo dice ("gestión institucional: promedio de N carreras cargadas, cobertura X"), con el gate de cobertura de ADR-0061.

**G4. La fórmula de los dos números no existe.** O1-4 exige publicar "la fórmula, el encogimiento y el valor de cada frase" y no hay fórmula en ningún doc. Faltan: si la frase tiene signo/peso o es conteo puro (T4-1 promete que aportar lo contrario no anula, pero un número único por eje netea); el prior y el peso de la muestra; si carrera = promedio de materias o conteo propio; qué peso tiene la verificación.
→ **Propuesta**: es un ADR propio, el más importante del sistema de frases, y se escribe antes de modelar. Lo que sí se puede fijar ya: las frases tienen **signo** (a favor / en contra) por eje, el número es una proporción encogida hacia 0.5 con un prior de N personas, y T4-1 se cumple mostrando los dos conteos crudos al lado del número, no evitando el neteo.

**G5. La baja de cuenta contra ADR-0044.** O5-2 dice "la baja decide qué pasa con lo aportado"; ADR-0044 rechazó exactamente esa alternativa (soft delete + preservar corpus, sin toggle). Si el usuario se lleva los aportes, n baja retroactivo, celdas caen bajo el piso, la serie cambia hacia atrás y el CSV que Rocío citó deja de existir. Y los hechos de trayectoria (ingreso + egreso + carrera) son cuasi-identificadores que viven en la cuenta anonimizada.
→ **Propuesta**: O5-2 se alinea con ADR-0044 y lo dice claro: la baja anonimiza la identidad y preserva lo aportado; lo que sí se puede es borrar aportes uno a uno **antes** de la baja (O5-1), y los cortes con fecha (A4) hacen que eso no rompa lo ya publicado. La trayectoria se generaliza al anonimizar (año de ingreso a rango).

**G6. Reforma de plan contra cómo se elige la materia.** Subject cuelga del plan; `contar` no exige plan; Diego elige de la lista del plan vigente y su valoración queda pegada al plan equivocado, que es lo que BO5-1 prohíbe. Y después de la reforma el corpus vive en un plan que nadie navega. Agregar cross-plan exige una equivalencia entre materias de planes distintos que ADR-0002 descartó y ADR-0049 no reintrodujo.
→ **Propuesta**: es la decisión que hay que tomar antes de escribir la tabla de aportes: **materia canónica por carrera** (identidad nuestra, E2), con las materias de cada plan como versiones; el aporte referencia la canónica y el período; la ficha muestra por plan cuando difieren. Es el "bloque 8: materia canónica" del plan de julio, y tenía razón: hay que hacerlo antes de cargar el segundo plan.

**G7. Materia pendiente de vincular (T3-1, P1): qué hace mientras está pendiente.** Si no cuenta, T3-4 no tiene nada que mostrar; si cuenta, ¿en qué ficha? Al vincular, salta de 0 a 12 y cruza umbrales de golpe. Y "Análisis Matemático I" y "Analisis Mat I" son dos pendientes a fusionar.
→ **Propuesta**: la pendiente es una entidad con estado propio (declarada / vinculada / fusionada), no cuenta en ninguna ficha pública hasta vincularse, y T3-4 le muestra al aportante "pendiente de vincular, N personas más la nombraron".

**G8. Qué se modera y qué le pasa al conteo.** Bajar un testimonio con seis aportantes: si se van sus toques, n cae a 4 y la ficha vuelve a "sin datos" después de haber publicado un número que se citó; si quedan, O8-6 miente.
→ **Propuesta**: se modera el texto (si existe, B) y el aporte entero solo por fraude; los cortes con fecha (A4) hacen que lo publicado no se reescriba y el corte siguiente lo refleje.

**G9. Trajectory: consentimiento y derivación.** O3-1 (co-cursada) solo sale de cruzar dos aportes de la misma cuenta en el mismo período (sesga a quien contó ambas) o del plan marcado, que es privado y nadie consintió publicar (precedente exacto: ADR-0047).
→ **Propuesta**: la co-cursada sale solo de aportes (que son públicos por acto), nunca del plan marcado; el sesgo se declara en `metodo`.

## H · Contradicciones internas menores del catálogo

- **T1-1 y T1-2** dicen "como quien ya aportó"; el mapa dice que votar y corregir "piden cuenta". Decide si Rocío (que no aporta) puede corregir el catálogo. Propuesta: cuenta alcanza.
- **O8-1** solo lleva frases; los embudos y la duración real, el dato más citable, no son descargables. Propuesta: el CSV tiene una segunda tabla de agregados de trayectoria, con el mismo piso.
- **La cola de pedidos** no tiene su BO5: E3 lo cubre.

---

## Cómo se decide

Los grupos A, B, C, G son decisiones de producto y de modelo; D, E, F, H son correcciones del catálogo que salen solas una vez decididos los primeros. El orden que propongo: **B** (texto libre: publicar o no), **G1-G3** (atribución por eje, cátedra = comisión, institución = carrera-en-institución), **A** (el piso en sus cinco piezas), **C1** (verificación docente como permiso), **G6** (materia canónica). Con eso decidido, todo el resto se escribe.
