# Escenarios de Elegir dónde estudiar

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-221: Entender qué es esto viendo una ficha real

### Camino feliz

**E1.** Dado que Cátedra Pérez (Análisis Matemático II, Ingeniería en Sistemas, UNSTA) tiene 41 voces reales, de 2022 a 2025, y ya pasa el gate de cobertura de su carrera
Cuando Inicio arma el bloque de la muestra honesta
Entonces muestra esa ficha real, con el texto "Análisis Matemático II · Cátedra Pérez, UNSTA: 6 de cada 10 marcaron alguien fallando · 41 voces", nunca un ejemplo inventado ni un número sin voces detrás.

**E2.** Dado un conjunto de fichas que ya pasan el gate de cobertura (por ejemplo Cátedra Pérez con 41 voces y su "6 de cada 10", e Ingeniería en Sistemas en UTN con 1200 voces y otra proporción distinta)
Cuando el bloque de la muestra elige qué ficha mostrar, muchas veces seguidas
Entonces la elegida varía entre las que pasan el gate: no siempre devuelve la de proporción más alta, no siempre la más baja, y no siempre la misma institución.

**E3.** Dado que alguien entra a Inicio desde un link que le compartieron, sin saber qué es plan-b
Cuando lee el bloque "qué es plan-b"
Entonces el texto explica el producto sin usar las palabras "instrumento de presión", "eje", "encogimiento" ni "Wilson", y desde ese mismo bloque hay salida a Explorar, a Buscar y a Método.

### Negativos

**N1.** Dado que Ingeniería Industrial en UNSTA tiene 20 de 40 materias canónicas con voces (la mitad exacta, no más de la mitad) y todavía no pasa el gate de cobertura
Cuando Inicio arma la muestra honesta
Entonces esa ficha nunca puede salir sorteada: el sorteo excluye a todo lo que no pasa el gate.

### Edge cases

- Si en un momento dado ninguna ficha pasa todavía el gate de cobertura (producto recién arrancado), qué muestra Inicio no está resuelto en ninguna story ni en la ficha de la pantalla. **Falta decidir**.
- Si solo una ficha pasa el gate, el sorteo siempre devuelve esa única ficha, y eso no cuenta como "elegida por destacada": sigue siendo la única candidata válida.
- Cuánto dura cada ficha en el sorteo (por visita, por día) y si se excluye la que el visitante ya vio: la propia ficha de Inicio lo deja abierto.

## US-222: Ver qué hay para estudiar sin saber qué buscar

### Camino feliz

**E1.** Dado que Valentina entra a Explorar sin haber iniciado sesión
Cuando abre la pantalla
Entonces ve las dos lentes, Carreras e Instituciones, y puede pasar de una a otra sin escribir nada en ningún campo y sin que se le pida cuenta.

**E2.** Dado que la lente de Carreras lista "Ingeniería en Sistemas, UNSTA" con 850 voces y cobertura de 22 de 40 materias, y "Ingeniería en Sistemas, UTN" con 1200 voces y cobertura de 30 de 40 materias
Cuando se muestra cada entrada
Entonces cada una trae el nombre de la carrera, la institución, sus voces y su cobertura, y ninguna de las dos muestra un puntaje ni una escala 1 a 5.

**E3.** Dado esas mismas dos entradas
Cuando la lente ordena por voces
Entonces UTN (1200 voces) aparece antes que UNSTA (850 voces); y cuando ordena alfabético, UNSTA aparece antes que UTN por el nombre de la institución, sin que ninguno de los dos criterios dependa del valor de ninguna proporción.

### Negativos

**N1.** Dado que Ingeniería en Sistemas en UNSTA tiene una proporción de "marcaron alguien fallando" más alta que la de UTN
Cuando se arma cualquiera de las dos lentes
Entonces UNSTA no aparece primera por tener ese número más alto: la proporción nunca es criterio de orden.

### Edge cases

- "No la cargamos todavía": una institución pedida pero no cargada no aparece en ninguna lente; vive en Pedir, no acá.
- "Cargada y todavía sin voces": una carrera recién cargada por catálogo con cero voces se lista igual, con el texto de que todavía no hay voces, nunca como un 0%.
- "Cargada, todavía no derivamos": una carrera con voces pero con cobertura de 15 de 40 materias (menos de la mitad) se lista con esa cobertura a la vista, sin cabecera.
- Dos instituciones con exactamente el mismo número de voces (empate): el criterio de desempate no está definido en la story. **Falta decidir**.

## US-127: Ver cuánto tarda de verdad la carrera

### Camino feliz

**E1.** Dado que el plan de Ingeniería en Sistemas en UNSTA dura nominalmente 5 años, y 40 egresados declararon tanto el año en que entraron como el año en que se recibieron, con una mediana de 7,5 años entre esas dos fechas
Cuando se mira la trayectoria en la Ficha de carrera
Entonces se muestran los dos números uno al lado del otro: duración nominal 5 años, duración real 7,5 años (mediana de 40 egresados).

**E2.** Dado esos mismos 5 años nominales y 7,5 reales
Cuando se calcula la brecha
Entonces se muestra una brecha de 2,5 años, y el texto dice que sale de esos mismos 40 egresados.

**E3.** Dado que la duración real muestra 7,5 años
Cuando se lee el texto que la acompaña
Entonces dice "de los que se recibieron y reseñaron acá": nadie que sigue cursando ni nadie que se fue entra en ese número.

### Negativos

**N1.** Dado que un estudiante reseñó varias materias de Ingeniería en Sistemas en UNSTA pero nunca declaró que se recibió
Cuando se calcula la duración real
Entonces ese estudiante no entra en la mediana de 7,5 años ni en el total de 40 egresados: solo cuentan quienes declararon las dos fechas.

### Edge cases

- Todavía nadie declaró haberse recibido de una carrera recién cargada: la duración real no se publica como 0 años, viaja como sin datos (ADR-0054), y se dice que hace falta que egresados declaren las dos fechas.
- Un solo egresado declaró las dos fechas: la mediana es ese único valor, se publica igual, sin piso, y el texto dice que sale de un solo egresado.
- La misma carrera en dos instituciones (US-128) tiene su propia brecha cada una: UNSTA con 2,5 años, UTN con 1,5 años (nominal 5, real 6,5 de 22 egresados); no existe una brecha compartida entre las dos.

## US-128: Comparar la misma carrera en varias instituciones

### Camino feliz

**E1.** Dado que Ingeniería en Sistemas está cargada como carrera canónica en UNSTA (nominal 5 años, real 7,5 años de 40 egresados, brecha 2,5 años, 850 voces, cobertura 22 de 40 materias) y en UTN (nominal 5 años, real 6,5 años de 22 egresados, brecha 1,5 años, 1200 voces, cobertura 30 de 40 materias)
Cuando alguien entra a Dónde estudiarla
Entonces ve las dos ofertas lado a lado, cada una con su nominal, su real, su brecha, su cobertura y su cabecera derivada (las dos pasan el gate porque las dos superan la mitad de sus materias canónicas), sin ninguna columna que las combine en un solo número.

**E2.** Dado esas mismas dos ofertas
Cuando se arma la comparación
Entonces el orden es alfabético (UNSTA antes que UTN) o por voces (UTN con 1200 antes que UNSTA con 850), nunca por cuál tiene la brecha más chica.

**E3.** Dado que alguien quiere ordenar las dos ofertas por su propia brecha en vez de alfabético o por voces
Cuando busca esa opción dentro de Dónde estudiarla
Entonces no existe ahí: tiene que bajar el CSV desde Método para ordenar como quiera.

### Negativos

**N1.** Dado que UTN tiene menos brecha que UNSTA (1,5 contra 2,5 años)
Cuando se muestra la comparación
Entonces ninguna de las dos aparece marcada como "mejor", "recomendada" ni con un ícono de ganador: los números se leen solos.

### Edge cases

- Solo Ingeniería en Sistemas en UNSTA está cargada todavía, ninguna otra institución la ofrece en el catálogo: Dónde estudiarla dice que no hay con qué comparar todavía, en vez de mostrar una comparación de una sola columna.
- Ingeniería en Sistemas en Siglo 21 está cargada pero sin ninguna voz: aparece en la comparación con su duración nominal y "todavía sin voces", sin inventar un cero.
- Contador Público en una tercera institución tiene solo 15 de 40 materias con voces: esa oferta se compara igual, pero sin cabecera derivada, mostrando "todavía no derivamos" con su cobertura al lado.

## US-129: Atribuir la dificultad: carrera o facultad

### Camino feliz

**E1.** Dado que Cátedra Domínguez (Base de Datos I, Ingeniería en Sistemas, UNSTA) acumuló 41 voces en total, y F01 "Es dura de verdad" (eje exigencia) es la única frase de exigencia que alguien marcó, con 15 de 41 voces (23,6%, encogido a 24%, ADR-0075)
Cuando alguien entra a la Ficha de Cátedra Domínguez
Entonces la cabecera muestra "dicen que es dura" en 24%, con esas mismas 15 de 41 voces, en su propia caja de la cabecera, no mezclada con ninguna otra frase de la ficha.

**E2.** Dado esa misma Cátedra Domínguez, donde F18 "Hay clases que no se dan" (eje gestión) es la única frase de gestión que alguien marcó, con 12 de 41 voces (17,6%, encogido a 18%, ADR-0075)
Cuando se mira la misma cabecera
Entonces "marcaron alguien fallando" muestra 18%, sobre el mismo denominador de 41 voces que usa "dicen que es dura", y las dos proporciones aparecen juntas en la cabecera.

**E3.** Dado que F01 es de sujeto materia y F18 es de sujeto cátedra
Cuando se arma la cabecera de Cátedra Domínguez
Entonces las dos suman a sus respectivas proporciones igual: lo que decide si suman a "es dura" o a "alguien fallando" es el eje de la frase, exigencia o gestión, no de qué sujeto vienen.

### Negativos

**N1.** Dado que alguien busca la atribución (carrera dura contra facultad fallando) en Cátedra Domínguez
Cuando la busca
Entonces no la encuentra en ninguna caja aparte ni en un bloque separado: vive únicamente en la cabecera de la ficha, como las dos proporciones de siempre.

### Edge cases

- En la ficha de una cursada individual (antes de derivar a cátedra), el denominador de la cabecera son personas, no voces acumuladas de varios períodos: una persona que reseñó y además votó esa misma cursada sigue contando una sola vez.
- Una frase con sujeto institución (por ejemplo F30 "El nivel académico es alto") nunca aparece en la cabecera de Cátedra Domínguez, porque esa frase no pertenece a esta ficha aunque su eje sea exigencia.
- Si alguien reseña la cursada de Cátedra Domínguez marcando solo una frase de gestión, sin marcar ninguna de exigencia, el denominador de "dicen que es dura" sube igual en 1, porque el denominador es todas las voces de la cursada, no solo las que marcaron esa frase (ADR-0075; el cálculo completo está en US-131).

## US-130: Ver cómo se calcula cada número

### Camino feliz

**E1.** Dado que Rocío quiere citar en una reunión el 24% de "Hay clases que no se dan" en Cátedra Pérez (15 de 41 voces, ADR-0075)
Cuando entra a Método
Entonces encuentra la fórmula del encogimiento escrita con sus tres variables (p, n, z = 1,96), y puede reproducir el cálculo ella misma sin pedirle nada al equipo.

**E2.** Dado que Método incluye un ejemplo de lectura de la fórmula
Cuando se lee ese bloque
Entonces muestra que 37 de 100 voces se lee 28,2% y que 60 de 120 se lee 41,2% (ADR-0075), para que quede claro que el encogimiento no es simplemente k dividido n.

**E3.** Dado que Método muestra cómo se derivan las fichas
Cuando se lee ese bloque
Entonces explica que una voz es una persona hablando de una cursada, y que la materia, la cátedra, la carrera y la institución se arman sumando las voces de las cursadas que les pertenecen.

**E4.** Dado que el catálogo tiene 46 frases semilla
Cuando se abre el bloque del catálogo en Método
Entonces cada frase se lista con su sujeto y su eje, y hay forma de ver las 46 enteras, no solo una muestra sin salida.

**E5.** Dado los tres sesgos declarados por la tesis
Cuando se lee Método
Entonces dice explícitamente que todo dato es de quienes reseñaron, que la duración real sale solo de los que se recibieron, y que la co-cursada sale solo de quien reseñó las dos materias.

### Negativos

**N1.** Dado que alguien busca la fórmula del encogimiento en cualquier ficha (carrera, cátedra, materia, institución)
Cuando la busca ahí
Entonces no la encuentra completa: la ficha lleva a Método con "cómo se calcula", no repite la fórmula entera en cada una.

### Edge cases

- El catálogo todavía no tiene ninguna frase destilada validada (solo las semilla): Método igual publica las 46 semilla completas, con la marca "síntesis" reservada para cuando exista la primera destilada.
- Alguien lee Método sin cuenta: la fórmula, el catálogo y los sesgos se leen igual, sin login (US-168).

## US-131: Ver sobre cuántas voces se calcula

### Camino feliz

**E1.** Dado que "Hay clases que no se dan" en Cátedra Pérez tiene 15 de 41 voces (encogido a 24%, ADR-0075) sostenidas entre 2022 y 2025
Cuando se muestra esa frase en la Ficha de Cátedra Pérez
Entonces al lado de la frase se leen las tres cosas juntas: 15 de 41 voces, el período 2022 a 2025, y el encogimiento a 24%.

**E2.** Dado que Cátedra Molina (Álgebra I, UNSTA), recién cargada, tiene "Es dura de verdad" marcada por 1 de 1 voz (encogido a 20,7%, ADR-0075)
Cuando se muestra esa frase
Entonces se publica igual, con su voz (1 de 1), su encogimiento (20,7%) y su período, sin esperar a que aparezca una segunda voz.

### Negativos

**N1.** Dado que F01 "Es dura de verdad" tiene 15 de 41 voces en Cátedra Domínguez, y llega una voz nueva que reseña esa cursada marcando solo F02 "Se aprueba yendo a clase" (el sentido opuesto, sin marcar F01)
Cuando se recalcula F01
Entonces su proporción no se queda en 15 de 41: pasa a ser 15 de 42, porque el denominador es compartido por toda la cursada y crece con cada voz nueva, aunque nadie le haya sacado una marca a F01 (ADR-0075).

**N2.** Dado cualquier frase publicada en cualquier ficha
Cuando se muestra su proporción
Entonces nunca aparece un porcentaje solo, sin sus voces y sin su período al lado: los tres viajan siempre juntos.

### Edge cases

- Una frase con 4 de 4 voces (encogido a 51,0%, ADR-0075): se publica con el mismo formato que una con miles de voces, sin destacarse como "confiable" ni advertirse como "poco confiable" más allá de mostrar el número real.
- Dos frases distintas de la misma ficha, una sostenida desde 2022 y la otra recién desde 2024: cada una muestra su propio período, no el período general de la ficha.

## US-132: Buscar por materia, carrera o docente

### Camino feliz

**E1.** Dado que alguien escribe "Análisis Matemático II" en Buscar
Cuando se ejecuta la búsqueda
Entonces los resultados mezclan los cuatro tipos de sujeto que coinciden: la materia Análisis Matemático II, la Cátedra Pérez y la Cátedra Gómez que la dictan, la carrera Ingeniería en Sistemas de UNSTA que la incluye, y UNSTA como institución, cada resultado con su tipo a la vista.

**E2.** Dado que alguien escribe "Claudia Fernández" en Buscar
Cuando se ejecuta la búsqueda
Entonces el resultado lleva directo a la Ficha de Cátedra Pérez, la cátedra de la que Claudia es titular, no a una ficha de "docente" que no existe.

### Negativos

**N1.** Dado ese mismo resultado de buscar "Claudia Fernández"
Cuando se arma la respuesta
Entonces nunca se genera una ficha propia de la persona Claudia Fernández: el destino siempre es la cátedra.

### Edge cases

- Alguien busca "Química General" (la materia de Cátedra Suárez, cuyo equipo docente todavía no está cargado en el catálogo): la materia aparece en los resultados igual, aunque Cátedra Suárez todavía no exista como entidad completamente buscable.
- Alguien busca "Universidad Inventada", que no existe en el catálogo: la búsqueda no devuelve ningún resultado, y explica que es o bien porque no la cargamos todavía (con link a Pedir) o un error de tipeo, nunca un resultado vacío sin explicación.
- Alguien busca "Ingeniería en Sistemas" sin especificar institución: la búsqueda devuelve las distintas ofertas por institución (UNSTA, UTN) como resultados separados, cada una su propia carrera en su institución.

## US-133: Saber si termina en un título

### Camino feliz

**E1.** Dado que Silvia entra a la Ficha de carrera de Ingeniería en Sistemas en UNSTA (nominal 5 años, real 7,5 años de 40 egresados, brecha 2,5 años)
Cuando mira la trayectoria sin hacer clic en nada
Entonces ya lee, escrito en palabras simples, que el plan dice 5 años y a la gente le toma 7,5, una diferencia de 2,5 años, sin tener que abrir ningún acordeón ni saber qué es una cohorte.

**E2.** Dado que la cohorte que entró a Ingeniería en Sistemas en UNSTA entre 2012 y 2016 ya cerró (entró hace más de 1,5 veces la duración nominal de 5 años) y tiene 40 personas que reseñaron acá: 12 se recibieron (18,1%), 18 se fueron (30,7%) y 10 no dijo o sigue (14,2%), todos con encogimiento de ADR-0075
Cuando Silvia mira esa parte de la ficha
Entonces lee las tres proporciones en una sola línea, sin abrir nada.

**Falta decidir**: los tres conteos crudos son una partición y suman 40 de 40, pero encogidos suman 63%, no 100%. ADR-0064 manda encoger cada proporción por separado, y eso es correcto para frases independientes (marcar F01 no excluye marcar F02); acá en cambio recibirse, irse y seguir son excluyentes. O la trayectoria no se encoge como una frase, o Método explica por qué una partición no cierra en 100%. No lo resuelve ninguna story.

**E3.** Dado esos mismos números
Cuando Silvia los lee
Entonces cada uno dice explícitamente que sale "de los que reseñaron acá", nunca "de todos los que cursaron la carrera".

### Negativos

**N1.** Dado que la cohorte que entró en 2023 a Ingeniería en Sistemas en UNSTA todavía no cumplió 1,5 veces la duración nominal
Cuando se arma la ficha
Entonces esa cohorte no publica ni egreso ni abandono todavía: para cerrar este año (2026) tendría que haber entrado en 2018 o antes (2026 menos 1,5 veces los 5 años de duración nominal).

### Edge cases

- Nadie de una cohorte cerrada declaró cómo terminó (ni se recibió ni dijo que se fue): las tres proporciones se publican igual, con "no dijo o sigue" cerca del 100% de esa cohorte, en vez de ocultarse.
- Una cohorte chica (por ejemplo, 8 personas que entraron en 2013): se agrupa con una cohorte contigua y se dice que se agrupó, en vez de publicar una proporción de una cohorte de 8 personas sola (ADR-0067).
- Cómo explicarle a Silvia qué es una "cohorte" sin vocabulario académico: la propia épica lo deja abierto. **Falta decidir**.

## US-134: Saber para cuánta carrera vale un dato

### Camino feliz

**E1.** Dado que Ingeniería en Sistemas en UNSTA tiene 22 de 40 materias canónicas con al menos una voz
Cuando se muestra su Ficha de carrera
Entonces la cobertura se lee como "22 de 40 materias con voces" al lado de la cabecera derivada, porque 22 es más de la mitad de 40 y la cabecera se publica.

**E2.** Dado que "Hay clases que no se dan" aparece marcada en cursadas de 12 materias distintas del plan de Ingeniería en Sistemas en UNSTA, sobre un total de 850 voces de toda la carrera (ADR-0066)
Cuando se muestra esa frase en la lista derivada de la carrera
Entonces dice "en 12 materias", además de sus voces y su proporción.

**E3.** Dado que Contador Público en una institución nueva tiene solo 15 de 40 materias canónicas con voces (menos de la mitad)
Cuando se arma su Ficha de carrera
Entonces la cabecera con las dos proporciones no se publica: en su lugar dice "todavía no derivamos", muestra "15 de 40 materias con voces" y deja entrar materia por materia.

### Negativos

**N1.** Dado una carrera con apenas 3 de 40 materias con voces
Cuando se arma su ficha
Entonces nunca se muestra una cabecera derivada con esas 3 materias, ni un 0% en ningún lado: el gate lo impide siempre, sin excepción por lo alto o lo bajo que sea el número que esas 3 materias darían.

### Edge cases

- Ingeniería Industrial en UNSTA con exactamente 20 de 40 materias con voces (la mitad justa): no pasa el gate, porque el criterio es "más de la mitad", no "la mitad o más".
- Un plan reformado que coexiste con el plan viejo: el denominador de cobertura es uno solo, la unión de materias canónicas de los dos planes (D04), no dos coberturas separadas.
- La materia electiva Legislación Profesional, con 10 voces propias, publica sus propias frases igual (por ejemplo, F03 "Es muchísimo contenido" en 3 de 10, 10,8% encogido, ADR-0075), sin que esa materia sola alcance para mover el gate de cobertura de la carrera: cobertura cuenta materias con al menos una voz, no cuánta voz tiene cada una.

## US-135: Leer los testimonios debajo de las frases

### Camino feliz

**E1.** Dado el testimonio de Matías sobre Cátedra Pérez (2024, primer cuatrimestre), con su comentario y las frases F18 "Hay clases que no se dan" y F05 "El final toma cosas que no se dieron" marcadas
Cuando se mira la Ficha de Cátedra Pérez
Entonces ese comentario aparece debajo de las listas de frases por eje, nunca arriba ni como cuerpo de la ficha, con su período (2024, primer cuatrimestre), la cátedra (Cátedra Pérez) y las dos frases que marcó a la vista.

**E2.** Dado ese mismo testimonio
Cuando se muestra
Entonces no trae cuenta, ni nombre, ni cómo terminó la cursada de Matías, tiene como máximo un párrafo, y no suma ni resta a ningún conteo de frases.

**E3.** Dado que el testimonio de Matías tiene 12 votos de "a mí también me pasó" y otro testimonio de Cátedra Pérez tiene 3
Cuando se ordenan los testimonios
Entonces el de Matías aparece antes que el de 3 votos, sin que el equipo lo haya elegido a mano como destacado.

### Negativos

**N1.** Dado el conjunto de testimonios de Cátedra Pérez
Cuando se calcula cualquier proporción de frase (por ejemplo F18 en 15 de 41 voces, 24%)
Entonces leer o no leer un testimonio no cambia ese número: el testimonio se lee aparte de los conteos, que ya vienen de la reseña y sus votos.

**N2.** Dado el listado completo de testimonios de Cátedra Pérez
Cuando se arma el orden
Entonces ningún testimonio aparece marcado como "destacado" ni "elegido por el equipo": el único criterio de orden son los votos.

### Edge cases

- Un testimonio sin ningún voto todavía: aparece igual, al final si el orden es descendente por votos, no se oculta por tener cero votos.
- Una reseña que marcó frases pero no escribió comentario: no aparece como testimonio (no hay texto que mostrar), pero sus frases siguen sumando a los conteos igual.
- Dos testimonios con exactamente el mismo número de votos (empate): el criterio de desempate no está definido en la story. **Falta decidir**.

## US-136: Entender la ficha vacía cuando llego primero

### Camino feliz

**E1.** Dado que Ana busca su facultad y llega a la Ficha de Cátedra Ibáñez (Física II, UNSTA), que todavía no tiene ninguna voz
Cuando entra a esa ficha
Entonces la cabecera no muestra 0% ni "0 de 0": dice que la ficha arranca vacía y que la primera voz ya se publica, sin ningún escalón que desbloquear.

**E2.** Dado que Ingeniería en Sistemas en Siglo 21 está cargada en el catálogo pero ninguna cursada la sostiene todavía
Cuando alguien entra a su Ficha de carrera
Entonces dice que arranca vacía y que la primera voz ya se publica, igual que en la cátedra.

**E3.** Dado que Física II en UNSTA (la materia) todavía no tiene ninguna cursada reseñada en ninguna de sus cátedras
Cuando alguien entra a su Ficha de materia
Entonces dice lo mismo: arranca vacía, la primera voz ya se publica.

### Negativos

**N1.** Dado cualquiera de esas tres fichas vacías
Cuando se muestra
Entonces en ningún caso aparece un botón ni un texto de "desbloquear con más voces", ni una barra de progreso hacia un mínimo: no hay escalera ni piso.

### Edge cases

- Llega la primera voz a Cátedra Ibáñez (una sola persona marca una sola frase): la ficha deja de estar vacía y publica esa proporción con su encogimiento (por ejemplo, 1 de 1, 20,7%, ADR-0075), sin esperar una segunda voz.
- Que Cátedra Ibáñez esté vacía o no es un estado distinto del estado del canal de su titular: que Prof. Paredes nunca haya verificado su identidad ni respondido no hace que la ficha esté "vacía"; son dos cosas separadas (US-176).

## US-137: Saber de cuándo son los testimonios

### Camino feliz

**E1.** Dado que Cátedra Pérez tiene voces desde 2022 hasta 2025, y hoy es 2026
Cuando se mira su Ficha de cátedra
Entonces la línea de sustento dice "41 voces, de 2022 a 2025", sin ningún aviso, porque de 2025 a 2026 pasó menos de dos años.

**E2.** Dado que Cátedra Gómez (la otra cátedra de Análisis Matemático II en UNSTA) tiene su última voz en 2023, y hoy es 2026
Cuando se mira su Ficha de cátedra
Entonces aparece el aviso de que lo último es de hace más de dos años, junto al período que la sostiene.

### Negativos

**N1.** Dado el mismo caso de Cátedra Gómez
Cuando se muestra el aviso
Entonces no dice ni implica que los datos sean falsos ni que no haya que confiar en ellos: solo declara la antigüedad, sin retirar ni ocultar ninguna frase publicada.

### Edge cases

- Una ficha con una sola voz, de hace tres años: el aviso aparece igual que si hubiera cientos de voces viejas, porque depende de la fecha, no de la cantidad.
- La Ficha de materia Análisis Matemático II suma cursadas de Cátedra Pérez (hasta 2025) y Cátedra Gómez (hasta 2023): el período que se muestra en la materia es el más reciente de las dos (2025), y el aviso se evalúa contra ese máximo, no contra cada cátedra por separado.
- Si "más de dos años" es el umbral correcto para toda ficha o depende del sujeto (una cátedra cambia de docente más rápido que una carrera cambia de plan): la propia épica lo deja abierto. **Falta decidir**.

## US-138: Entender por qué una frase pesa distinto

### Camino feliz

**E1.** Dado que "Hay clases que no se dan" (F18) tiene 15 de 41 voces (encogido a 24%, ADR-0075) en la Ficha de Cátedra Pérez, y esa misma frase, sumada a nivel de toda la carrera Ingeniería en Sistemas en UNSTA, tiene 23% de 850 voces, en 12 de 40 materias (ADR-0066)
Cuando se compara F18 en la Ficha de cátedra contra F18 en la Ficha de carrera
Entonces el porcentaje es distinto en cada una porque el denominador es distinto (41 voces de esta cátedra contra 850 de toda la carrera), y la ficha de carrera aclara que esa frase aparece en 12 de las 40 materias del plan.

**E2.** Dado ese mismo F18 en la Ficha de carrera
Cuando se muestra en la lista de frases derivadas
Entonces dice "en 12 materias", además de su propia proporción de voces: eso es lo que separa lo sistémico (aparece en casi un tercio de las materias) de lo local.

### Negativos

**N1.** Dado que F18 pesa distinto en Cátedra Pérez que en la carrera entera
Cuando alguien lo lee
Entonces la ficha no lo deja como una contradicción sin explicar: al lado de cada número dice de qué voces sale (de esta cátedra, o de toda la carrera sumando materias).

### Edge cases

- La Ficha de materia Análisis Matemático II suma las cursadas de Cátedra Pérez y de Cátedra Gómez juntas, sin deduplicar entre las dos ni entre períodos: si la misma persona recursó la materia, sus dos cursadas cuentan como dos voces, no una.
- Una frase que solo aparece marcada en una sola materia de las 22 con voces de Ingeniería en Sistemas en UNSTA: en la carrera dice "en 1 materia", sin ocultarse por ser un caso chico.
