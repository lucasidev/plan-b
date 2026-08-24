# ADR-0075: The published proportion has a z, a denominator, and one voice per cursada

- **Estado**: aceptado (2026-08-24; reescrito el 2026-08-21 tras un pase adversarial que rompió dos puntos de la primera versión: ver "Lo que rompió la primera versión")
- **Fecha**: 2026-08-21
- **Precisa**: [ADR-0064](0064-phrases-with-voices-not-scores.md), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)

## Contexto

[ADR-0064](0064-phrases-with-voices-not-scores.md) fijó qué se publica: la frase con su proporción de voces, por eje, con encogimiento. Su punto 11 nombra la fórmula: *"el límite inferior del intervalo de Wilson (o su equivalente, el promedio bayesiano con prior hacia 0.5)"*. Su punto 9 la ejemplifica: *"Hay clases que no se dan: 37% de 120 personas"*.

Eso alcanza para decidir el producto y no alcanza para escribir un test. Al intentar traducir los criterios de US-130, US-131, US-138 y US-164 a escenarios ejecutables aparecieron tres huecos, y cada uno bloquea un `assert`:

1. **Wilson no trae su parámetro.** El límite inferior depende del nivel de confianza. Con 12 de 40, z = 1,96 da 18% y z = 1,645 da 20%. Y el "equivalente bayesiano" que el ADR menciona entre paréntesis es otra fórmula con otro resultado. Tres números distintos para el mismo dato publicado.
2. **El denominador no está definido.** "37% de 120 personas": ¿las 120 son todas las que reseñaron esa cursada, o solo las que marcaron alguna frase de ese eje? Cambia el número de cada frase del producto.
3. **El voto no dice cuántas voces suma.** [US-188](../product/student/care-for-what-is-published/stories/US-188-vote-me-too-on-a-review/README.md) dice que el voto *"suma una voz a las frases de esa reseña"*. Si alguien vota dos reseñas distintas de la misma cursada, sin una regla suma dos veces, y una sola persona puede inflar una frase votando.

## Decisión

**Los parámetros se fijan acá, con nombre y número, para que la proporción publicada sea reproducible por cualquiera que lea el Método.**

### 1. z = 1,96 (95% de confianza), y el límite inferior de Wilson, no el equivalente bayesiano

El paréntesis "o su equivalente" de ADR-0064 se cierra: es Wilson. Una sola fórmula publicable, con su parámetro, es lo que [US-130](../product/student/choose-where-to-study/stories/US-130-see-how-each-number-is-calculated/README.md) exige poder citar. El 95% es la convención que una mesa reconoce sin que haya que defenderla, y **no es una elección nueva: es la que los bocetos ya usaban**. La Ficha de cátedra (SC-002) publica tres frases sobre 41 voces con la etiqueta "encogido": 15 de 41 en 24%, 12 de 41 en 18% y 9 de 41 en 12%. Wilson con z = 1,96 da 23,6%, 17,6% y 12,0%, que redondean exactamente a lo dibujado. Con z = 1,645 daría 25%, 19% y 13%, y con z = 1,0 daría 30%, 23% y 16%: ninguno reproduce el diseño. Esta decisión formaliza el parámetro que el producto ya tenía adentro sin haberlo escrito.

### 2. El denominador es el sujeto de la frase, no la cursada

Cada frase tiene un sujeto ([`phrases.md`](../product/phrases.md): materia, cátedra, institución, administración, centro de estudiantes). **El denominador son las voces de ese sujeto, en el nivel que le corresponde**, y cómo suben las voces de nivel ya lo fija [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) punto 1: *"arriba de la cursada, la voz es (persona, cursada), y se suma"*.

- Frase de **materia** o de **cátedra**: las voces de esa cursada en ese período.
- Frase de **institución**, **administración** o **centro de estudiantes**: las voces de esa institución, que son la suma de las de sus cursadas.

No son las voces del eje ni las de la frase. Es lo que hace verdadero el criterio de [US-164](../product/student/write-a-review/stories/US-164-mark-the-opposite-phrase/README.md) (*"ninguna resta de la otra"*): dos frases opuestas del mismo sujeto se miden contra el mismo denominador, pueden sumar menos de 100% porque hay quien no marcó ninguna, y **nunca se restan entre sí**.

### 3. Una voz entra al denominador de una frase solo si esa frase estaba disponible cuando habló

Una frase destilada entra al catálogo después: [US-199](../product/team/sustain-the-catalog/stories/US-199-review-distilled-phrases-before-marking/README.md) dice que *"solo se ofrecen para marcar después de aprobadas"*. Quien reseñó antes **nunca tuvo la opción**, y contarlo en el denominador no mide desacuerdo: mide ausencia de oportunidad.

Entonces cada frase lleva la fecha desde la que está disponible para ese sujeto, y su denominador son las voces posteriores. Las frases semilla la tienen desde el día uno, así que para ellas esta regla no cambia nada.

**Consecuencia buscada**: dos frases del mismo sujeto pueden tener denominadores distintos si una es semilla y la otra destilada. Es correcto, porque midieron poblaciones distintas, y la ficha lo dice publicando el "de N voces" de cada una.

### 4. Una persona es una voz por cursada

Reseñar esa cursada es una voz; votar reseñas de esa cursada es una voz; hacer las dos cosas sigue siendo una voz. La voz suma a la unión de las frases que esa persona sostiene: las que marcó al reseñar más las de las reseñas que votó. Votar diez reseñas de la misma cursada no produce diez voces.

**Lo que no cambia**: la unidad de publicación sigue siendo la frase con su proporción (ADR-0064 punto 9), sigue sin haber número global por eje (punto 10), y cada dato sigue viajando con sus voces y su período (punto 12).

## Lo que rompió la primera versión

Esta decisión se escribió el 2026-08-21 y se atacó el mismo día, antes de aceptarla. Dos puntos no aguantaron, y quedan acá para que no se reintroduzcan.

**Decía "el denominador es la cursada".** Con eso, **17 de las 46 frases del catálogo se quedaban sin denominador**: las 11 de institución y las 6 de administración no hablan de una cursada. Lo arregla el punto 2.

**Y no tenía la ventana de disponibilidad.** Con el denominador contando a todos, una frase destilada nace invisible. Medido: 100 personas reseñan una cursada en los meses 1 a 5; en el mes 6 se destila y aprueba una frase salida de sus propios comentarios; en los meses 6 a 12 reseñan 20 más y 15 la marcan. Con la regla vieja publicaba 15 de 120, o sea **7,7%**. Con la ventana publica 15 de 20, o sea **53,1%**. **Un factor de 7, y siempre hacia abajo.** Le pegaba justo al mecanismo que la tesis inventó para capturar lo que el catálogo semilla no supo nombrar. Lo arregla el punto 3.

## Alternativas consideradas

**A. z = 1,645 (90%).** Encoge menos y publica números más altos con pocas voces. Se descarta porque el producto se para en lo contrario: un instrumento que va a ser discutido por quien sale mal parado tiene que ser conservador con el dato chico. El 95% es más difícil de atacar.

**B. z = 1,0 (~68%), el que usa Reddit para ordenar comentarios.** Sirve para ordenar, no para publicar: nadie cita un intervalo del 68%. Descartada.

**C. El promedio bayesiano con prior hacia 0,5**, el equivalente que ADR-0064 nombra. Es defendible y da resultados parecidos, pero exige elegir y publicar la fuerza del prior, que es un parámetro más que explicar en Método. Wilson se explica en una línea y tiene nombre propio. Descartada por comunicable, no por incorrecta.

**D. Denominador = las voces del eje** (solo quienes marcaron alguna frase de exigencia). Hace que las proporciones de un eje sumen cerca de 100% y se lean como un reparto, que es exactamente lo que la tesis no quiere: convierte frases independientes en categorías que compiten. Descartada.

**E. Denominador = las voces de la frase.** Sin sentido: daría 100% siempre.

**F. El voto suma una voz por reseña votada.** Es lo que dice la letra de US-188 si se lee sola, y abre el agujero: una persona vota diez reseñas de la misma cursada y multiplica su peso por diez. Descartada; US-188 no lo dice para permitir eso, lo dice sin haber mirado el caso.

**G. Re-preguntar la frase destilada a quienes ya reseñaron**, para que el denominador vuelva a ser uniforme. Resuelve el problema del punto 3 por el otro lado, y se descarta por dos razones: rompe [US-169](../product/guarantees/US-169-never-asked-twice/README.md) (nada se pregunta dos veces), y convierte cada aprobación de una destilada en una notificación masiva. La ventana de disponibilidad da el mismo resultado sin molestar a nadie.

## Consecuencias

- **Los cuatro criterios que estaban bloqueados se vuelven calculables.** Con 12 de 40 voces y z = 1,96, la proporción publicada es 18,1%, no 30%. Con 4 de 4, no es 100%: es 51,0%.
- **US-130 gana su contenido**: Método publica la fórmula, el z, el denominador y la ventana de disponibilidad, no una intención.
- **El dominio necesita tres cosas que antes no se veían**: la voz por (persona, cursada), que impide el doble conteo; el sujeto de cada frase, que decide contra qué se mide; y la fecha desde la que cada frase está disponible para cada sujeto. Las tres son invariantes del agregado, no consultas.
- **Una sola voz publica 20,7%**, no 100%. Es la consecuencia directa de que la tesis diga "no hay piso" ([ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) punto 5) y de encoger desde la primera. Se publica junto al "1 voz", así que se lee entero, pero **hay que mirar cómo queda en la ficha antes de dar por buena esa lectura**: nadie la vio todavía.
- **Los hechos de trayectoria no son frases y esta regla no los cubre.** Recibido, se fue y no dijo son una partición: los conteos crudos suman el total y encogidos no. Medido: 12, 18 y 10 sobre 40 dan 18,1%, 30,7% y 14,2%, que suman **63%**. Encoger cada proporción por separado es correcto para frases independientes (marcar F01 no impide marcar F02) y no lo es para casos excluyentes. Cómo se publica la trayectoria se decide al construir [US-133](../product/student/choose-where-to-study/stories/US-133-see-if-it-leads-to-graduation/README.md), y esta decisión no la alcanza.
- **Los valores son reversibles y baratos**: cambiar el z cambia un número en un lugar y recalcula todo. Lo caro sería no tener ninguno.
- **Queda abierto**: qué pasa con la proporción cuando la cursada cambia de período (la serie de US-177, con denominador por período). Se decide al construir esa story.

## Refs

- [ADR-0064](0064-phrases-with-voices-not-scores.md) (lo que esto precisa), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (cómo suben las voces de nivel, que es lo que hace posible el punto 2), [ADR-0054](0054-a-metric-without-backing-travels-null-never-zero.md) (una métrica sin sustento viaja null, la regla vecina para el caso de cero voces).
- Wilson, E. B. (1927), *Probable Inference, the Law of Succession, and Statistical Inference*, JASA 22(158). El límite inferior es el que se publica.
- [`product/phrases.md`](../product/phrases.md) (las 46 frases semilla, con su sujeto, su eje y su sentido: F01 y F02 son el par opuesto del punto 2).
