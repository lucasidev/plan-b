# US-169: No repetir lo que ya dije

> Los casos de [US-169](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ana se registra desde el mail "cargamos lo que pediste", con institución (UNSTA) y carrera (Licenciatura en Psicología) ya precargadas por su pedido confirmado,
Cuando crea la cuenta,
Entonces llega directo a leer o a reseñar, sin ningún paso intermedio, y en ningún momento se le vuelve a preguntar institución ni carrera: ya vienen resueltas desde el Registro.

**E2.** Dado que Lucía ya declaró en su primera reseña que entró en 2022,
Cuando hace una segunda reseña, de otra cursada,
Entonces el formulario NO le vuelve a preguntar el año de ingreso; y si marca que cursó Análisis Matemático II en 2024, primer cuatrimestre, y cómo terminó, ese dato viaja pegado a esa reseña, no como una pregunta aparte de su perfil.

**E3.** Dado que Diego dejó su carrera en tercer año y nunca declaró en qué año se fue,
Cuando pasa un año desde la última vez que se le preguntó,
Entonces recibe un mail preguntándoselo una sola vez.

## Negativos

**N1.** Dado que Diego contestó ese mail indicando que se fue en 2024, cuando pasa otro año, entonces plan-b NO le manda un mail nuevo preguntándole lo mismo: la pregunta se apagó para siempre al contestarla.

**N2.** Dado que Ana ya declaró su carrera al registrarse, cuando hace su primera reseña, entonces Reseñar NO le vuelve a preguntar institución ni carrera: lo único que pregunta es la materia, el período y cómo terminó.

## Edge cases

- Si la situación declarada (curso, me recibí, me fui) se puede cambiar después de declararla una vez: ninguna fuente lo fija. **Falta decidir**.
- El reenganche es una sola pregunta por año, no una por cada cursada que a Diego todavía le falta declarar cómo terminó: si tiene tres cursadas sin declarar, le llega un solo mail, no tres.
