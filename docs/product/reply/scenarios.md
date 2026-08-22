# Escenarios de Replicar

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-227: Pedir que verifiquen mi cargo antes de responder

### Camino feliz

**E1.** Dado que Marcela Sosa nunca pidió verificar ningún cargo institucional, y quiere responder al testimonio sobre el trámite de título de UNSTA que marcó F31 "El título tardó meses"
Cuando entra a Verificar y pide la verificación diciendo que tiene el cargo de Secretaría Académica en UNSTA
Entonces el pedido queda pendiente de revisión y, hasta que se resuelva, Responder no le muestra ningún campo para escribir la réplica.

**E2.** Dado que Marcela Sosa está completando el pedido de verificación de su cargo institucional
Cuando llega al paso de elegir qué cargo tiene
Entonces solo puede elegir entre los cargos genéricos de la lista corta del catálogo (por ejemplo, Secretaría Académica, Departamento de Alumnos), sin ningún campo de texto libre (US-224).

**E3.** Dado que a Marcela Sosa le aprobaron el cargo de Secretaría Académica de UNSTA (US-225)
Cuando su réplica al testimonio sobre el trámite de título se publica
Entonces queda firmada "Marcela Sosa, Secretaría Académica, UNSTA": en ningún lado aparece "Responde UNSTA" sin el nombre de una persona.

### Negativos

**N1.** Dado que Marcela Sosa todavía no pidió verificar su cargo institucional
Cuando intenta responder al testimonio sobre el trámite de título de UNSTA
Entonces no hay ningún campo de respuesta disponible: la pantalla la deriva a pedir la verificación primero.

### Edge cases

- Marcela Sosa pide un cargo que la lista corta todavía no cubre porque UNSTA recién se cargó: el pedido no se rechaza, pasa a ser trabajo de catálogo y se resuelve cuando el cargo está cargado (US-225); mientras tanto sigue sin campo de respuesta.
- Dos personas distintas piden verificarse con el mismo cargo genérico en la misma institución (dos "Secretaría Académica" de UNSTA): la story no dice si eso está permitido. **Falta decidir**.
- El cargo de Marcela Sosa vence al año (US-226) y no lo renueva: qué pasa con la réplica que ya publicó no está decidido. **Falta decidir** (abierto en el README de la épica).

## US-172: Responder con identidad verificada

### Camino feliz

**E1.** Dado el testimonio de Matías sobre Cátedra Pérez (Análisis Matemático II, Ingeniería en Sistemas, UNSTA, 2024, primer cuatrimestre), que marcó la frase F18 "Hay clases que no se dan" con 12 de 40 voces (18,1%, ADR-0075), y Claudia Fernández con identidad docente verificada como titular de Cátedra Pérez
Cuando Claudia manda su respuesta y se cumple el plazo de retención sin que Matías la edite, la borre ni pida revisión
Entonces la respuesta se publica al lado del testimonio de Matías, firmada "Claudia Fernández, titular, identidad verificada", con la fecha de publicación.

**E2.** Dado que la respuesta de Claudia Fernández ya se publicó al lado del testimonio de Matías
Cuando se mira la Ficha de Cátedra Pérez
Entonces el testimonio de Matías sigue completo y visible como estaba, y F18 sigue con sus mismas 12 de 40 voces (18,1%): la respuesta no bajó el testimonio ni movió ningún conteo.

### Negativos

**N1.** Dado que Claudia Fernández todavía no tiene identidad docente verificada
Cuando intenta responder al testimonio de Matías sobre Cátedra Pérez
Entonces la réplica no se publica: Responder no le muestra campo de respuesta hasta que la verificación se apruebe (US-178).

### Edge cases

- Claudia responde a la ficha de la cátedra en general, sin apuntar a un testimonio puntual: esta story no describe dónde queda esa réplica dentro de la ficha.
- El testimonio de Matías se borra después de que la respuesta de Claudia ya se publicó (no durante el plazo de US-179, sino después): qué pasa con la réplica publicada. **Falta decidir** (abierto en el README de la épica).

## US-173: Mostrar los dos ejes sin puntaje

### Camino feliz

**E1.** Dado que Cátedra Pérez acumuló 40 voces en total, y F18 "Hay clases que no se dan" (gestión) es la única frase de gestión que alguien marcó, con 12 de 40 voces (18,1%, ADR-0075)
Cuando alguien entra a la Ficha de Cátedra Pérez
Entonces la cabecera muestra dos proporciones separadas, nunca mezcladas: gestión en 18,1% (F18, 12 de 40) y exigencia en 44,6% (F01 "Es dura de verdad", 24 de 40), con el mismo denominador de 40 voces y sin mezclarse; y F18 aparece, con esa misma proporción, en la lista de frases de gestión.

**E2.** Dado que, más adelante, Cátedra Pérez acumuló 120 voces en total y F01 "Es dura de verdad" (exigencia, sujeto materia) tiene 60 de 120 voces (41,2%, ADR-0075)
Cuando se muestra en la lista de exigencia de la Ficha de Cátedra Pérez
Entonces se lee como información neutra sobre la materia, nunca como una falla de la cátedra, y en ningún lugar de la ficha (cabecera, listas, pie) aparece un puntaje ni una escala 1 a 5.

### Negativos

**N1.** Dado que Cátedra Pérez tiene voces en los dos ejes
Cuando se arma cualquier parte de la ficha
Entonces nunca se muestra un número único que combine o promedie exigencia y gestión (por ejemplo, ningún "3,2 sobre 5"): cada eje se publica como su propia proporción de voces.

### Edge cases

- Todas las voces de una cursada marcaron alguna frase de gestión y ninguna marcó una de exigencia: la proporción de exigencia se publica igual, en 0 de N voces, sin ocultarse ni inventarse.
- Una cátedra recién cargada, con una sola voz que marcó una frase de exigencia: se publica igual, 1 de 1 encogido a 20,7% (ADR-0075), sin piso ni escalera.

## US-174: Comparar instituciones lado a lado

### Camino feliz

**E1.** Dado que UNSTA tiene 12 de 40 voces (18,1%) sobre F42 "Cada trámite es una pelea", UTN tiene 60 de 120 voces (41,2%) y UNT tiene 37 de 100 voces (28,2%) sobre la misma frase (ADR-0075)
Cuando Marcela Sosa entra a la comparación de instituciones desde la Ficha de institución de UNSTA
Entonces ve F42 lado a lado para las tres instituciones, cada una con su propia proporción, sus propias voces y su propio encogimiento.

**E2.** Dado la misma comparación de F42 entre UNSTA, UTN y UNT
Cuando se arma la lista
Entonces el orden es alfabético o por cantidad de voces, nunca por el valor de la proporción: UTN no aparece primera por tener el número más alto.

### Negativos

**N1.** Dado la comparación de instituciones por la frase F42
Cuando se arma la vista
Entonces nunca se muestra un compuesto que junte varias frases en un solo número por institución, ni un puesto (1°, 2°, 3°) al lado de cada una.

### Edge cases

- Siglo 21 todavía no tiene voces sobre F42: aparece como "sin voces todavía" dentro de la comparación, no se la oculta ni se le inventa un 0%.
- Solo hay dos instituciones cargadas: la comparación se muestra igual, sin exigir un mínimo.
- Marcela Sosa elige comparar otra frase (por ejemplo F30 "El nivel académico es alto"): la comparación se rearma para esa frase, con las mismas reglas de orden.

## US-175: Avisar al docente que lo nombraron

### Camino feliz

**E1.** Dado que Claudia Fernández tiene identidad docente verificada sobre Cátedra Pérez, y que en el último período se marcaron 5 frases nuevas sobre su cátedra, entre ellas F18 (ahora en 12 de 40 voces, 18,1%, ADR-0075)
Cuando se cumple la cadencia del resumen periódico
Entonces a Claudia le llega un mail que dice cuántas frases nuevas se marcaron sobre su cátedra, sin ninguna fecha ni hora de cuándo se aportó cada una.

### Negativos

**N1.** Dado que Prof. Paredes nunca pidió ni tiene identidad docente verificada
Cuando se marcan frases nuevas sobre Cátedra Ibáñez
Entonces no le llega ningún resumen: el aviso sale solo para quien tiene identidad verificada.

### Edge cases

- El período cierra sin ninguna frase nueva marcada sobre esa cátedra: la story no dice si igual se manda un mail sin novedades o directamente no se manda. **Falta decidir**.
- La cadencia exacta del resumen (semanal, mensual u otra) no está fijada. **Falta decidir** (abierto en la ficha de pantalla de Avisos).
- Alguien compara dos resúmenes consecutivos tratando de inferir cuándo se escribió cada testimonio: el mail nunca lo permite porque no trae fecha ni hora por reseña.

## US-176: Declarar el estado del canal

### Camino feliz

**E1.** Dado que Prof. Paredes pidió verificar que es titular de Cátedra Ibáñez (Física II, UNSTA) y ese pedido todavía está pendiente de resolver
Cuando alguien entra a la Ficha de Cátedra Ibáñez y no hay ninguna réplica
Entonces el estado del canal se muestra como "sin réplica", nunca como "no quiso responder".

**E2.** Dado que el titular de Cátedra Gómez (la otra cátedra de Análisis Matemático II en UNSTA) nunca se registró ni pidió verificar su identidad
Cuando alguien entra a la Ficha de Cátedra Gómez y no hay ninguna réplica
Entonces el estado del canal se muestra como "docente sin identidad verificada", porque nunca se le pudo avisar.

### Negativos

**N1.** Dado cualquiera de los dos casos anteriores (pendiente de verificación, o nunca verificado)
Cuando se muestra el estado del canal
Entonces en ningún caso aparece el texto "no quiso responder" ni ninguna frase que presuma la intención del docente.

### Edge cases

- Prof. Paredes deja Cátedra Ibáñez (se retira o lo reemplazan) sin que nadie asuma su lugar todavía: qué estado muestra el canal en ese momento. **Falta decidir**: ninguna story de esta épica lo cubre.
- La identidad verificada de un docente vence al año (US-226) y no la renueva: si el canal vuelve a mostrarse como "docente sin identidad verificada" pese a que antes sí respondió. **Falta decidir** (abierto en el README de la épica).

## US-177: Ver la serie por período

### Camino feliz

**E1.** Dado que F18 "Hay clases que no se dan" sobre Cátedra Pérez tiene, período por período: 2021 primer cuatrimestre 4 de 4 voces (51,0%), 2023 primer cuatrimestre 12 de 40 voces (18,1%) y 2024 primer cuatrimestre 60 de 120 voces (41,2%), todos según ADR-0075
Cuando se mira la serie de esa frase en la Ficha de Cátedra Pérez
Entonces cada período se ve por separado, con sus propias voces y su propio encogimiento, sin promediar ni interpolar entre ellos, aunque la proporción baje de 51,0% a 18,1% y después suba a 41,2%.

**E2.** Dado que en 2024 primer cuatrimestre se publicó por primera vez la ficha de Cátedra Pérez y en 2024 segundo cuatrimestre Claudia Fernández respondió con su réplica
Cuando se mira la serie
Entonces esos dos períodos quedan marcados en la línea de tiempo como "publicado" y "réplica", respectivamente.

**E3.** Dado que F42 "Cada trámite es una pelea" sobre UNSTA como institución tiene 2022 con 4 de 4 voces (51,0%), 2023 con 37 de 100 voces (28,2%) y 2024 con 60 de 120 voces (41,2%)
Cuando Marcela Sosa entra a ver la serie de UNSTA desde la Ficha de institución
Entonces ve los mismos tres períodos separados y sin suavizar, que es lo que le dice si mejoró desde que se publicó.

### Negativos

**N1.** Dado la serie de una frase con varios períodos
Cuando se muestra
Entonces ningún período se suaviza ni se rellena con un promedio de los vecinos: un hueco sin voces se ve como hueco, no como una interpolación.

### Edge cases

- Un período sin ninguna voz sobre esa frase: aparece como hueco en la serie, no se inventa un punto.
- La cursada cambia de período (por ejemplo, la cátedra pasa de dictarse en el primer cuatrimestre a dictarse en el segundo): qué pasa con la serie y su denominador por período. **Falta decidir** (ADR-0075 lo deja abierto en sus consecuencias).

## US-178: Verificar identidad antes de responder

### Camino feliz

**E1.** Dado que Claudia Fernández pide verificar que es titular de Cátedra Pérez, Análisis Matemático II, UNSTA
Cuando Camila compara ese pedido contra lo que el catálogo tiene cargado de Cátedra Pérez (titular Claudia Fernández, activa desde 2021) y lo aprueba, con su nombre y la fecha
Entonces Claudia queda con identidad docente verificada y Responder le habilita el campo para escribir la réplica.

**E2.** Dado que Matías subió su constancia de alumno regular, y por separado Claudia pidió verificar su identidad docente
Cuando Camila trabaja las colas de Verificaciones
Entonces la constancia de Matías está en la cola de constancias de alumno y el pedido de Claudia está en la cola de identidad docente (US-210), cada una separada de la otra.

**E3.** Dado que a Claudia le aprobaron la identidad docente sobre Cátedra Pérez
Cuando se mira qué habilita esa verificación
Entonces funciona como el permiso que abre el campo de respuesta en Responder, no como una insignia o señal decorativa (a diferencia de la constancia de alumno, que sí es señal, US-190).

### Negativos

**N1.** Dado que alguien dice ser titular de Cátedra Suárez (Química General, UNSTA) y el catálogo todavía no tiene cargado el equipo docente de esa cátedra
Cuando pide verificar su identidad docente
Entonces el pedido no se rechaza pero tampoco se aprueba: pasa a ser trabajo de catálogo (cargar el equipo docente) y se resuelve recién cuando ese dato está.

### Edge cases

- Alguien pide verificarse diciendo ser titular de una cátedra que no existe en el catálogo, con el nombre mal escrito: si eso se rechaza directo o también pasa a trabajo de catálogo. **Falta decidir**.
- La identidad docente de Claudia vence al año (US-226) y ella no la renueva: la próxima vez que quiera responder, el campo vuelve a estar bloqueado hasta reverificar.

## US-179: No quedar expuesto por la réplica

### Camino feliz

**E1.** Dado que Claudia Fernández escribe una respuesta al testimonio de Matías sobre Cátedra Pérez (2024, primer cuatrimestre, con las frases F18 "Hay clases que no se dan" y F05 "El final toma cosas que no se dieron" marcadas)
Cuando manda esa respuesta
Entonces corre el mismo chequeo previo que corre sobre cualquier comentario (ADR-0068 punto 5): si la respuesta habla de alguien fuera de su rol en la cátedra, queda retenida hasta que un humano la mire.

**E2.** Dado que el testimonio de Matías dice «El titular faltó todo mayo y después tomó todo igual. Los tres que cursamos a la noche lo hablamos con el coordinador y no pasó nada. El final fue sobre temas que nunca se dieron.», con "los tres que cursamos a la noche" marcada por el propio Matías como la parte que lo identifica
Cuando Claudia intenta mandar una respuesta que cita textualmente esa parte
Entonces el sistema se lo avisa antes de mandarla, y no la deja publicar así hasta que saque la cita.

**E3.** Dado que Claudia mandó su respuesta al testimonio de Matías
Cuando se le avisa a Matías por mail que va a salir una réplica
Entonces en Mis aportes a Matías se le muestra la fecha en la que se publica si no hace nada, con tres salidas disponibles: editar el testimonio, borrarlo o pedir revisión.

**E4.** Dado que Matías, dentro del plazo, borra su testimonio sobre Cátedra Pérez
Cuando llega la fecha en la que iba a publicarse la respuesta de Claudia
Entonces la respuesta de Claudia no se publica: ya no queda testimonio al que responder.

### Negativos

**N1.** Dado que el testimonio de Matías tiene "los tres que cursamos a la noche" marcada como parte identificante
Cuando Claudia intenta citarla en su respuesta
Entonces esa versión de la respuesta no se publica: se rechaza hasta que la reescriba sin la cita.

### Edge cases

- Matías no hace nada durante todo el plazo (ni edita, ni borra, ni pide revisión): al vencer, la respuesta de Claudia se publica normalmente (camino feliz de US-172).
- Matías pide revisión en vez de editar o borrar: qué resuelve exactamente esa opción no está definido. **Falta decidir** (abierto en la ficha de pantalla de Responder).
- Cuánto dura el plazo entre el aviso a Matías y la publicación: el número no está fijado en ninguna story de la épica. **Falta decidir** (abierto en el README de la épica y en la ficha de Responder).
- La identidad docente de Claudia vence (US-226) durante el plazo de retención, antes de que la respuesta se publique: qué pasa con esa respuesta pendiente. **Falta decidir**.
