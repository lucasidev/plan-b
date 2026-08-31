# User personas

Las personas del producto, portadas del mapa de producto (canvas `plan-b mapa`, sección "quién camina cada paso"). Cada una existe por una tensión, y cada tensión produjo una decisión de diseño concreta: si la persona no obliga a decidir nada, sobra.

**No confundir con [`dev-seed-personas.md`](../engineering/dev-seed-personas.md)**: aquel doc son las identidades de testing que siembra el `DevSeedHostedService` (Lucía Mansilla y compañía). Esto es producto, no fixtures.

Tres reglas que el mapa fija sobre este conjunto:

- **No son segmentos.** No hay tamaño de mercado ni porcentaje: hay una tensión cada una, y si dos comparten tensión, sobra una.
- **Cinco no son alumnos que cursan, y eso es del pivote.** Sin ellas lo publicado no tiene a quién servirle, la respuesta no tiene dueño, y el que se fue o el que paga quedan afuera de un producto que los afecta.
- **Ninguna quiere el producto.** Quieren decidir, que quede registrado, o llevar un dato a una reunión. El producto es el medio, y confundirlo con el fin es lo que infló la versión anterior.

## Las nueve de negocio

### Valentina, 17 · "Tiene que decidir cinco años con un folleto"

Nadie en su familia terminó una carrera, así que no tiene a quién preguntarle. Lee todo lo que encuentra y no le cree a nada que parezca vendido.

**La contradicción**: desconfía de los rankings y a la vez necesita uno. Si le mostramos un número redondo lo descarta; si le mostramos de qué está hecho, lo usa.

**Decisión que produce**: por ella la lectura es pública y el método es criticable; arriba de la ficha se lee la fama por convergencia, en dos segundos, nunca un puntaje; y Dónde estudiarla compara lado a lado sin ganador. Si el gate estuviera antes del valor, se va y no vuelve.

### Lucía, 23 · "Se anotó en cinco y dejó dos"

Cuarto año, veinte horas de trabajo. Tiene más para decir que nadie y menos tiempo que nadie.

**La contradicción**: quiere que exista el dato pero no quiere producirlo. Aportaría si le costara lo que cuesta mandar un mensaje.

**Decisión que produce**: por ella se responden ítems cerrados en vez de escribir, la unidad es una cursada y no el período, y lo único que la reseña le agrega es un toque: cómo terminó. Y la co-cursada que le sirve sale sola de las reseñas, sin que el producto le pida nada de su carrera ([ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)).

### Matías, 26 · "Reclamó solo y no sirvió de nada"

Cursó una materia donde faltaron seis clases. Fue a hablar, le dijeron que era el único que se quejaba.

**La contradicción**: está convencido de que no cambia nada y aun así quiere que quede registrado. Le da lo mismo el producto: quiere el número.

**Decisión que produce**: por él el gate llega en la acción y no en la puerta, nada le pide completar algo antes de reseñar, y su reseña queda: suma a los conteos, y si escribe en el campo libre, alimenta los ítems que se destilan más adelante. Lo que quiere es que quede.

### Ana, 21 · "Su facultad no está y sospecha del vacío"

Buscó la suya, no apareció, y lo primero que pensó fue que el sitio es chico o que la esconden.

**La contradicción**: quiere usar algo que todavía no la cubre. Si el vacío no se explica, no vuelve; si se explica, empuja para que se cargue.

**Decisión que produce**: por ella no hay ficha vacía ni número inventado: el vacío se explica en sus tres estados (no la cargamos / cargada, sin llegar todavía al piso / cargada, con voces publicadas, todavía no derivamos, con la cobertura a la vista), y la cola de pedidos es pública.

### Claudia, 44 · "Da bien su materia y nadie lo ve"

Docente desde 2016, la cátedra más elegida de su materia. Es la primera vez que alguien mide lo que hace.

**La contradicción**: le conviene que se publique y le da miedo que se publique. Sabe que responder con nombre la expone, y que no responder la expone más.

**Decisión que produce**: por ella existe la respuesta del reseñado, firmada con nombre y cargo: pide identidad verificada (permiso, en su propia cola), y responde a los números agregados de su ficha, nunca a una reseña individual. Si publicamos, tiene que poder contestar.

### Rocío, 31 · "Necesita el crudo, no nuestras conclusiones"

Trabaja en un centro de estudiantes. Tiene que llevar un dato a una reunión y que no se lo puedan desarmar.

**La contradicción**: nos usa y a la vez nos audita. Si no puede ver cómo calculamos, no nos cita; si puede, nos defiende.

**Decisión que produce**: por ella el método es público (la regla de comparación, el catálogo de ítems, los sesgos), la cobertura se declara y el crudo se descarga sin registro, agregado por ítem con voces y período, sin reseñas individuales: no existe un crudo con más que la ficha.

### Diego, 28 · "Dejó en tercero y nadie le preguntó por qué"

Cursó tres años de ingeniería y abandonó. Tiene la explicación completa de por qué se va la gente, y ya no le sirve de nada tenerla.

**La contradicción**: es el que más tiene para decir y el que menos razón tiene para volver. Todo lo que sabe se pierde el día que cierra sesión por última vez.

**Decisión que produce**: por él aportar no exige estar cursando, y reseñar una materia sola alcanza. El que se fue no va a inventariar cinco años; su año de salida se le pregunta una vez, y si no vuelve, por mail. Y lo publicado no dice cómo terminó ni quién escribió: su reseña suma igual que la de cualquiera.

### Silvia, 51 · "Paga la cuota y no pisa la facultad"

Financia una privada para su hija. No entiende de planes ni de correlativas, y no va a aportar nunca: solo consume.

**La contradicción**: es la que pone la plata y la que menos derecho siente a opinar. Si le mostramos la interfaz del alumno, se va en diez segundos.

**Decisión que produce**: por ella la duración real (dato oficial: dura en el papel contra dura en la realidad, con la brecha en años) y el egreso por cohorte (dato oficial: se recibió, se fue, sigue) están arriba en la ficha, en palabras y no en vocabulario académico, siempre con la fuente dicha al lado.

### Prof. Paredes, 58 · "Lo nombraron y no piensa contestar"

Da la misma materia desde 2009. Se enteró de que hay conteos sobre su cátedra y su postura es que no nos corresponde medirlo.

**La contradicción**: su silencio no es indiferencia, es una posición. Y tiene razón en algo: nadie nos delegó esto.

**Decisión que produce**: por él la respuesta es opcional y nunca se presume. La ficha declara el estado del canal ("sin respuesta"; "docente sin identidad verificada" si nunca se le pudo avisar), no "no quiso responder".

## Las cuatro del equipo

### Sofía, 29 · equipo, catálogo

Carga planes, correlativas, la duración nominal, las cátedras (el equipo docente a cargo) y las materias canónicas a mano, porque la calidad del dato base es lo único que no se crowdsourcea; y decide qué ofertas de distintas instituciones son la misma carrera canónica, que es una decisión editorial y no un campo más. Una ficha a medias miente más que una que no existe, así que no puede publicar hasta terminar. Y la cola de pedidos crece más rápido de lo que carga.

> "Puedo cargar dos carreras por semana. Este mes me pidieron once."

**Qué necesita**: ver los huecos antes que los logros (empezando por los que bloquean lo publicado: la duración nominal y la carrera canónica), priorizar por cuánta gente lo pidió, y avisarle a los que esperan cuando termina.

### Nahuel, 34 · equipo, moderación

Mira el filtro grueso del campo libre antes de que pase a curaduría (agresión dirigida, dato personal de un tercero), el canal de reclamos institucionales contra un dato ya publicado, y la alarma de cuentas correlacionadas que intentan inflar un conteo. Nada de lo que revisa es texto publicado: el campo libre nunca se publica, así que no hay nada que bajar de la vista pública, solo decidir si algo pasa filtrado o directo. No verifica: quien ve nombres reales es otra persona (Camila), y US-217 hace que no puedan ser la misma.

> "Si libero de más, algo que identifica a alguien llega a la curaduría. Si retengo de más, se pierde la única voz que lo iba a decir."

**Qué necesita**: el criterio escrito de qué dispara el filtro, que sus tres colas no se le mezclen, y que ningún reclamo ni alarma baje un dato solo, sin que él lo revise.

### Camila, 27 · equipo, verificación

Verifica constancias de alumno y la identidad de los docentes que quieren responder, así que es la única que ve nombres reales de gente que confió en que sería anónima. No modera y no llega a los aportes: US-217 corta ese camino por construcción, no por buena voluntad, y US-208 le cierra la puerta desde la cola de constancias.

> "Veo el nombre, comparo con lo declarado, destruyo el documento. Si algún día pudiera ver qué reseñó, ese día el anonimato sería una promesa."

**Qué necesita**: ver lo mínimo para decidir, que quede registrado que lo vio, y que nadie más pueda; y para el docente, atarlo a la cátedra del catálogo, porque para él verificar es el permiso de responder.

### Admin · equipo, accesos

Da de alta al equipo y decide quién ve qué. No modera ni carga: su trabajo es que el corte entre catálogo y comunidad se sostenga, porque si todos ven todo, el anonimato es una declaración y no un mecanismo.

> "Catálogo no necesita ver una constancia con nombre. Si puede, algún día la va a ver."

**Qué necesita**: roles cortados por lo que no ven, y registro de quién hizo qué.
