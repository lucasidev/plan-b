# Escenarios de Llevarse el dato

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-180: Descargar el crudo sin registrarse

### Camino feliz

**E1.** Dado que en el período 2024, primer cuatrimestre, 40 personas reseñaron o votaron la cursada de la Cátedra Pérez (Análisis Matemático II, UNSTA), y de esas 40, 12 marcan o sostienen "Hay clases que no se dan" (F18, sujeto cátedra, eje gestión); entre esas 12 está Matías, que no reseñó esa cursada sino que votó "a mí también me pasó" en la reseña de Lucía, que sí la había marcado
Cuando Rocío entra a Método sin haber iniciado sesión y descarga el CSV
Entonces la tabla 1 trae una fila con frase F18 ("Hay clases que no se dan"), sujeto Cátedra Pérez (Análisis Matemático II, UNSTA), período 2024, primer cuatrimestre, voces 12 de 40 y eje gestión: el voto de Matías ya está sumado en esas 12, sin una fila aparte para él.

**E2.** Dado que 300 personas entraron a Ingeniería en Sistemas (UNSTA) entre 2012 y 2016 y reseñaron algo de esa carrera, de las cuales 45% se recibió, 30% se fue y 25% no dijo o sigue; y que en el período 2024, segundo cuatrimestre, 40 personas llevaron juntas Análisis Matemático II y Programación I, de las cuales 12 dejaron una de las dos
Cuando Rocío descarga el CSV
Entonces la tabla 2 trae una fila con esos agregados por carrera-institución y cohorte (Ingeniería en Sistemas, UNSTA, cohorte 2012-2016), una fila por materia y período con su aprobación y su abandono de cursada (Análisis Matemático II, 2024, primer cuatrimestre), y una fila por par y período con la co-cursada (Análisis Matemático II más Programación I, 2024, segundo cuatrimestre: 40 juntas, 12 dejaron una).

**E3.** Dado que Matías escribió, además de sus votos, una reseña propia de la Cátedra Pérez con un comentario en sus palabras
Cuando Rocío descarga el CSV
Entonces ninguna de las dos tablas trae el nombre de Matías, su cuenta, su perfil ni el texto de su comentario: la fila de F18 solo trae frase, sujeto, período, voces y eje, igual que lo que ya se lee en la Ficha de cátedra.

### Negativos

**N1.** Dado que Matías vota "a mí también me pasó" en tres reseñas distintas de la Cátedra Pérez, todas del período 2024, primer cuatrimestre
Cuando se recalculan las voces que va a traer el CSV para esa cursada en ese período
Entonces Matías cuenta una sola voz en el denominador (las 40), nunca tres: votar varias reseñas de la misma cursada no multiplica su voz (ADR-0075, punto 3).

**N2.** Dado que Lucía marcó frases al reseñar la Cátedra Pérez y en su comentario contó una anécdota puntual
Cuando Rocío busca esa anécdota palabra por palabra dentro del CSV descargado
Entonces no la encuentra en ninguna columna: el CSV nunca exporta testimonios en bloque, se hayan retirado o no.

### Edge cases

- Una cátedra con una sola voz (Cátedra Gómez, la otra cátedra de Análisis Matemático II en UNSTA, período 2025, primer cuatrimestre, 1 de 1 marcó "Explican bien", F12, cátedra, gestión) aparece igual en el CSV desde la primera voz, con su proporción encogida a 20,7%: no hay piso que la deje afuera del archivo (ADR-0066).
- Una institución recién cargada sin ninguna cursada reseñada todavía no aporta ninguna fila a ninguna de las dos tablas: no existe una fila con "voces: 0", porque una métrica sin sustento viaja null, nunca cero (ADR-0054).
- El primer día del producto, sin ninguna reseña todavía, el CSV se descarga igual, sin cuenta, con las dos tablas en cero filas.
- Se corta la conexión de Rocío a mitad de la descarga: puede reintentar el botón "Descargar el CSV" en Método sin fricción, porque no hay sesión ni estado de descarga que retomar (el archivo es estático y sin cuenta).
- Una institución con coma en su nombre (por ejemplo, "UTN, Facultad Regional Tucumán") aparece como sujeto de una fila sin correr las columnas del CSV. **Falta decidir**: el separador, el escapado y la codificación exactos del CSV.
- En el período 2025, primer cuatrimestre nadie declaró cuántas clases no se dieron en la Cátedra Pérez: ese campo viaja vacío, nunca en cero, porque nadie lo midió.

**Falta decidir**: el formato exacto del CSV (columnas, codificación, si trae el encogimiento ya calculado o solo k y n) y con qué periodicidad se regenera el crudo.

## US-181: Cuánto se bajó del corpus

### Camino feliz

**E1.** Dado que este trimestre Nahuel bajó 21 textos de 3.240 comentarios: 14 por la categoría "Vida privada, salud o familia", 4 por "Aspecto" y 3 por "Datos de contacto"
Cuando Rocío entra a Método
Entonces ve el conteo por categoría (14, 4, 3) y el total (21 de 3.240), sin ninguna palabra del contenido de los textos retirados.

**E2.** Dado que Matías reseñó la Cátedra Pérez marcando "Hay clases que no se dan" (F18) y escribió un comentario que Nahuel bajó por "Vida privada, salud o familia"
Cuando alguien entra a la Ficha de cátedra y mira la proporción de F18
Entonces la voz de Matías sigue contando ahí (sigue sumando al numerador y al denominador de esa cursada), aunque su comentario ya no se lea en ningún lado.

**E3.** Dado que el comentario retirado de Matías mencionaba detalles de salud de un tercero
Cuando Rocío descarga el CSV de Método
Entonces no encuentra ese texto en ninguna fila ni columna: el CSV nunca contiene testimonios, se hayan bajado o no.

### Negativos

**N1.** Dado que Nahuel bajó el comentario de Matías por "Vida privada, salud o familia"
Cuando se recalcula la proporción de "Hay clases que no se dan" (F18) en la Cátedra Pérez
Entonces la voz de Matías no se resta ni del numerador ni del denominador de F18: bajar un texto nunca resta una voz.

**N2.** Dado que Método arma el bloque "Cuánto se bajó y por qué" con los conteos por categoría
Cuando se publica ese bloque
Entonces no incluye ningún fragmento del texto retirado, ni siquiera parcial o parafraseado: solo la categoría y el número.

### Edge cases

- Alguien reporta el comentario de Matías el mismo día; mientras Nahuel no resuelve, ese texto sigue publicado y todavía no suma al conteo de bajados de Método.
- Una categoría sin ningún texto bajado en el trimestre (por ejemplo, "Datos de contacto" en cero) se publica igual con su conteo en cero: acá el cero es una medición real (se revisó y no hubo ninguno), no ausencia de dato.

**Falta decidir**: la taxonomía completa de categorías para bajar un texto (la ficha de Reportes lo deja abierto); estos escenarios usan las tres categorías de ejemplo del boceto de Método (Vida privada, salud o familia; Aspecto; Datos de contacto).

## US-182: Publicar qué no cubrimos todavía

### Camino feliz

**E1.** Dado que hay 86 carreras cargadas, 61 en cola y 214 pedidas sin confirmar todavía, y que la carrera Ingeniería en Sistemas de UNSTA tiene voces en 24 de sus 40 materias
Cuando Rocío entra a Método
Entonces ve los tres números (86, 61, 214) y, al entrar a la Ficha de carrera de Ingeniería en Sistemas (UNSTA), la cobertura "24 de 40 materias con voces".

**E2.** Dado que el método declara que todo dato es de quienes reseñaron, que la duración real es solo de los que se recibieron y que la co-cursada es solo de quien reseñó las dos materias
Cuando Rocío lee el bloque "Los sesgos declarados" de Método
Entonces encuentra las tres aclaraciones: que ningún número es "la tasa de la carrera", que la duración real deja afuera a quien no se recibió, y que la co-cursada no sale del plan que alguien marcó para sí, que es privado.

**E3.** Dado que 142 cuentas de 9.400 quedaron afuera de todo agregado de trayectoria por inconsistencia (por ejemplo, una cuenta con "me recibí" antes que "entré")
Cuando Rocío entra a Método
Entonces ve "142 de 9.400" cuentas afuera por inconsistencia, y esas 142 cuentas no suman ni al numerador ni al denominador de ningún agregado publicado (por ejemplo, la duración real de Ingeniería en Sistemas).

### Negativos

**N1.** Dado que Ana pidió la carrera Ingeniería en Sistemas de Información en UTN, Facultad Regional Tucumán, y todavía no está cargada
Cuando Rocío entra a Método
Entonces esa carrera no figura como cargada: cuenta dentro de las 214 pedidas o de las 61 en cola, nunca aparece con una ficha como si tuviera datos.

**N2.** Dado que Ingeniería en Sistemas de UNSTA todavía no llegó a más de la mitad de sus materias con voces (por ejemplo, 15 de 40)
Cuando alguien entra a esa Ficha de carrera
Entonces no ve la cabecera derivada con las dos proporciones: ve la cobertura (15 de 40) y el aviso de que todavía no se derivó, nunca un número inventado para completar el hueco.

### Edge cases

- Una carrera que ya está cargada pero con cero cursadas reseñadas todavía figura entre las 86 cargadas, con cobertura "0 de N materias": es una medición real (se revisó el plan entero y ninguna tiene voces), no un "sin datos".
- El plan de una carrera suma una materia nueva: la cobertura ("24 de 40") cambia de denominador, no solo de numerador.
- Una carrera con dos planes cargados en la misma institución (por ejemplo, un cambio de plan de estudios) usa un único denominador de cobertura: la unión de sus materias canónicas, no una cobertura por plan.

## US-183: Publicar el método y la fórmula

### Camino feliz

**E1.** Dado que en una cátedra recién cargada 4 personas de 4 marcaron "Es dura de verdad" (F01, sujeto materia, eje exigencia) en su única cursada reseñada
Cuando Valentina entra a Método antes de citar ese número
Entonces encuentra el límite inferior del intervalo de Wilson escrito tal cual, con sus tres variables (p, n, z = 1,96), y puede recalcular que lo publicado es 51,0%, no 100%.

**E2.** Dado que el catálogo tiene 46 frases semilla, cada una con su sujeto y su eje (por ejemplo, F01 "Es dura de verdad": materia, exigencia; F27 "Hubo acoso": cátedra, gestión, sin categoría aparte ni canal privado)
Cuando Rocío entra a Método
Entonces ve el catálogo entero, cada frase con su sujeto y su eje a la vista, incluida F27 al lado de cualquier otra.

**E3.** Dado que en el período 2024, primer cuatrimestre de la Cátedra Pérez, 40 personas reseñaron o votaron esa cursada: 12 marcaron "Hay clases que no se dan" (F18) y otras marcaron "Las clases se dan" (F17, su sentido opuesto)
Cuando Método explica cómo se calcula cada proporción
Entonces declara que F18 (12 de 40, 18,1%) y F17 comparten el mismo denominador (las 40 voces de esa cursada en ese período, marcaran o no cada frase), que sus proporciones no tienen por qué sumar 100% y que nunca se restan entre sí; y las dos viajan con sus voces y su período al lado.

**E4.** Dado que "Es dura de verdad" (F01, materia, exigencia) tiene, sumando todos los períodos y las dos cátedras de Análisis Matemático II (Pérez y Gómez) en UNSTA, 37 voces de 100
Cuando se compara ese dato con el de F01 dentro de una sola cátedra y un solo período
Entonces cada uno muestra su propio n y su propio período (37 de 100, encogido a 28,2%, para toda la materia; un número distinto para un solo período de una sola cátedra): son denominadores de niveles distintos, y ninguno se confunde con el otro.

### Negativos

**N1.** Dado que ADR-0064 mencionaba "el promedio bayesiano con prior hacia 0,5" como equivalente
Cuando alguien busca esa fórmula alternativa en Método
Entonces no la encuentra publicada: ADR-0075 cerró que se publica una sola fórmula, el límite inferior de Wilson con z = 1,96, no dos conviviendo.

**N2.** Dado que "Hay clases que no se dan" (F18) se publica en la Cátedra Pérez
Cuando se muestra su proporción en cualquier ficha o en el CSV
Entonces nunca aparece sin sus voces (12 de 40) ni sin su período (2024, primer cuatrimestre) al lado: no hay un número pelado.

### Edge cases

- "Se puede rendir libre y aprobar" (F08, materia, gestión) todavía no la marcó nadie en ninguna cursada: igual aparece en el catálogo entero de Método, porque el catálogo se publica completo aunque una frase no tenga uso todavía.

## US-184: Nunca afirmar una causa

### Camino feliz

**E1.** Dado que la Cátedra Pérez tiene "Hay clases que no se dan" (F18) en 12 de 40 voces (18,1%)
Cuando alguien lee la lista de frases de gestión de esa ficha
Entonces ve la frase con su proporción de voces, sin ningún texto adicional que explique por qué pasa.

**E2.** Dado que la cabecera de la Cátedra Pérez muestra sus dos proporciones (exigencia y gestión, con el mismo denominador)
Cuando alguien las lee
Entonces las lee como la lectura agregada de los dos ejes (cuánta gente dice que es dura, cuánta gente marcó alguien fallando), nunca como un puntaje ni como un juicio aparte de la lista de frases.

**E3.** Dado que "Contenido de hace diez años" (F07, materia, gestión) sale alta en Análisis Matemático II
Cuando ese dato se publica en la Ficha de materia
Entonces se muestra la frase con su proporción de voces, sin ningún texto que explique por qué el contenido no se actualiza ni quién es responsable: eso es lo que el producto no sabe y no afirma (THESIS, "Qué no hace").

### Negativos

**N1.** Dado que "Te la estudiás solo" (F16, cátedra, gestión) sale alta en la Cátedra Pérez y "Es dura de verdad" (F01, materia, exigencia) también sale alta
Cuando se arma cualquier texto de esa ficha
Entonces no aparece una frase que conecte las dos como causa y efecto (por ejemplo, "es dura porque te la estudiás solo"): son dos hechos separados, con su propio sujeto y su propio n, y ninguno explica al otro.

### Edge cases

- Claudia responde en su réplica que en mayo de 2024 tuvo licencia médica sin reemplazo: esa es la explicación de Claudia, citada con su nombre y su rol, y no se confunde con una causa que el producto afirme por cuenta propia.
- El eje de una frase (exigencia o gestión) es una atribución publicada, no una causa: dice de qué lado cae el hecho (la carrera siendo dura, alguien fallando), nunca por qué pasa ni quién tiene la culpa (ADR-0065).

## US-185: Sin acuerdos con las instituciones

### Camino feliz

**E1.** Dado que UNSTA, UTN y UNT están las tres cargadas en el catálogo
Cuando alguien entra a Método
Entonces lee la postura escrita: que no hay acuerdos con ninguna institución y que ninguna tiene trato preferencial.

**E2.** Dado que UNSTA tiene 563 de 1.340 voces como sujeto, UNT tiene 80 de 205 y UTN tiene 148 de 290
Cuando se calcula la proporción de cada una
Entonces las tres usan el mismo z = 1,96, el mismo denominador (todas las voces de esa institución como sujeto) y el mismo gate de cobertura: ninguna tiene una regla de cálculo distinta.

### Negativos

**N1.** Dado que una institución pidiera un umbral de cobertura más bajo para mostrar antes su cabecera derivada de carrera
Cuando se evalúa ese pedido
Entonces se rechaza: el gate de "más de la mitad de las materias del plan" (ADR-0066) es el mismo para todas, sin excepción por convenio.

### Edge cases

- UNSTA es la institución de origen de este proyecto: sus datos se calculan con las mismas reglas que UTN o UNT, sin ningún trato distinto declarado ni de hecho.
- Una institución con pocas voces (UNT, 80 de 205) se publica igual que una con muchas (UNSTA, 563 de 1.340): ninguna se oculta ni se redondea para parecer mejor.

## US-186: Marcar el texto retirado

### Camino feliz

**E1.** Dado que Nahuel bajó, con la categoría "Vida privada, salud o familia", el comentario que Matías había escrito al reseñar la Cátedra Pérez en el período 2023, segundo cuatrimestre
Cuando alguien entra a esa Ficha de cátedra
Entonces ve, en el lugar de ese testimonio, que el texto se retiró y con qué categoría, sin ninguna palabra del comentario original.

**E2.** Dado que Matías había marcado "Hay clases que no se dan" (F18) en esa misma reseña
Cuando su comentario se retira
Entonces F18 en la Cátedra Pérez sigue sumando la voz de Matías en su proporción, igual que antes del retiro.

### Negativos

**N1.** Dado que el comentario de Matías se retiró por hablar de una persona fuera de su acto público
Cuando alguien lee la Ficha de cátedra
Entonces no encuentra ningún resumen ni fragmento del contenido retirado, ni siquiera parafraseado: solo la marca de retirado y la categoría.

### Edge cases

- Con el tiempo se retiran todos los comentarios con texto de la Cátedra Gómez: la sección de testimonios queda sin nada para leer, pero las listas de frases por eje siguen mostrando sus voces con normalidad.
- Rocío descarga el CSV el lunes; Nahuel retira el comentario de Matías el martes; Rocío descarga de nuevo el miércoles: las dos descargas traen los mismos números de voces para F18, porque el CSV nunca tuvo ese texto y retirarlo no mueve ningún conteo.

## US-187: Declarar el reproceso y la destilación

### Camino feliz

**E1.** Dado que la Ficha de cátedra Pérez se reprocesó por última vez el 19 de agosto de 2026
Cuando alguien la lee ese mismo día
Entonces ve, en el pie de la ficha, "esta lista se reprocesa" junto con la fecha exacta con la que se está leyendo ("leída el 19/8/2026"), no una fecha de cuándo se reseñó.

**E2.** Dado que "Toman lo que no dieron" es una frase destilada de comentarios, aprobada por quien cura las frases con sujeto materia y eje gestión
Cuando se muestra en la lista de frases de gestión de una ficha
Entonces aparece marcada como "síntesis" al lado de su proporción, distinta de una frase semilla como "Hay clases que no se dan" (F18), que no lleva esa marca.

**E3.** Dado que "Toman lo que no dieron" tiene, en un período dado, sus propias voces sobre el total de esa cursada
Cuando Rocío descarga el CSV
Entonces la fila de esa frase lleva la misma marca de destilada que se ve en la ficha.

### Negativos

**N1.** Dado que "Toman lo que no dieron" todavía está en la cola de curaduría de Frases, sin sujeto ni eje asignado
Cuando alguien reseña la Cátedra Pérez
Entonces esa frase no se ofrece para marcar y no aparece en ninguna ficha ni en el CSV: recién se ofrece, marcada como destilada, después de que quien cura las frases la apruebe con sujeto y eje (US-199).

### Edge cases

- El comentario retirado de Matías (2023, segundo cuatrimestre) sigue alimentando el pipeline de destilación aunque nadie pueda leerlo en ninguna ficha (ADR-0068, punto 7).
- Quien cura las frases corrige el eje de "Hay clases que no se dan" (F18): la corrección reprocesa todas las fichas que usan F18, y Método declara el cambio con autor y fecha (US-198). **Falta decidir**: cómo se versiona el catálogo para que una cita puntual de Rocío sea exactamente reproducible más allá de declarar la fecha de lectura.
