# US-172: Responder con identidad verificada

> Los casos de [US-172](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la Ficha de Cátedra Pérez (Análisis Matemático II, Ingeniería en Sistemas, UNSTA) publica, entre sus conteos, la frase "Podían preguntar sin quedar mal" con moda "No · 66 %" sobre 25 de 38 voces (ADR-0083), y Claudia Fernández con identidad docente verificada como titular de Cátedra Pérez
Cuando Claudia manda su respuesta desde Responder
Entonces la respuesta se publica al instante en el bloque "Qué respondió la cátedra" de la ficha, firmada "Claudia Fernández, titular, identidad verificada", con la fecha de publicación.

**E2.** Dado que la respuesta de Claudia Fernández ya se publicó
Cuando se mira la Ficha de Cátedra Pérez
Entonces "Podían preguntar sin quedar mal" sigue con sus mismas 25 de 38 voces (66 %): la respuesta no movió ningún conteo.

## Negativos

**N1.** Dado que Claudia Fernández todavía no tiene identidad docente verificada
Cuando intenta entrar a Responder
Entonces no ve ningún campo de respuesta: la pantalla la deriva a Verificar antes de poder escribir nada (US-178).

## Edge cases

- Claudia nombra a un estudiante puntual en su respuesta: como no hay chequeo previo (no hay testimonio que citar ni autor anónimo que proteger), esta story no dice qué pasa con ese texto. **Falta decidir** (linda con el canal de reclamos de [Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md)).
- La longitud máxima de la respuesta no está definida.
