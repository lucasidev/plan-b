# US-127: Ver cuánto tarda de verdad la carrera

> Los casos de [US-127](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.
>
> Reescritos contra el modelo de [ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) (hallazgo E01): la versión anterior daba por hecho que "dura en la realidad" iba a llegar publicada ("UNT... 8,4 años") y sus cuatro escenarios confirmaban un vacío declarado, no un dato. El [relevamiento](../../../../../history/reviews/2026-09-07-official-data-survey.md) mostró que **ninguna fuente pública publica la duración real por carrera**: lo que la ficha muestra hoy es "dura en el papel" publicado contra "dura en la realidad" explícitamente no publicado, con fecha. Verde acá tiene que significar que ese contraste se lee, no que la ficha esconde el vacío.

## Camino feliz

**E1.** Dado que la Tecnicatura Universitaria en Desarrollo y Calidad de Software de UNSTA dura 2 años y medio en el papel según el sitio institucional (RM 2495/2018)
Cuando se mira el bloque de datos oficiales en su Ficha de carrera
Entonces se lee "Dura en el papel" con "2 años y medio" (o su forma equivalente en años y decimales) y, al lado, su fuente y su período.

**E2.** Dado que ninguna fuente pública releva cuánto tarda en recibirse quien cursa esa Tecnicatura
Cuando se mira el mismo bloque
Entonces "Dura en la realidad" no se deja en blanco ni se calcula sobre reseñas propias: se muestra "No publicado" con qué se buscó y la fecha del relevamiento, al lado de "Dura en el papel" publicado.

**E3.** Dado que Ingeniería en Sistemas en UTN todavía no tiene ninguna cursada reseñada
Cuando se mira su Ficha de carrera
Entonces el bloque de datos oficiales se muestra igual, porque no depende de reseñas: solo "qué frena la cursada" y la cobertura dicen que la carrera arranca vacía.

**E4.** Dado que la Ficha de carrera muestra un dato oficial publicado, como "Dura en el papel"
Cuando se lee ese dato
Entonces nunca aparece sin su fuente al lado: ningún dato oficial se publica sin decir de dónde sale, publicado o no.

## Negativos

**N1.** Dado que una carrera todavía no tiene ningún dato oficial relevado (ni "dura en el papel" ni "dura en la realidad")
Cuando se arma su Ficha de carrera
Entonces el bloque entero dice que todavía no hay datos oficiales de esa carrera, en vez de mostrar un espacio vacío sin explicación o inventar un número.

**N2.** Dado que "dura en la realidad" de una carrera todavía no está relevada
Cuando se arma su Ficha de carrera
Entonces esa fila no se completa con un cálculo sobre reseñas propias ni con un cero: dice que ese dato no está publicado, con su fecha.

## Edge cases

- La misma carrera en tres instituciones (US-128, Dónde estudiarla): cada institución tiene su propia afirmación de "dura en la realidad", con su propio estado. Hoy las tres relevadas están "no publicado"; el día que una universidad responda un pedido de información, esa fila cambia sola, sin tocar a las demás.
- Un plan reformado, con dos planes coexistiendo: a cuál de los dos corresponde "dura en el papel" cuando los dos están vigentes queda abierto (US-204).
