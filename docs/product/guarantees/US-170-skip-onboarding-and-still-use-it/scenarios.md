# US-170: Saltear el onboarding y usar la app

> Los casos de [US-170](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías termina de registrarse y llega a Empezar,
Cuando aprieta "saltear" en el paso de marcar por dónde va,
Entonces sale del onboarding sin completarlo y puede usar el resto de la app con normalidad.

**E2.** Dado que Lucía dejó Empezar a mitad del paso de marcar sus materias,
Cuando vuelve más tarde y lo abre de nuevo,
Entonces retoma exactamente donde había quedado, no arranca de cero.

**E3.** Dado que Matías nunca marcó ningún plan en Mi carrera,
Cuando entra a una Ficha de materia y corrige un dato duro (US-189),
Entonces la corrección se registra igual: esa acción no depende de tener un plan marcado.

## Negativos

**N1.** Dado que Lucía nunca marcó su plan en Mi carrera, cuando abre la pestaña de co-cursada filtrada a lo que todavía puede cursar, entonces esa pestaña puntual NO puede filtrar y lo dice de manera explícita, en vez de simular un resultado con datos que no tiene: es la única pantalla que sí necesita el plan marcado.

**N2.** Dado que Matías salteó Empezar sin abrir ni un paso, cuando vuelve más tarde a leer o a reseñar, entonces la app NO lo redirige de nuevo a Empezar ni le bloquea nada hasta que lo termine.

## Edge cases

- Cuántos pasos concretos tiene la versión rehecha de Empezar, más allá de marcar por dónde vas: la ficha de esa pantalla no lo cierra. **Falta decidir**.
- Si Empezar ofrece reseñar al terminar el último paso: no está decidido. **Falta decidir**.
