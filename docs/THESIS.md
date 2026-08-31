# La tesis de plan-b

**Vigente desde**: 2026-08-16. **Registro del viraje**: [ADR-0063](decisions/0063-the-product-is-a-pressure-instrument.md). **Estado de la poda**: [STATUS.md](plan/status.md).

Este documento es la tesis del producto: lo que plan-b es, lo que no hace, y la posición que toma. Todo lo demás del repo se lee contra esto. El código de hoy contiene la versión anterior (el planificador) en retiro; que un módulo exista no significa que la tesis lo respalde.

> **Estado (2026-08-25)**: la tesis se cerró por capas y la medición se rehizo entera el 2026-08-25: el instrumento pregunta conducta observable y vivencia en tres capas ([ADR-0082](decisions/0082-the-review-captures-the-cursada-in-three-layers.md)), la ficha publica conteos y comparaciones, nunca puntajes ([ADR-0083](decisions/0083-the-ficha-publishes-counts-not-scores.md)), el texto libre alimenta la curaduría y no se publica ([ADR-0084](decisions/0084-free-text-feeds-curation-and-is-never-published.md)), y hay tres instrumentos con datos oficiales al lado de las voces ([ADR-0085](decisions/0085-three-instruments-and-official-data.md)). Lo que sigue es propagarla a los [requisitos](product/README.md) y planificar contra ella.

---

## Qué es

Un instrumento de presión construido con lo único que los alumnos tienen y la institución no controla: lo que saben porque lo vivieron.

No es un buscador de carreras, ni un ranking, ni una app de gestión académica. Es el lugar donde lo que hoy es un reclamo aislado y desmentible se vuelve un dato que aguanta una discusión.

## El problema

Los alumnos sostienen la universidad y no tienen forma de incidir en ella. La institución decide, evalúa, demora y define; el alumno acepta. Esa es la asimetría, y es de **poder**, no de información.

La información es su arista más accionable porque es la única pieza que ya está en manos de los alumnos. Pero vive en grupos de WhatsApp y en pasillos. Un alumno diciendo "no dieron las clases" es una anécdota. Cuarenta diciéndolo es un hecho. El único obstáculo entre esas dos cosas es que están dispersos y en silencio.

Contexto argentino: la universidad, y sobre todo la pública, está endiosada. Es transversal la lucha por protegerla, y es casi inaudito auditarla o cuestionarla. Eso lo sufren los estudiantes, no los políticos. plan-b no está en contra de la universidad: está del lado del que la cursa.

## Las cinco decisiones que gobiernan todo

### 1 · Conteos con voces, nunca puntajes

Lo que se publica es el conteo de lo que sus voces respondieron: "Casi nunca contestaba las preguntas: lo dice el 59 % de sus 37 voces", con la distribución completa al lado. La síntesis de cada dato es la **moda**, la opción literal que más personas eligieron, nunca un promedio ni una etiqueta nuestra: "2,4 sobre 3" no significa nada; que el 59 % haya marcado «casi nunca», sí. Ningún dato se promedia con otro y no existe puntaje, rating ni número global de ningún tipo. Por qué conteos y no un 1 a 5, con todo lo que se probó y murió en el camino (el índice, las estrellas, el rating tipo Elo con tiers): [ADR-0083](decisions/0083-the-ficha-publishes-counts-not-scores.md).

Recolectar e informar son dos capas que no se condicionan: la reseña junta la nube de datos cruda y la ficha la trabaja para publicar sus hechos: qué converge, qué distingue al sujeto de sus pares, cómo terminan sus cursadas, cuándo pasó.

### 2 · Conducta observable y vivencia, sin juicio nuestro

El instrumento pregunta dos cosas distintas y no las mezcla: **qué hizo la cátedra** (lo que cualquiera en el aula vio, en frecuencias gruesas: si contestaba preguntas, si se dictaron las clases, si el práctico daba lo mismo que el teórico) y **qué te pasó a vos** (si salías entendiendo, si podías preguntar sin quedar mal). Los dos bloques se publican separados y jamás se suman: la cátedra que entregó el programa en tiempo y forma puede ser la misma de la que el 63 % casi nunca salía entendiendo, y las dos cosas conviven a la vista. El producto no etiqueta culpas ni reparte responsabilidades: publica la conducta y la vivencia, y la atribución la hace el que lee. Quién tiene la culpa no es un dato nuestro.

### 3 · Leer no pide cuenta, producir sí

El gate está en la acción (reseñar, corregir), no en la puerta. Publicamos sobre instituciones que no nos delegaron nada: esconderlo detrás de un login sería no publicarlo. Y si el muro está antes del valor, no hay corpus.

### 4 · La unidad es la cursada

Nadie llega con ganas de inventariar su cuatrimestre: llega con una materia en la cabeza, la que lo destrozó o la que le cambió la carrera. Se reseña **esa cursada**: la materia, la cátedra que la dio, el período, y lo que viviste, en un solo acto de un minuto y medio donde saltear siempre vale. Solo se reseña la cursada: la materia, la carrera y la institución se derivan de ahí, con la cobertura a la vista, porque el dato anclado a una cursada concreta es caro de fabricar y barato de auditar, y el flotante ("puntuá tu universidad") es lo contrario.

Los ítems no son solo nuestros: de lo que muchos escriben en el campo libre se destilan los que faltaban, y el instrumento evoluciona versionado ([ADR-0082](decisions/0082-the-review-captures-the-cursada-in-three-layers.md), [ADR-0084](decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Si los ítems los inventáramos solo nosotros, el producto respondería "¿qué falla?" únicamente con las fallas que se nos ocurrieron.

### 5 · El catálogo es nuestro, y lo oficial viene con fuente

Planes, materias, cátedras y correlativas los carga el equipo, completos: una ficha a medias miente más que una que no existe. Lo que se crowdsourcea es la vivencia, nunca el dato base. Y los datos que son públicos no se le preguntan a nadie: cuánto dura la carrera en la realidad, cuántos egresan por cohorte, si las actas y el presupuesto están publicados, se releva contra la fuente oficial (SPU, CONEAU, AGN) y se publica con fecha y fuente ([ADR-0085](decisions/0085-three-instruments-and-official-data.md)).

## Qué recabamos

Rehecho el 2026-08-25 ([ADR-0082](decisions/0082-the-review-captures-the-cursada-in-three-layers.md), [ADR-0085](decisions/0085-three-instruments-and-official-data.md)). Es la lista de datos que el producto pide, sin nada de cómo se muestran.

1. **La reseña de una cursada**, en tres capas. El **contexto**, que no se publica y controla el sesgo: el período, la cátedra, la modalidad, cómo terminó y cuántas veces la cursaste. La **conducta observable de la cátedra**, en frecuencias gruesas que la memoria real puede responder (nada de contar clases ni recordar días exactos). Y **lo que te pasó a vos**, en primera persona. Saltear cualquier cosa vale y no cuenta en ningún denominador.
2. **El campo libre**, uno solo, al final: "¿algo que no te preguntamos y deberíamos?". No se publica nunca: alimenta a la curaduría ([ADR-0084](decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
3. **El instrumento administrativo**: preguntas cortas de trámites, infraestructura y becas, con disparador propio (el perfil, re-preguntado con el tiempo, porque la opinión institucional cambia a medida que se cursa). Solo cuenta lo respondido por cuentas con al menos una cursada reseñada: el que no puso el cuerpo no mueve números.
4. **La constancia**, opcional: la prueba de condición de alumno. Verificarse pesa, no habilita.
5. **Lo destilado**: del campo libre de muchos salen ítems nuevos, versionados en el catálogo. Es un dato derivado, no pedido.

Nada más se reseña. Ni la carrera, ni la universidad, ni la gestión como acto aparte: se derivan de las cursadas, del instrumento administrativo y del relevamiento oficial.

## Qué publicamos

Rehecho el 2026-08-25. La base son [ADR-0082](decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](decisions/0085-three-instruments-and-official-data.md).

1. **La unidad de publicación es el conteo de un ítem**: la moda como síntesis (la opción literal más votada, con su porcentaje) y la distribución completa por opción. Cada ítem es su propio dato con su propio denominador (quienes lo respondieron); nada se promedia con nada.
2. **La fama es la convergencia.** Lo primero que la ficha dice del sujeto son los hechos donde varios ítems distintos apuntan al mismo lado, predicados de él ("acá no se aprende preguntando"), con el sustento como metadato. Tres ítems convergentes valen más que quinientas marcas en uno.
3. **Comparar es solo contra los pares directos**: una cátedra contra las otras cátedras de su misma materia, donde el sesgo de quién reseña pega parejo y se cancela en la diferencia. El contraste se publica solo si los intervalos no se tocan (Wilson, como maquinaria interna, no como número publicado); sin señal o sin base comparable, silencio. Jamás se cruzan señales de reseñas entre instituciones.
4. **La tasa de finalización se publica agregada** ("de cada 10 que la cursan, llegan 4"): es un resultado de la cátedra y de la universidad, que tiene que luchar por que se reciban. El desenlace individual no se muestra jamás.
5. **Hay piso, y es por el que reseña**: una cátedra publica desde las 10 reseñas, porque con menos el titular deduce quién dijo qué. El estado se muestra ("junta 3 reseñas: con 7 más se publica"). No es vergüenza estadística: es privacidad.
6. **Todo dato viaja con sus voces, su período y su dispersión temporal**: "412 reseñas, 380 cargadas en marzo de 2026" se muestra tal cual, sin filtrar ni suavizar, y el lector interpreta. La coincidencia sola no es evidencia.
7. **Lo que no se reseña se deriva, condicionado a cobertura**: la materia muestra la dispersión entre sus cátedras ("depende de cuál te toque" es el dato); la carrera muestra estructura (qué materia frena a cuántas, dónde se corta la cursada) y cuánto del plan está medido. La carrera de la que nadie habló no es impecable: es desconocida, y la ficha lo dice.
8. **La institución no tiene número**: su ficha es su plantel navegable, su transparencia relevada a fuente pública (con fecha y fuentes), las notas de curaduría y su cobertura.
9. **Los datos oficiales van al lado de las voces, con su fuente dicha**: dura en el papel contra dura en la realidad, egreso por cohorte, plan vigente, acreditación, régimen de ingreso. Comparar una carrera entre instituciones es lado a lado con esos datos, medidos igual para todas, sin compuesto y sin ganador.
10. **La curaduría publica notas sin nombres** a nivel carrera o institución, con procedencia declarada ("leída de comentarios que no se publican") y fecha ([ADR-0084](decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
11. **El instrumento se versiona y la serie declara sus cortes**: si un ítem cambia de significado, cambia de código y la serie no se compara a través. La lista se reprocesa a medida que entran reseñas, y se dice.
12. **El método entero es público**, con el catálogo de ítems, las reglas de publicación y el piso; y los datos se bajan como se publican, agregados: no existe un crudo que tenga más que la ficha.

## Qué no hace

- **No investiga causas.** Mostramos que una materia es un embudo en tres instituciones. Por qué lo es, no lo sabemos y no lo afirmamos. Somos el crudo y el movilizador: que otros se tomen el trabajo de averiguarlo.
- **No juzga lo que mide.** Publica conducta observable y vivencia, cada una con sus voces, y en ningún lado afirma una causa ni nombra un culpable: qué se hace con eso lo decide quien lee.
- **No publica texto de nadie.** El campo libre alimenta la curaduría y muere ahí: es el único lugar donde alguien podría escribir un nombre y una acusación, y ese riesgo es nuestro, no del que escribe ([ADR-0084](decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
- **No planifica tu cuatrimestre.** Eso se resuelve con una lapicera en quince minutos, y competir con la lapicera fue lo que volvió compleja la versión anterior. Le damos lo que la lapicera NO puede calcular: cuántos llegan, qué materia frena a cuántas, y cómo se cursa con cada cátedra.
- **No pretende autoridad ni tiene convenios.** No podríamos publicar estos números y a la vez depender de quien evaluamos.

## Posición tomada

Nada de esto es neutral.

- El nombre del alumno NUNCA aparece. El de la cátedra sí, porque dictar es un acto público y responder también: la respuesta del reseñado se publica con nombre, contra los números agregados de su ficha.
- Aportar pide cuenta, no constancia: si todos se tienen que verificar, el muro queda antes del valor y no hay corpus. El que prueba su condición de alumno suma una señal que viaja con el dato: verificarse pesa, no habilita. Y jamás mostramos quién es nadie; sin eso, el que más tiene para decir es el que más tiene para perder.
- El anonimato es mecanismo, no declaración: ninguna reseña individual se muestra, ni cómo terminó nadie; el texto libre no se publica; y una cátedra no publica hasta juntar 10 reseñas, porque en un grupo chico el titular deduce quién dijo qué. Ese piso protege al que reseña, no a la institución, y el contrato se le dice en la cara antes de enviar.
- La ficha se ve antes de reseñar. Cegarla sería fricción contra el que aporta gratis; el contrapeso del contagio es mostrar la dispersión temporal de las reseñas, siempre.

## A quién sirve

Al que elige, para no decidir con un folleto. Al que está adentro, para saber si lo que le pasa es la materia o la cátedra, y para no reclamar solo. A la cátedra que da bien su materia, que por primera vez tiene dónde que se vea. Al que investiga, porque somos el crudo agregado y se descarga sin registro.

Y a la institución: lo atractivo para ella es exactamente la amenaza que plan-b representa. El mismo dato que la expone es el que le dice dónde arreglar. La que lo ignora queda expuesta; la que lo usa mejora. Las dos rompen la asimetría, una a la fuerza y la otra por decisión.

## Fin último

Que una facultad publique voluntariamente lo que hoy tenemos que reconstruir desde abajo. Ese día plan-b ganó, incluso si deja de hacer falta.
