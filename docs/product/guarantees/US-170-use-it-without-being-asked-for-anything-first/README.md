# US-170: Usarlo sin que me pidan nada antes

**Épica**: [Que no me molesten](../README.md)
**Del mapa**: O6-3

## Historia

Como quien entra, quiero leer y reseñar sin que me hagan completar nada primero, porque no vine a hacer trámites.

## Listo cuando

- Ninguna pantalla exige completar datos antes de dejarme leer o reseñar.

## Dónde se resuelve

Es una garantía transversal: no tiene pantalla propia, se verifica en cada ficha de pantalla nueva (la tercera de las cuatro preguntas del checklist, ver el README de esta épica) y en el [Definition of Done](../../../plan/definition-of-done.md).

## Notas

**Reformulada el 2026-08-29.** Decía "todo funciona sin plan cargado, salvo lo que necesita saber qué cursás", y protegía algo concreto: que Matías pudiera saltear el onboarding donde se marcaba el plan. Con [ADR-0086](../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) ese onboarding se retiró, y el enunciado quedó cumpliéndose solo: sin plan que cargar, la pregunta del checklist ("¿deja de funcionar si no hay plan marcado?") siempre daba que no. Una garantía que no puede fallar no frena nada.

La intención no cambió (no me hagan hacer trámites); cambió el sujeto, de un trámite que ya no existe a cualquiera que se agregue. Ahora agarra los dos casos que la versión anterior no nombraba: un paso obligatorio antes de dejarte reseñar una cursada, y un gate de cuenta para leer una ficha (que además viola [US-168](../US-168-read-without-an-account/README.md)).
