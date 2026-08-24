# ADR-0079: The subjects are the real fichas

- **Estado**: aceptado (2026-08-24)
- **Fecha**: 2026-08-24
- **Precisa**: [ADR-0064](0064-phrases-with-voices-not-scores.md) (el sujeto dice a qué ficha va), [ADR-0075](0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md) (la lista de sujetos del denominador)

## Contexto

El catálogo de frases listaba cinco sujetos: materia, cátedra, institución, administración y centro de estudiantes, con la lista declarada abierta. Al asignarles tema a las frases (sesión de curaduría del #352, [ADR-0078](0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md)) aparecieron tres síntomas de que la lista estaba mal cortada:

1. **El borde institución/administración era difuso y diluía señal**: "el título tardó meses" tenía sujeto institución y "cada trámite es una pelea" tenía sujeto administración, siendo la misma vivencia (el mostrador es la institución). La misma queja se repartía entre dos denominadores.
2. **El centro de estudiantes era sujeto y tema a la vez**, una celda degenerada en la matriz sujeto × tema.
3. **Ni administración ni centro tienen ficha**: no están entre las pantallas del producto, y el sujeto existe para decir a qué ficha va el dato ([ADR-0064](0064-phrases-with-voices-not-scores.md)). Un sujeto que no enruta a ninguna ficha no enruta.

Además, dos frases de la sesión nombraban "la carrera" como si fuera marcable, y la carrera no es sujeto: se deriva sumando las voces de sus materias ([ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)), y el momento de marcar es siempre una cursada concreta o un evento institucional.

## Decisión

**Los sujetos de frase son las fichas reales: materia, cátedra e institución.**

1. El sujeto dice a qué ficha va el dato, y esas son las fichas donde un dato marcado aterriza. La carrera tiene ficha pero se deriva: no es sujeto.
2. **El mostrador y el centro de estudiantes pasan a ser temas** de la vivencia institucional: sus frases llevan sujeto institución y conservan su tema (trato, trámites, centro). La vivencia no se pierde; deja de partirse en denominadores fantasma.
3. Las frases que nombraban "la carrera" se reescriben a nivel marcable o se van: "es una carrera cara" salió del catálogo (la cuota es dato público, no vivencia; el costo vivido queda en materiales, ocultos y becas), y la de carga horaria habla de la cursada.

## Alternativas consideradas

**A. Dejar los cinco sujetos.** Rechazada: mantiene el borde difuso (misma vivencia, dos denominadores) y la celda degenerada, y deja dos sujetos que no enrutan a ninguna ficha.

**B. Darle ficha propia al centro de estudiantes.** Rechazada por YAGNI: nadie pidió esa pantalla, y el centro se lee perfectamente como tema dentro de la ficha de institución. Si algún día el producto necesita la ficha del centro, este ADR se revisa.

**C. La lista abierta.** Era el statu quo ("la lista no es cerrada"). Rechazada: la apertura invitaba a agregar sujetos por comodidad editorial sin preguntarse a qué ficha enrutan, que es exactamente cómo aparecieron administración y centro.

## Consecuencias

- El catálogo ([phrases.md](../product/phrases.md)) quedó con 67 frases y sujetos {materia, cátedra, institución}; la matriz de cobertura pasa a 3 filas.
- [ADR-0075](0075-the-published-proportion-has-a-z-a-denominator-and-one-voice-per-cursada.md) queda **precisado**: su regla (el denominador es el sujeto de la frase) no cambia, pero la lista de sujetos posibles es esta. Las frases del mostrador y del centro cuentan contra las voces de la institución.
- La tesis y el glosario ya lo dicen (propagados el 2026-08-24, mismo día de la decisión).
- La ficha de institución gana la responsabilidad de mostrar el mostrador y el centro como temas legibles; cómo, lo decide la spec de la ficha.
