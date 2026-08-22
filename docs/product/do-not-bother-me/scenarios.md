# Escenarios de Que no me molesten

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-168: Leer sin necesitar cuenta

### Camino feliz

**E1.** Dado que Valentina nunca creó una cuenta en plan-b,
Cuando entra a la Ficha de cátedra de Análisis Matemático II, Cátedra Pérez, UNSTA (cabecera de gestión: "6 de cada 10 marcaron alguien fallando, 41 voces"),
Entonces lee la cabecera, las listas de frases por eje, la serie por período y los testimonios completos sin que en ningún momento se le pida iniciar sesión.

**E2.** Dado que Valentina compara instituciones en Dónde estudiarla,
Cuando abre la Ficha de carrera de cada oferta comparada,
Entonces las lee todas sin cuenta: ninguna pantalla de esa cadena de lectura le exige login.

### Negativos

**N1.** Dado que Silvia entra directamente a la Ficha de carrera de la carrera de su hija, sin cuenta, cuando la pantalla termina de cargar, entonces NO aparece ningún redirect ni modal a Ingresar antes de mostrarle la trayectoria y la cohorte cerrada: Ingresar solo aparece si ella misma dispara una acción con cuenta.

### Edge cases

- Una cátedra recién cargada con una sola voz, por ejemplo "Física I, Cátedra Domínguez, UNSTA" con F18 "Hay clases que no se dan" encogida de 100% a 20,7% con 1 voz (ADR-0075), se lee sin cuenta igual que una con 41 voces: el gate nunca depende de cuánta data hay detrás.
- El límite exacto entre "una pantalla de lectura con una acción adentro" (votar, reportar) y "una pantalla que pide cuenta" no está escrito: hoy el gate está en la acción puntual (reportar no pide cuenta, votar sí), nunca en toda la pantalla, pero dónde termina esa línea queda abierto. **Falta decidir**.

## US-169: No repetir lo que ya dije

### Camino feliz

**E1.** Dado que Ana se registra desde el mail "cargamos lo que pediste", con institución (UNSTA) y carrera (Licenciatura en Psicología) ya precargadas por su pedido confirmado,
Cuando llega a Empezar y después a Mi carrera,
Entonces en ningún momento se le vuelve a preguntar institución ni carrera: ya vienen resueltas desde el Registro.

**E2.** Dado que Lucía ya declaró en su primera reseña que entró en 2022,
Cuando hace una segunda reseña, de otra cursada,
Entonces el formulario NO le vuelve a preguntar el año de ingreso; y si marca que cursó Análisis Matemático II en 2024, primer cuatrimestre, y cómo terminó, ese dato viaja pegado a esa reseña, no como una pregunta aparte de su perfil.

**E3.** Dado que Diego dejó su carrera en tercer año y nunca declaró en qué año se fue,
Cuando pasa un año desde la última vez que se le preguntó,
Entonces recibe un mail preguntándoselo una sola vez.

### Negativos

**N1.** Dado que Diego contestó ese mail indicando que se fue en 2024, cuando pasa otro año, entonces plan-b NO le manda un mail nuevo preguntándole lo mismo: la pregunta se apagó para siempre al contestarla.

**N2.** Dado que Ana ya declaró su carrera al registrarse, cuando abre Empezar, entonces el paso de carrera NO aparece como una pregunta a completar: lo único que se le ofrece es marcar por dónde va, materia por materia.

### Edge cases

- Si la situación declarada (curso, me recibí, me fui) se puede cambiar después de declararla una vez: ninguna fuente lo fija. **Falta decidir**.
- El reenganche es una sola pregunta por año, no una por cada cursada que a Diego todavía le falta declarar cómo terminó: si tiene tres cursadas sin declarar, le llega un solo mail, no tres.

## US-170: Saltear el onboarding y usar la app

### Camino feliz

**E1.** Dado que Matías termina de registrarse y llega a Empezar,
Cuando aprieta "saltear" en el paso de marcar por dónde va,
Entonces sale del onboarding sin completarlo y puede usar el resto de la app con normalidad.

**E2.** Dado que Lucía dejó Empezar a mitad del paso de marcar sus materias,
Cuando vuelve más tarde y lo abre de nuevo,
Entonces retoma exactamente donde había quedado, no arranca de cero.

**E3.** Dado que Matías nunca marcó ningún plan en Mi carrera,
Cuando entra a una Ficha de cátedra y aprieta "a mí también me pasó" en un testimonio,
Entonces el voto se registra igual: esa acción no depende de tener un plan marcado.

### Negativos

**N1.** Dado que Lucía nunca marcó su plan en Mi carrera, cuando abre la pestaña de co-cursada filtrada a lo que todavía puede cursar, entonces esa pestaña puntual NO puede filtrar y lo dice de manera explícita, en vez de simular un resultado con datos que no tiene: es la única pantalla que sí necesita el plan marcado.

**N2.** Dado que Matías salteó Empezar sin abrir ni un paso, cuando vuelve más tarde a leer o a votar, entonces la app NO lo redirige de nuevo a Empezar ni le bloquea nada hasta que lo termine.

### Edge cases

- Cuántos pasos concretos tiene la versión rehecha de Empezar, más allá de marcar por dónde vas: la ficha de esa pantalla no lo cierra. **Falta decidir**.
- Si Empezar ofrece reseñar al terminar el último paso: no está decidido. **Falta decidir**.

## US-171: Que no me vendan nada

### Camino feliz

**E1.** Dado que Explorar lista carreras y universidades,
Cuando Valentina elige cómo ordenarlas,
Entonces solo puede elegir entre alfabético o por voces (nunca "recomendado" ni "destacado"), y ninguna institución aparece remarcada ni fija arriba de la lista por haber pagado algo.

**E2.** Dado que "Ingeniería en Sistemas" está cargada en dos instituciones, con la cabecera de gestión de UNSTA encogida de 100% a 51,0% sobre 4 voces, y la cabecera de gestión de Siglo 21 encogida de 30% a 18,1% sobre 12 de 40 voces (ADR-0075),
Cuando Valentina abre Dónde estudiarla para compararlas,
Entonces las dos ofertas aparecen ordenadas alfabético o por voces, nunca por cuál cabecera tiene el número más alto o más bajo, y ninguna lleva una etiqueta de "mejor opción" ni aparece remarcada.

### Negativos

**N1.** Dado que Inicio elige al azar una ficha real para mostrar como muestra, por ejemplo "Análisis Matemático II, Cátedra Pérez, UNSTA: 6 de cada 10 marcaron alguien fallando, 41 voces", cuando se hace ese sorteo, entonces NO depende de cuál cátedra tiene el número más alto, más bajo o más voces: es al azar entre las que pasan el gate de cobertura, nunca por el valor del número.

**N2.** Dado que una institución (UNSTA, Siglo 21, UTN Facultad Regional Tucumán, UNT o USPT) le paga o le propone un acuerdo a plan-b, cuando se renderiza cualquier listado del producto, entonces esa institución NO aparece remarcada, con una marca de "destacado" ni ordenada por delante de las demás por esa razón: no existe ningún mecanismo de eso en el producto.

### Edge cases

- Cómo se audita este orden cuando haya que elegir uno "de verdad" (alfabético, por voces, por cobertura): cualquiera que no sea neutro puede leerse como conveniencia, y esta épica todavía no lo resuelve. **Falta decidir**.
- Empate en voces entre dos ofertas cuando el criterio elegido es "por voces": ninguna fuente fija el desempate. **Falta decidir**.
