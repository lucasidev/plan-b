# US-190: Verificarme sin que sea obligatorio

> Los casos de [US-190](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías reseñó la cursada de Análisis Matemático II (Cátedra Fernández, UNSTA) sin haberse verificado nunca
Cuando cualquiera lee su testimonio en la Ficha de cátedra
Entonces se publica igual que cualquier otro, sin ninguna marca de "pendiente de verificar" ni ningún bloqueo: aportar nunca pidió verificarse.

**E2.** Dado que Matías sube su certificado de alumno regular en Verificar y Camila lo aprueba en Verificaciones el 2026-08-21
Cuando Matías entra a Mi perfil
Entonces ve la señal de verificado con la fecha "2026-08-21".
**Falta decidir**: cómo se ve esa misma señal en la Ficha de cátedra, al lado de su testimonio, sin identificarlo (qué texto o ícono usa) no está resuelto (README de la épica).

**E3.** Dado que la frase F18 (Hay clases que no se dan) de Cátedra Fernández en Análisis Matemático II está en 12 de 40 voces (18,1%, ADR-0075), y una de esas 40 es la reseña de Matías, todavía sin verificar
Cuando Matías se verifica (sube su certificado y Camila lo aprueba)
Entonces la frase sigue en 12 de 40 voces (18,1%): la proporción no cambia, las voces se cuentan igual verificadas o no.

## Negativos

**N1.** Dado que Matías se verificó, cuando revisa si eso le habilitó algo que antes no podía hacer (responder, tener más votos, algo especial), entonces no encuentra nada nuevo: verificarse es señal, nunca permiso, a diferencia de la identidad docente o el cargo institucional, que sí habilitan Responder.

## Edge cases

- Cómo se ve la señal de verificado en la ficha pública sin identificar a nadie ("12 de 20 voces verificadas"? un ícono al lado del testimonio?) es una pregunta abierta, no una decisión (README de la épica).
- La constancia se rechaza por parecer adulterada: el motivo queda a la vista y Matías puede volver a intentarlo sin quedar marcado (US-211, cola de Verificaciones).
- Diego dejó la carrera hace tres años: puede reseñar igual, porque aportar no exige estar cursando, pero un certificado de alumno regular lo emite la universidad solo a quien sigue inscripto; si Diego puede verificarse sin estar cursando no está resuelto en ninguna fuente.
