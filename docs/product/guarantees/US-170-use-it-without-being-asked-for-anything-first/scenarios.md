# US-170: Usarlo sin que me pidan nada antes

> Los casos de [US-170](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías termina de registrarse,
Cuando el producto lo deja donde entró,
Entonces puede leer una ficha o reseñar una cursada sin que nada le pida completar un dato primero.

**E2.** Dado que alguien llega de un link a una ficha de cátedra, sin cuenta,
Cuando la abre,
Entonces la lee entera, con sus conteos, sin registro ni muro de por medio ([US-168](../US-168-read-without-an-account/README.md)).

**E3.** Dado que Matías nunca declaró nada más que su carrera al registrarse,
Cuando entra a una Ficha de materia y corrige un dato duro (US-189),
Entonces la corrección se registra igual: ninguna acción del producto depende de datos que no le pedimos.
No construido: corregir un dato duro desde la Ficha de materia es US-189 (Backlog)

## Negativos

**N1.** Dado que una pantalla nueva quisiera exigir completar el perfil antes de dejar reseñar,
Cuando se la verifica contra esta garantía en el checklist de la épica,
Entonces no pasa: la garantía es exactamente eso, y el paso obligatorio se saca o se vuelve salteable.

**N2.** Dado que Matías reseñó una cursada y volvió días después,
Cuando entra de nuevo,
Entonces la app NO lo manda a completar nada ni le bloquea nada por lo que no declaró.

## Edge cases

- Reseñar sí pide cuenta, y eso no viola esta garantía: producir un hecho exige haber cursado, y esa es la asimetría de la tesis. Lo que la garantía prohíbe es pedir datos **de más** antes de dejarte hacer lo que viniste a hacer.
- La primera reseña pregunta el año de ingreso ([US-155](../../student/write-a-review/README.md)): es un dato del hecho que se está contando, no un trámite previo, y se pregunta una sola vez ([US-169](../US-169-never-asked-twice/README.md)).
