# US-152: Decir en qué año me fui

> Los casos de [US-152](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Diego entró a Ingeniería en Sistemas en UNSTA en 2017 y se fue en 2019 (año 3 del plan: me fui − entré + 1), y la mayoría de quienes se fueron de esa carrera también lo hizo en el año 3 (18 de los 30 que se fueron).
Cuando se visita la Ficha de carrera.
Entonces se publica que el año 3 del plan es donde se fue la mayoría de los que se fueron, con el límite inferior de Wilson (18 de 30, 42,3%, z = 1.96) y sus voces.

**E2.** Dado que en Análisis Matemático II, período 2026-C1, 120 cursadas terminaron de alguna forma (37 la aprobé, 25 me quedó regular, 38 la recursé, 20 la dejé).
Cuando se visita la Ficha de materia.
Entonces se publica la tasa de finalización como 42,8% (62 de 120 terminaron aprobada o regular, límite inferior de Wilson con z = 1.96), por período.

**E3.** Dado que Diego nunca dijo su situación de trayectoria y reseña Análisis Matemático II con un período viejo, 2019-C1.
Cuando el paso 2 le pregunta "¿seguís cursando?" y contesta "me fui, en 2019", y más tarde entra a Mi situación o le llega el mail anual de reenganche.
Entonces el hecho queda guardado desde la primera respuesta y ninguno de los otros caminos le vuelve a hacer la pregunta.

## Negativos

**N1.** Dado que un alumno nunca contestó la pregunta de trayectoria (ni en Reseñar con período viejo, ni en Mi situación, ni por el mail anual), Cuando se calculan los agregados de cohorte, Entonces cuenta como "no dijo o sigue": el sistema nunca infiere que se fue, aunque pasen años sin que reseñe nada.

## Edge cases

- Si el año declarado de "me fui" es anterior al año de "entré" (dato inconsistente), esa cuenta no entra al agregado de trayectoria (control de calidad; sin ADR que lo fije).
- Falta decidir: el tercer camino (la app cuando ya pasó entré más la duración nominal) todavía no tiene pantalla asignada.
- Falta decidir: si "me fui" pide el año o el período, y qué pasa con quien se fue y volvió (dos hechos, no uno).
