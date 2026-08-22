# Escenarios de Reseñar

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-146: Reseñar en menos de cinco minutos

### Camino feliz

**E1.** Dado que Lucía entra a Reseñar para Análisis Matemático II, período 2026-C1.
Cuando marca "la aprobé" como cómo terminó, marca la frase F02 (Se aprueba yendo a clase), elige "no me acuerdo / no aparece" en cátedra y no escribe ningún comentario.
Entonces la reseña se publica igual: en ningún paso el sistema le exigió escribir texto, y el comentario quedó como el último paso, saltado.

### Negativos

**N1.** Dado que Lucía llega al paso 6 sin haber marcado ninguna frase (ni de materia ni de cátedra) y sin escribir comentario, Cuando intenta publicar, Entonces el sistema no la deja: pide marcar al menos una frase antes de publicar, porque escribir un comentario solo no alcanza para reemplazar esa marca.

### Edge cases

- Doble click en "Publicar reseña": no genera dos reseñas para la misma cuenta, materia y período; publica una sola vez (envío duplicado).
- Comentario que supera el tope de longitud (600 caracteres en el boceto; el tope exacto todavía no está decidido): no se puede publicar hasta acortarlo.

## US-147: Reseñar una materia sola

### Camino feliz

**E1.** Dado que Lucía cursó tres materias en el período 2026-C1 (Bases de Datos, Análisis Matemático II y Programación I), sin haber reseñado ninguna todavía.
Cuando abre Reseñar.
Entonces el paso 1 le pide elegir una sola materia con un buscador, sin mostrarle un checklist con las tres materias del período para tildar juntas.

### Negativos

**N1.** Dado que Lucía está en el paso 1 del buscador, Cuando intenta tildar más de una materia a la vez (por ejemplo Bases de Datos y Programación I juntas), Entonces el sistema no lo permite: elegir una materia abre su propio flujo de seis pasos, y para la otra hay que empezar de nuevo.

### Edge cases

- Buscar una materia que no devuelve resultados no es un error: se resuelve como materia fuera del plan (US-160), escribiéndola igual.

## US-148: Que nadie sepa que fui yo

### Camino feliz

**E1.** Dado que Matías reseña la cátedra Pérez (turno noche) de Análisis Matemático II, período 2026-C1, marca "la desaprobé" como cómo terminó, marca la frase F18 (Hay clases que no se dan) y escribe un comentario.
Cuando la reseña se publica.
Entonces la ficha muestra el período (2026-C1), la cátedra (Pérez), la frase F18 y el comentario; en ningún lugar público aparece el nombre de Matías, su cuenta, su rol, ni que la desaprobó.

### Negativos

**N1.** Dado la misma reseña de Matías ya publicada, Cuando alguien consulta la ficha pública de la cátedra Pérez (no Mis aportes de Matías), Entonces no encuentra en ningún lado que esa cursada "la desaprobó": ese dato solo existe en el registro privado de Matías, en Mis aportes.

### Edge cases

- Reseña sin cátedra marcada ("no me acuerdo / no aparece"): no publica ninguna cátedra, y las frases de materia cuentan igual.
- Reseña sin comentario: no aparece como testimonio (no hay texto para leer), pero sigue sumando voz a sus frases.

## US-149: Avisar cuando cierra el período

### Camino feliz

**E1.** Dado que Lucía cursó Bases de Datos en el período 2026-C1 (según su historial cargado) y todavía no la reseñó.
Cuando el período 2026-C1 cierra.
Entonces le llega un mail que nombra "Bases de Datos" como la materia concreta para reseñar, con el link directo a Reseñar.

### Negativos

**N1.** Dado que Lucía no cursó ninguna materia en el período que acaba de cerrar, Cuando el período cierra, Entonces no le llega este mail: no hay una materia concreta que nombrarle.

### Edge cases

- Mail que rebota o no llega: comportamiento no definido (ver README de Avisos).
- Falta decidir: qué materia nombra el mail cuando hay más de una sin reseñar en el mismo período.

## US-150: Declarar cuántas clases no se dieron

### Camino feliz

**E1.** Dado que Matías cursó la cátedra Pérez de Análisis Matemático II y en el paso 4 marca la frase F18 (Hay clases que no se dan).
Cuando avanza al paso 5.
Entonces el sistema le muestra la pregunta "¿cuántas, más o menos?" en rangos, y Matías declara "6".

**E2.** Dado que en la cátedra Pérez de Análisis Matemático II, período 2026-C1, 12 personas (entre ellas Matías, con 6) marcaron F18 y declararon cuántas clases faltaron, con mediana 4 y rango entre 2 y 8.
Cuando se visita la Ficha de cátedra.
Entonces se publica "clases sin dar: 4, entre 2 y 8, 12 voces", nunca un valor único.

### Negativos

**N1.** Dado que Lucía cursó la misma cátedra Pérez pero no marcó la frase F18 en el paso 4, Cuando avanza al paso 5, Entonces la pregunta "¿cuántas, más o menos?" no le aparece.

**N2.** Dado que en un período nadie declaró cuántas clases faltaron en una cátedra, Cuando se visita su Ficha de cátedra, Entonces la sección "clases sin dar" no se publica: ni un cero, ni un valor por defecto.

### Edge cases

- Si en el paso 5 elige "no me acuerdo / no aparece" para la cátedra, no le aparece la pregunta de clases sin dar: no hay cátedra a la que colgarla.
- Al destildar "Hay clases que no se dan" en Editar, el número declarado se borra junto con la frase (D02).
- Si las declaraciones no convergen (por ejemplo, algunas personas dicen 2 y otras 15), se publica igual el rango completo, nunca un promedio ni un valor único.

## US-151: Reseñar por qué me fui

### Camino feliz

**E1.** Dado que Diego dejó Ingeniería en Sistemas y no tiene ninguna cursada activa declarada.
Cuando entra a Reseñar y elige una sola materia que cursó antes de irse, Análisis Matemático II.
Entonces completa y publica la reseña sin que el sistema le pida estar cursando actualmente ni reseñar ninguna otra materia.

### Negativos

**N1.** Ninguno: esta story elimina una restricción (estar cursando), no agrega una. No queda ningún requisito de matrícula activa que el sistema deba rechazar en Diego.

### Edge cases

- Diego igual necesita una cuenta para aportar (el gate de Ingresar / Registro): lo que esta story saca es "estar cursando", no "tener cuenta".

## US-152: Decir en qué año me fui

### Camino feliz

**E1.** Dado que Diego entró a Ingeniería en Sistemas en UNSTA en 2017 y se fue en 2019 (año 3 del plan: me fui − entré + 1), y la mayoría de quienes se fueron de esa carrera también lo hizo en el año 3.
Cuando se visita la Ficha de carrera.
Entonces se publica que el año 3 del plan es donde se fue la mayoría de los que se fueron, con su proporción encogida (18 de los 30 que se fueron, 42,3%) y sus voces.

**E2.** Dado que en Análisis Matemático II, período 2026-C1, 100 cursadas terminaron en "la aprobé" o en "la desaprobé" (37 aprobaron y 63 desaprobaron); y de las 120 cursadas que terminaron de alguna forma (aprobé, desaprobé, regular o la dejé), 60 marcaron "la dejé".
Cuando se visita la Ficha de materia.
Entonces se publica la aprobación como 28,2% (37 de 100, límite inferior de Wilson con z = 1.96) y el abandono de cursada como 41,2% (60 de 120), ambos por período.

**E3.** Dado que Diego nunca dijo su situación de trayectoria y reseña Análisis Matemático II con un período viejo, 2019-C1.
Cuando el paso 2 le pregunta "¿seguís cursando?" y contesta "me fui, en 2019", y más tarde entra a Mi situación o le llega el mail anual de reenganche.
Entonces el hecho queda guardado desde la primera respuesta y ninguno de los otros caminos le vuelve a hacer la pregunta.

### Negativos

**N1.** Dado que un alumno nunca contestó la pregunta de trayectoria (ni en Reseñar con período viejo, ni en Mi situación, ni por el mail anual), Cuando se calculan los agregados de cohorte, Entonces cuenta como "no dijo o sigue": el sistema nunca infiere que se fue, aunque pasen años sin que reseñe nada.

### Edge cases

- Si el año declarado de "me fui" es anterior al año de "entré" (dato inconsistente), esa cuenta no entra al agregado de trayectoria (control de calidad, ADR-0067).
- Falta decidir: el tercer camino (la app cuando ya pasó entré más la duración nominal) todavía no tiene pantalla asignada.
- Falta decidir: si "me fui" pide el año o el período, y qué pasa con quien se fue y volvió (dos hechos, no uno).

## US-153: No ser tratado como un fracaso

### Camino feliz

**E1.** Dado que en la cátedra Pérez de Análisis Matemático II, período 2019-C1, la frase F18 (Hay clases que no se dan) tenía 2 de 9 voces.
Cuando Diego reseña esa cursada marcando "la dejé" como cómo terminó y marca F18.
Entonces la frase pasa a 3 de 10 voces (10,8%, límite inferior de Wilson con z = 1.96), exactamente como si la voz fuera de alguien que la aprobó, y en ningún lugar público se distingue que esa voz "la dejó".

### Negativos

**N1.** Dado que la frase F18 en esa cátedra y período tiene ahora 3 de 10 voces (una de Diego, que la dejó, y dos de personas que la aprobaron), Cuando se publica esa proporción, Entonces no hay ningún desglose ni filtro que separe "voces de quienes dejaron" de "voces de quienes aprobaron": las tres cuentan igual.

### Edge cases

- Ninguna ficha ni el CSV ofrecen un filtro público por "cómo terminó" la cursada de cada voz.

## US-154: Decir cómo terminó la cursada

### Camino feliz

**E1.** Dado que en Análisis Matemático II, período 2026-C1, ya había 99 cursadas terminadas en "la aprobé" o en "la desaprobé" (36 aprobé, 63 desaprobé), y Lucía está en el paso 3 de Reseñar.
Cuando toca "la aprobé" con un solo toque y publica.
Entonces el dato queda guardado sin pedirle más campos, la aprobación publicada en la Ficha de materia pasa a ser 28,2% (37 de 100, límite inferior de Wilson con z = 1.96), y ese mismo dato alimenta también el abandono de cursada de ese período junto con quienes marcaron "la dejé".

### Negativos

**N1.** Dado que Lucía todavía no completó el paso 3 (cómo terminó), Cuando intenta avanzar al paso 4 o publicar, Entonces el sistema se lo impide: "cómo terminó" es, junto con la materia, el período y al menos una frase, uno de los pasos obligatorios.

### Edge cases

- Elegir una opción de "cómo terminó" reemplaza cualquier elección anterior: nunca se pueden marcar dos a la vez, es un toque único.
- "Sigo cursando" es una opción válida de "cómo terminó" y queda afuera de los denominadores de aprobación y de abandono de cursada (ADR-0067).

## US-155: Preguntar el año de ingreso una vez

### Camino feliz

**E1.** Dado que es la primera vez que la cuenta de Lucía reseña una materia de Ingeniería en Sistemas.
Cuando llega al paso 2 (¿Cuándo la cursaste?), contesta que entró en 2023, y más tarde reseña una segunda materia de la misma carrera.
Entonces la primera vez el paso 2 le preguntó el año de ingreso; la segunda vez no se lo vuelve a preguntar, porque ya está contestado.

### Negativos

**N1.** Dado que a Lucía le preguntan el año de ingreso por primera vez, Cuando elige "prefiero no decirlo", Entonces el dato queda guardado como "no dijo": el sistema nunca vuelve a preguntárselo ni infiere un año.

### Edge cases

- Si Lucía reseña por primera vez una materia de una segunda carrera distinta, la pregunta del año de ingreso vuelve a aparecer: es por carrera, no global.

## US-156: Preguntar por mail si me recibí

### Camino feliz

**E1.** Dado que la cuenta de Diego lleva más de un año inactiva y nunca dijo su situación de trayectoria.
Cuando pasa un año desde el último aviso.
Entonces le llega un mail con la pregunta "¿te recibiste? ¿cuándo?", respondible con un click desde el mail, sin entrar a la app.

### Negativos

**N1.** Dado que Diego ya contestó esa pregunta en un envío anterior (por ejemplo, "me recibí, en 2024"), Cuando pasa otro año, Entonces no le vuelve a llegar el mail de reenganche: la pregunta ya está apagada para siempre.

### Edge cases

- Si Diego no contesta el mail, se le vuelve a mandar la misma pregunta al año siguiente.

## US-157: Reseñar un evento institucional

### Camino feliz

**E1.** Dado que a Matías le tardaron ocho meses en entregarle el título en UNSTA, algo que no es de ninguna materia.
Cuando entra a Reseñar, elige la salida "es un trámite, el título, una mesa: un evento, no una materia", declara cuándo pasó, marca la frase F31 (El título tardó meses) y agrega un comentario opcional.
Entonces la reseña se publica sin materia ni cátedra, y F31 junto con el comentario van a la Ficha de institución de UNSTA, sumando una voz igual que si fuera una cursada.

### Negativos

**N1.** Dado que Matías eligió la salida de evento institucional, Cuando el flujo avanza, Entonces el paso "¿Con qué cátedra la cursaste?" y la pregunta de clases sin dar no aparecen: un evento no tiene cátedra.

### Edge cases

- Si no recuerda la fecha exacta del evento, puede declarar el período aproximado en vez del día puntual.
- Falta decidir: si el evento institucional queda como una pantalla propia o como esta misma pantalla con otras frases (el boceto lo deja como salida del paso 1, sin resolver).

## US-158: Avisar si el comentario me delata

### Camino feliz

**E1.** Dado que Matías escribe en su comentario "los tres que cursamos con Pérez en el turno noche vamos a reclamar juntos".
Cuando llega al paso 6 y corre el chequeo previo, antes de publicar.
Entonces el sistema resalta esa parte como algo que puede identificarlo por contexto, y Matías decide dejarla, sabiendo que la réplica no va a poder citar esa parte.

**E2.** Dado que Lucía escribe en su comentario que el titular de la cátedra es alcohólico y que se nota en las clases (habla de la persona fuera de su acto público: salud).
Cuando corre el chequeo previo.
Entonces ese comentario queda retenido hasta que alguien del equipo lo mire, y a Lucía se le dice que quedó retenido.

### Negativos

**N1.** Dado que Matías escribe en su comentario que el titular lo acosó (un acto hacia alumnos, dentro de su rol docente), Cuando corre el chequeo previo, Entonces NO queda retenido: se publica al instante, porque describe un acto público del docente y no su vida privada.

### Edge cases

- Comentario sin nada que identifique por contexto ni hable de un tercero: el chequeo previo lo deja pasar directo a publicar.
- Si se edita después un comentario ya publicado, el chequeo previo vuelve a correr solo si el texto cambió; si no se tocó, no vuelve a pasar por ahí.
- Falta decidir: qué hace el chequeo previo con un comentario que identifica a un tercero alumno, ni el autor ni un docente.

## US-159: Que ningún cruce me identifique

### Camino feliz

**E1.** Dado que Rocío descarga el CSV agregado de la cátedra Gómez (Estadística, turno tarde, período 2026-C1: 5 personas cursaron, 2 marcaron la frase F16, "Te la estudiás solo").
Cuando revisa cualquier columna del archivo: frases con sus voces, clases sin dar si las hay, hechos de trayectoria.
Entonces no encuentra en ninguna columna un nombre, una cuenta ni un identificador de perfil: todo viene agregado por frase, eje y período.

**E2.** Dado que Lucía, una de esas 5 personas, está en el paso 6 de Reseñar esa misma cátedra, a punto de publicar.
Cuando llega al aviso previo a publicar.
Entonces ve el texto que dice que no se promete anonimato estadístico, que en un grupo chico pueden sospechar, y que lo que se promete es no publicar quién.

### Negativos

**N1.** Dado que la cátedra Gómez tiene solo 5 voces en total (grupo chico), Cuando el sistema arma su ficha pública o el CSV, Entonces no aplica ningún piso mínimo que oculte o bloquee esos datos por ser pocas personas: se publican igual, con el encogimiento de Wilson a la vista.

### Edge cases

- Con una sola voz publicada (1 de 1 = 20,7%, límite inferior de Wilson con z = 1.96), el dato sale igual, sin piso ni bloqueo.
- Falta decidir: el copy exacto del aviso de la sospecha; acá se usan las palabras de la tesis, no el texto final de la pantalla.

## US-160: Reseñar una materia fuera del plan

### Camino feliz

**E1.** Dado que Lucía cursa "Taller de Redes Neuronales", una optativa que no está en el plan cargado de su carrera.
Cuando la busca en el paso 1 de Reseñar, no aparece, la escribe igual y continúa el flujo.
Entonces el sistema acepta la reseña y la marca como pendiente de vincular, en vez de rechazarla.

**E2.** Dado que la reseña de "Taller de Redes Neuronales" de Lucía está pendiente de vincular.
Cuando se visita la Ficha de carrera, se calcula la cobertura de materias con voces, y Lucía entra a Mis aportes.
Entonces esa reseña no cuenta en ninguna ficha ni suma a la cobertura, y en Mis aportes Lucía la ve marcada como pendiente.

### Negativos

**N1.** Dado que la reseña de Lucía sigue pendiente de vincular (el equipo todavía no la asoció a una materia canónica), Cuando alguien visita la ficha de cualquier materia existente, Entonces las frases marcadas en esa reseña pendiente no aparecen ahí ni afectan ninguna proporción publicada.

### Edge cases

- Se puede editar la reseña pendiente igual, con el aviso de que todavía no cuenta en ninguna ficha.
- Falta decidir: qué ve Lucía si su materia pendiente se fusiona con otra que no era la que quiso decir, si puede objetar o solo se entera.

## US-161: Retomar una reseña a medias

### Camino feliz

**E1.** Dado que Lucía llega al paso 4 de Reseñar (marcando frases) y cierra la pestaña sin publicar.
Cuando vuelve a entrar más tarde, por ejemplo desde Mis aportes.
Entonces encuentra la reseña a medias guardada con el paso donde quedó (paso 4), y puede retomarla desde ahí en vez de empezar de cero.

### Negativos

**N1.** Dado que la reseña a medias de Lucía nunca llegó a marcar ninguna frase ni a completar el paso 3 (cómo terminó), Cuando se calculan las voces publicadas en cualquier ficha, Entonces esa reseña a medias no suma ninguna voz ni aparece publicada en ningún lado, hasta que se termine y se publique.

### Edge cases

- Si el corte fue por una falla técnica (por ejemplo, se cae la conexión), la pantalla de Error avisa que lo ya contestado se guardó solo y ofrece el link para retomar.
- Si la sesión expira a mitad del flujo, lo ya contestado sigue guardado y se recupera al volver a loguearse.
- Falta decidir: cuánto tiempo se conserva una reseña a medias antes de descartarse.

## US-162: Ver qué cambió con mi aporte

### Camino feliz

**E1.** Dado que Matías marcó la frase F18 al reseñar la cátedra Pérez (antes de su reseña, F18 tenía 11 de 39 voces) y escribió un comentario que ya tuvo 8 lecturas.
Cuando entra a Mis aportes.
Entonces ve, junto a esa reseña, que F18 ahora suma 12 de 40 voces (18,1%, límite inferior de Wilson con z = 1.96) y que su testimonio tuvo 8 lecturas.

### Negativos

**N1.** Dado que Matías reseñó sin escribir comentario (marcó solo frases), Cuando entra a Mis aportes, Entonces no ve ningún contador de lecturas para esa reseña, porque no generó testimonio; sí ve las voces que sumó cada frase que marcó.

### Edge cases

- Si otra persona vota la misma frase después ("a mí también me pasó"), el número de voces que Mis aportes le muestra a Matías sube, aunque él no vuelva a reseñar.

## US-163: Reseñar la misma materia dos veces

### Camino feliz

**E1.** Dado que Lucía ya reseñó Programación I en el período 2024-C1 (la desaprobó).
Cuando recursa la materia y la reseña de nuevo en el período 2025-C1 (la aprueba).
Entonces el sistema acepta la segunda reseña porque el período es otro: cuenta × materia × período son claves distintas, y ambas cuentan como aportes independientes.

### Negativos

**N1.** Dado que Lucía ya reseñó Programación I en el período 2025-C1, Cuando intenta reseñarla de nuevo en el mismo período 2025-C1, aunque esta vez diga que la cursó con otra cátedra, Entonces el sistema rechaza el segundo intento: la clave es cuenta × materia × período, y la cátedra, al ser opcional, no forma parte de esa clave.

### Edge cases

- Concurrencia: si Lucía envía dos reseñas para el mismo período casi al mismo tiempo, desde dos pestañas, el sistema acepta la primera y rechaza la segunda por la misma clave repetida.

## US-164: Marcar el sentido contrario de una frase

### Camino feliz

**E1.** Dado que en la cátedra Pérez de Análisis Matemático II, período 2025-C2, hay 120 voces totales de esa cursada (hayan marcado una frase o no), de las cuales 60 marcaron F18 (Hay clases que no se dan, 41,2%, límite inferior de Wilson con z = 1.96).
Cuando Lucía, que tuvo todas sus clases con esa cátedra en ese mismo período, reseña su cursada y marca F17 (Las clases se dan) en vez de reportar.
Entonces su voz suma a F17 y las dos frases opuestas conviven: F17 publica 1 de 121 (0,1%) y F18 conserva sus 60 marcas intactas, que ahora se leen sobre 121 voces (40,8%, antes 41,2%). Marcar la contraria no le resta ni una voz a F18: lo único que se movió es el denominador, que es compartido (ADR-0075).

### Negativos

**N1.** Dado que F18 y F17 tienen cada una su proporción publicada sobre las mismas 120 voces de esa cursada, Cuando se calcula cualquiera de las dos, Entonces el sistema nunca resta una de la otra ni fuerza que sumen 100%: cada una se computa de forma independiente.

### Edge cases

- Falta decidir: si al marcar una frase se avisa que existe el sentido contrario, o alcanza con que las dos estén a la vista.
- Falta decidir: qué pasa si el catálogo todavía no tiene el sentido contrario de una frase destilada (US-199).
