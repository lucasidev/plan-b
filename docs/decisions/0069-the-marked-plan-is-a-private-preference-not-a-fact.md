# ADR-0069: What you mark on your plan is a private preference, not a fact

- **Estado**: aceptado
- **Fecha**: 2026-08-18

## Contexto

La pantalla de tu plan (el mapa la llama Mi carrera; en el código es `/my-career`) muestra el plan de estudios de la carrera que declaraste, con sus correlativas, y una pestaña de co-cursada. La story US-144 pide "ver esas combinaciones contra lo que me falta", y para resolver correlativas hace falta saber qué materias aprobaste o regularizaste en **todo** el plan. La tesis solo sabe de vos lo que declaraste al reseñar (cuándo cursaste, cómo terminó) y dice de los hechos de trayectoria: "de a uno, cuando aparecen, nunca como inventario" ([THESIS.md](../THESIS.md), "Qué recabamos", en su redacción de entonces). Era la decisión D01 de la [propagación del 17](../history/reviews/2026-08-17-catalog-propagation.md).

## Decisión

**Lo que marcás en tu plan es preferencia privada, no dato.** En la pantalla del plan podés señalar qué materias te faltan o cuáles estás considerando, para que la co-cursada se filtre a tu caso. Eso se guarda por comodidad y nada más: no es un hecho de trayectoria, no entra a ningún agregado, no se publica, no se exporta, y no cambia ninguna proporción. Lo que ya reseñaste con cómo terminó viene marcado solo, porque eso sí es un hecho.

Con esto US-144 se construye sin reabrir "qué recabamos", y la reseña sigue siendo la única puerta por la que un hecho entra al corpus.

## Alternativas consideradas

**A. Dejar marcar en el plan "la cursé, terminó así" de a una materia, sin frases, como hecho de trayectoria.** Era la primera recomendación. Descartada por dos razones: si cuenta como reseña, diluye los conteos (cien "aprobé" sin frases suman al denominador de "dicen que es dura" con cero marcas); si no cuenta como reseña, es un tercer tipo de dato que hay que explicar en el glosario y en el método. Y una pantalla del plan donde marcás materias es el inventario que la tesis dice que nadie completa, con otro nombre.

**B. Cancelar US-144** y que la pantalla del plan sea solo el plan con lo que reseñaste. Descartada: Lucía pide el filtro y se le puede dar sin costo para la tesis.

**C. Preferencia privada** (la decisión). Le da el filtro, no recaba nada, no diluye nada.

## Consecuencias

- **US-144** se reescribe: el filtro sale de lo que reseñaste (hecho) más lo que marcaste como que te falta (preferencia); resolver correlativas contra el plan es lo que hoy hace `SubjectAvailabilityEvaluator` en `planning`, que se rescata a `academic` antes de podar. **US-145** ("volver a marcar lo que curso") es esa misma preferencia.
- **El modelo de datos** guarda la preferencia aparte de los hechos de trayectoria y de las reseñas, y ninguna lectura pública la toca. Un hecho entra al corpus solo por la reseña y su contexto ([ADR-0082](0082-the-review-captures-the-cursada-in-three-layers.md)).
- **El glosario** gana "marcar el plan" con esta definición, y "corral" (la palabra del mapa) no se usa.
- **La pantalla del plan** se define para su ficha en `docs/product/my-career/screens/`: el plan con correlativas, lo reseñado con cómo terminó, la marca privada de lo que falta, y la co-cursada filtrada.

## Refs

- [THESIS.md](../THESIS.md), "Qué recabamos" (cerrado; esta decisión no lo amplía). La co-cursada sale solo de reseñas, nunca del plan marcado, y esta decisión lo confirma: la marca es preferencia. El ADR que lo fijaba se retiró con el modelo anterior y ninguno vigente lo reemplaza. D01 en la [revisión del 17](../history/reviews/2026-08-17-catalog-propagation.md).
