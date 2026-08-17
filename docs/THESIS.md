# La tesis de plan-b

**Vigente desde**: 2026-08-16. **Registro del viraje**: [ADR-0063](decisions/0063-the-product-is-a-pressure-instrument.md). **Estado de la poda**: [STATUS.md](STATUS.md).

Este documento es la tesis del producto: lo que plan-b es, lo que no hace, y la posición que toma. Todo lo demás del repo se lee contra esto. El código de hoy contiene la versión anterior (el planificador) en retiro; que un módulo exista no significa que la tesis lo respalde.

> **Revisión en curso (2026-08-16)**: la tesis se está cerrando por capas, en orden. **Cerrado**: qué es, el problema, a quién sirve, y [qué recabamos](#qué-recabamos). **Abierto**: qué publicamos y cómo (los dos números, la atribución, la lista destilada, con qué reglas). Las decisiones 1 y 2 de abajo describen la intención original y se reescriben cuando cierre lo publicado; hasta entonces no se construye nada que dependa de ellas.

---

## Qué es

Un instrumento de presión construido con lo único que los alumnos tienen y la institución no controla: lo que saben porque lo vivieron.

No es un buscador de carreras, ni un ranking, ni una app de gestión académica. Es el lugar donde lo que hoy es un reclamo aislado y desmentible se vuelve un dato que aguanta una discusión.

## El problema

Los alumnos sostienen la universidad y no tienen forma de incidir en ella. La institución decide, evalúa, demora y define; el alumno acepta. Esa es la asimetría, y es de **poder**, no de información.

La información es su arista más accionable porque es la única pieza que ya está en manos de los alumnos. Pero vive en grupos de WhatsApp y en pasillos. Un alumno diciendo "no dieron las clases" es una anécdota. Cuarenta diciéndolo es un hecho. El único obstáculo entre esas dos cosas es que están dispersos y en silencio.

Contexto argentino: la universidad, y sobre todo la pública, está endiosada. Es transversal la lucha por protegerla, y es casi inaudito auditarla o cuestionarla. Eso lo sufren los estudiantes, no los políticos. plan-b no está en contra de la universidad: está del lado del que la cursa.

## Las cinco decisiones que gobiernan todo

### 1 · Dos números, nunca promediados

**Exigencia** (cuán dura es) y **gestión** (cuán bien la llevan). Una carrera exigente no es una carrera mal llevada, y confundirlas es exactamente lo que protege al que la lleva mal. Exigencia alta NO es un defecto: es información. Gestión baja SÍ es alarma: es alguien fallando.

Los dos salen de conteos de frases, con encogimiento hacia el medio según cuánta gente habló: cuatro marcas de un solo lado no producen un 5.0.

### 2 · Atribución

Cada frase lleva si lo que describe es propio de la materia o de la institución. De ahí sale "de todo lo que la hace difícil, el 65% es la institución fallando, no la carrera siendo dura". Esa es la tesis del producto, y va pegada al número, no en otra caja.

Cómo se produce: cada frase tiene un **sujeto** (la materia, la cátedra o la institución) y un **eje** (exigencia o gestión). La atribución no se declara: se calcula. Lo que es exigencia de la materia es la carrera siendo dura; lo que es gestión de la cátedra o de la institución es alguien fallando. La cátedra tiene ficha propia y, a los efectos de la atribución, cuenta del lado de la institución: el docente que no da clases es la institución que lo permite.

### 3 · Leer no pide cuenta, producir sí

El gate está en la acción (reseñar, votar, corregir), no en la puerta. Publicamos sobre instituciones que no nos delegaron nada: esconderlo detrás de un login sería no publicarlo. Y si el muro está antes del valor, no hay corpus.

### 4 · La unidad es la cursada, no el período

Nadie llega con ganas de inventariar su cuatrimestre: llega con una materia en la cabeza, la que lo destrozó o la que le cambió la carrera. Se reseña **esa cursada**: lo que viviste cursándola, que es la materia, la cátedra que la dio y la gestión que la rodeó, en un solo acto. Se marcan frases y, si querés, escribís en tus palabras. Confirmar es más barato que elegir; el que no quiere escribir vota la reseña de otro. Cinco minutos o no lo hace nunca. Un acto produce muchos datos; no muchas preguntas producen uno.

Las frases no son solo nuestras. Las nuestras son el punto de partida; de lo que muchos escriben se destilan las que faltaban, y esas se suman a las que se ofrecen. Si las frases las inventáramos solo nosotros, el producto respondería "¿qué falla?" únicamente con las fallas que se nos ocurrieron.

Lo mismo vale para los hechos: cuánto tarda la gente de verdad, dónde se cae la mayoría, qué se llevó junto y cuántos dejaron una. Eso no sale de frases, sale de trayectoria, y la trayectoria se pregunta **de a un hecho, en el momento en que aparece** (cuándo cursaste esto, cuándo entraste, si te fuiste cuándo, si te recibiste cuándo), nunca como inventario. Con esos hechos sueltos, cruzados por cuenta, se reconstruye lo que ningún checklist consigue que alguien complete.

### 5 · El catálogo es nuestro

Planes, materias y correlativas los carga el equipo, completos. Una ficha a medias miente más que una que no existe. Lo que se crowdsourcea es la valoración, nunca el dato base. Si una carrera no está, se pide y la cargamos: el hueco es nuestro y se dice.

## Qué recabamos

Cerrado el 2026-08-16. Es la lista de datos que el producto pide, sin nada de cómo se muestran: eso se decide después, y aparte.

1. **La reseña de una cursada.** El acto principal: elegís una materia que cursaste. Lleva la materia y el período en que la cursaste; la cátedra, si la recordás; las **frases que marcás** de las que se ofrecen (las nuestras y las ya destiladas para esa materia); el **comentario** en tus palabras, opcional; y si hubo clases que no se dieron, cuántas (una pregunta que aparece solo si marcaste que sí). Cada frase habla de algo (su **sujeto**: la materia, la cátedra, la institución, el centro de estudiantes; la lista no es cerrada, es "de qué habla") y de un aspecto (su **eje**: exigencia o gestión). Todo lo que hace a la cursada entra acá: cómo se dicta, cómo se evalúa, el techo de nota, rendir libre, el trato, y también el acoso, como cualquier otra frase.
2. **El evento institucional.** Lo que pasa fuera de una cursada y también hay que contar: trámites y título (cuánto tardó, si salió), equivalencias, vacantes que no conseguiste, el sistema que no cargó o se cayó, mesas que no hubo o regularidades que vencieron esperando, el trato de administrativos y del centro de estudiantes. Se pregunta de a un evento, cuando aparece, sin materia. Lleva frases, comentario y votos igual que la reseña: es el mismo mecanismo con el sujeto fijo, no otro producto.
3. **Los votos.** "A mí también me pasó", sobre una reseña o un evento que otro escribió, sin escribir. Es lo que convierte una reseña en muchas voces. Se vota la reseña entera, no una frase suelta.
4. **Los hechos de trayectoria.** De a uno, cuando aparecen, nunca como inventario: cuándo entraste, cuándo cursaste cada materia (viene con la reseña), si te fuiste cuándo, si te recibiste cuándo.
5. **La constancia**, opcional: la prueba de condición de alumno. Verificarse pesa, no habilita.
6. **Lo destilado.** De los comentarios de muchos, con inteligencia, salen frases nuevas que se suman a las que se ofrecen para marcar. Es un dato derivado, no pedido, y está acá porque alimenta el punto 1.

Nada más se reseña. Ni la carrera, ni la universidad, ni la gestión como acto aparte: la carrera y la institución se derivan de sus cursadas y sus eventos; cómo, es parte de "qué publicamos".

## Qué publicamos

**Abierto.** Con lo recabado cerrado, lo siguiente es decidir qué se muestra y cómo: los dos números y si son suficientes, la atribución (hoy la decisión 2 dice que la decide el cruce sujeto × eje y deja dos combinaciones sin lado; la propuesta en discusión es que la decida el eje solo), la lista destilada con sus voces, los hechos declarados, la trayectoria, y con qué reglas se derivan carrera e institución. La posición "publicamos el número, no el veredicto" va a esa mesa como posición a revisar, no como axioma. Hasta que cierre, las decisiones 1 y 2 son la intención original, no el diseño.

## Qué no hace

- **No investiga causas.** Mostramos que una materia es un embudo en tres instituciones. Por qué lo es, no lo sabemos y no lo afirmamos. Somos el crudo y el movilizador: que otros se tomen el trabajo de averiguarlo.
- **No juzga lo que mide.** Publicamos el número, no el veredicto. (En revisión junto con "qué publicamos": qué significa esto frase por frase se decide ahí.)
- **No planifica tu cuatrimestre.** Eso se resuelve con una lapicera en quince minutos, y competir con la lapicera fue lo que volvió compleja la versión anterior. Le damos lo que la lapicera NO puede calcular: cuánto tarda la gente de verdad, cuántas clases se dieron, y de los que llevaron esas dos materias juntas, cuántos dejaron una.
- **No pretende autoridad ni tiene convenios.** No podríamos publicar estos números y a la vez depender de quien evaluamos.

## Posición tomada

Nada de esto es neutral.

- El nombre del alumno NUNCA aparece. El del docente sí, porque responder es un acto público. El riesgo no es simétrico.
- Aportar pide cuenta, no constancia: si todos se tienen que verificar, el muro queda antes del valor y no hay corpus. El que prueba su condición de alumno suma una señal que viaja con el dato: verificarse pesa, no habilita. Y jamás mostramos quién es nadie; sin eso, el que más tiene para contar es el que más tiene para perder.
- El anonimato es mecanismo, no declaración: revisamos que el TEXTO no te reconstruya, y limitamos qué puede citar la réplica.
- El número tampoco te reconstruye: ningún conteo público sale por debajo del piso de personas, y en un cruce (materias que se llevaron juntas, cátedra, período) el piso vale en cada celda, no solo en el total. Lo que se descarga es lo mismo que se publica, agregado y con su n: no existe un crudo que tenga más que la ficha.
- Se modera lo que expone a una persona, no lo que incomoda a la institución. Cada testimonio que se baja de más es uno que no se vuelve a escribir.

## A quién sirve

Al que elige, para no decidir con un folleto. Al que está adentro, para saber si lo que le pasa es la materia o la cátedra, y para no reclamar solo. Al docente que da bien su materia, que por primera vez tiene dónde que se vea. Al que investiga, porque somos el crudo y se descarga sin registro.

Y a la institución: lo atractivo para ella es exactamente la amenaza que plan-b representa. El mismo dato que la expone es el que le dice dónde arreglar. La que lo ignora queda expuesta; la que lo usa mejora. Las dos rompen la asimetría, una a la fuerza y la otra por decisión.

## Fin último

Que una facultad publique voluntariamente lo que hoy tenemos que reconstruir desde abajo. Ese día plan-b ganó, incluso si deja de hacer falta.
