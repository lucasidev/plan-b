# US-229: Entrar y volver a lo que estaba haciendo

> Los casos de [US-229](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías está leyendo la Ficha de Cátedra Pérez sin sesión y toca "a mí también me pasó" sobre el testimonio de Lucía.
Cuando el gate lo manda a Ingresar.
Entonces la pantalla dice arriba, con esas palabras, por qué está ahí: "para votar esta reseña, necesitás una cuenta".

**E2.** Dado que Matías está en Ingresar habiendo venido de votar ese testimonio.
Cuando entra con sus credenciales correctas.
Entonces vuelve a la Ficha de Cátedra Pérez, en el mismo testimonio, con el voto ya aplicado: no tiene que buscarlo de nuevo ni tocar otra vez.

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
- La acción que lo trajo ya no es posible cuando vuelve: el testimonio que iba a votar se bajó mientras tanto (US-186).
- Ingresa con una cuenta dada de baja y anonimizada (US-166).
