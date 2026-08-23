# US-220: Recuperar la contraseña con un link al mail

> Los casos de [US-220](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Diego tiene una cuenta con el mail diego28@gmail.com y olvidó la contraseña.
Cuando pide el link de Recuperar con ese mail.
Entonces la pantalla confirma que el link salió, sin decir nada más de la cuenta: ni si está activa, ni su situación, ni ningún otro dato.

**E2.** Dado que a Diego le llegó el link de Recuperar y todavía no venció.
Cuando lo abre.
Entonces llega directo a poner la contraseña nueva, y la pantalla no le pregunta situación, institución ni carrera: solo la contraseña nueva.

**E3.** Dado que el link que le llegó a Diego para Recuperar ya venció.
Cuando intenta usarlo.
Entonces la pantalla le dice que el link venció y le ofrece pedir uno nuevo, aclarando que lo que venció es el link, nunca la cuenta ni lo que tiene adentro.

## Negativos

**N1.** Dado que a Ana, al registrarse, se le precargaron institución y carrera desde el mail de su pedido (US-142), y después olvida la contraseña.
Cuando abre el link de Recuperar y llega a poner la contraseña nueva.
Entonces la pantalla no le vuelve a preguntar institución, carrera ni situación: nada de lo que ya declaró se repite acá.

**N2.** Dado que el link de Diego ya venció.
Cuando de todos modos intenta mandar una contraseña nueva con ese link vencido.
Entonces el sistema lo rechaza: no le cambia la contraseña con un link que ya venció.

## Edge cases

- Link vencido: pide uno nuevo, y la cuenta con todo lo que tiene adentro sigue intacta.
- Mail que no existe en el sistema: la pantalla confirma que el link salió, igual que si la cuenta existiera, sin decir que ese mail no está registrado.
- Link ya usado una vez, abierto de nuevo.
- Pedir el link dos veces seguidas, antes de usar el primero.

**Falta decidir**: qué pasa la segunda vez que se abre un link ya usado, si sigue sirviendo o queda invalidado. **Falta decidir**: cuánto dura el link y si pedirlo muchas veces seguidas tiene algún límite, abierto en el README de la épica.
