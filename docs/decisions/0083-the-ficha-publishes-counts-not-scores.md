# ADR-0083: The ficha publishes counts, not scores

- **Estado**: aceptado (2026-08-25)
- **Fecha**: 2026-08-25

## Contexto

Probamos varias síntesis para que la ficha se lea de un vistazo: prevalencia por tema, listas de proporciones, un rating tipo Elo/Glicko con tiers de minerales. Todas fallaron por alguna de dos razones: o describían a la medición y no al medido ("el 51 % de las respuestas salió mal" habla de los estudiantes, no de la cátedra), o fabricaban un número único sin sustento real (contra un estándar fijo, sin partidas entre pares, el Elo degenera matemáticamente en un promedio de aciertos con escala esotérica: 1429 no le dice nada a nadie).

A la vez, el número publicado tiene que aguantar dos ataques conocidos: la coincidencia fabricada (500 reseñas idénticas en tres días no son evidencia, son contagio o campaña) y el sesgo de detección (la carrera con más reseñas se ve peor solo porque se la midió más).

## Decisión

**La ficha publica conteos y comparaciones, nunca puntajes.**

1. **La moda como badge**: cada ítem muestra literalmente la opción más votada ("Casi nunca · 59 %"), sin etiquetas inventadas ni promedios ("2,4 sobre 3" no significa nada; que el 59 % haya marcado «casi nunca», sí).
2. **La distribución completa por opción**, como barra segmentada. El único color de alarma es el rojo de la opción negativa; el resto va en grises. No hay semáforos ni umbrales editoriales.
3. **Dos bloques que no se suman** (qué hizo la cátedra / qué les pasó a los que cursaron): sumarlos sería el puntaje único por la ventana.
4. **La fama es la convergencia**: arriba de la ficha van los hechos donde varios ítems distintos apuntan al mismo lado, predicados del sujeto ("Acá no se aprende preguntando"), con el sustento como metadato. Tres ítems convergentes valen más que quinientas marcas en uno.
5. **La comparación es solo contra las hermanas de la misma materia**: ahí el sesgo de autoselección pega parejo a los dos lados y la diferencia es creíble. Intervalos de Wilson para proporciones, y la regla editorial: **el contraste se publica solo si los intervalos no se tocan**; sin señal, silencio. Sin base comparable (cátedra única), la sección no aparece.
6. **La tasa de finalización se publica agregada** ("de cada 10 que la cursan, llegan 4"): es un resultado de la cátedra y de la universidad, que tiene que luchar por que se reciban. El desenlace individual no se publica jamás.
7. **La dispersión temporal siempre visible**: "412 reseñas, 380 cargadas en marzo de 2026" se muestra tal cual y el lector interpreta. No se filtra ni se suaviza nada.
8. **Todo agregado hacia arriba va condicionado a cobertura**: la carrera sin reseñas no es impecable, es desconocida, y la ficha lo dice ("23 de 51 materias medidas").
9. **El análisis crece por capas**: (1) conteos SQL directos desde la primera reseña; (2) comparaciones con intervalos; (3) modelo Rasch con severidad del respondente y pooling jerárquico, en batch, recién con N decente (si algún día existe un número por unidad, sale de acá); (4) cruces con las series oficiales (SPU) como validación externa del instrumento.

## Alternativas consideradas

**Promedio o estrellas.** Mezcla dimensiones inconmensurables, castiga a la cátedra exigente y honesta, y "3,2" no aguanta una discusión porque no es un hecho.

**Rating Elo/Glicko con tiers.** Sin partidas entre pares no hay red que lo sostenga: contra oponente fijo colapsa a win-rate con pasos de más. Los tiers quedaron huérfanos con él.

**Prevalencia por tema.** El tema murió como estructura del instrumento; el agregado temático heredaba esa muerte.

**Número único institucional.** Agrega Medicina con Filosofía: no describe nada (ver ADR-0085).

**Filtrar o suavizar picos de carga sospechosos.** Nos volvería jueces de intención; mostrar la dispersión temporal logra lo mismo sin tocar el dato.

## Consecuencias

- La ficha mínima de R1 (#360) se redefine con esta anatomía: fama por convergencia, tasa agregada, dos bloques con moda y distribución, comparaciones con silencio.
- El método público documenta la regla de intervalos, el piso, la convergencia y el condicionamiento por cobertura.
- Ningún boceto ni pantalla escribe números a mano: se computan de un corpus (regla de trabajo que ya reveló contrastes espurios).
- La capa 3 y la 4 quedan declaradas y no construidas: nada en v1 depende de ellas.
