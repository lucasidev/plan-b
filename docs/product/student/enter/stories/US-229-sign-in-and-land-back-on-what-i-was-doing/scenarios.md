# US-229: Entrar y volver a lo que estaba haciendo

> Los casos de [US-229](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías está leyendo la Ficha de Cátedra Pérez sin sesión y toca "¿La cursaste? Reseñala".
Cuando el gate lo manda a Ingresar.
Entonces la pantalla dice arriba, con esas palabras, por qué está ahí: "para reseñar una cursada, necesitás una cuenta".

**E2.** Dado que Matías está en Ingresar habiendo venido de reseñar Análisis Matemático II con la Cátedra Pérez.
Cuando entra con sus credenciales correctas.
Entonces vuelve a Reseñar con la materia y la cátedra ya elegidas, en el paso donde estaba: no tiene que buscarlas de nuevo ni empezar el flujo otra vez.

**E3.** Dado que Matías entra desde el link de Ingresar del pie, sin venir de ninguna acción.
Cuando entra con sus credenciales correctas.
Entonces la sesión se abre y va al lugar por defecto, sin ningún motivo arriba, porque no hubo acción que lo trajera.

## Negativos

**N1.** Dado que Matías escribió su mail bien y la contraseña mal.
Cuando intenta entrar.
Entonces el aviso dice que el mail o la contraseña no coinciden, sin decir cuál de los dos falló y sin borrar lo que ya escribió: no confirma si ese mail tiene cuenta.

## Edge cases

- La sesión expira entre que llega a Ingresar y que manda el formulario.
- Entra en otra pestaña y vuelve a la primera, que todavía cree que no hay sesión.
- La acción que lo trajo ya no es posible cuando vuelve: esa misma cursada ya la reseñó desde otra sesión, y el flujo lo lleva a su reseña en vez de abrir una nueva (una voz por cuenta, materia y período).
- Ingresa con una cuenta dada de baja y anonimizada (US-166).
