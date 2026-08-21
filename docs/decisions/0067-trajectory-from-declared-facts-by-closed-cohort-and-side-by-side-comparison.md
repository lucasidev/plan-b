# ADR-0067: Trajectory comes from declared facts by closed cohort, and offerings compare side by side, never ranked

- **Estado**: aceptado
- **Fecha**: 2026-08-16

## Contexto

La tesis promete cuatro cosas que no salen de frases sino de trayectoria: cuánto tarda la gente de verdad, dónde se cae la mayoría, qué se llevó junto y cuántos dejaron una ([THESIS.md](../THESIS.md), decisión 4). Las stories las reparten entre Valentina (US-127: nominal, real y de cuántos egresados sale), Silvia (US-133: duración real y cuántos se reciben, sin vocabulario), Matías (US-143: por par de materias, cuántos las llevaron juntas y cuántos dejaron una), Diego (US-152: en qué punto del plan se cae la mayoría), Claudia y la institución (US-177: la serie, "si mejoré desde que lo publicaron"), y las comparaciones de Dónde estudiarla (US-128: la misma carrera en varias instituciones; US-174: "en qué estoy peor que la de al lado").

Lo que se recaba estaba cerrado ([ADR-0064](0064-phrases-with-voices-not-scores.md), punto 6): cuándo entraste, cuándo cursaste cada materia (viene con la reseña), si te fuiste cuándo, si te recibiste cuándo; de a uno, nunca como inventario. Con eso solo se sabe en qué **año del plan** se fue el que se fue. No se sabe qué materias tumban gente, ni cuántos dejaron una de un par, ni la aprobación que [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md) llamaba "el dato más objetivo de la página": las tres dependen de un hecho que faltaba, **cómo terminó la cursada**.

Y quedaban tres cabos: qué queda de 0047 (su definición de aprobación, su piso, su fuente privada); "brecha", que el mapa usa junto a los dos números y nadie definió; y el hallazgo G9 de la [revisión del catálogo](../history/reviews/2026-08-16-catalog.md): la co-cursada no puede salir del plan que la persona marcó para sí, que es privado y nadie consintió publicar.

Nada de esto pide inteligencia. Pide contabilidad sobre hechos sueltos unidos por cuenta, y disciplina para no inventar el hecho que falta.

## Decisión

### Un hecho más se recaba: cómo terminó la cursada

La reseña lleva, además de la materia y el período, **cómo terminó**: la aprobé, me quedó regular, la desaprobé, la dejé, sigo cursando. Son los estados de cursada que el dominio ya tiene. Es un toque, aparece exactamente cuando la reseña, y sin él la trayectoria por materia no existe. Es la única ampliación de "qué recabamos" que trae esta decisión.

### Cómo se consigue el hecho que no viene solo

`Me fui (año)` y `me recibí (año)` no aparecen con ninguna reseña. Se piden con una pregunta, una vez, por cuatro caminos: en Reseñar, si el período declarado es viejo y la cuenta no dijo su situación ("¿seguís cursando?" → sí / me recibí, cuándo / me fui, cuándo); en Mi situación, en cualquier momento y sin plan marcado; por **reenganche por mail** a cuentas inactivas, una vez al año, con una sola pregunta respondible desde el mail sin entrar; y en la app, cuando `entré + nominal` ya pasó y la cuenta no dijo nada. `Entré (año)` se pregunta una sola vez, la primera vez que la cuenta reseña una carrera. Nada se pregunta dos veces (US-169).

**El silencio no se infiere.** Quien no dijo es "no dijo o sigue", y esa categoría se publica. No existe "si no reseñó en dos años, se fue" ni "reseñó una de quinto, se recibió".

### Qué se publica

1. **Duración real y brecha**, por carrera en una institución. La **mediana** de años entre `entré` y `me recibí`, de las cuentas que declararon los dos, contra la **duración nominal** del plan: "el plan dice 5; la gente tarda 7,5 (mediana de 40 egresados)". La **brecha** es real menos nominal, en años; el cociente real/nominal va en el método. Siempre "de los que se recibieron": el que no se recibió no está en ese número, y se dice.
2. **Egreso y abandono, solo de cohortes cerradas.** La **cohorte** son las cuentas que entraron a esa carrera en esa institución el mismo año; está **cerrada** cuando entró hace al menos 1,5 veces la duración nominal, y solo entonces publica: "de 300 que entraron entre 2012 y 2016 y reseñaron acá, 45% se recibió, 30% se fue, 25% no dijo o sigue". Tres proporciones de personas con encogimiento, y el "no dijo" a la vista. Cohortes chicas se agrupan en contiguas, y se dice.
3. **Dónde se cae.** Por año del plan, sobre los que se fueron: `me fui − entré + 1` ("6 de cada 10 se fueron en primero o segundo"). Y por materia y período, desde cómo terminó: **abandono de cursada** (dejé sobre todos los que terminaron de alguna forma) y **aprobación** con la definición exacta de 0047, aprobé sobre aprobé más desaprobé, afuera dejé, regular y sigo. Con voces, con Wilson, con serie.
4. **Co-cursada.** Solo desde reseñas, nunca desde el plan marcado: dos materias reseñadas por la misma cuenta en el mismo período. Por par y período: "40 personas las llevaron juntas; 12 dejaron una". Sin piso, como todo ([ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)). El sesgo (solo cuenta quien reseñó las dos) va en el método.
5. **La serie.** Cualquier proporción publicada se muestra por el **período en que pasó** (el período de cursada, la fecha del evento), nunca por cuándo se reseñó; cada punto con sus voces y su encogimiento; sin suavizar y sin escala 1 a 5. Con la fecha de publicación y la de la réplica marcadas: es lo que Claudia y la institución necesitan para saber si movió.
6. **Dónde estudiarla: la misma carrera, lado a lado, dato por dato.** Qué ofertas son "la misma carrera" lo decide el catálogo con una **carrera canónica** curada por nosotros ("Ingeniería en Sistemas" y "en Sistemas de Información" son una o no lo son porque lo decidimos, no por el nombre). Se muestran nominal, real, brecha, egreso de cohortes cerradas, las dos cabeceras (con su gate: "todavía no derivamos" si no llegó), la cobertura y las listas por eje. **Sin compuesto, sin ganador y sin ordenar por valor**: alfabético o por voces; el que quiere ordenar baja el CSV. Es lo único que mantiene "no es un ranking" verdadero. US-174 se cumple así: frase por frase, no con un puesto.
7. **El CSV** gana una segunda tabla con los agregados de trayectoria: por carrera-institución y cohorte; por materia y período; por par y período; con las mismas reglas que la ficha (lo que se descarga es lo que se publica).

### Cómo se calcula

Una tabla de hechos por cuenta (`entré`, `me fui`, `me recibí`, cada uno con año y carrera-institución) más `terminó` en la reseña, unidos por cuenta; se lee cross-módulo como cualquier read ([ADR-0017](0017-persistence-ignorance.md)). Todo es SQL:

- Duración real: `mediana(recibí − entré)` sobre cuentas con ambos hechos, por carrera-institución.
- Cohorte cerrada: `entré ≤ año_actual − ⌈1,5 × nominal⌉`. Egreso / abandono / no dijo: conteos sobre la cohorte, cada uno con Wilson.
- Año del plan de abandono: histograma de `me fui − entré + 1` sobre los que se fueron.
- Aprobación y abandono de cursada: conteos de `terminó` por materia y período.
- Co-cursada: self-join de reseñas por (cuenta, período), `materia_a < materia_b`, `count(distinct cuenta)`; "dejaron una" son las cuentas del par con algún `terminó = dejé`.
- Serie: cualquiera de las anteriores con `group by período`.
- Encogimiento (0064): con `p = k/n` y `z = 1,96`, el límite inferior de Wilson es `(p + z²/2n − z·√(p(1−p)/n + z²/4n²)) / (1 + z²/n)`. Una función en la capa de lectura, publicada en Método tal cual.

Los hechos sobreviven a la baja de la cuenta, exactos y sin cuenta ([ADR-0044](0044-soft-delete-del-user-con-preservacion-de-corpus.md)): una baja no recalcula una cohorte ni generaliza un año a rango; quien quiera sacar algo lo borra antes, de a uno.

Control de calidad, que es lo único que se parece a inteligencia y no lo es: **consistencia por cuenta** (`recibí ≥ entré`; períodos de cursada dentro de `[entré, recibí o me fui]`; un solo `entré` por carrera), y lo inconsistente no entra al agregado y Método publica cuántas cuentas quedaron afuera y por qué; **procedencia** (US-213): las cuentas que el anti-spam marca no suman a ninguna trayectoria; **reproceso**: cada corte recalcula todo desde los hechos, nada se acumula a mano.

Lo que ningún cálculo arregla, y se declara en cada dato: es **de quienes reseñaron**, nunca "la tasa de egreso de la carrera" (el disclaimer de 0047, ahora regla general del método); la duración real es de **los que se recibieron** (supervivencia); y **es lento**: egreso solo con cohortes cerradas, duración real solo cuando reseñen egresados. El reenganche por mail es lo que lo acorta.

## Alternativas consideradas

**A. Inferir egreso o abandono desde patrones** (dejó de reseñar; reseñó materias del último año). Es afirmar algo que no sabemos, y el número que saldría es indefendible en la mesa de Rocío. Descartada.

**B. Publicar egreso de cohortes abiertas**, con la leyenda "todavía puede recibirse". El número se cita sin la leyenda y castiga a la cohorte que sigue cursando. La regla del 150% del tiempo nominal existe para eso. Descartada.

**C. Promedio en vez de mediana para la duración real.** Un egresado de catorce años mueve el promedio y no la mediana; con muestras chicas el promedio es una anécdota. Descartada.

**D. Co-cursada desde el plan marcado.** Es la única fuente que la tendría completa y es privada: nadie marcó su plan para publicarlo (G9; el mismo argumento por el que 0047 nació con piso). Descartada; el sesgo de la fuente pública se declara.

**E. Dónde estudiarla con un compuesto o ordenado por valor.** Es un ranking con otro nombre, y el producto dice que no lo es. Descartada; el CSV deja ordenar a quien quiera.

**F. No recabar cómo terminó** y bajar US-143 a "cuántos las llevaron juntas", sin aprobación ni abandono por materia. Un toque menos a cambio de perder los tres datos más citables por materia. Descartada.

**G. Pedir el historial completo** para tener la trayectoria entera de una vez. Es el inventario que la tesis rechazó: nadie lo completa, y el que más tiene para contar es el que menos vuelve. Descartada.

## Consecuencias

- **La reseña gana un toque** (cómo terminó), y la tesis lo dice en "qué recabamos". Es la única ampliación de esa capa.
- **El reenganche por mail pasa a ser infraestructura**, junto con los avisos ([ADR-0040](0040-notifications-como-bounded-context.md)): sin él, el egreso y la duración real tardan años en aparecer. Aun con él, tardan.
- **Las stories cambian de letra**: US-177 pierde el "1 a 5"; US-143, US-152, US-127 y US-133 dicen de dónde sale su dato; US-128 y US-174 dicen "lado a lado, sin ordenar"; US-180 gana la segunda tabla.
- **"Brecha" tiene definición** (real menos nominal, en años) y **"cohorte" cambia de significado**: la del planificador ("misma combinación de materias") se retira con él; la nueva es la de siempre, los que entraron el mismo año.
- **[ADR-0047](0047-pass-rate-publico-desde-historial-privado.md) queda superado del todo**: su definición de aprobación vive acá desde lo declarado; su piso murió en 0066; su fuente privada no existe en el producto nuevo.
- **El catálogo necesita la carrera canónica** para que Dónde estudiarla sepa qué compara. Es trabajo del equipo, como todo el catálogo.
- **Modelo de datos**: la tabla de hechos de trayectoria por cuenta, `terminó` en la reseña, la carrera canónica. Se registra cuando el modelo nuevo se diseñe; acá está el porqué.

## Precedente

La Secretaría de Políticas Universitarias publica el coeficiente **duración real sobre duración teórica** por carrera y dice que solo el 29,6% de los estudiantes egresa en el tiempo teórico, con una demora promedio del 90% ([Perfil, 2023](https://noticias.perfil.com/noticias/educacion/solo-el-29-de-los-universitarios-argentinos-terminan-la-carrera-en-el-tiempo-previsto.phtml); [Duración real de los estudios universitarios](https://www.aacademica.org/000-028/40.pdf)): la brecha es un indicador argentino conocido, no un invento nuestro. La tasa de graduación federal de Estados Unidos se calcula sobre la cohorte que ya tuvo **150% del tiempo nominal** ([NCES, IPEDS Graduation Rates](https://nces.ed.gov/ipeds/use-the-data/measuring-student-success-in-ipeds)): de ahí la cohorte cerrada.

## Refs

- [THESIS.md](../THESIS.md), decisión 4, "Qué recabamos" y "Qué publicamos". [ADR-0064](0064-phrases-with-voices-not-scores.md) (la unidad y el encogimiento que acá se aplican a proporciones de personas), [ADR-0065](0065-attribution-is-the-axis-not-a-split.md), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (sin piso; el gate de la cabecera que Dónde estudiarla respeta). **Completa** a 0064.
- [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md): la definición de aprobación que sobrevive. [ADR-0054](0054-metrica-sin-sustento-viaja-null-nunca-cero.md): una cohorte abierta no publica un cero, no publica.
- Hallazgos F2 (reenganche) y G9 (co-cursada) de la [revisión adversarial del catálogo](../history/reviews/2026-08-16-catalog.md).
