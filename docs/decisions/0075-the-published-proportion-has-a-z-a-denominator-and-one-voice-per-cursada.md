# ADR-0075: The published proportion has a z, a denominator, and one voice per cursada

- **Estado**: propuesto
- **Fecha**: 2026-08-21
- **Precisa**: [ADR-0064](0064-phrases-with-voices-not-scores.md)

## Contexto

[ADR-0064](0064-phrases-with-voices-not-scores.md) fijó qué se publica: la frase con su proporción de voces, por eje, con encogimiento. Su punto 11 nombra la fórmula: *"el límite inferior del intervalo de Wilson (o su equivalente, el promedio bayesiano con prior hacia 0.5)"*. Su punto 9 la ejemplifica: *"Hay clases que no se dan: 37% de 120 personas"*.

Eso alcanza para decidir el producto y no alcanza para escribir un test. Al intentar traducir los criterios de US-130, US-131, US-138 y US-164 a escenarios ejecutables aparecieron tres huecos, y cada uno bloquea un `assert`:

1. **Wilson no trae su parámetro.** El límite inferior depende del nivel de confianza. Con 12 de 40, z = 1.96 da 0.18 y z = 1.645 da 0.20. Y el "equivalente bayesiano" que el ADR menciona entre paréntesis es otra fórmula con otro resultado. Tres números distintos para el mismo dato publicado.
2. **El denominador no está definido.** "37% de 120 personas": ¿las 120 son todas las que reseñaron esa cursada, o solo las que marcaron alguna frase de ese eje? Cambia el número de cada frase del producto.
3. **El voto no dice cuántas voces suma.** [US-188](../product/care-for-what-is-published/stories/US-188-vote-me-too-on-a-review.md) dice que el voto *"suma una voz a las frases de esa reseña"*. Si alguien vota dos reseñas distintas de la misma cursada, sin una regla suma dos veces, y una sola persona puede inflar una frase votando.

El glosario ya resolvió el caso vecino (*"quien reseñó tres cursadas de una carrera son tres voces en ella"*), pero no este.

## Decisión

**Los tres parámetros se fijan acá, con nombre y número, para que la proporción publicada sea reproducible por cualquiera que lea el Método.**

1. **z = 1.96 (95% de confianza), y el límite inferior de Wilson, no el equivalente bayesiano.** El paréntesis "o su equivalente" de ADR-0064 se cierra: es Wilson. Una sola fórmula publicable, con su parámetro, es lo que [US-130](../product/choose-where-to-study/stories/US-130-see-how-each-number-is-calculated.md) exige poder citar. El 95% es la convención que una mesa reconoce sin que haya que defenderla, y **no es una elección nueva: es la que los bocetos ya usaban**. La Ficha de cátedra (SC-002) publica tres frases sobre 41 voces con la etiqueta "encogido": 15 de 41 en 24%, 12 de 41 en 18% y 9 de 41 en 12%. Wilson con z = 1,96 da 23,6%, 17,6% y 12,0%, que redondean exactamente a lo dibujado. Con z = 1,645 daría 25%, 19% y 13%, y con z = 1,0 daría 30%, 23% y 16%: ninguno de los dos reproduce el diseño. Esta decisión formaliza el parámetro que el producto ya tenía adentro sin haberlo escrito.

2. **El denominador es la cursada: todas las voces de esa cursada en ese período, hayan marcado esa frase o no.** No las voces del eje, ni las de la frase. Es lo que hace verdadero el criterio de [US-164](../product/write-a-review/stories/US-164-mark-the-opposite-phrase.md) (*"ninguna resta de la otra"*): F01 y F02 se miden contra el mismo denominador, pueden sumar menos de 100% porque hay quien no marcó ninguna, y **nunca se restan entre sí**.

3. **Una persona es una voz por cursada.** Reseñar esa cursada es una voz; votar reseñas de esa cursada es una voz; hacer las dos cosas sigue siendo una voz. La voz suma a la unión de las frases que esa persona sostiene: las que marcó al reseñar más las de las reseñas que votó. Votar diez reseñas de la misma cursada no produce diez voces.

**Lo que no cambia**: la unidad de publicación sigue siendo la frase con su proporción (ADR-0064 punto 9), sigue sin haber número global por eje (punto 10), y cada dato sigue viajando con sus voces y su período (punto 12).

## Alternativas consideradas

**A. z = 1.645 (90%).** Encoge menos y publica números más altos con pocas voces. Se descarta porque el producto se para en lo contrario: un instrumento que va a ser discutido por quien sale mal parado tiene que ser conservador con el dato chico. El 95% es más difícil de atacar.

**B. z = 1.0 (~68%), el que usa Reddit para ordenar comentarios.** Sirve para ordenar, no para publicar: nadie cita un intervalo del 68%. Descartada.

**C. El promedio bayesiano con prior hacia 0.5**, el equivalente que ADR-0064 nombra. Es defendible y da resultados parecidos, pero exige elegir y publicar la fuerza del prior, que es un parámetro más que explicar en Método. Wilson se explica en una línea y tiene nombre propio. Descartada por comunicable, no por incorrecta.

**D. Denominador = las voces del eje** (solo quienes marcaron alguna frase de exigencia). Hace que las proporciones de un eje sumen cerca de 100% y se lean como un reparto, que es exactamente lo que la tesis no quiere: convierte frases independientes en categorías que compiten. Descartada.

**E. Denominador = las voces de la frase.** Sin sentido: daría 100% siempre.

**F. El voto suma una voz por reseña votada.** Es lo que dice la letra de US-188 si se lee sola, y abre el agujero: una persona vota diez reseñas de la misma cursada y multiplica su peso por diez. Descartada; US-188 no lo dice para permitir eso, lo dice sin haber mirado el caso.

## Consecuencias

- **Los cuatro criterios que estaban bloqueados se vuelven calculables.** Con 12 de 40 voces y z = 1.96, la proporción publicada es 18%, no 30%. Con 4 de 4, no es 100%: es 51%. Eso es lo que hay que poder testear antes de escribirlo.
- **US-130 gana su contenido**: Método publica la fórmula, el z y el denominador, no una intención.
- **El dominio necesita una noción de voz por cursada y persona**, que es lo que impide el doble conteo del punto 3. Es un invariante del agregado, no una consulta.
- **Los valores son reversibles y baratos**: cambiar el z cambia un número en un lugar y recalcula todo. Lo caro sería no tener ninguno.
- **Queda abierto**: qué pasa con la proporción de una frase cuando la cursada cambia de período (¿serie por período, como pide US-177, con denominador por período?). Se decide al construir US-177, no acá.

## Refs

- [ADR-0064](0064-phrases-with-voices-not-scores.md) (lo que esto precisa), [ADR-0054](0054-a-metric-without-backing-travels-null-never-zero.md) (una métrica sin sustento viaja null, que es la regla vecina para el caso de cero voces), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (cómo suben las voces a la carrera).
- Wilson, E. B. (1927), *Probable Inference, the Law of Succession, and Statistical Inference*, JASA 22(158). El límite inferior es el que se publica.
- [`product/phrases.md`](../product/phrases.md) (las 51 frases semilla, con su eje y su sentido: F01 y F02 son el par opuesto del punto 2).
